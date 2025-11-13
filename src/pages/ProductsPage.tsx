import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Fab,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { productService, Product, ProductListRequest } from '../services/productService';
import ProductForm from '../components/ProductForm';
import { localizeNumber } from '../utils/numberLocalization';
import {
  DataTable,
  StatusChip,
  CurrencyDisplay,
  createStandardActions,
  EmptyState,
  commonStatusConfigs
} from '../components/common';
import PageHeader from '../components/common/PageHeader';
import FilterBar from '../components/common/FilterBar';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import usePagination, { usePaginationProps } from '../hooks/usePagination';

interface ProductsPageProps {}

const ProductsPage: React.FC<ProductsPageProps> = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'stockQuantity' | 'createdDate'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalCount, setTotalCount] = useState(0);

  // Use pagination hook
  const [pagination, paginationActions] = usePagination();
  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleting, setDeleting] = useState(false);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const request: ProductListRequest = {
        pageSize: pagination.pageSize,
        pageNumber: pagination.page,
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        unit: selectedUnit || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStockOnly ? true : undefined,
        sortBy,
        sortOrder
      };

      const response = await productService.getProducts(request);
      if (response.data.succeeded && response.data.data) {
        setProducts(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
      } else {
        throw new Error(response.data.message || t('products.failedToLoadProducts'));
      }
    } catch (err: any) {
      setError(err.message || t('products.failedToLoadProducts'));
      setSnackbar({ open: true, message: err.message || t('products.failedToLoadProducts'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.data.succeeded && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setDeleting(true);
      const response = await productService.deleteProduct(selectedProduct.id);
      if (response.data.succeeded) {
        setSnackbar({ open: true, message: t('products.productDeleted'), severity: 'success' });
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        throw new Error(response.data.message || t('products.failedToDeleteProduct'));
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || t('products.failedToDeleteProduct'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Refresh products
  const handleRefresh = () => {
    loadProducts();
  };

  // Action handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setProductFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Product form handlers
  const handleOpenAddProduct = () => {
    setEditProduct(null);
    setProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    handleEditProduct(product);
  };

  const handleCloseProductForm = () => {
    setProductFormOpen(false);
    setEditProduct(null);
  };

  const handleSaveProduct = (savedProduct: Product) => {
    setSnackbar({
      open: true,
      message: editProduct ? t('products.productUpdated') : t('products.productCreatedSuccessfully'),
      severity: 'success'
    });
    loadProducts();
  };

  // Handle search
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    paginationActions.setPage(1);
    loadProducts();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    paginationActions.setPage(1);
    loadProducts();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedUnit('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('createdDate');
    setSortOrder('desc');
    paginationActions.setPage(1);
  };

  
  // Get unit name from ProductUnit enum value
  const getUnitName = (unit: number | string) => {
    const unitValue = typeof unit === 'number' ? unit : parseInt(unit);

    const unitMap: { [key: number]: string } = {
      0: t('products.units.box'),
      1: t('products.units.piece'),
      2: t('products.units.squareFeet'),
      3: t('products.units.kilogram'),
      4: t('products.units.gram'),
      5: t('products.units.liter'),
      6: t('products.units.milliliter'),
      7: t('products.units.meter'),
      8: t('products.units.centimeter'),
      9: t('products.units.inch'),
      10: t('products.units.yard'),
      11: t('products.units.ton'),
      12: t('products.units.pack'),
      13: t('products.units.dozen'),
      14: t('products.units.pair'),
      15: t('products.units.roll'),
      16: t('products.units.bundle'),
      17: t('products.units.carton'),
      18: t('products.units.bag'),
      19: t('products.units.set'),
      20: t('products.units.barrel'),
      21: t('products.units.gallon'),
      22: t('products.units.can'),
      23: t('products.units.tube'),
      24: t('products.units.packet'),
      25: t('products.units.unit')
    };

    return unitMap[unitValue] || t('products.units.unit');
  };

  // Get profit margin color
  const getProfitMarginColor = (margin: number): 'success' | 'warning' | 'error' => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [pagination.page, pagination.pageSize, searchTerm, selectedCategory, selectedUnit, minPrice, maxPrice, inStockOnly, sortBy, sortOrder]);

  // Define table columns
  const columns = [
    {
      id: 'title',
      label: t('products.name'),
      minWidth: 200,
      format: (value, product) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {product.productPhotos && product.productPhotos.length > 0 && (
            <Avatar
              src={product.productPhotos.find(p => p.isPrimary)?.blobUrl || product.productPhotos[0].blobUrl}
              variant="rounded"
              sx={{ width: 48, height: 48 }}
            >
              {product.title.charAt(0)}
            </Avatar>
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {product.title}
          </Typography>
        </Box>
      )
    },
    {
      id: 'categoryName',
      label: t('products.category'),
      minWidth: 120
    },
    {
      id: 'size',
      label: t('products.size'),
      minWidth: 80,
      format: (value) => value || '-'
    },
    {
      id: 'color',
      label: t('products.color'),
      minWidth: 80,
      format: (value) => value || '-'
    },
    {
      id: 'sellingPrice',
      label: t('products.price'),
      align: 'right' as const,
      minWidth: 100,
      format: (value) => (
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    },
    {
      id: 'stockQuantity',
      label: t('products.stock'),
      minWidth: 120,
      format: (value, product) => (
        <Box>
          <Typography variant="body2">
            {localizeNumber(value, currentLanguage)} {getUnitName(product.unit)}
          </Typography>
          <StatusChip
            status={value}
            statusConfig={commonStatusConfigs.stockStatus(t, value)}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
      )
    },
    {
      id: 'profitMargin',
      label: t('products.margin'),
      minWidth: 80,
      align: 'center' as const,
      format: (value) => (
        <StatusChip
          status={value}
          statusConfig={{
            label: `${value.toFixed(1)}%`,
            color: getProfitMarginColor(value)
          }}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'status',
      label: t('products.status'),
      minWidth: 100,
      format: (value) => (
        <StatusChip
          status={value}
          statusConfig={commonStatusConfigs.productStatus(t, value)}
        />
      )
    }
  ];

  // Define row actions
  const getRowActions = (product) => {
    return createStandardActions(
      product,
      handleViewProduct,
      handleEditProduct,
      handleDeleteClick,
      {
        canEdit: () => true,
        canDelete: () => true,
        translations: {
          viewDetails: t('common.viewDetails'),
          edit: t('common.edit'),
          delete: t('common.delete')
        }
      }
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={t('products.title')}
        actionButton={{
          label: t('products.addProduct'),
          onClick: handleOpenAddProduct
        }}
        showRefresh={true}
        onRefresh={loadProducts}
        loading={loading}
      />

      <FilterBar
        searchPlaceholder={t('products.searchPlaceholder')}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterMinWidth={200}
        autocompleteFields={[
          {
            id: 'category',
            label: t('products.category'),
            value: selectedCategory,
            options: categories.map((category) => ({ value: category.id, label: category.title })),
            onChange: (value) => {
              setSelectedCategory(value);
            }
          },
          {
            id: 'unit',
            label: t('products.unit'),
            value: selectedUnit,
            options: [
              { value: '0', label: t('products.units.box') },
              { value: '1', label: t('products.units.piece') },
              { value: '2', label: t('products.units.squareFeet') },
              { value: '3', label: t('products.units.kilogram') },
              { value: '4', label: t('products.units.gram') },
              { value: '5', label: t('products.units.liter') },
              { value: '6', label: t('products.units.milliliter') },
              { value: '7', label: t('products.units.meter') },
              { value: '8', label: t('products.units.centimeter') },
              { value: '9', label: t('products.units.inch') },
              { value: '10', label: t('products.units.yard') },
              { value: '11', label: t('products.units.ton') },
              { value: '12', label: t('products.units.pack') },
              { value: '13', label: t('products.units.dozen') },
              { value: '14', label: t('products.units.pair') },
              { value: '15', label: t('products.units.roll') },
              { value: '16', label: t('products.units.bundle') },
              { value: '17', label: t('products.units.carton') },
              { value: '18', label: t('products.units.bag') },
              { value: '19', label: t('products.units.set') },
              { value: '20', label: t('products.units.barrel') },
              { value: '21', label: t('products.units.gallon') },
              { value: '22', label: t('products.units.can') },
              { value: '23', label: t('products.units.tube') },
              { value: '24', label: t('products.units.packet') },
              { value: '25', label: t('products.units.unit') }
            ],
            onChange: (value) => {
              setSelectedUnit(value);
            }
          }
        ]}
        filters={[
          {
            id: 'sortBy',
            label: t('products.sortBy'),
            value: sortBy,
            options: [
              { value: 'title', label: t('products.name') },
              { value: 'price', label: t('products.price') },
              { value: 'stockQuantity', label: t('products.stock') },
              { value: 'createdDate', label: t('products.createdDate') }
            ]
          },
          {
            id: 'sortOrder',
            label: t('products.order'),
            value: sortOrder,
            options: [
              { value: 'asc', label: t('products.ascending') },
              { value: 'desc', label: t('products.descending') }
            ]
          }
        ]}
        onFilterChange={(filterId, value) => {
          if (filterId === 'sortBy') {
            setSortBy(value as any);
          } else if (filterId === 'sortOrder') {
            setSortOrder(value as any);
          }
          handleFilterChange();
        }}
        onClearFilters={clearAllFilters}
        loading={loading}
        showClearButton={true}
      />

  
      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        error={error}
        emptyState={{
          icon: '📦',
          title: t('products.noProductsFound'),
          description: searchTerm ? t('products.tryAdjustingSearch') : t('products.getStarted'),
          action: {
            label: t('products.addProduct'),
            onClick: handleOpenAddProduct
          }
        }}
        actions={getRowActions}
        getRowId={(product) => product.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount)}
        errorAction={{
          label: t('products.retry'),
          onClick: handleRefresh
        }}
      />

      {/* View Product Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedProduct(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">{t('products.productDetails')}</Typography>
              <IconButton onClick={() => {
          setViewDialogOpen(false);
          setSelectedProduct(null);
        }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ padding: 3 }}>
              <Grid container spacing={3}>
                {/* Product Photos */}
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2, color: '#1a1a1a' }}>
                    {t('products.productImages')}
                  </Typography>
                  {selectedProduct.productPhotos && selectedProduct.productPhotos.length > 0 ? (
                    <Box>
                      {/* Primary Photo */}
                      {selectedProduct.productPhotos.find(photo => photo.isPrimary) && (
                        <Box sx={{ marginBottom: 2 }}>
                          <Typography variant="body2" sx={{ marginBottom: 1, color: '#666' }}>
                            {t('products.primaryPhoto')}
                          </Typography>
                          <img
                            src={selectedProduct.productPhotos.find(photo => photo.isPrimary)?.blobUrl}
                            alt={selectedProduct.title}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0'
                            }}
                          />
                        </Box>
                      )}

                      {/* Other Photos */}
                      {selectedProduct.productPhotos.filter(photo => !photo.isPrimary).length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ marginBottom: 1, color: '#666' }}>
                            {t('products.otherPhotos')}
                          </Typography>
                          <Grid container spacing={1}>
                            {selectedProduct.productPhotos
                              .filter(photo => !photo.isPrimary)
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map((photo) => (
                                <Grid sx={{ xs: 6, sm: 4 }} key={photo.id}>
                                  <img
                                    src={photo.blobUrl}
                                    alt={selectedProduct.title}
                                    style={{
                                      width: '100%',
                                      height: '80px',
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      border: '1px solid #e0e0e0'
                                    }}
                                  />
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '200px',
                        border: '1px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t('products.noPhotosAvailable')}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Product Information */}
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2, color: '#1a1a1a' }}>
                    {t('products.productInformation')}
                  </Typography>

                  <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                      {t('products.productName')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedProduct.title}
                    </Typography>
                  </Box>

                  <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                      {t('products.description')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedProduct.description || t('products.noDescriptionAvailable')}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.category')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.categoryName}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.unit')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.unit}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.size')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.size || t('products.notAvailable')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.color')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.color || t('products.notAvailable')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.sellingPrice')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                          <CurrencyDisplay amount={selectedProduct.sellingPrice || 0} />
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.costPrice')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          <CurrencyDisplay amount={selectedProduct.costPrice || 0} />
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.stock')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {localizeNumber(selectedProduct.stockQuantity, currentLanguage)} {getUnitName(selectedProduct.unit)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          {t('products.status')}
                        </Typography>
                        <StatusChip
                          status={selectedProduct.status}
                          statusConfig={commonStatusConfigs.productStatus(t, selectedProduct.status)}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Tags */}
                  {selectedProduct.productTags && selectedProduct.productTags.length > 0 && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography variant="body2" sx={{ color: '#666', marginBottom: 1 }}>
                        {t('products.tags')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedProduct.productTags.map((tag, index) => (
                          <StatusChip
                            key={index}
                            status={tag}
                            statusConfig={{
                              label: tag,
                              color: 'default'
                            }}
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedProduct(null); }}
        onConfirm={handleDeleteProduct}
        entityName={selectedProduct?.title || ''}
        entityType="Product"
        loading={deleting}
      />

      {/* Product Form Dialog */}
      <ProductForm
        open={productFormOpen}
        onClose={handleCloseProductForm}
        onSave={handleSaveProduct}
        editProduct={editProduct}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Refresh */}
      <Tooltip title={t('products.refresh')}>
        <Fab
          color="primary"
          size="small"
          onClick={handleRefresh}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <RefreshIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default ProductsPage;