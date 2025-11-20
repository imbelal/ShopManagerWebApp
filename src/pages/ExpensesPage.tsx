import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar
} from '@mui/material';
import DataTable, { TableColumn, ContextAction } from '../components/common/DataTable';
import FilterBar from '../components/common/FilterBar';
import { StatusChip, commonStatusConfigs } from '../components/common';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Paid as PaidIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { usePagination } from '../hooks/usePagination';
import expensesService, { Expense, ExpensesFilter, ExpenseStatus } from '../services/expensesService';
import PageHeader from '../components/common/PageHeader';
import ExpenseForm from '../components/ExpenseForm';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import {
  getExpenseTypeOptions,
  getStatusOptions,
  getPaymentMethodOptions
} from '../utils/expenseUtils';
import { formatCurrency } from '../components/common/CurrencyDisplay';

const ExpensesPage: React.FC = () => {
  const { t } = useTranslation();
  // State management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expenseToReject, setExpenseToReject] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewTabValue, setViewTabValue] = useState(0);
  const [viewLoading, setViewLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Filter states
  const [filters, setFilters] = useState<ExpensesFilter>({});

  // Pagination hook
  const [paginationState, paginationActions] = usePagination(1, 10);

  // Table columns definition with translation support
  const columns: TableColumn<Expense>[] = useMemo(() => [
    {
      id: 'title',
      label: t('expenses.tableColumns.title'),
      minWidth: 200,
      format: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
          {row.description && (
            <Typography variant="caption" color="textSecondary">
              {row.description}
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'expenseTypeName',
      label: t('expenses.tableColumns.type'),
      minWidth: 120,
      format: (value, row) => (
        <Chip
          label={getExpenseTypeTranslation(value, row.expenseType)}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      )
    },
    {
      id: 'amount',
      label: t('expenses.tableColumns.amount'),
      minWidth: 100,
      align: 'right',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'expenseDate',
      label: t('expenses.tableColumns.date'),
      minWidth: 100,
      format: (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    {
      id: 'statusName',
      label: t('expenses.tableColumns.status'),
      minWidth: 100,
      format: (value, row) => (
        <StatusChip
          status={row.status}
          statusConfig={commonStatusConfigs.expenseStatus(t)}
          size="small"
        />
      )
    },
    {
      id: 'paymentMethod',
      label: t('expenses.tableColumns.paymentMethod'),
      minWidth: 120,
      format: (value, row) => (
        <Chip
          label={getPaymentMethodTranslation(row.paymentMethod)}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      )
    },
    {
      id: 'receiptNumber',
      label: t('expenses.tableColumns.receipt'),
      minWidth: 100,
      format: (value) => value ? (
        <Chip
          label={value}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      ) : (
        <Typography variant="caption" color="textSecondary">
          N/A
        </Typography>
      )
    },
    {
      id: 'createdByUserName',
      label: t('expenses.tableColumns.createdBy'),
      minWidth: 120,
      format: (value) => (
        <Typography variant="caption">
          {value}
        </Typography>
      )
    }
  ], [t]);

  // Load expenses
  const loadExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const filterParams: ExpensesFilter = {
        ...filters,
        pageNumber: paginationState.page,
        pageSize: paginationState.pageSize
      };

      const response = await expensesService.getExpenses(filterParams);
      const items = response?.data?.items || [];
      setExpenses(items);
      setTotalExpenses(response?.data?.totalCount || 0);

      // Calculate total amount for current page
      const pageTotal = items.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalAmount(pageTotal);
    } catch (err: any) {
      setError(err.message || t('expenses.failedToLoadExpenses'));
    } finally {
      setLoading(false);
    }
  };

  // Load expenses when filters or pagination changes
  useEffect(() => {
    loadExpenses();
  }, [filters, paginationState.page, paginationState.pageSize]);

  // Filter handlers
  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => {
      const updatedFilters = { ...prev };

      // Convert empty string to undefined for optional fields
      const processedValue = value === '' ? undefined : value;

      switch (filterId) {
        case 'search':
          updatedFilters.search = processedValue;
          break;
        case 'fromDate':
          // Convert HTML date input format (YYYY-MM-DD) to ISO string
          updatedFilters.startDate = processedValue ? new Date(processedValue).toISOString() : undefined;
          break;
        case 'toDate':
          // Convert HTML date input format (YYYY-MM-DD) to ISO string
          updatedFilters.endDate = processedValue ? new Date(processedValue).toISOString() : undefined;
          break;
        case 'expenseType':
          updatedFilters.expenseType = processedValue ? parseInt(processedValue) : undefined;
          break;
        case 'status':
          updatedFilters.status = processedValue ? parseInt(processedValue) : undefined;
          break;
        case 'paymentMethod':
          updatedFilters.paymentMethod = processedValue ? parseInt(processedValue) : undefined;
          break;
        default:
          break;
      }

      return updatedFilters;
    });
    paginationActions.resetPage();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    paginationActions.resetPage();
  };

  // Handle page change
  const handlePageChange = (event: any, newPage: number) => {
    paginationActions.setPage(newPage + 1); // Convert to 1-based indexing
  };

  // Handle page size change
  const handlePageSizeChange = (event: any) => {
    paginationActions.setPageSize(parseInt(event.target.value, 10));
  };

  // Create new expense
  const handleCreateExpense = () => {
    setEditExpense(null);
    setFormOpen(true);
  };

  // Edit expense
  const handleEditExpense = (expense: Expense) => {
    if (expensesService.canEditExpense(expense.status)) {
      setEditExpense(expense);
      setFormOpen(true);
    }
  };

  // View expense details
  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
    setViewTabValue(0);
  };

  // Delete expense
  const handleDeleteExpense = (expense: Expense) => {
    if (expensesService.canEditExpense(expense.status)) {
      setExpenseToDelete(expense);
      setDeleteDialogOpen(true);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await expensesService.deleteExpense(expenseToDelete.id);
        loadExpenses();
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      } catch (err: any) {
        setError(err.message || t('expenses.failedToDeleteExpense'));
      }
    }
  };

  // Approve expense
  const handleApproveExpense = async (expense: Expense) => {
    try {
      await expensesService.approveExpense(expense.id);
      loadExpenses();
    } catch (err: any) {
      setError(err.message || t('expenses.failedToApproveExpense'));
    }
  };

  // Reject expense
  const handleRejectExpense = (expense: Expense) => {
    setExpenseToReject(expense);
    setRejectDialogOpen(true);
  };

  // Confirm reject
  const confirmReject = async () => {
    if (expenseToReject) {
      try {
        await expensesService.rejectExpense(expenseToReject.id, rejectionReason);
        loadExpenses();
        setRejectDialogOpen(false);
        setExpenseToReject(null);
        setRejectionReason('');
      } catch (err: any) {
        setError(err.message || t('expenses.failedToRejectExpense'));
      }
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      await expensesService.markAsPaid(expense.id);
      loadExpenses();
    } catch (err: any) {
      setError(err.message || t('expenses.failedToMarkAsPaid'));
    }
  };

  // Form handlers
  const handleFormClose = () => {
    setFormOpen(false);
    setEditExpense(null);
  };

  const handleExpenseAdded = () => {
    loadExpenses();
  };

  const handleExpenseUpdated = () => {
    loadExpenses();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  
  // Handle PDF download
  const handleDownloadPdf = async () => {
    try {
      setLoading(true);

      // Create a descriptive message for the download
      const hasDateFilter = filters.startDate || filters.endDate;
      const message = hasDateFilter
        ? t('expenses.generatingPdfFiltered')
        : t('expenses.generatingPdfAll');

      setSnackbar({
        open: true,
        message,
        severity: 'info'
      });

      await expensesService.generateExpensesPdf(
        filters.startDate,
        filters.endDate
      );

      setSnackbar({
        open: true,
        message: t('expenses.pdfDownloadedSuccessfully'),
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || t('expenses.failedToGeneratePdf'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to translate expense types
  const getExpenseTypeTranslation = (expenseTypeName: string, expenseType: number): string => {
    // Map expense type values to translation keys - completely override the English name
    switch (expenseType) {
      case 1: return t('expenseTypes.rent'); // ExpenseType.Rent
      case 2: return t('expenseTypes.salary'); // ExpenseType.Salary
      case 3: return t('expenseTypes.utilities'); // ExpenseType.Utilities
      case 4: return t('expenseTypes.foodAndBeverages'); // ExpenseType.Food
      case 5: return t('expenseTypes.maintenance'); // ExpenseType.Maintenance
      case 6: return t('expenseTypes.officeSupplies'); // ExpenseType.Supplies
      case 7: return t('expenseTypes.transportation'); // ExpenseType.Transportation
      case 8: return t('expenseTypes.marketing'); // ExpenseType.Marketing
      case 9: return t('expenseTypes.insurance'); // ExpenseType.Insurance
      case 10: return t('expenseTypes.taxes'); // ExpenseType.Taxes
      case 11: return t('expenseTypes.legal'); // ExpenseType.Legal
      case 12: return t('expenseTypes.training'); // ExpenseType.Training
      case 13: return t('expenseTypes.entertainment'); // ExpenseType.Entertainment
      case 14: return t('expenseTypes.communication'); // Communication (fallback to other)
      case 15: return t('expenseTypes.software'); // ExpenseType.Software
      case 16: return t('expenseTypes.equipment'); // ExpenseType.Equipment
      case 17: return t('expenseTypes.other'); // ExpenseType.Cleaning (fallback to other)
      case 18: return t('expenseTypes.other'); // ExpenseType.Security (fallback to other)
      case 19: return t('expenseTypes.bankFees'); // ExpenseType.BankCharges
      case 20: return t('expenseTypes.other'); // ExpenseType.Other
      default:
        // For unknown types, try to extract keywords and translate
        const lowerName = expenseTypeName.toLowerCase();
        if (lowerName.includes('food') || lowerName.includes('beverage')) {
          return t('expenseTypes.foodAndBeverages');
        } else if (lowerName.includes('transport')) {
          return t('expenseTypes.transportation');
        } else if (lowerName.includes('office') || lowerName.includes('supplie')) {
          return t('expenseTypes.officeSupplies');
        } else if (lowerName.includes('marketing')) {
          return t('expenseTypes.marketing');
        } else if (lowerName.includes('software') || lowerName.includes('subscription')) {
          return t('expenseTypes.software');
        } else if (lowerName.includes('travel')) {
          return t('expenseTypes.travel');
        } else if (lowerName.includes('equipment') || lowerName.includes('tool')) {
          return t('expenseTypes.equipment');
        } else if (lowerName.includes('legal') || lowerName.includes('professional')) {
          return t('expenseTypes.legal');
        } else if (lowerName.includes('bank') || lowerName.includes('fee')) {
          return t('expenseTypes.bankFees');
        } else if (lowerName.includes('rent')) {
          return t('expenseTypes.rent');
        } else if (lowerName.includes('salary')) {
          return t('expenseTypes.salary');
        } else if (lowerName.includes('utility')) {
          return t('expenseTypes.utilities');
        } else if (lowerName.includes('insurance')) {
          return t('expenseTypes.insurance');
        } else if (lowerName.includes('tax')) {
          return t('expenseTypes.taxes');
        } else if (lowerName.includes('maintenance')) {
          return t('expenseTypes.maintenance');
        } else if (lowerName.includes('training')) {
          return t('expenseTypes.training');
        } else if (lowerName.includes('entertainment')) {
          return t('expenseTypes.entertainment');
        } else if (lowerName.includes('depreciation')) {
          return t('expenseTypes.depreciation');
        }
        return expenseTypeName; // Fallback to original if no match
    }
  };

  // Helper function to translate expense type options for filters
  const getTranslatedExpenseTypeOptions = () => {
    return getExpenseTypeOptions().map(option => ({
      value: (option && option.value != null) ? option.value.toString() : '',
      label: getExpenseTypeTranslation(option?.label || '', (option && option.value != null) ? parseInt(option.value.toString()) : 0)
    }));
  };

  // Helper function to translate status options for filters
  const getTranslatedStatusOptions = () => {
    return [
      { value: '0', label: t('expenses.status.pending') }, // Pending
      { value: '1', label: t('expenses.status.approved') }, // Approved
      { value: '2', label: t('expenses.status.rejected') }, // Rejected
      { value: '3', label: t('expenses.status.paid') }, // Paid
      { value: '4', label: t('expenses.status.overdue') } // Overdue
    ];
  };

  // Helper function to translate payment method options for filters
  const getTranslatedPaymentMethodOptions = () => {
    return getPaymentMethodOptions()
      .map(option => ({
        value: (option && option.value != null) ? option.value.toString() : '',
        label: getPaymentMethodTranslation((option && option.value != null) ? parseInt(option.value.toString()) : 0)
      }))
      .filter(option => {
        // Filter out unknown options (those that return 'Unknown')
        const paymentValue = parseInt(option.value);
        return paymentValue >= 1 && paymentValue <= 8; // Only show valid payment methods (1-8)
      });
  };

  // Helper function to translate payment methods
  const getPaymentMethodTranslation = (paymentMethodValue: number): string => {
    switch (paymentMethodValue) {
      case 1: return t('expenses.paymentMethods.cash'); // PaymentMethod.Cash
      case 2: return t('expenses.paymentMethods.bank'); // PaymentMethod.BankTransfer
      case 3: return t('expenses.paymentMethods.mobilePayment'); // PaymentMethod.Mobile
      case 4: return t('expenses.paymentMethods.creditCard'); // PaymentMethod.CreditCard
      case 5: return t('expenses.paymentMethods.debitCard'); // PaymentMethod.DebitCard
      case 6: return t('expenses.paymentMethods.check'); // PaymentMethod.Check
      case 7: return t('expenses.paymentMethods.online'); // PaymentMethod.Online
      case 8: return t('expenses.paymentMethods.other'); // PaymentMethod.Other
      default: return t('common.unknown');
    }
  };

  // Table actions
  const getExpenseActions = (expense: Expense): ContextAction[] => {
    const actions: ContextAction[] = [
      {
        id: 'view',
        label: t('expenses.actions.viewDetails'),
        icon: <ViewIcon fontSize="small" />,
        onClick: () => handleViewExpense(expense)
      }
    ];

    // Edit action - only for editable statuses
    if (expensesService.canEditExpense(expense.status)) {
      actions.push({
        id: 'edit',
        label: t('expenses.actions.edit'),
        icon: <EditIcon fontSize="small" color="primary" />,
        onClick: () => handleEditExpense(expense)
      });
    }

    // Approval actions for pending expenses
    if (expense.status === ExpenseStatus.Pending) {
      actions.push(
        {
          id: 'approve',
          label: t('expenses.actions.approve'),
          icon: <ApproveIcon fontSize="small" color="success" />,
          onClick: () => handleApproveExpense(expense)
        },
        {
          id: 'reject',
          label: t('expenses.actions.reject'),
          icon: <RejectIcon fontSize="small" color="error" />,
          onClick: () => handleRejectExpense(expense)
        }
      );
    }

    // Mark as paid action for approved expenses
    if (expense.status === ExpenseStatus.Approved) {
      actions.push({
        id: 'mark-paid',
        label: t('expenses.actions.markAsPaid'),
        icon: <PaidIcon fontSize="small" color="success" />,
        onClick: () => handleMarkAsPaid(expense)
      });
    }

    // Delete action - only for editable statuses
    if (expensesService.canEditExpense(expense.status)) {
      actions.push({
        id: 'delete',
        label: t('expenses.actions.delete'),
        icon: <DeleteIcon fontSize="small" color="error" />,
        onClick: () => handleDeleteExpense(expense),
        divider: true
      });
    }

    return actions;
  };

  const expenseTypeOptions = getExpenseTypeOptions();
  const statusOptions = getStatusOptions();
  const paymentMethodOptions = getPaymentMethodOptions();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        {/* Page Header */}
        <PageHeader
          title={t('expenses.management')}
          subtitle={t('expenses.subtitle')}
          actionButton={{
            label: t('expenses.addExpense'),
            icon: <AddIcon />,
            onClick: handleCreateExpense,
            variant: 'contained',
            color: 'primary'
          }}
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters Section */}
        <FilterBar
          searchPlaceholder={t('expenses.searchPlaceholder')}
          searchTerm={filters?.search || ''}
          onSearchChange={(value) => handleFilterChange('search', value)}
          filters={[
            {
              id: 'expenseType',
              label: t('expenses.filter.type'),
              value: (filters && filters.expenseType != null) ? filters.expenseType.toString() : '',
              options: getTranslatedExpenseTypeOptions()
            },
            {
              id: 'status',
              label: t('expenses.filter.status'),
              value: (filters && filters.status != null) ? filters.status.toString() : '',
              options: getTranslatedStatusOptions()
            },
            {
              id: 'paymentMethod',
              label: t('expenses.filter.paymentMethod'),
              value: (filters && filters.paymentMethod != null) ? filters.paymentMethod.toString() : '',
              options: getTranslatedPaymentMethodOptions()
            }
          ]}
          dateFields={[
            {
              id: 'fromDate',
              label: t('expenses.fromDate'),
              value: (filters && filters.startDate) ? new Date(filters.startDate).toISOString().split('T')[0] : '',
              onChange: (value) => handleFilterChange('fromDate', value),
              type: 'date'
            },
            {
              id: 'toDate',
              label: t('expenses.toDate'),
              value: (filters && filters.endDate) ? new Date(filters.endDate).toISOString().split('T')[0] : '',
              onChange: (value) => handleFilterChange('toDate', value),
              type: 'date'
            }
          ]}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          loading={loading}
          showClearButton={true}
          filterMinWidth={200}
          sx={{ mb: 3 }}
        >
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadExpenses}
              sx={{ borderRadius: 1 }}
            >
              {t('expenses.refresh')}
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPdf}
              disabled={loading}
              sx={{ borderRadius: 1 }}
            >
              {t('expenses.downloadPdf')}
            </Button>
          </Box>
        </FilterBar>

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid sx={{ xs: 12, sm: 6, md: 3, minWidth: 200 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('expenses.totalExpenses')}
                </Typography>
                <Typography variant="h4">
                  {totalExpenses}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 3, minWidth: 200 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('expenses.totalAmount')}
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(totalAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Expenses Table */}
        <DataTable
          data={expenses || []}
          columns={columns}
          loading={loading}
          error={error}
          actions={getExpenseActions}
          pagination={{
            page: paginationState.page - 1, // TablePagination uses 0-based indexing
            rowsPerPage: paginationState.pageSize,
            totalCount: totalExpenses,
            onPageChange: handlePageChange,
            onRowsPerPageChange: handlePageSizeChange,
            rowsPerPageOptions: [5, 10, 25, 50]
          }}
        />

  
        {/* Expense Form Dialog */}
        <ExpenseForm
          open={formOpen}
          onClose={handleFormClose}
          editExpense={editExpense}
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          entityName={expenseToDelete?.title || ''}
          entityType="Expense"
        />

        {/* View Expense Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setSelectedExpense(null);
            setViewTabValue(0);
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2, minHeight: '70vh' } }}
        >
          {selectedExpense && (
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
                    {t('expenses.expenseDetails')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {selectedExpense.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatusChip
                    status={selectedExpense.status}
                    statusConfig={commonStatusConfigs.expenseStatus(t)}
                    sx={{ fontWeight: 500 }}
                  />
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedExpense(null);
                      setViewTabValue(0);
                    }}
                    startIcon={<CloseIcon />}
                  >
                    {t('expenses.close')}
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
                    <Tab label={t('expenses.tabs.overview')} />
                    <Tab label={t('expenses.tabs.details')} />
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
                        {/* Expense Summary Card */}
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                                {t('expenses.expenseSummary')}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('expenses.date')}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDate(selectedExpense.expenseDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('expenses.category')}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {getExpenseTypeTranslation(selectedExpense.expenseTypeName, selectedExpense.expenseType)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('expenses.paymentMethod')}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {getPaymentMethodTranslation(selectedExpense.paymentMethod)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* Financial Information Card */}
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ReceiptIcon color="primary" />
                                {t('expenses.financialInformation')}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">{t('expenses.amount')}</Typography>
                                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {formatCurrency(selectedExpense.amount)}
                                  </Typography>
                                </Grid>
                                {selectedExpense.receiptNumber && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.receiptNumber')}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {selectedExpense.receiptNumber}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* Description Card */}
                        {selectedExpense.description && (
                          <Grid item xs={12}>
                            <Card>
                              <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>{t('expenses.description')}</Typography>
                                <Typography variant="body1">
                                  {selectedExpense.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        )}

                        {/* Remarks Card */}
                        {selectedExpense.remarks && (
                          <Grid item xs={12}>
                            <Card>
                              <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>{t('expenses.remarks')}</Typography>
                                <Typography variant="body1">
                                  {selectedExpense.remarks}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        )}

                        {/* Additional Information Card */}
                        <Grid item xs={12}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2 }}>{t('expenses.additionalInformation')}</Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">{t('expenses.createdBy')}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedExpense.createdByUserName}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">{t('expenses.expenseDate')}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDate(selectedExpense.createdDate)}
                                  </Typography>
                                </Grid>
                                {selectedExpense.approvedByUserName && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.approvedBy')}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {selectedExpense.approvedByUserName}
                                    </Typography>
                                  </Grid>
                                )}
                                {selectedExpense.approvedDate && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.approveDate')}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {formatDate(selectedExpense.approvedDate)}
                                    </Typography>
                                  </Grid>
                                )}
                                {selectedExpense.paidDate && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.paidDate')}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {formatDate(selectedExpense.paidDate)}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Details Tab */}
                {viewTabValue === 1 && (
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 3 }}>{t('expenses.completeExpenseInformation')}</Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>{t('expenses.basicInformation')}</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.title')}:</Typography>
                                    <Typography variant="body2">{selectedExpense.title}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.statusLabel')}:</Typography>
                                    <StatusChip
                                      status={selectedExpense.status}
                                      statusConfig={commonStatusConfigs.expenseStatus(t)}
                                      size="small"
                                    />
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.expenseType')}:</Typography>
                                    <Typography variant="body2">{getExpenseTypeTranslation(selectedExpense.expenseTypeName, selectedExpense.expenseType)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.paymentMethod')}:</Typography>
                                    <Typography variant="body2">{getPaymentMethodTranslation(selectedExpense.paymentMethod)}</Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>{t('expenses.financialDetails')}</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">{t('expenses.amount')}:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {formatCurrency(selectedExpense.amount)}
                                    </Typography>
                                  </Box>
                                  {selectedExpense.receiptNumber && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2" color="text.secondary">{t('expenses.receiptNumber')}:</Typography>
                                      <Typography variant="body2">{selectedExpense.receiptNumber}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('expenses.rejectExpense')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('expenses.rejectionReason')}
              type="text"
              fullWidth
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>{t('expenses.cancel')}</Button>
            <Button onClick={confirmReject} color="error" variant="contained">
              {t('expenses.rejectExpense')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ExpensesPage;