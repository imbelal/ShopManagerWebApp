import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Menu,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import purchasesService, { Purchase, Supplier, PurchaseStatus } from '../services/purchasesService';
import { productService, Product } from '../services/productService';
import { handleApiError } from '../services/apiClient';
import PurchaseForm from '../components/PurchaseForm';

const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Handle page size change
  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [purchaseToView, setPurchaseToView] = useState<Purchase | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null);

  // View dialog states
  const [viewTabValue, setViewTabValue] = useState(0);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Load purchases
  const loadPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
        supplierId: selectedSupplier || undefined,
        status: selectedStatus ? parseInt(selectedStatus) as PurchaseStatus : undefined
      };

      const response = await purchasesService.getPurchases(filters);
      if (response.data.succeeded && response.data.data) {
        setPurchases(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
      } else {
        setError(response.data.message || 'Failed to load purchases');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const response = await purchasesService.getSuppliers();
      if (response.data.succeeded && response.data.data) {
        setSuppliers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({
        pageSize: 100,
        pageNumber: 1,
        inStock: true
      });
      if (response.data.succeeded && response.data.data) {
        setProducts(response.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, purchase: Purchase) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchase(purchase);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchase(null);
  };

  const handleView = async () => {
    if (selectedPurchase) {
      setPurchaseToView(selectedPurchase);
      setViewDialogOpen(true);
      setViewTabValue(0);

      // Load supplier details for this purchase
      const supplier = suppliers.find(s => s.id === selectedPurchase.supplierId);
      setViewSupplier(supplier || null);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedPurchase) {
      setEditPurchase(selectedPurchase);
      setPurchaseFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedPurchase) {
      setPurchaseToDelete(selectedPurchase);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCancel = async () => {
    if (selectedPurchase) {
      try {
        setLoading(true);
        const response = await purchasesService.cancelPurchase(selectedPurchase.id);
        if (response.data.succeeded) {
          showSnackbar('Purchase cancelled successfully', 'success');
          loadPurchases();
        } else {
          setError(response.data.message || 'Failed to cancel purchase');
        }
      } catch (err: any) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (purchaseToDelete) {
      try {
        setLoading(true);
        const response = await purchasesService.deletePurchase(purchaseToDelete.id);
        if (response.data.succeeded) {
          showSnackbar('Purchase deleted successfully', 'success');
          loadPurchases();
        } else {
          setError(response.data.message || 'Failed to delete purchase');
        }
      } catch (err: any) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
        setDeleteDialogOpen(false);
        setPurchaseToDelete(null);
      }
    }
  };

  const handleRefresh = () => {
    loadPurchases();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Effects
  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, [page, pageSize, searchTerm, selectedSupplier, selectedStatus]);

  // Business rule helpers
  const canEditPurchase = (purchase: Purchase) => {
    return purchase.status !== PurchaseStatus.Completed && purchase.status !== PurchaseStatus.Cancelled;
  };

  const canCancelPurchase = (purchase: Purchase) => {
    return purchase.status !== PurchaseStatus.Cancelled;
  };

  const canDeletePurchase = (purchase: Purchase) => {
    return purchase.status !== PurchaseStatus.Completed && purchase.status !== PurchaseStatus.Cancelled;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Purchases Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditPurchase(null);
            setPurchaseFormOpen(true);
          }}
        >
          Add Purchase
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4} minWidth={220}>
              <TextField
                fullWidth
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3} minWidth={220}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={selectedSupplier}
                  label="Supplier"
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3} minWidth={220}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="0">Pending</MenuItem>
                  <MenuItem value="1">Completed</MenuItem>
                  <MenuItem value="2">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2} minWidth={220}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No purchases found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id} hover>
                      <TableCell>
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {purchase.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {purchase.purchaseItems.length} items
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(purchase.totalCost)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={purchasesService.formatPurchaseStatus(purchase.status)}
                          color={purchasesService.getPurchaseStatusColor(purchase.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {purchase.createdBy}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, purchase)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {!loading && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {purchases.length} of {totalCount} purchases
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Page Size</InputLabel>
                  <Select
                    value={pageSize}
                    label="Page Size"
                    onChange={handlePageSizeChange}
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
                size="medium"
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
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedPurchase && canEditPurchase(selectedPurchase) && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {selectedPurchase && canCancelPurchase(selectedPurchase) && (
          <MenuItem onClick={handleCancel}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel
          </MenuItem>
        )}
        {selectedPurchase && canDeletePurchase(selectedPurchase) && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Enhanced View Purchase Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setPurchaseToView(null);
          setViewSupplier(null);
          setViewTabValue(0);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minHeight: '70vh' } }}
      >
        {purchaseToView && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                  Purchase Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ID: {purchaseToView.id.substring(0, 8)}...
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={purchasesService.formatPurchaseStatus(purchaseToView.status)}
                  color={purchasesService.getPurchaseStatusColor(purchaseToView.status)}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <IconButton onClick={() => setViewDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={viewTabValue} onChange={(e, newValue) => setViewTabValue(newValue)}>
                <Tab label="Overview" />
                <Tab label={`Items (${purchaseToView.purchaseItems.length})`} />
                <Tab label="Supplier" />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            {viewTabValue === 0 && (
              <Box sx={{ p: 3 }}>
                {viewLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* Purchase Summary Card */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                            Purchase Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>Purchase Date</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {new Date(purchaseToView.purchaseDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>Created By</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {purchaseToView.createdBy}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>Supplier</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {purchaseToView.supplierName}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Financial Summary Card */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon color="primary" />
                            Financial Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {formatCurrency(purchaseToView.totalCost)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Items</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {purchaseToView.purchaseItems.length}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Status</Typography>
                              <Chip
                                label={purchasesService.formatPurchaseStatus(purchaseToView.status)}
                                color={purchasesService.getPurchaseStatusColor(purchaseToView.status)}
                                size="small"
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Remarks Card */}
                    {purchaseToView.remark && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimelineIcon color="primary" />
                              Remarks
                            </Typography>
                            <Typography variant="body1">
                              {purchaseToView.remark}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            )}

            {/* Items Tab */}
            {viewTabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBasketIcon color="primary" />
                  Purchase Items ({purchaseToView.purchaseItems.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Cost per Unit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseToView.purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.costPerUnit)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            {formatCurrency(item.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Supplier Tab */}
            {viewTabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" />
                  Supplier Information
                </Typography>
                {viewSupplier ? (
                  <Card>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <List>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <BusinessIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Company Name"
                                secondary={viewSupplier.name}
                                primaryTypographyProps={{ fontWeight: 600 }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                  <EmailIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Email"
                                secondary={viewSupplier.email}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                  <PhoneIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Contact"
                                secondary={viewSupplier.contactNo}
                              />
                            </ListItem>
                          </List>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <List>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                  <LocationOnIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Address"
                                secondary={viewSupplier.address}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: viewSupplier.isActive ? 'success.main' : 'error.main' }}>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Status"
                                secondary={
                                  <Chip
                                    label={viewSupplier.isActive ? 'Active' : 'Inactive'}
                                    color={viewSupplier.isActive ? 'success' : 'error'}
                                    size="small"
                                  />
                                }
                              />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="h6">Supplier information not available</Typography>
                    <Typography variant="body2">Unable to load supplier details for this purchase.</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPurchaseToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this purchase? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setPurchaseToDelete(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Form Dialog */}
      <PurchaseForm
        open={purchaseFormOpen}
        onClose={() => {
          setPurchaseFormOpen(false);
          setEditPurchase(null);
        }}
        editPurchase={editPurchase}
        suppliers={suppliers}
        products={products}
        onPurchaseAdded={() => {
          loadPurchases();
          loadSuppliers();
          loadProducts();
        }}
        onPurchaseUpdated={() => {
          loadPurchases();
          loadSuppliers();
          loadProducts();
        }}
      />

      {/* Snackbar */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={handleSnackbarClose}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            minWidth: 300
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default PurchasesPage;