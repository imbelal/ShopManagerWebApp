import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  ListItemIcon,
  Chip,
  MenuItem
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
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
import {
  DataTable,
  StatusChip,
  CurrencyDisplay,
  createStandardActions,
  EmptyState
} from '../components/common';
import PageHeader from '../components/common/PageHeader';
import FilterBar from '../components/common/FilterBar';
import usePagination, { usePaginationProps } from '../hooks/usePagination';

const StockTransactionsPage: React.FC = () => {
  const theme = useTheme();

  // State for transactions list
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [pagination, paginationActions] = usePagination(1, 20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    refType: '',
    fromDate: '',
    toDate: ''
  });

  // Menu and dialog states
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
        pageSize: pagination.pageSize,
        pageNumber: pagination.page
      };

      // Only include non-empty filters
      if (filters.productId) request.productId = filters.productId;
      if (filters.type) {
        const typeValue = parseInt(filters.type) as StockTransactionType;
        request.type = typeValue;
              }
      if (filters.refType) {
        const refTypeValue = parseInt(filters.refType) as StockReferenceType;
        request.refType = refTypeValue;
              }
      if (filters.fromDate) request.fromDate = filters.fromDate;
      if (filters.toDate) request.toDate = filters.toDate;

            const response = await stockTransactionsService.getTransactions(request);

      if (response.data.succeeded && response.data.data) {
        const data = response.data.data;

        // Handle response format - backend returns either array or paginated object
        if (Array.isArray(data)) {
          // Direct array response - set transactions directly
          setTransactions(data);
          setTotalCount(data.length);
          setTotalPages(Math.ceil(data.length / pagination.pageSize));
                  } else {
          // Paginated response
          setTransactions(data.items);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
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
  }, []); // Only load once on mount

  // Reload when pagination or filters change
  useEffect(() => {
    loadTransactions();
  }, [pagination.page, pagination.pageSize]); // Only reload when pagination changes

  // Reload when filters change
  useEffect(() => {
    paginationActions.resetPage();
    loadTransactions();
  }, [filters.productId, filters.type, filters.refType, filters.fromDate, filters.toDate]);

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    paginationActions.setPage(1);
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
    paginationActions.setPage(1);

    // Load transactions with cleared filters immediately
    loadTransactionsWithFilters(clearedFilters);
  };

  // Helper function to load transactions with specific filters
  const loadTransactionsWithFilters = async (filterValues = filters) => {
    setLoading(true);
    setError(null);

    try {
      const request: StockTransactionListRequest = {
        pageSize: pagination.pageSize,
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
          // Direct array response - set transactions directly
          setTransactions(data);
          setTotalCount(data.length);
          setTotalPages(Math.ceil(data.length / pagination.pageSize));
                  } else {
          // Paginated response
          setTransactions(data.items);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
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

  
  // View details handler
  const handleViewDetails = (transaction: StockTransactionDto) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
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

  // Define table columns matching original structure
  const columns = [
    {
      id: 'transactionDate',
      label: 'Date',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'productName',
      label: 'Product',
      minWidth: 200
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 80,
      format: (value) => (
        <Chip
          label={value === StockTransactionType.IN ? 'IN' : 'OUT'}
          color={value === StockTransactionType.IN ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      )
    },
    {
      id: 'refTypeName',
      label: 'Reference',
      minWidth: 120
    },
    {
      id: 'quantity',
      label: 'Quantity',
      align: 'right' as const,
      minWidth: 100,
      format: (value, row) => (
        <Typography variant="body2" sx={{
          fontWeight: 500,
          color: row.type === StockTransactionType.IN ? 'success.main' : 'error.main'
        }}>
          {row.type === StockTransactionType.IN ? '+' : '-'}{value}
        </Typography>
      )
    },
    {
      id: 'unitCost',
      label: 'Unit Cost',
      align: 'right' as const,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2">
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'totalCost',
      label: 'Total Cost',
      align: 'right' as const,
      minWidth: 120,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'createdBy',
      label: 'Created By',
      minWidth: 120
    }
  ];

  // Define row actions
  const getRowActions = (transaction: StockTransactionDto) => {
    return createStandardActions(
      transaction,
      () => handleViewDetails(transaction),
      undefined, // No edit action for stock transactions
      undefined, // No delete action for stock transactions
      {
        canEdit: () => false,
        canDelete: () => false
      }
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader
        title="Stock Transactions"
        subtitle="Track and manage your inventory movements"
        actionButton={{
          label: "Create Adjustment",
          onClick: handleCreateAdjustment
        }}
        showRefresh={true}
        onRefresh={loadTransactions}
        loading={loading}
      />

          <FilterBar
        searchPlaceholder=""
        searchTerm=""
        onSearchChange={() => {}}
        hideSearch={true}
        filters={[
          {
            id: 'productId',
            label: 'Product',
            value: filters.productId,
            options: products?.map((product) => ({ value: product.id, label: product.title })) || []
          },
          {
            id: 'type',
            label: 'Transaction Type',
            value: filters.type,
            options: stockTransactionsService.getTransactionTypeOptions().map((option) => ({
              value: option.value.toString(),
              label: option.label
            }))
          },
          {
            id: 'refType',
            label: 'Reference Type',
            value: filters.refType,
            options: stockTransactionsService.getReferenceTypeOptions().map((option) => ({
              value: option.value.toString(),
              label: option.label
            }))
          }
        ]}
        dateFields={[
          {
            id: 'fromDate',
            label: 'From Date',
            value: filters.fromDate,
            onChange: (value) => handleFilterChange('fromDate', value),
            type: 'date'
          },
          {
            id: 'toDate',
            label: 'To Date',
            value: filters.toDate,
            onChange: (value) => handleFilterChange('toDate', value),
            type: 'date'
          }
        ]}
        onFilterChange={(filterId, value) => {
          handleFilterChange(filterId, value);
        }}
        onClearFilters={clearFilters}
        loading={loading}
        showClearButton={true}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stock Transactions DataTable */}
      <DataTable
        data={transactions || []}
        columns={columns}
        loading={loading}
        error={error}
        emptyState={{
          icon: '📈',
          title: 'No stock transactions found',
          description: filters.productId || filters.type || filters.refType || filters.fromDate || filters.toDate
            ? 'Try adjusting your search terms or filters'
            : 'Stock transactions will appear here when inventory changes occur',
          action: {
            label: 'Create Adjustment',
            onClick: handleCreateAdjustment
          }
        }}
        actions={getRowActions}
        getRowId={(transaction) => transaction.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount, totalPages, [5, 10, 20, 25, 50, 100])}
        errorAction={{
          label: 'Retry',
          onClick: loadTransactions
        }}
        sx={{
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04)
            }
          }
        }}
      />

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