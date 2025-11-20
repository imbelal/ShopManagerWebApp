import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../components/common/CurrencyDisplay';
import {
  Box,
  Typography,
  Button,
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
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
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
import {
  DataTable,
  StatusChip,
  CurrencyDisplay,
  createPurchaseActions,
  EmptyState,
  commonStatusConfigs
} from '../components/common';
import PageHeader from '../components/common/PageHeader';
import FilterBar from '../components/common/FilterBar';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import usePagination, { usePaginationProps } from '../hooks/usePagination';

const PurchasesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [pagination, paginationActions] = usePagination();
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Handle filter changes
  const handleFilterChange = () => {
    paginationActions.setPage(1);
    loadPurchases();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('');
    setSelectedStatus('');
    paginationActions.setPage(1);
    loadPurchases();
  };

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [purchaseToView, setPurchaseToView] = useState<Purchase | null>(null);
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
  const [deleting, setDeleting] = useState(false);

  // Load purchases
  const loadPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        pageNumber: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined,
        supplierId: selectedSupplier || undefined,
        status: selectedStatus ? parseInt(selectedStatus) as PurchaseStatus : undefined
      };

      const response = await purchasesService.getPurchases(filters);
      if (response.data.succeeded && response.data.data) {
        setPurchases(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
      } else {
        setError(response.data.message || t('purchases.failedToLoadPurchases'));
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

  // Action handlers
  const handleView = async (purchase: Purchase) => {
    setPurchaseToView(purchase);
    setSelectedPurchase(purchase);
    setViewDialogOpen(true);
    setViewTabValue(0);

    // Load supplier details for this purchase
    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    setViewSupplier(supplier || null);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditPurchase(purchase);
    setPurchaseFormOpen(true);
  };

  const handleDeleteClick = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteDialogOpen(true);
  };

  const handleCancel = async (purchase: Purchase) => {
    try {
      setLoading(true);
      const response = await purchasesService.cancelPurchase(purchase.id);
      if (response.data.succeeded) {
        showSnackbar(t('purchases.purchaseCancelled'), 'success');
        loadPurchases();
      } else {
        setError(response.data.message || t('purchases.failedToCancelPurchase'));
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (purchaseToDelete) {
      try {
        setDeleting(true);
        const response = await purchasesService.deletePurchase(purchaseToDelete.id);
        if (response.data.succeeded) {
          showSnackbar(t('purchases.purchaseDeleted'), 'success');
          setDeleteDialogOpen(false);
          setPurchaseToDelete(null);
          loadPurchases();
        } else {
          setError(response.data.message || t('purchases.failedToDeletePurchase'));
        }
      } catch (err: any) {
        setError(handleApiError(err));
      } finally {
        setDeleting(false);
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
  }, [pagination.page, pagination.pageSize, searchTerm, selectedSupplier, selectedStatus]);

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

  
  

  // Define table columns with translation support
  const columns = useMemo(() => [
    {
      id: 'purchaseDate',
      label: t('purchases.tableColumns.purchaseDate'),
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'supplierName',
      label: t('purchases.supplier'),
      minWidth: 150
    },
    {
      id: 'purchaseItems',
      label: t('purchases.items'),
      minWidth: 80,
      format: (value) => (
        <Typography variant="body2">
          {value.length} {t('purchases.items')}
        </Typography>
      )
    },
    {
      id: 'totalCost',
      label: t('purchases.totalCost'),
      align: 'right' as const,
      minWidth: 120,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          <CurrencyDisplay amount={value} />
        </Typography>
      )
    },
    {
      id: 'status',
      label: t('purchases.status'),
      minWidth: 100,
      format: (value) => (
        <StatusChip
          status={value}
          statusConfig={commonStatusConfigs.purchaseStatus(t)}
        />
      )
    },
    {
      id: 'createdBy',
      label: t('purchases.tableColumns.createdBy'),
      minWidth: 120
    }
  ], [t, currentLanguage]);

  // Define row actions
  const getRowActions = (purchase) => {
    return createPurchaseActions(
      purchase,
      handleView,
      handleEdit,
      handleDeleteClick,
      handleCancel,
      t
    );
  };

  
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={t('purchases.management')}
        subtitle={t('purchases.subtitle')}
        actionButton={{
          label: t('purchases.addPurchase'),
          onClick: () => {
            setEditPurchase(null);
            setPurchaseFormOpen(true);
          }
        }}
        showRefresh={true}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FilterBar
        searchPlaceholder={t('purchases.searchPlaceholder')}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          handleFilterChange();
        }}
        filterMinWidth={200}
        filters={[
          {
            id: 'status',
            label: t('purchases.status'),
            value: selectedStatus,
            options: [
              { value: '0', label: t('purchases.pending') },
              { value: '1', label: t('purchases.completed') },
              { value: '2', label: t('purchases.cancelled') }
            ]
          }
        ]}
        autocompleteFields={[
          {
            id: 'supplier',
            label: t('purchases.supplier'),
            value: selectedSupplier,
            options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
            onChange: (value) => {
              setSelectedSupplier(value);
              handleFilterChange();
            }
          }
        ]}
        onFilterChange={(filterId, value) => {
          if (filterId === 'status') {
            setSelectedStatus(value);
            handleFilterChange();
          }
        }}
        onClearFilters={clearAllFilters}
        loading={loading}
        showClearButton={true}
      />

      {/* Purchases DataTable */}
      <DataTable
        data={purchases}
        columns={columns}
        loading={loading}
        error={error}
        emptyState={{
          icon: '📦',
          title: t('purchases.noPurchasesFound'),
          description: searchTerm || selectedSupplier || selectedStatus
            ? t('purchases.tryAdjustingSearch')
            : t('purchases.getStarted'),
          action: {
            label: t('purchases.newPurchase'),
            onClick: () => setPurchaseFormOpen(true)
          }
        }}
        actions={getRowActions}
        getRowId={(purchase) => purchase.id}
        pagination={usePaginationProps(pagination, paginationActions, totalCount)}
        errorAction={{
          label: t('common.retry'),
          onClick: handleRefresh
        }}
      />

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
                  {t('purchases.purchaseDetails')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ID: {purchaseToView.id.substring(0, 8)}...
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatusChip
                  status={purchaseToView.status}
                  statusConfig={commonStatusConfigs.purchaseStatus(t)}
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
                <Tab label={t('purchases.tabs.overview')} />
                <Tab label={`${t('purchases.tabs.items')} (${purchaseToView.purchaseItems.length})`} />
                <Tab label={t('purchases.tabs.supplier')} />
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
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                            {t('purchases.purchaseSummary')}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid sx={{ xs: 12 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('purchases.purchaseDate')}</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {new Date(purchaseToView.purchaseDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid sx={{ xs: 12 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('purchases.createdBy')}</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {purchaseToView.createdBy}
                              </Typography>
                            </Grid>
                            <Grid sx={{ xs: 12 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('purchases.supplier')}</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {purchaseToView.supplierName}
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
                            {t('purchases.financialSummary')}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid sx={{ xs: 12 }}>
                              <Typography variant="body2" color="text.secondary">{t('purchases.totalCost')}</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                <CurrencyDisplay amount={purchaseToView.totalCost} />
                              </Typography>
                            </Grid>
                            <Grid sx={{ xs: 6 }}>
                              <Typography variant="body2" color="text.secondary">{t('purchases.items')}</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {purchaseToView.purchaseItems.length}
                              </Typography>
                            </Grid>
                            <Grid sx={{ xs: 6 }}>
                              <Typography variant="body2" color="text.secondary">{t('purchases.status')}</Typography>
                              <StatusChip
                                status={purchaseToView.status}
                                statusConfig={commonStatusConfigs.purchaseStatus(t)}
                                size="small"
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Remarks Card */}
                    {purchaseToView.remark && (
                      <Grid sx={{ xs: 12 }}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimelineIcon color="primary" />
                              {t('purchases.remarks')}
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
                  {t('purchases.purchaseItems')} ({purchaseToView.purchaseItems.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('purchases.itemsTableColumns.product')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('purchases.itemsTableColumns.quantity')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('purchases.itemsTableColumns.costPerUnit')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('purchases.itemsTableColumns.totalCost')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseToView.purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            <CurrencyDisplay amount={item.costPerUnit} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            <CurrencyDisplay amount={item.totalCost} />
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
                  {t('purchases.supplierInformation')}
                </Typography>
                {viewSupplier ? (
                  <Card>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid sx={{ xs: 12, md: 6 }}>
                          <List>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <BusinessIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={t('purchases.companyName')}
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
                                primary={t('sales.email')}
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
                                primary={t('purchases.contact')}
                                secondary={viewSupplier.contactNo}
                              />
                            </ListItem>
                          </List>
                        </Grid>
                        <Grid sx={{ xs: 12, md: 6 }}>
                          <List>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                  <LocationOnIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={t('purchases.address')}
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
                                primary={t('purchases.status')}
                                secondary={
                                  <Chip
                                    label={viewSupplier.isActive ? t('products.active') : t('products.inactive')}
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
                    <Typography variant="h6">{t('purchases.supplierInfoNotAvailable')}</Typography>
                    <Typography variant="body2">{t('purchases.unableToLoadSupplierDetails')}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPurchaseToDelete(null);
        }}
        onConfirm={confirmDelete}
        entityName={`Purchase #${purchaseToDelete?.id || ''}`}
        entityType="Purchase"
        loading={deleting}
      />

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