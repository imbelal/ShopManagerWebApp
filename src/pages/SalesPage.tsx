import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../components/common/CurrencyDisplay';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Snackbar,
  Alert,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Payments as PaymentIcon
} from '@mui/icons-material';
import { salesService, Sales, Customer } from '../services/salesService';
import { handleApiError } from '../services/apiClient';
import SalesForm from '../components/SalesForm';
import PaymentDialog from '../components/PaymentDialog';
import {
  DataTable,
  StatusChip,
  CurrencyDisplay,
  createSalesActions,
  EmptyState,
  commonStatusConfigs
} from '../components/common';
import PageHeader from '../components/common/PageHeader';
import FilterBar from '../components/common/FilterBar';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import usePagination, { usePaginationProps } from '../hooks/usePagination';

const SalesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [sales, setSales] = useState<Sales[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [pagination, paginationActions] = usePagination();
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sales | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const [deleting, setDeleting] = useState(false);

  // Load sales data
  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.getSales({
        pageNumber: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined,
        customerId: selectedCustomer || undefined
      });

      if (response.data.succeeded && response.data.data) {
        setSales(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
      } else {
        setError(response.data.message || t('sales.failedToLoadSales'));
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
  }, [pagination.page, pagination.pageSize, searchTerm, selectedCustomer]);

  // Handle view sale
  const handleViewSale = async (sale: Sales) => {
    if (!sale?.id) return;

    setViewLoading(true);
    setSelectedSale(sale);
    setViewDialogOpen(true);

    try {
      // Load payments for this sale
      const paymentsResponse = await salesService.getSalePayments(sale.id);
      if (paymentsResponse.data.succeeded && paymentsResponse.data.data) {
        setViewPayments(paymentsResponse.data.data);
      }

      // Load customer details
      const customersResponse = await salesService.getCustomers();
      if (customersResponse.data.succeeded && customersResponse.data.data) {
        const customer = customersResponse.data.data.find(c => c.id === sale.customerId);
        setViewCustomer(customer || null);
      }
    } catch (error) {
      console.error('Failed to load sale details:', error);
    } finally {
      setViewLoading(false);
    }
  };

  // Handle delete sale
  const handleDeleteSaleClick = (sale: Sales) => {
    setSelectedSale(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    // Prevent deleting paid sales
    if (selectedSale.status === 2) {
      setSnackbar({
        open: true,
        message: t('sales.cannotDeletePaidSales'),
        severity: 'warning'
      });
      setDeleteDialogOpen(false);
      setSelectedSale(null);
      return;
    }

    // Prevent deleting cancelled sales
    if (selectedSale.status === 3) {
      setSnackbar({
        open: true,
        message: t('sales.cannotDeleteCancelledSales'),
        severity: 'warning'
      });
      setDeleteDialogOpen(false);
      setSelectedSale(null);
      return;
    }

    try {
      setDeleting(true);
      const response = await salesService.deleteSale(selectedSale.id);
      if (response.data.succeeded) {
        setSnackbar({
          open: true,
          message: t('sales.saleDeleted'),
          severity: 'success'
        });
        setDeleteDialogOpen(false);
        setSelectedSale(null);
        loadSales();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || t('sales.failedToDeleteSale'),
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
      setDeleting(false);
    }
  };

  // Handle cancel sale
  const handleCancelSale = async (sale: Sales) => {
    if (!sale) return;

    try {
      const response = await salesService.cancelSale(sale.id);
      if (response.data.succeeded) {
        setSnackbar({
          open: true,
          message: t('sales.saleCancelled'),
          severity: 'success'
        });
        loadSales();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || t('sales.failedToCancelSale'),
          severity: 'error'
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: handleApiError(err),
        severity: 'error'
      });
    }
  };

  // Handle add payment
  const handleAddPayment = async (sale: Sales) => {
    if (!sale?.id) return;

    // Prevent adding payments to cancelled sales
    if (sale.status === 3) {
      setSnackbar({
        open: true,
        message: t('sales.cannotAddPaymentsToCancelledSales'),
        severity: 'warning'
      });
      return;
    }

    try {
      // Fetch fresh sale data to get current payment information
      const response = await salesService.getSaleById(sale.id);
      if (response.data.succeeded && response.data.data) {
        setPaymentDialogSale(response.data.data);
      } else {
        // If fetch fails, use existing sale data
        setPaymentDialogSale(sale);
      }
    } catch (error) {
      console.error('Failed to refresh sale data:', error);
      // If fetch fails, use existing sale data
      setPaymentDialogSale(sale);
    }

    // Open dialog immediately after setting payment dialog sale data
    setPaymentDialogOpen(true);
  };

  // Handle payment added
  const handlePaymentAdded = () => {
    loadSales();
    setSnackbar({
      open: true,
      message: t('sales.paymentAdded'),
      severity: 'success'
    });
  };

  // Handle PDF download
  const handleDownloadPdf = async (sale: Sales) => {
    if (!sale) return;

    try {
      await salesService.generateSalesPdf(sale.id);
      setSnackbar({
        open: true,
        message: t('sales.pdfDownloaded'),
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: handleApiError(err),
        severity: 'error'
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadSales();
    loadCustomers();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    paginationActions.setPage(1);
    loadSales();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('');
    paginationActions.setPage(1);
    loadSales();
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
        message: t('sales.cannotEditPaidSales'),
        severity: 'warning'
      });
      return;
    }

    if (sale.status === 3) {
      setSnackbar({
        open: true,
        message: t('sales.cannotEditCancelledSales'),
        severity: 'warning'
      });
      return;
    }

    setEditSale(sale);
    setSalesFormOpen(true);
  };

  const handleSaveSale = async (saleId: string) => {
    setSalesFormOpen(false);
    setEditSale(null);
    await loadSales(); // Refresh the sales list
    setSnackbar({
      open: true,
      message: t('sales.saleSaved'),
      severity: 'success'
    });
  };

  const handleCloseSalesForm = () => {
    setSalesFormOpen(false);
    setEditSale(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  
  // Define table columns with useMemo to react to language changes
  const columns = useMemo(() => [
    {
      id: 'salesNumber',
      label: t('sales.tableColumns.salesNumber'),
      minWidth: 120,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'customerName',
      label: t('sales.customer'),
      minWidth: 150
    },
    {
      id: 'createdDate',
      label: t('sales.date'),
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'grandTotal',
      label: t('sales.total'),
      align: 'right' as const,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    },
    {
      id: 'totalPaid',
      label: t('sales.tableColumns.paid'),
      align: 'right' as const,
      minWidth: 100,
      format: (value, sale) => (
        <Typography variant="body2" sx={{
          color: value >= sale.grandTotal ? 'success.main' : 'warning.main'
        }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    },
    {
      id: 'remainingAmount',
      label: t('sales.tableColumns.balance'),
      align: 'right' as const,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{
          color: value > 0 ? 'error.main' : 'success.main'
        }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    },
    {
      id: 'status',
      label: t('sales.status'),
      minWidth: 100,
      format: (value) => (
        <StatusChip
          status={value}
          statusConfig={commonStatusConfigs.salesStatus(t)}
        />
      )
    },
    {
      id: 'salesProfit',
      label: t('sales.profit'),
      align: 'right' as const,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{
          color: value >= 0 ? 'success.main' : 'error.main',
          fontWeight: 500
        }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    }
  ], [t, currentLanguage]);

  // Define row actions
  const getRowActions = (sale) => {
    return createSalesActions(
      sale,
      handleViewSale,
      handleEditSale,
      handleDeleteSaleClick,
      handleAddPayment,
      handleCancelSale,
      handleDownloadPdf,
      t
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={t('sales.title')}
        subtitle={t('sales.subtitle')}
        actionButton={{
          label: t('sales.addSale'),
          onClick: handleNewSale
        }}
        showRefresh={true}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <FilterBar
        searchPlaceholder={t('sales.searchPlaceholder')}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          handleFilterChange();
        }}
        filterMinWidth={200}
        autocompleteFields={[
          {
            id: 'customer',
            label: t('sales.customer'),
            value: selectedCustomer,
            options: customers.map((customer) => ({
              value: customer.id,
              label: `${customer.firstName} ${customer.lastName}`
            })),
            onChange: (value) => {
              setSelectedCustomer(value);
              handleFilterChange();
            }
          }
        ]}
        onFilterChange={() => {}} // Required prop but not used with autocompleteFields only
        onClearFilters={clearAllFilters}
        loading={loading}
        showClearButton={true}
      />

      {/* Sales Table */}
      <DataTable
        data={sales}
        columns={columns}
        loading={loading}
        error={error}
        emptyState={{
          icon: '💰',
          title: t('sales.noSalesFound'),
          description: searchTerm ? t('sales.tryAdjustingSearch') : t('sales.getStarted'),
          action: {
            label: t('sales.addSale'),
            onClick: handleNewSale
          }
        }}
        actions={getRowActions}
        getRowId={(sale) => sale.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount)}
        errorAction={{
          label: t('common.retry'),
          onClick: handleRefresh
        }}
      />

      {/* View Sale Dialog */}
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
                  {t('sales.saleDetails')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedSale.salesNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatusChip
                  status={selectedSale.status}
                  statusConfig={commonStatusConfigs.salesStatus(t)}
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
                  {t('common.close')}
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
                  <Tab label={t('sales.tabs.overview')} />
                  <Tab label={t('sales.tabs.items')} />
                  <Tab label={t('sales.tabs.payments')} />
                  <Tab label={t('sales.tabs.customer')} />
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
                              {t('sales.saleSummary')}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 12 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('sales.date')}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatDate(selectedSale.createdDate)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('sales.remark')}</Typography>
                                <Typography variant="body1">
                                  {selectedSale.remark || t('sales.noRemarks')}
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
                              {t('sales.financialSummary')}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.totalPrice')}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(selectedSale.totalPrice)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.discount')}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                                  -{formatCurrency(selectedSale.discountAmount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.taxAmount')}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(selectedSale.taxAmount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.grandTotal')}</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {formatCurrency(selectedSale.grandTotal)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.totalPaid')}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                                  {formatCurrency(selectedSale.totalPaid)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.remaining')}</Typography>
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
                              {t('sales.profitAnalysis')}
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid sx={{ xs: 12, md: 4 }}>
                                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                  <Typography variant="body2" color="text.secondary">{t('sales.totalCost')}</Typography>
                                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                                    {formatCurrency(selectedSale.salesTotalCost)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 4 }}>
                                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: selectedSale.salesProfit >= 0 ? 'success.50' : 'error.50' }}>
                                  <Typography variant="body2" color="text.secondary">{t('sales.profit')}</Typography>
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
                                  <Typography variant="body2" color="text.secondary">{t('sales.profitMargin')}</Typography>
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
                    {t('sales.salesItems')} ({selectedSale.salesItems.length})
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>{t('sales.tableColumns.product')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{t('sales.quantity')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{t('sales.unitPrice')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{t('sales.total')}</TableCell>
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
                    {t('sales.paymentHistory')} ({viewPayments.length})
                  </Typography>
                  {viewPayments.length > 0 ? (
                    <List>
                      {viewPayments.map((payment) => (
                        <Card key={payment.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.amount')}</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(payment.amount)}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.method')}</Typography>
                                <Chip
                                  label={payment.paymentMethod}
                                  color={salesService.getPaymentMethodColor(payment.paymentMethod)}
                                  size="small"
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">{t('sales.date')}</Typography>
                                <Typography variant="body1">
                                  {new Date(payment.paymentDate).toLocaleDateString()} at {new Date(payment.paymentDate).toLocaleTimeString()}
                                </Typography>
                              </Grid>
                              <Grid sx={{ xs: 12, md: 3 }}>
                                {payment.remark && (
                                  <>
                                    <Typography variant="body2" color="text.secondary">{t('sales.remark')}</Typography>
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
                      <Typography variant="h6">{t('sales.noPaymentsRecorded')}</Typography>
                      <Typography variant="body2">{t('sales.noPaymentHistory')}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Customer Tab */}
              {viewTabValue === 3 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    {t('sales.customerInformation')}
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
                                  primary={t('sales.name')}
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
                                  primary={t('sales.email')}
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
                                  primary={t('sales.contact')}
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
                                  primary={t('sales.address')}
                                  secondary={viewCustomer.address || t('sales.noAddressProvided')}
                                />
                              </ListItem>
                              {viewCustomer.remark && (
                                <ListItem>
                                  <ListItemText
                                    primary={t('sales.remarks')}
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
                      <Typography variant="h6">{t('sales.customerInfoNotAvailable')}</Typography>
                      <Typography variant="body2">{t('sales.unableToLoadCustomerDetails')}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedSale(null); }}
        onConfirm={handleDeleteSale}
        entityName={`Sale #${selectedSale?.salesNumber || ''}`}
        entityType="sale"
        loading={deleting}
        warning={t('sales.cannotDeletePaidOrCancelledSales')}
      />

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

    </Box>
  );
};

export default SalesPage;