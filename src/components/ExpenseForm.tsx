import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import expensesService, {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  getExpenseTypeOptions,
  getPaymentMethodOptions
} from '../services/expensesService';
import { handleApiError } from '../services/apiClient';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
  onExpenseAdded: () => void;
  onExpenseUpdated: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  open,
  onClose,
  editExpense,
  onExpenseAdded,
  onExpenseUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    remarks: '',
    expenseDate: new Date(),
    expenseType: 20 as number, // ExpenseType.Other
    paymentMethod: 1 as number, // PaymentMethod.Cash
    receiptNumber: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      resetForm();
      if (editExpense) {
        // Load existing expense data
        setFormData({
          title: editExpense.title,
          description: editExpense.description,
          amount: editExpense.amount.toString(),
          remarks: editExpense.remarks,
          expenseDate: new Date(editExpense.expenseDate),
          expenseType: editExpense.expenseType,
          paymentMethod: editExpense.paymentMethod,
          receiptNumber: editExpense.receiptNumber || ''
        });
      }
    }
  }, [open, editExpense]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      remarks: '',
      expenseDate: new Date(),
      expenseType: 20 as number, // ExpenseType.Other
      paymentMethod: 1 as number, // PaymentMethod.Cash
      receiptNumber: ''
    });
    setErrors({});
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    setError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (editExpense) {
        // Update existing expense
        const updateData: UpdateExpenseRequest = {
          id: editExpense.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          remarks: formData.remarks.trim(),
          expenseDate: formData.expenseDate.toISOString().split('T')[0],
          expenseType: formData.expenseType as number,
          paymentMethod: formData.paymentMethod as number,
          receiptNumber: formData.receiptNumber.trim() || undefined
        };

        response = await expensesService.updateExpense(updateData);
        setSuccess('Expense updated successfully!');

        setTimeout(() => {
          onExpenseUpdated();
          handleClose();
        }, 1500);
      } else {
        // Create new expense
        const createData: CreateExpenseRequest = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          remarks: formData.remarks.trim(),
          expenseDate: formData.expenseDate.toISOString().split('T')[0],
          expenseType: formData.expenseType as number,
          paymentMethod: formData.paymentMethod as number,
          receiptNumber: formData.receiptNumber.trim() || undefined
        };

        response = await expensesService.createExpense(createData);
        setSuccess('Expense created successfully!');

        setTimeout(() => {
          onExpenseAdded();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  const expenseTypeOptions = getExpenseTypeOptions();
  const paymentMethodOptions = getPaymentMethodOptions();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editExpense ? 'Edit Expense' : 'Create New Expense'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Basic Information */}
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#1a1a1a' }}>
              Basic Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography variant="body2">$</Typography>
                  }}
                />
              </Grid>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <DatePicker
                  label="Expense Date"
                  value={formData.expenseDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleInputChange('expenseDate', newValue);
                    }
                  }}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{
                    textField: TextField
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.expenseDate,
                      helperText: errors.expenseDate
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Type and Payment */}
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#1a1a1a' }}>
              Type & Payment
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid sx={{ xs: 12, sm: 6, minWidth: 200 }}>
                <FormControl fullWidth error={!!errors.expenseType}>
                  <InputLabel>Expense Type</InputLabel>
                  <Select
                    value={formData.expenseType}
                    onChange={(e) => handleInputChange('expenseType', e.target.value)}
                    label="Expense Type"
                    required
                  >
                    {expenseTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.expenseType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.expenseType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid sx={{ xs: 12, sm: 6, minWidth: 200 }}>
                <FormControl fullWidth error={!!errors.paymentMethod}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    label="Payment Method"
                    required
                  >
                    {paymentMethodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.paymentMethod && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.paymentMethod}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* Additional Information */}
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#1a1a1a' }}>
              Additional Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Receipt Number"
                  value={formData.receiptNumber}
                  onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                  placeholder="Optional receipt or reference number"
                />
              </Grid>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the expense"
                />
              </Grid>
              <Grid sx={{ xs: 12, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional notes or details about this expense"
                />
              </Grid>
            </Grid>

            {/* Amount Summary */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.main">
                  Total Amount: {expensesService.formatCurrency(parseFloat(formData.amount))}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} disabled={loading} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Saving...' : (editExpense ? 'Update Expense' : 'Create Expense')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExpenseForm;