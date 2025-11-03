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
  PictureAsPdf as PdfIcon,
  Payments as PaymentIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { salesService, Sales, Customer } from '../services/salesService';
import { handleApiError } from '../services/apiClient';
import SalesForm from '../components/SalesForm';
import PaymentDialog from '../components/PaymentDialog';

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sales[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sales | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [salesFormOpen, setSalesFormOpen] = useState(false);
  const [editSale, setEditSale] = useState<Sales | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogSale, setPaymentDialogSale] = useState<Sales | null>(null);

  // View dialog states
  const [viewPayments, setViewPayments] = useState<any[]>([]);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [viewTabValue, setViewTabValue] = useState(0);
  const [viewLoading, setViewLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Load sales data
  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.getSales({
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
        customerId: selectedCustomer || undefined
      });

      if (response.data.succeeded && response.data.data) {
        setSales(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
      } else {
        setError(response.data.message || 'Failed to load sales');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const response = await salesService.getCustomers();
      if (response.data.succeeded && response.data.data) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    loadSales();
    loadCustomers();
  }, [page, pageSize, searchTerm, selectedCustomer]);

  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, sale: Sales) => {
    setSelectedSale(sale);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  // Handle view sale
  const handleViewSale = async () => {
    if (!selectedSale?.id) return;

    setViewLoading(true);
    setAnchorEl(null);

    try {
      // Load payments for this sale
      const paymentsResponse = await salesService.getSalePayments(selectedSale.id);
      if (paymentsResponse.data.succeeded && paymentsResponse.data.data) {
        setViewPayments(paymentsResponse.data.data);
      }

      // Load customer details
      const customersResponse = await salesService.getCustomers();
      if (customersResponse.data.succeeded && customersResponse.data.data) {
        const customer = customersResponse.data.data.find(c => c.id === selectedSale.customerId);
        setViewCustomer(customer || null);
      }

      setViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to load sale details:', error);
      setViewDialogOpen(true); // Still open dialog even if some data fails
    } finally {
      setViewLoading(false);
    }
  };

  // Handle delete sale
  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    // Prevent deleting paid sales
    if (selectedSale.status === 2) {
      setSnackbar({
        open: true,
        message: 'Cannot delete paid sales',
        severity: 'warning'
      });
      setDeleteDialogOpen(false);
      handleMenuClose();
      return;
    }

    // Prevent deleting cancelled sales
    if (selectedSale.status === 3) {
      setSnackbar({
        open: true,
        message: 'Cannot delete cancelled sales',
        severity: 'warning'
      });
      setDeleteDialogOpen(false);
      handleMenuClose();
      return;
    }

    try {
      const response = await salesService.deleteSale(selectedSale.id);
      if (response.data.succeeded) {
        setSnackbar({
          open: true,
          message: 'Sale deleted successfully',
          severity: 'success'
        });
        loadSales();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to delete sale',
          severity: 'error'
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: handleApiError(err),
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
    }
  };

  // Handle cancel sale
  const handleCancelSale = async () => {
    if (!selectedSale) return;

    try {
      const response = await salesService.cancelSale(selectedSale.id);
      if (response.data.succeeded) {
        setSnackbar({
          open: true,
          message: 'Sale cancelled successfully',
          severity: 'success'
        });
        loadSales();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to cancel sale',
          severity: 'error'
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: handleApiError(err),
        severity: 'error'
      });
    } finally {
      handleMenuClose();
    }
  };

  // Handle add payment
  const handleAddPayment = async () => {
    if (!selectedSale?.id) return;

    // Prevent adding payments to cancelled sales
    if (selectedSale.status === 3) {
      setSnackbar({
        open: true,
        message: 'Cannot add payments to cancelled sales',
        severity: 'warning'
      });
      handleMenuClose();
      return;
    }

    handleMenuClose();

    try {
      // Fetch fresh sale data to get current payment information
      const response = await salesService.getSaleById(selectedSale.id);
      if (response.data.succeeded && response.data.data) {
        setPaymentDialogSale(response.data.data);
      } else {
        // If fetch fails, use existing selectedSale data
        setPaymentDialogSale(selectedSale);
      }
    } catch (error) {
      console.error('Failed to refresh sale data:', error);
      // If fetch fails, use existing selectedSale data
      setPaymentDialogSale(selectedSale);
    }

    // Open dialog immediately after setting payment dialog sale data
    setPaymentDialogOpen(true);
  };

  // Handle payment added
  const handlePaymentAdded = () => {
    loadSales();
    setSnackbar({
      open: true,
      message: 'Payment added successfully',
      severity: 'success'
    });
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!selectedSale) return;

    try {
      await salesService.generateSalesPdf(selectedSale.id);
      setSnackbar({
        open: true,
        message: 'PDF downloaded successfully',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: handleApiError(err),
        severity: 'error'
      });
    } finally {
      handleMenuClose();
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadSales();
    loadCustomers();
  };

  // Handle page size change
  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Sales form handlers
  const handleNewSale = () => {
    setEditSale(null);
    setSalesFormOpen(true);
  };

  const handleEditSale = (sale: Sales) => {
    // Prevent editing paid and cancelled sales
    if (sale.status === 2) {
      setSnackbar({
        open: true,
        message: 'Cannot edit paid sales',
        severity: 'warning'
      });
      handleMenuClose();
      return;
    }

    if (sale.status === 3) {
      setSnackbar({
        open: true,
        message: 'Cannot edit cancelled sales',
        severity: 'warning'
      });
      handleMenuClose();
      return;
    }

    setEditSale(sale);
    setSalesFormOpen(true);
    handleMenuClose();
  };

  const handleSaveSale = async (saleId: string) => {
    setSalesFormOpen(false);
    setEditSale(null);
    await loadSales(); // Refresh the sales list
    setSnackbar({
      open: true,
      message: 'Sale saved successfully',
      severity: 'success'
    });
  };

  const handleCloseSalesForm = () => {
    setSalesFormOpen(false);
    setEditSale(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Sales
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            borderRadius: 1,
            px: 3,
            py: 1,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
            }
          }}
          onClick={handleNewSale}
        >
          New Sale
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid sx={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by sales number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 3, minWidth: 250 }}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={selectedCustomer}
                  label="Customer"
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                fullWidth
                sx={{ borderRadius: 1, height: '56px' }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card sx={{ borderRadius: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
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
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sales #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Profit</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {sale.salesNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{formatDate(sale.createdDate)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(sale.grandTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{
                            color: sale.totalPaid >= sale.grandTotal ? 'success.main' : 'warning.main'
                          }}>
                            {formatCurrency(sale.totalPaid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{
                            color: sale.remainingAmount > 0 ? 'error.main' : 'success.main'
                          }}>
                            {formatCurrency(sale.remainingAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={salesService.getStatusText(sale.status)}
                            color={salesService.getStatusColor(sale.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{
                            color: sale.salesProfit >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 500
                          }}>
                            {formatCurrency(sale.salesProfit)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, sale)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {(totalPages > 1 || totalCount > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {sales.length} of {totalCount} sales
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
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="medium"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
        }}
      >
        <MenuItem onClick={handleViewSale}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem
          onClick={() => handleEditSale(selectedSale!)}
          disabled={selectedSale?.status === 2 || selectedSale?.status === 3} // Disable for Paid and Cancelled sales
        >
          <EditIcon sx={{ mr: 1 }} /> Edit Sale
        </MenuItem>
        <MenuItem onClick={handleDownloadPdf}>
          <PdfIcon sx={{ mr: 1 }} /> Download PDF
        </MenuItem>
        <MenuItem
          onClick={handleAddPayment}
          disabled={selectedSale?.remainingAmount <= 0 || selectedSale?.status === 3} // Disable if no balance or cancelled
        >
          <PaymentIcon sx={{ mr: 1 }} /> Add Payment
        </MenuItem>
        {selectedSale?.status !== 3 && selectedSale?.status !== 2 && ( // Not Cancelled and Not Paid
          <MenuItem onClick={handleCancelSale} sx={{ color: 'warning.main' }}>
            <CancelIcon sx={{ mr: 1 }} /> Cancel Sale
          </MenuItem>
        )}
        <MenuItem
          onClick={() => { setDeleteDialogOpen(true); }}
          sx={{ color: 'error.main' }}
          disabled={selectedSale?.status === 2 || selectedSale?.status === 3} // Disable for Paid and Cancelled sales
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Enhanced View Sale Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedSale(null);
          setViewPayments([]);
          setViewCustomer(null);
          setViewTabValue(0);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minHeight: '70vh' } }}
      >
        {selectedSale && (
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
                  Sale Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedSale.salesNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={salesService.getStatusText(selectedSale.status)}
                  color={salesService.getStatusColor(selectedSale.status) as any}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedSale(null);
                    setViewPayments([]);
                    setViewCustomer(null);
                    setViewTabValue(0);
                  }}
                  startIcon={<CloseIcon />}
                >
                  Close
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={viewTabValue}
                  onChange={(e, newValue) => setViewTabValue(newValue)}
                  sx={{ px: 3 }}
                >
                  <Tab label="Overview" />
                  <Tab label="Items" />
                  <Tab label="Payments" />
                  <Tab label="Customer" />
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
                      {/* Sale Summary Card */}
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                              Sale Summary
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 12 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Date</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatDate(selectedSale.createdDate)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Remark</Typography>
                                <Typography variant="body1">
                                  {selectedSale.remark || 'No remarks'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Financial Summary Card */}
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReceiptIcon color="primary" />
                              Financial Summary
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Total Price</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(selectedSale.totalPrice)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Discount</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                                  -{formatCurrency(selectedSale.discountAmount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(selectedSale.taxAmount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Grand Total</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {formatCurrency(selectedSale.grandTotal)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                                  {formatCurrency(selectedSale.totalPaid)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Remaining</Typography>
                                <Typography variant="h6" sx={{
                                  fontWeight: 600,
                                  color: selectedSale.remainingAmount > 0 ? 'error.main' : 'success.main'
                                }}>
                                  {formatCurrency(selectedSale.remainingAmount)}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Profit Analysis Card */}
                      <Grid sx={{ xs: 12 }}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimelineIcon color="success" />
                              Profit Analysis
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid sx={{ xs: 12, md: 4 }}>
                                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                  <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                                    {formatCurrency(selectedSale.salesTotalCost)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 4 }}>
                                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: selectedSale.salesProfit >= 0 ? 'success.50' : 'error.50' }}>
                                  <Typography variant="body2" color="text.secondary">Profit</Typography>
                                  <Typography variant="h5" sx={{
                                    fontWeight: 600,
                                    mt: 1,
                                    color: selectedSale.salesProfit >= 0 ? 'success.main' : 'error.main'
                                  }}>
                                    {formatCurrency(selectedSale.salesProfit)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 4 }}>
                                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: selectedSale.salesProfitMargin >= 0 ? 'success.50' : 'error.50' }}>
                                  <Typography variant="body2" color="text.secondary">Profit Margin</Typography>
                                  <Typography variant="h5" sx={{
                                    fontWeight: 600,
                                    mt: 1,
                                    color: selectedSale.salesProfitMargin >= 0 ? 'success.main' : 'error.main'
                                  }}>
                                    {selectedSale.salesProfitMargin.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {/* Items Tab */}
              {viewTabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingBasketIcon color="primary" />
                    Sales Items ({selectedSale.salesItems.length})
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSale.salesItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Payments Tab */}
              {viewTabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon color="primary" />
                    Payment History ({viewPayments.length})
                  </Typography>
                  {viewPayments.length > 0 ? (
                    <List>
                      {viewPayments.map((payment) => (
                        <Card key={payment.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">Amount</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(payment.amount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">Method</Typography>
                                <Chip
                                  label={payment.paymentMethod}
                                  color={salesService.getPaymentMethodColor(payment.paymentMethod)}
                                  size="small"
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">Date</Typography>
                                <Typography variant="body1">
                                  {new Date(payment.paymentDate).toLocaleDateString()} at {new Date(payment.paymentDate).toLocaleTimeString()}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                {payment.remark && (
                                  <>
                                    <Typography variant="body2" color="text.secondary">Remark</Typography>
                                    <Typography variant="body2">{payment.remark}</Typography>
                                  </>
                                )}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="h6">No payments recorded</Typography>
                      <Typography variant="body2">This sale has no payment history yet.</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Customer Tab */}
              {viewTabValue === 3 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    Customer Information
                  </Typography>
                  {viewCustomer ? (
                    <Card>
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <List>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <PersonIcon />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary="Name"
                                  secondary={`${viewCustomer.firstName} ${viewCustomer.lastName}`}
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
                                  secondary={viewCustomer.email}
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
                                  secondary={viewCustomer.contactNo}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <List>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                                    <LocationIcon />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary="Address"
                                  secondary={viewCustomer.address || 'No address provided'}
                                />
                              </ListItem>
                              {viewCustomer.remark && (
                                <ListItem>
                                  <ListItemText
                                    primary="Remarks"
                                    secondary={viewCustomer.remark}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="h6">Customer information not available</Typography>
                      <Typography variant="body2">Unable to load customer details.</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedSale(null); }}
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle>Delete Sale</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete sale "{selectedSale?.salesNumber}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedSale(null); }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSale} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sales Form Dialog */}
      <SalesForm
        open={salesFormOpen}
        onClose={handleCloseSalesForm}
        onSave={handleSaveSale}
        editSale={editSale}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentDialogSale(null);
        }}
        saleId={paymentDialogSale?.id || ''}
        salesNumber={paymentDialogSale?.salesNumber || ''}
        grandTotal={paymentDialogSale?.grandTotal || 0}
        totalPaid={paymentDialogSale?.totalPaid || 0}
        remainingAmount={paymentDialogSale?.remainingAmount || 0}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Snackbar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999
        }}
      >
        {/* Snackbar implementation here */}
      </Box>
    </Box>
  );
};

export default SalesPage;