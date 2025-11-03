import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Inventory as ProductIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Event as EventIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import stockTransactionsService, {
  StockTransactionDto,
  StockTransactionType,
  StockReferenceType,
  StockTransactionListRequest,
  StockTransactionListResponse,
  CreateStockAdjustmentCommand
} from '../services/stockTransactionsService';
import productService, { Product } from '../services/productService';
import { handleApiError } from '../services/apiClient';

const StockTransactionsPage: React.FC = () => {
  const theme = useTheme();

  // State for transactions list
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state - similar to purchase page
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pagination state
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    refType: '',
    fromDate: '',
    toDate: ''
  });

  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransactionDto | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [detailsTabValue, setDetailsTabValue] = useState(0);

  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    type: StockTransactionType.IN,
    quantity: 1,
    reason: ''
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: StockTransactionListRequest = {
        pageSize: pageSize,
        pageNumber: page,
        ...filters
      };

      // Only include non-empty filters
      if (filters.productId) request.productId = filters.productId;
      if (filters.type) request.type = parseInt(filters.type) as StockTransactionType;
      if (filters.refType) request.refType = parseInt(filters.refType) as StockReferenceType;
      if (filters.fromDate) request.fromDate = filters.fromDate;
      if (filters.toDate) request.toDate = filters.toDate;

      const response = await stockTransactionsService.getTransactions(request);

      if (response.data.succeeded && response.data.data) {
        const data = response.data.data;

        // Handle response format - backend returns either array or paginated object
        if (Array.isArray(data)) {
          // Direct array response - calculate pagination manually
          const totalCount = data.length;
          const calculatedTotalPages = Math.ceil(totalCount / pageSize);

          setTransactions(data);
          setPagination(prev => ({
            ...prev,
            pageNumber: page,
            totalCount: totalCount,
            totalPages: calculatedTotalPages,
            hasNextPage: page < calculatedTotalPages,
            hasPreviousPage: page > 1
          }));
        } else {
          // Paginated response
          setTransactions(data.items);
          setPagination(prev => ({
            ...prev,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalCount: data.totalCount,
            totalPages: data.totalPages,
            hasNextPage: data.hasNextPage,
            hasPreviousPage: data.hasPreviousPage
          }));
        }
      } else {
        setError(response.data.message || 'Failed to load stock transactions');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Load products for dropdowns
  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ pageSize: 1000 });
      if (response.data.succeeded && response.data.data) {
        setProducts(response.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadTransactions();
    loadProducts();
  }, [filters]); // Only reload when filters change

  // Reload when page or pageSize changes
  useEffect(() => {
    loadTransactions();
  }, [page, pageSize]);

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
    loadTransactions();
  };

  const clearFilters = () => {
    const clearedFilters = {
      productId: '',
      type: '',
      refType: '',
      fromDate: '',
      toDate: ''
    };

    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, pageNumber: 1 }));

    // Load transactions with cleared filters immediately
    loadTransactionsWithFilters(clearedFilters);
  };

  // Helper function to load transactions with specific filters
  const loadTransactionsWithFilters = async (filterValues = filters) => {
    setLoading(true);
    setError(null);

    try {
      const request: StockTransactionListRequest = {
        pageSize: pageSize,
        pageNumber: 1, // Always start from page 1 when applying filters
        ...filterValues
      };

      // Only include non-empty filters
      if (filterValues.productId) request.productId = filterValues.productId;
      if (filterValues.type) request.type = parseInt(filterValues.type) as StockTransactionType;
      if (filterValues.refType) request.refType = parseInt(filterValues.refType) as StockReferenceType;
      if (filterValues.fromDate) request.fromDate = filterValues.fromDate;
      if (filterValues.toDate) request.toDate = filterValues.toDate;

      const response = await stockTransactionsService.getTransactions(request);

      if (response.data.succeeded && response.data.data) {
        const data = response.data.data;

        // Handle response format - backend returns either array or paginated object
        if (Array.isArray(data)) {
          // Direct array response - calculate pagination manually
          const totalCount = data.length;
          const calculatedTotalPages = Math.ceil(totalCount / pageSize);

          setTransactions(data);
          setPagination(prev => ({
            ...prev,
            pageNumber: page,
            totalCount: totalCount,
            totalPages: calculatedTotalPages,
            hasNextPage: page < calculatedTotalPages,
            hasPreviousPage: page > 1
          }));
        } else {
          // Paginated response
          setTransactions(data.items);
          setPagination(prev => ({
            ...prev,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalCount: data.totalCount,
            totalPages: data.totalPages,
            hasNextPage: data.hasNextPage,
            hasPreviousPage: data.hasPreviousPage
          }));
        }
      } else {
        setError(response.data.message || 'Failed to load stock transactions');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers - similar to purchase page
  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, transaction: StockTransactionDto) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  // View details handler
  const handleViewDetails = () => {
    setViewDialogOpen(true);
    // Close menu but preserve selectedTransaction for the dialog
    setAnchorEl(null);
  };

  // Adjustment dialog handlers
  const handleCreateAdjustment = () => {
    setAdjustmentDialogOpen(true);
    // Close menu but preserve selectedTransaction
    setAnchorEl(null);
  };

  const handleAdjustmentFormChange = (field: string, value: any) => {
    setAdjustmentForm(prev => ({ ...prev, [field]: value }));
    setAdjustmentError(null);
  };

  const handleCreateAdjustmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.reason) {
      setAdjustmentError('All fields are required');
      return;
    }

    setAdjustmentLoading(true);
    setAdjustmentError(null);

    try {
      const command: CreateStockAdjustmentCommand = {
        productId: adjustmentForm.productId,
        type: adjustmentForm.type,
        quantity: adjustmentForm.quantity,
        reason: adjustmentForm.reason
      };

      const response = await stockTransactionsService.createAdjustment(command);

      if (response.data.succeeded) {
        setAdjustmentSuccess('Stock adjustment created successfully!');
        setAdjustmentForm({
          productId: '',
          type: StockTransactionType.IN,
          quantity: 1,
          reason: ''
        });

        setTimeout(() => {
          setAdjustmentSuccess(null);
          setAdjustmentDialogOpen(false);
          loadTransactions();
        }, 1500);
      } else {
        setAdjustmentError(response.data.message || 'Failed to create adjustment');
      }
    } catch (err: any) {
      setAdjustmentError(handleApiError(err));
    } finally {
      setAdjustmentLoading(false);
    }
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
    return new Date(dateString).toLocaleString();
  };

  // Get transaction type chip color
  const getTransactionTypeColor = (type: StockTransactionType) => {
    switch (type) {
      case StockTransactionType.IN:
        return 'success';
      case StockTransactionType.OUT:
        return 'error';
      default:
        return 'default';
    }
  };

  // Get reference type chip color
  const getReferenceTypeColor = (refType: StockReferenceType) => {
    switch (refType) {
      case StockReferenceType.Purchase:
        return 'primary';
      case StockReferenceType.Sale:
        return 'secondary';
      case StockReferenceType.Adjustment:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
          Stock Transactions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAdjustment}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            }
          }}
        >
          Create Adjustment
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Filters
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Product</InputLabel>
                <Select
                  value={filters.productId}
                  label="Product"
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                >
                  <MenuItem value="">All Products</MenuItem>
                  {products?.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Transaction Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {stockTransactionsService.getTransactionTypeOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Reference Type</InputLabel>
                <Select
                  value={filters.refType}
                  label="Reference Type"
                  onChange={(e) => handleFilterChange('refType', e.target.value)}
                >
                  <MenuItem value="">All References</MenuItem>
                  {stockTransactionsService.getReferenceTypeOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <TextField
                fullWidth
                size="small"
                label="From Date"
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <TextField
                fullWidth
                size="small"
                label="To Date"
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid sx={{ xs: 12, sm: 6, md: 2, minWidth: 220 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={applyFilters}
                  sx={{ flex: 1 }}
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ flex: 1 }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Transactions Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Cost</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (!transactions || transactions.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No stock transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {transaction.productName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.typeName}
                        color={getTransactionTypeColor(transaction.type) as any}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.refTypeName}
                        color={getReferenceTypeColor(transaction.refType) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'medium',
                          color: transaction.type === StockTransactionType.OUT ? 'error.main' : 'success.main'
                        }}
                      >
                        {transaction.type === StockTransactionType.OUT ? '-' : '+'}{transaction.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(transaction.unitCost)}</TableCell>
                    <TableCell align="right">{formatCurrency(transaction.totalCost)}</TableCell>
                    <TableCell>{transaction.createdBy}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, transaction)}
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

        {/* Custom Pagination - similar to purchase page */}
        {!loading && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {transactions.length} of {pagination.totalCount} transactions
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
              count={pagination.totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
              size="medium"
            />
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 150,
            '& .MuiListItem-root': {
              px: 2
            }
          }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Enhanced View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setDetailsTabValue(0);
          setSelectedTransaction(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ReceiptIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Transaction Details
            </Typography>
          </Box>
        </DialogTitle>

        {/* Tabs */}
        <Tabs
          value={detailsTabValue}
          onChange={(e, newValue) => setDetailsTabValue(newValue)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<InfoIcon />}
            label="Overview"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<ProductIcon />}
            label="Product Details"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<TimelineIcon />}
            label="Reference & Origin"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        <DialogContent sx={{ pt: 2 }}>
          {selectedTransaction ? (
            <>
              {/* Overview Tab */}
              {detailsTabValue === 0 && (
                <Box>
                  <Grid container spacing={3}>
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <Card elevation={1} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                          Transaction Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Transaction ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                              {selectedTransaction.id?.substring(0, 8).toUpperCase() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Transaction Date
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {formatDate(selectedTransaction.transactionDate)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Transaction Type
                            </Typography>
                            <Chip
                              label={selectedTransaction.typeName}
                              color={getTransactionTypeColor(selectedTransaction.type) as any}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>

                    <Grid sx={{ xs: 12, md: 6 }}>
                      <Card elevation={1} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                          Financial Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Quantity
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {selectedTransaction.quantity.toLocaleString()} units
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Unit Cost
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {formatCurrency(selectedTransaction.unitCost)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Cost
                            </Typography>
                            <Typography variant="h5" color="primary.main" fontWeight={600}>
                              {formatCurrency(selectedTransaction.totalCost)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>

                    <Grid sx={{ xs: 12 }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                          Reference Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              Reference Type
                            </Typography>
                            <Chip
                              label={selectedTransaction.refTypeName}
                              color={getReferenceTypeColor(selectedTransaction.refType) as any}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </Grid>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              Reference ID
                            </Typography>
                            <Typography variant="body1">
                              {selectedTransaction.refId || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Product Details Tab */}
              {detailsTabValue === 1 && (
                <Box>
                  <Card elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight={600} sx={{ mb: 3 }}>
                      Product Information
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid sx={{ xs: 12, md: 8 }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Product Name
                          </Typography>
                          <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
                            {selectedTransaction.productName}
                          </Typography>
                        </Box>

                        <Grid container spacing={3}>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Product ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
                              {selectedTransaction.productId?.substring(0, 8).toUpperCase() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Stock Impact
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              <Chip
                                label={`${selectedTransaction.type === StockTransactionType.IN ? '+' : '-'}${selectedTransaction.quantity} units`}
                                color={selectedTransaction.type === StockTransactionType.IN ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid sx={{ xs: 12, md: 4 }}>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <ProductIcon sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" gutterBottom>
                            Product Transaction
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This transaction affects product inventory levels
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

              {/* Reference & Origin Tab */}
              {detailsTabValue === 2 && (
                <Box>
                  <Card elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight={600} sx={{ mb: 3 }}>
                      Transaction Origin & Audit Trail
                    </Typography>

                    <List>
                      <ListItem sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 2, mb: 2 }}>
                        <ListItemIcon>
                          <EventIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6" fontWeight={600}>
                              Transaction Created
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(selectedTransaction.createdDate)}
                              </Typography>
                              <Typography variant="body1">
                                Stock transaction recorded in the system
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>

                      <ListItem sx={{ borderLeft: 3, borderColor: 'secondary.main', pl: 2, mb: 2 }}>
                        <ListItemIcon>
                          <PersonIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6" fontWeight={600}>
                              Created By
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body1">
                                {selectedTransaction.createdBy}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                System user who initiated this transaction
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>

                      <ListItem sx={{ borderLeft: 3, borderColor: 'success.main', pl: 2 }}>
                        <ListItemIcon>
                          <ReceiptIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6" fontWeight={600}>
                              Reference Information
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body1">
                                Type: {selectedTransaction.refTypeName}
                              </Typography>
                              {selectedTransaction.refId && (
                                <Typography variant="body1">
                                  ID: {selectedTransaction.refId}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Related document or transaction reference
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </List>
                  </Card>

                  <Card elevation={1} sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                      Technical Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Transaction Type Enum
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {selectedTransaction.type}
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Reference Type Enum
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {selectedTransaction.refType}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No transaction details available.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setViewDialogOpen(false);
              setDetailsTabValue(0);
              setSelectedTransaction(null);
            }}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Adjustment Dialog */}
      <Dialog
        open={adjustmentDialogOpen}
        onClose={() => setAdjustmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Create Stock Adjustment</DialogTitle>
        <form onSubmit={handleCreateAdjustmentSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {adjustmentError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {adjustmentError}
              </Alert>
            )}

            {adjustmentSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {adjustmentSuccess}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid sx={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={adjustmentForm.productId}
                    label="Product"
                    onChange={(e) => handleAdjustmentFormChange('productId', e.target.value)}
                  >
                    {products?.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid sx={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Adjustment Type</InputLabel>
                  <Select
                    value={adjustmentForm.type}
                    label="Adjustment Type"
                    onChange={(e) => handleAdjustmentFormChange('type', parseInt(e.target.value) as StockTransactionType)}
                  >
                    {stockTransactionsService.getTransactionTypeOptions().map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={adjustmentForm.quantity}
                  onChange={(e) => handleAdjustmentFormChange('quantity', parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid sx={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={adjustmentForm.reason}
                  onChange={(e) => handleAdjustmentFormChange('reason', e.target.value)}
                  required
                  placeholder="Describe the reason for this adjustment..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAdjustmentDialogOpen(false)} disabled={adjustmentLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adjustmentLoading}
              startIcon={adjustmentLoading ? <CircularProgress size={20} /> : null}
            >
              {adjustmentLoading ? 'Creating...' : 'Create Adjustment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StockTransactionsPage;