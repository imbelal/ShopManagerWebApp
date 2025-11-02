import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Pause as PausedIcon,
  Block as BlockedIcon,
  ExpandMore as ExpandMoreIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import { productService, Product, ProductListRequest } from '../services/productService';
import ProductForm from '../components/ProductForm';

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const request: ProductListRequest = {
        pageSize,
        pageNumber: page,
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
      const response = await productService.deleteProduct(selectedProduct.id);
      if (response.data.succeeded) {
        setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
        setDeleteDialogOpen(false);
        loadProducts();
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete product', severity: 'error' });
    }
  };

  // Refresh products
  const handleRefresh = () => {
    loadProducts();
  };

  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  // Product form handlers
  const handleOpenAddProduct = () => {
    setEditProduct(null);
    setProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditProduct(product);
    setProductFormOpen(true);
    handleMenuClose();
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
    setPage(1);
    loadProducts();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setPage(1);
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
    setPage(1);
  };

  // Handle pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get profit margin color
  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
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

  // Get product status info based on ProductStatus enum
  const getProductStatusInfo = (status: number | string) => {
    // Handle both numeric enum values and string values
    const statusValue = typeof status === 'number' ? status : parseInt(status);

    switch (statusValue) {
      case 1: // ProductStatus.Active
        return {
          color: 'success' as const,
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
          label: 'Active'
        };
      case 2: // ProductStatus.InActive
        return {
          color: 'warning' as const,
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
          label: 'Inactive'
        };
      default:
        return {
          color: 'default' as const,
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
          label: 'Unknown'
        };
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, searchTerm, selectedCategory, selectedUnit, minPrice, maxPrice, inStockOnly, sortBy, sortOrder]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
            }
          }}
          onClick={handleOpenAddProduct}
        >
          Add Product
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Basic Search Bar */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search products by name, description, size, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      handleFilterChange();
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="title">Name</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="stockQuantity">Stock</MenuItem>
                    <MenuItem value="createdDate">Created Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) => {
                      setSortOrder(e.target.value as any);
                      handleFilterChange();
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Advanced Filters */}
          <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                minHeight: 48,
                '& .MuiAccordionSummary-content': { my: 1 },
                backgroundColor: '#f8f9fa',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Advanced Filters
                </Typography>
                {(selectedCategory || selectedUnit || minPrice || maxPrice || inStockOnly) && (
                  <Chip
                    label="Active"
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        handleFilterChange();
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ minWidth: 150 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={selectedUnit}
                      label="Unit"
                      onChange={(e) => {
                        setSelectedUnit(e.target.value);
                        handleFilterChange();
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All Units</MenuItem>
                      <MenuItem value="0">Box</MenuItem>
                      <MenuItem value="1">Piece</MenuItem>
                      <MenuItem value="2">Square Feet</MenuItem>
                      <MenuItem value="3">Kilogram</MenuItem>
                      <MenuItem value="4">Gram</MenuItem>
                      <MenuItem value="5">Liter</MenuItem>
                      <MenuItem value="6">Milliliter</MenuItem>
                      <MenuItem value="7">Meter</MenuItem>
                      <MenuItem value="8">Centimeter</MenuItem>
                      <MenuItem value="9">Inch</MenuItem>
                      <MenuItem value="10">Yard</MenuItem>
                      <MenuItem value="11">Ton</MenuItem>
                      <MenuItem value="12">Pack</MenuItem>
                      <MenuItem value="13">Dozen</MenuItem>
                      <MenuItem value="14">Pair</MenuItem>
                      <MenuItem value="15">Roll</MenuItem>
                      <MenuItem value="16">Bundle</MenuItem>
                      <MenuItem value="17">Carton</MenuItem>
                      <MenuItem value="18">Bag</MenuItem>
                      <MenuItem value="19">Set</MenuItem>
                      <MenuItem value="20">Barrel</MenuItem>
                      <MenuItem value="21">Gallon</MenuItem>
                      <MenuItem value="22">Can</MenuItem>
                      <MenuItem value="23">Tube</MenuItem>
                      <MenuItem value="24">Packet</MenuItem>
                      <MenuItem value="25">Unit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} minWidth={120}>
                  <TextField
                    fullWidth
                    label="Min Price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      handleFilterChange();
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      handleFilterChange();
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={inStockOnly}
                          onChange={(e) => {
                            setInStockOnly(e.target.checked);
                            handleFilterChange();
                          }}
                          color="primary"
                        />
                      }
                      label="In Stock Only"
                      sx={{ mr: 2 }}
                    />
                    <Tooltip title="Clear all filters">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ClearAllIcon />}
                        onClick={clearAllFilters}
                        sx={{ borderRadius: 2 }}
                      >
                        Clear
                      </Button>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="error" action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }>
                {error}
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Margin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
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
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {product.title}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.size || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.color || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(product.sellingPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {product.stockQuantity} {getUnitName(product.unit)}
                          </Typography>
                          <Chip
                            label={product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                            color={product.stockQuantity > 0 ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${product.profitMargin.toFixed(1)}%`}
                          color={getProfitMarginColor(product.profitMargin)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const statusInfo = getProductStatusInfo(product.status);
                          return (
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                              variant="filled"
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-icon': {
                                  fontSize: 14,
                                }
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, product)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {!loading && !error && products.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
              </Typography>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                size="medium"
                siblingCount={1}
                boundaryCount={1}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
        }}
      >
        <MenuItem onClick={() => { setViewDialogOpen(true); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem onClick={() => { handleOpenEditProduct(selectedProduct!); }}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* View Product Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Product Details</Typography>
              <IconButton onClick={() => setViewDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {selectedProduct.productPhotos && selectedProduct.productPhotos.length > 0 && (
                    <Box sx={{ textAlign: 'center' }}>
                      <img
                        src={selectedProduct.productPhotos.find(p => p.isPrimary)?.blobUrl || selectedProduct.productPhotos[0].blobUrl}
                        alt={selectedProduct.title}
                        style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 300 }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>{selectedProduct.title}</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography>{selectedProduct.categoryName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                      <Typography>{selectedProduct.size || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Color</Typography>
                      <Typography>{selectedProduct.color || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
                      <Typography>{selectedProduct.unit}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Selling Price</Typography>
                      <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(selectedProduct.sellingPrice)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Cost Price</Typography>
                      <Typography>{formatCurrency(selectedProduct.costPrice)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Stock Quantity</Typography>
                      <Typography>{selectedProduct.stockQuantity} {getUnitName(selectedProduct.unit)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Profit Margin</Typography>
                      <Chip
                        label={`${selectedProduct.profitMargin.toFixed(1)}%`}
                        color={getProfitMarginColor(selectedProduct.profitMargin)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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