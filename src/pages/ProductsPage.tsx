import React, { useState, useEffect } from 'react';
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
        throw new Error(response.data.message || 'Failed to load products');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      setSnackbar({ open: true, message: err.message || 'Failed to load products', severity: 'error' });
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
        setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete product', severity: 'error' });
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
      message: editProduct ? 'Product updated successfully' : 'Product created successfully',
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
      0: 'Box',
      1: 'Piece',
      2: 'Square Feet',
      3: 'Kilogram',
      4: 'Gram',
      5: 'Liter',
      6: 'Milliliter',
      7: 'Meter',
      8: 'Centimeter',
      9: 'Inch',
      10: 'Yard',
      11: 'Ton',
      12: 'Pack',
      13: 'Dozen',
      14: 'Pair',
      15: 'Roll',
      16: 'Bundle',
      17: 'Carton',
      18: 'Bag',
      19: 'Set',
      20: 'Barrel',
      21: 'Gallon',
      22: 'Can',
      23: 'Tube',
      24: 'Packet',
      25: 'Unit'
    };

    return unitMap[unitValue] || 'Unit';
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
      label: 'Product',
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
      label: 'Category',
      minWidth: 120
    },
    {
      id: 'size',
      label: 'Size',
      minWidth: 80,
      format: (value) => value || '-'
    },
    {
      id: 'color',
      label: 'Color',
      minWidth: 80,
      format: (value) => value || '-'
    },
    {
      id: 'sellingPrice',
      label: 'Price',
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
      label: 'Stock',
      minWidth: 120,
      format: (value, product) => (
        <Box>
          <Typography variant="body2">
            {value} {getUnitName(product.unit)}
          </Typography>
          <StatusChip
            status={value}
            statusConfig={commonStatusConfigs.stockStatus}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
      )
    },
    {
      id: 'profitMargin',
      label: 'Margin',
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
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <StatusChip
          status={value}
          statusConfig={commonStatusConfigs.productStatus}
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
        canDelete: () => true
      }
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Products"
        actionButton={{
          label: "Add Product",
          onClick: handleOpenAddProduct
        }}
        showRefresh={true}
        onRefresh={loadProducts}
        loading={loading}
      />

      <FilterBar
        searchPlaceholder="Search products by name, description, size, or color..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterMinWidth={200}
        autocompleteFields={[
          {
            id: 'category',
            label: 'Category',
            value: selectedCategory,
            options: categories.map((category) => ({ value: category.id, label: category.title })),
            onChange: (value) => {
              setSelectedCategory(value);
            }
          },
          {
            id: 'unit',
            label: 'Unit',
            value: selectedUnit,
            options: [
              { value: '0', label: 'Box' },
              { value: '1', label: 'Piece' },
              { value: '2', label: 'Square Feet' },
              { value: '3', label: 'Kilogram' },
              { value: '4', label: 'Gram' },
              { value: '5', label: 'Liter' },
              { value: '6', label: 'Milliliter' },
              { value: '7', label: 'Meter' },
              { value: '8', label: 'Centimeter' },
              { value: '9', label: 'Inch' },
              { value: '10', label: 'Yard' },
              { value: '11', label: 'Ton' },
              { value: '12', label: 'Pack' },
              { value: '13', label: 'Dozen' },
              { value: '14', label: 'Pair' },
              { value: '15', label: 'Roll' },
              { value: '16', label: 'Bundle' },
              { value: '17', label: 'Carton' },
              { value: '18', label: 'Bag' },
              { value: '19', label: 'Set' },
              { value: '20', label: 'Barrel' },
              { value: '21', label: 'Gallon' },
              { value: '22', label: 'Can' },
              { value: '23', label: 'Tube' },
              { value: '24', label: 'Packet' },
              { value: '25', label: 'Unit' }
            ],
            onChange: (value) => {
              setSelectedUnit(value);
            }
          }
        ]}
        filters={[
          {
            id: 'sortBy',
            label: 'Sort By',
            value: sortBy,
            options: [
              { value: 'title', label: 'Name' },
              { value: 'price', label: 'Price' },
              { value: 'stockQuantity', label: 'Stock' },
              { value: 'createdDate', label: 'Created Date' }
            ]
          },
          {
            id: 'sortOrder',
            label: 'Order',
            value: sortOrder,
            options: [
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' }
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
          title: 'No products found',
          description: searchTerm ? 'Try adjusting your search terms or filters' : 'Get started by adding your first product',
          action: {
            label: 'Add Product',
            onClick: handleOpenAddProduct
          }
        }}
        actions={getRowActions}
        getRowId={(product) => product.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount)}
        errorAction={{
          label: 'Retry',
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
              <Typography variant="h6" component="div">Product Details</Typography>
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
                    Product Photos
                  </Typography>
                  {selectedProduct.productPhotos && selectedProduct.productPhotos.length > 0 ? (
                    <Box>
                      {/* Primary Photo */}
                      {selectedProduct.productPhotos.find(photo => photo.isPrimary) && (
                        <Box sx={{ marginBottom: 2 }}>
                          <Typography variant="body2" sx={{ marginBottom: 1, color: '#666' }}>
                            Primary Photo:
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
                            Other Photos:
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
                        No photos available
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Product Information */}
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2, color: '#1a1a1a' }}>
                    Product Information
                  </Typography>

                  <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                      Product Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedProduct.title}
                    </Typography>
                  </Box>

                  <Box sx={{ marginBottom: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedProduct.description || 'No description available'}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Category
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.categoryName}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Unit
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
                          Size
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.size || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Color
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.color || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Selling Price
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                          <CurrencyDisplay amount={selectedProduct.sellingPrice || 0} />
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Cost Price
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
                          Stock Quantity
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProduct.stockQuantity} {selectedProduct.unit}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 6 }}>
                      <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', marginBottom: 0.5 }}>
                          Status
                        </Typography>
                        <StatusChip
                          status={selectedProduct.status}
                          statusConfig={commonStatusConfigs.productStatus}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Tags */}
                  {selectedProduct.productTags && selectedProduct.productTags.length > 0 && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography variant="body2" sx={{ color: '#666', marginBottom: 1 }}>
                        Tags
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
      <Tooltip title="Refresh">
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