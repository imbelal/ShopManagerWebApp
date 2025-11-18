import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  MenuItem,
  Autocomplete
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
  const { t } = useTranslation();
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
        setError(response.data.message || t('stockTransactions.failedToLoadTransactions'));
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
        pageNumber: 1 // Always start from page 1 when applying filters
      };

      // Only include non-empty filters with proper type conversion
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
        setError(response.data.message || t('stockTransactions.failedToLoadTransactions'));
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Note: Pagination is now handled by usePagination hook

  
  // View details handler
  const handleViewDetails = (transaction: StockTransactionDto) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  // Adjustment dialog handlers
  const handleCreateAdjustment = () => {
    setAdjustmentDialogOpen(true);
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

  // Translate transaction type names
  const getTransactionTypeTranslation = (typeName: string): string => {
    switch (typeName?.toLowerCase()) {
      case 'stock in':
        return t('stockTransactions.transactionTypes.stockIn');
      case 'stock out':
        return t('stockTransactions.transactionTypes.stockOut');
      default:
        return typeName || '';
    }
  };

  // Translate reference type names
  const getReferenceTypeTranslation = (refTypeName: string): string => {
    switch (refTypeName?.toLowerCase()) {
      case 'purchase':
        return t('stockTransactions.referenceTypes.purchase');
      case 'sale':
        return t('stockTransactions.referenceTypes.sale');
      case 'sales return':
        return t('stockTransactions.referenceTypes.salesReturn');
      case 'adjustment':
        return t('stockTransactions.referenceTypes.adjustment');
      case 'sales cancellation':
      case 'salescancellation':
        return t('stockTransactions.referenceTypes.salesCancellation');
      case 'purchase cancellation':
      case 'purchasecancellation':
        return t('stockTransactions.referenceTypes.purchaseCancellation');
      default:
        return refTypeName || '';
    }
  };

  // Define table columns matching original structure
  const columns = [
    {
      id: 'transactionDate',
      label: t('stockTransactions.tableColumns.date'),
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'productName',
      label: t('stockTransactions.tableColumns.product'),
      minWidth: 200
    },
    {
      id: 'type',
      label: t('stockTransactions.tableColumns.type'),
      minWidth: 80,
      format: (value) => (
        <Chip
          label={getTransactionTypeTranslation(value === StockTransactionType.IN ? 'Stock In' : 'Stock Out')}
          color={value === StockTransactionType.IN ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      )
    },
    {
      id: 'refTypeName',
      label: t('stockTransactions.tableColumns.reference'),
      minWidth: 120,
      format: (value) => getReferenceTypeTranslation(value)
    },
    {
      id: 'quantity',
      label: t('stockTransactions.tableColumns.quantity'),
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
      label: t('stockTransactions.tableColumns.unitCost'),
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
      label: t('stockTransactions.tableColumns.totalCost'),
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
      label: t('stockTransactions.tableColumns.createdBy'),
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
        canDelete: () => false,
        translations: {
          viewDetails: t('stockTransactions.actions.viewDetails'),
          edit: t('stockTransactions.actions.edit'),
          delete: t('stockTransactions.actions.delete')
        }
      }
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader
        title={t('stockTransactions.title')}
        subtitle={t('stockTransactions.subtitle')}
        actionButton={{
          label: t('stockTransactions.createAdjustment'),
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
        filterMinWidth={200}
        filters={[
          {
            id: 'type',
            label: t('stockTransactions.filters.transactionType'),
            value: filters.type,
            options: stockTransactionsService.getTransactionTypeOptions().map((option) => ({
              value: option.value.toString(),
              label: getTransactionTypeTranslation(option.label)
            }))
          },
          {
            id: 'refType',
            label: t('stockTransactions.filters.referenceType'),
            value: filters.refType,
            options: stockTransactionsService.getReferenceTypeOptions().map((option) => ({
              value: option.value.toString(),
              label: getReferenceTypeTranslation(option.label)
            }))
          }
        ]}
        autocompleteFields={[
          {
            id: 'productId',
            label: t('stockTransactions.filters.product'),
            value: filters.productId,
            options: products?.map((product) => ({ value: product.id, label: product.title })) || [],
            onChange: (value) => handleFilterChange('productId', value)
          }
        ]}
        dateFields={[
          {
            id: 'fromDate',
            label: t('stockTransactions.filters.fromDate'),
            value: filters.fromDate,
            onChange: (value) => handleFilterChange('fromDate', value),
            type: 'date'
          },
          {
            id: 'toDate',
            label: t('stockTransactions.filters.toDate'),
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
          title: t('stockTransactions.noTransactionsFound'),
          description: filters.productId || filters.type || filters.refType || filters.fromDate || filters.toDate
            ? t('stockTransactions.tryAdjustingSearch')
            : t('stockTransactions.getStarted'),
          action: {
            label: t('stockTransactions.createAdjustment'),
            onClick: handleCreateAdjustment
          }
        }}
        actions={getRowActions}
        getRowId={(transaction) => transaction.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount, totalPages, [5, 10, 20, 25, 50, 100])}
        errorAction={{
          label: t('stockTransactions.retry'),
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
              {t('stockTransactions.transactionDetails')}
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
            label={t('stockTransactions.overview')}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<ProductIcon />}
            label={t('stockTransactions.productDetails')}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<TimelineIcon />}
            label={t('stockTransactions.referenceOrigin')}
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
                          {t('stockTransactions.transactionInformation')}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.transactionId')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                              {selectedTransaction.id?.substring(0, 8).toUpperCase() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.transactionDate')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {formatDate(selectedTransaction.transactionDate)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.transactionType')}
                            </Typography>
                            <Chip
                              label={getTransactionTypeTranslation(selectedTransaction.typeName)}
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
                          {t('stockTransactions.financialInformation')}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.quantity')}
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {selectedTransaction.quantity.toLocaleString()} {t('stockTransactions.units')}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.unitCost')}
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {formatCurrency(selectedTransaction.unitCost)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.totalCost')}
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
                          {t('stockTransactions.referenceInformation')}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.referenceType')}
                            </Typography>
                            <Chip
                              label={getReferenceTypeTranslation(selectedTransaction.refTypeName)}
                              color={getReferenceTypeColor(selectedTransaction.refType) as any}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </Grid>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('stockTransactions.referenceId')}
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
                      {t('stockTransactions.productInformation')}
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid sx={{ xs: 12, md: 8 }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {t('stockTransactions.productName')}
                          </Typography>
                          <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
                            {selectedTransaction.productName}
                          </Typography>
                        </Box>

                        <Grid container spacing={3}>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {t('stockTransactions.productId')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
                              {selectedTransaction.productId?.substring(0, 8).toUpperCase() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid sx={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {t('stockTransactions.stockImpact')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              <Chip
                                label={`${selectedTransaction.type === StockTransactionType.IN ? '+' : '-'}${selectedTransaction.quantity} ${t('stockTransactions.units')}`}
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
                            {t('stockTransactions.productTransaction')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('stockTransactions.productTransactionDescription')}
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
                      {t('stockTransactions.transactionOriginAudit')}
                    </Typography>

                    <List>
                      <ListItem sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 2, mb: 2 }}>
                        <ListItemIcon>
                          <EventIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6" fontWeight={600}>
                              {t('stockTransactions.transactionCreated')}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(selectedTransaction.createdDate)}
                              </Typography>
                              <Typography variant="body1">
                                {t('stockTransactions.transactionRecorded')}
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
                              {t('stockTransactions.createdBy')}
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
                              {t('stockTransactions.referenceInformation')}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body1">
                                {t('stockTransactions.type')}: {getReferenceTypeTranslation(selectedTransaction.refTypeName)}
                              </Typography>
                              {selectedTransaction.refId && (
                                <Typography variant="body1">
                                  {t('stockTransactions.id')}: {selectedTransaction.refId}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {t('stockTransactions.relatedDocument')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </List>
                  </Card>

                  <Card elevation={1} sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                      {t('stockTransactions.technicalDetails')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('stockTransactions.transactionTypeEnum')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {selectedTransaction.type}
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('stockTransactions.referenceTypeEnum')}
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
                {t('stockTransactions.noTransactionDetails')}
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
            {t('stockTransactions.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Adjustment Dialog */}
      <Dialog
        open={adjustmentDialogOpen}
        onClose={() => setAdjustmentDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>{t('stockTransactions.createStockAdjustment')}</DialogTitle>
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
              {/* First Row: Product, Adjustment Type, Quantity */}
              <Grid sx={{ xs: 12, sm: 12, md: 6 }}>
                <Autocomplete
                  fullWidth
                  options={products?.map((product) => ({ value: product.id, label: product.title })) || []}
                  value={products?.find((product) => product.id === adjustmentForm.productId) ?
                    { value: adjustmentForm.productId, label: products.find((product) => product.id === adjustmentForm.productId)?.title || '' } : null}
                  onChange={(event, newValue) => {
                    handleAdjustmentFormChange('productId', newValue ? newValue.value : '');
                  }}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('stockTransactions.product')}
                      required
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
              </Grid>

              <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth required sx={{ minWidth: 200 }}>
                  <InputLabel>{t('stockTransactions.adjustmentType')}</InputLabel>
                  <Select
                    value={adjustmentForm.type}
                    label={t('stockTransactions.adjustmentType')}
                    onChange={(e) => handleAdjustmentFormChange('type', e.target.value as StockTransactionType)}
                  >
                    {stockTransactionsService.getTransactionTypeOptions().map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {getTransactionTypeTranslation(option.label)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label={t('stockTransactions.quantity')}
                  type="number"
                  value={adjustmentForm.quantity}
                  onChange={(e) => handleAdjustmentFormChange('quantity', parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 1 }}
                  sx={{ minWidth: 200 }}
                />
              </Grid>

              {/* Second Row: Reason */}
              <Grid sx={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('stockTransactions.reason')}
                  multiline
                  rows={3}
                  value={adjustmentForm.reason}
                  onChange={(e) => handleAdjustmentFormChange('reason', e.target.value)}
                  required
                  placeholder={t('stockTransactions.adjustmentReasonPlaceholder')}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAdjustmentDialogOpen(false)} disabled={adjustmentLoading}>
              {t('stockTransactions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adjustmentLoading}
              startIcon={adjustmentLoading ? <CircularProgress size={20} /> : null}
            >
              {adjustmentLoading ? t('stockTransactions.creating') : t('stockTransactions.createAdjustment')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StockTransactionsPage;