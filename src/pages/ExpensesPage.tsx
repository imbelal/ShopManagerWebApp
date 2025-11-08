import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Stack,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import DataTable, { TableColumn, ContextAction } from '../components/common/DataTable';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Paid as PaidIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
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

const ExpensesPage: React.FC = () => {
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

  // Filter states
  const [filters, setFilters] = useState<ExpensesFilter>({});

  // Show filters state
  const [showFilters, setShowFilters] = useState(false);

  // Pagination hook
  const [paginationState, paginationActions] = usePagination(1, 10);

  // Table columns definition
  const columns: TableColumn<Expense>[] = [
    {
      id: 'title',
      label: 'Title',
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
      label: 'Type',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      )
    },
    {
      id: 'amount',
      label: 'Amount',
      minWidth: 100,
      align: 'right',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {safeFormatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'expenseDate',
      label: 'Date',
      minWidth: 100,
      format: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      id: 'statusName',
      label: 'Status',
      minWidth: 100,
      format: (value, row) => (
        <Chip
          label={value}
          color={getStatusColor(row.status) as any}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      )
    },
    {
      id: 'paymentMethodName',
      label: 'Payment Method',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      )
    },
    {
      id: 'receiptNumber',
      label: 'Receipt',
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
      label: 'Created By',
      minWidth: 120,
      format: (value) => (
        <Typography variant="caption">
          {value}
        </Typography>
      )
    }
  ];

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
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Load expenses when filters or pagination changes
  useEffect(() => {
    loadExpenses();
  }, [filters, paginationState.page, paginationState.pageSize]);

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<ExpensesFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
        setError(err.message || 'Failed to delete expense');
      }
    }
  };

  // Approve expense
  const handleApproveExpense = async (expense: Expense) => {
    try {
      await expensesService.approveExpense(expense.id);
      loadExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to approve expense');
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
        setError(err.message || 'Failed to reject expense');
      }
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      await expensesService.markAsPaid(expense.id);
      loadExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to mark expense as paid');
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

  // Get status color
  const getStatusColor = (status: number): string => {
    try {
      return expensesService?.getStatusColor?.(status) || '#666666';
    } catch {
      return '#666666';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Safety check for expensesService
  const safeFormatCurrency = (amount: number) => {
    try {
      return expensesService?.formatCurrency?.(amount) || `$${amount.toFixed(2)}`;
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  };

  // Table actions
  const getExpenseActions = (expense: Expense): ContextAction[] => {
    const actions: ContextAction[] = [
      {
        id: 'view',
        label: 'View Details',
        icon: <ViewIcon fontSize="small" />,
        onClick: () => handleViewExpense(expense)
      }
    ];

    // Edit action - only for editable statuses
    if (expensesService.canEditExpense(expense.status)) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        icon: <EditIcon fontSize="small" color="primary" />,
        onClick: () => handleEditExpense(expense)
      });
    }

    // Approval actions for pending expenses
    if (expense.status === ExpenseStatus.Pending) {
      actions.push(
        {
          id: 'approve',
          label: 'Approve',
          icon: <ApproveIcon fontSize="small" color="success" />,
          onClick: () => handleApproveExpense(expense)
        },
        {
          id: 'reject',
          label: 'Reject',
          icon: <RejectIcon fontSize="small" color="error" />,
          onClick: () => handleRejectExpense(expense)
        }
      );
    }

    // Mark as paid action for approved expenses
    if (expense.status === ExpenseStatus.Approved) {
      actions.push({
        id: 'mark-paid',
        label: 'Mark as Paid',
        icon: <PaidIcon fontSize="small" color="success" />,
        onClick: () => handleMarkAsPaid(expense)
      });
    }

    // Delete action - only for editable statuses
    if (expensesService.canEditExpense(expense.status)) {
      actions.push({
        id: 'delete',
        label: 'Delete',
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
          title="Expenses Management"
          subtitle="Track and manage your business expenses"
          actionButton={{
            label: 'Add Expense',
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
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {showFilters && (
                <>
                  <Grid sx={{ xs: 12, sm: 6, md: 3, minWidth: 200 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search expenses..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid sx={{ xs: 12, sm: 4, md: 2, minWidth: 150 }}>
                    <DatePicker
                      label="From Date"
                      value={filters.fromDate ? new Date(filters.fromDate) : null}
                      onChange={(date) => handleFilterChange({ fromDate: date?.toISOString() || undefined })}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>

                  <Grid sx={{ xs: 12, sm: 4, md: 2, minWidth: 150 }}>
                    <DatePicker
                      label="To Date"
                      value={filters.toDate ? new Date(filters.toDate) : null}
                      onChange={(date) => handleFilterChange({ toDate: date?.toISOString() || undefined })}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>

                  <Grid sx={{ xs: 12, sm: 4, md: 1, minWidth: 150 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filters.expenseType || ''}
                        onChange={(e) => handleFilterChange({ expenseType: e.target.value || undefined })}
                        label="Type"
                      >
                        <MenuItem value="">All Types</MenuItem>
                        {expenseTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid sx={{ xs: 12, sm: 4, md: 1, minWidth: 150 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                        label="Status"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid sx={{ xs: 12, sm: 4, md: 1, minWidth: 150 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment</InputLabel>
                      <Select
                        value={filters.paymentMethod || ''}
                        onChange={(e) => handleFilterChange({ paymentMethod: e.target.value || undefined })}
                        label="Payment"
                      >
                        <MenuItem value="">All Methods</MenuItem>
                        {paymentMethodOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              <Grid sx={{ xs: 12, md: 2, minWidth: 150 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{ borderRadius: 1 }}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadExpenses}
                    sx={{ borderRadius: 1 }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid sx={{ xs: 12, sm: 6, md: 3, minWidth: 200 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Expenses
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
                  Total Amount
                </Typography>
                <Typography variant="h4">
                  {safeFormatCurrency(totalAmount)}
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
                    Expense Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {selectedExpense.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={selectedExpense.statusName}
                    sx={{
                      backgroundColor: getStatusColor(selectedExpense.status),
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedExpense(null);
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
                    <Tab label="Details" />
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
                                Expense Summary
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Date</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDate(selectedExpense.expenseDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Category</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedExpense.expenseTypeName}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Payment Method</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedExpense.paymentMethodName}
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
                                Financial Information
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {safeFormatCurrency(selectedExpense.amount)}
                                  </Typography>
                                </Grid>
                                {selectedExpense.receiptNumber && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Receipt Number</Typography>
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
                                <Typography variant="h6" sx={{ mb: 2 }}>Description</Typography>
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
                                <Typography variant="h6" sx={{ mb: 2 }}>Remarks</Typography>
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
                              <Typography variant="h6" sx={{ mb: 2 }}>Additional Information</Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">Created By</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedExpense.createdByUserName}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">Created Date</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDate(selectedExpense.createdDate)}
                                  </Typography>
                                </Grid>
                                {selectedExpense.approvedByUserName && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">Approved By</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {selectedExpense.approvedByUserName}
                                    </Typography>
                                  </Grid>
                                )}
                                {selectedExpense.approvedDate && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">Approved Date</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {formatDate(selectedExpense.approvedDate)}
                                    </Typography>
                                  </Grid>
                                )}
                                {selectedExpense.paidDate && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">Paid Date</Typography>
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
                            <Typography variant="h6" sx={{ mb: 3 }}>Complete Expense Information</Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Basic Information</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Title:</Typography>
                                    <Typography variant="body2">{selectedExpense.title}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                                    <Chip
                                      label={selectedExpense.statusName}
                                      size="small"
                                      sx={{
                                        backgroundColor: getStatusColor(selectedExpense.status),
                                        color: 'white'
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Expense Type:</Typography>
                                    <Typography variant="body2">{selectedExpense.expenseTypeName}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                                    <Typography variant="body2">{selectedExpense.paymentMethodName}</Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Financial Details</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Amount:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {safeFormatCurrency(selectedExpense.amount)}
                                    </Typography>
                                  </Box>
                                  {selectedExpense.receiptNumber && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2" color="text.secondary">Receipt Number:</Typography>
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
          <DialogTitle>Reject Expense</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason"
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
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmReject} color="error" variant="contained">
              Reject Expense
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ExpensesPage;