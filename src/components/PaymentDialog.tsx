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
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { salesService, Payment, AddPaymentRequest } from '../services/salesService';
import { handleApiError } from '../services/apiClient';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  salesNumber: string;
  grandTotal: number;
  totalPaid: number;
  remainingAmount: number;
  onPaymentAdded: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  saleId,
  salesNumber,
  grandTotal,
  totalPaid,
  remainingAmount,
  onPaymentAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingPayments, setExistingPayments] = useState<Payment[]>([]);

  // Form state
  const [paymentData, setPaymentData] = useState({
    amount: remainingAmount > 0 ? remainingAmount : 0,
    paymentMethod: 'cash',
    remark: ''
  });

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'online', label: 'Online Payment' }
  ];

  // Load existing payments
  useEffect(() => {
    if (open && saleId) {
      loadPayments();
    }
  }, [open, saleId]);

  const loadPayments = async () => {
    try {
      const response = await salesService.getSalePayments(saleId);
      if (response.data.succeeded && response.data.data) {
        setExistingPayments(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  // Validate form
  const validateForm = () => {
    const errors: string[] = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Payment amount is required');
    }

    if (paymentData.amount > remainingAmount) {
      errors.push(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}`);
    }

    if (!paymentData.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const addPaymentData: AddPaymentRequest = {
        salesId: saleId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        remark: paymentData.remark
      };

      const response = await salesService.addPayment(addPaymentData);

      if (response.data.succeeded) {
        setSuccess('Payment added successfully!');

        // Reload payments list
        await loadPayments();

        // Reset form with updated remaining amount
        const newRemainingAmount = grandTotal - (totalPaid + paymentData.amount);
        setPaymentData({
          amount: newRemainingAmount > 0 ? newRemainingAmount : 0,
          paymentMethod: 'cash',
          remark: ''
        });

        // Clear messages
        setError(null);
        setSuccess(null);

        // Notify parent component
        onPaymentAdded();

        // Close dialog after a brief delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to add payment');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get payment method color
  const getPaymentMethodColor = (method: string) => {
    return salesService.getPaymentMethodColor(method);
  };

  // Calculate new totals after adding this payment
  const newTotalPaid = totalPaid + paymentData.amount;
  const newRemainingAmount = grandTotal - newTotalPaid;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Add Payment - {salesNumber}
        </Typography>
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

          {/* Sale Summary */}
          <Card sx={{ mb: 3, backgroundColor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Sale Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Grand Total
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Already Paid
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(totalPaid)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    color={remainingAmount > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(remainingAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Typography variant="subtitle2" gutterBottom>
            Payment Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} sx={{ minWidth: 250 }}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: remainingAmount, step: 0.01 }}
                required
                helperText={`Max: ${formatCurrency(remainingAmount)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 250 }}>
              <FormControl fullWidth required>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.paymentMethod}
                  label="Payment Method"
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ minWidth: 250 }}>
              <TextField
                fullWidth
                label="Remark (Optional)"
                multiline
                rows={2}
                value={paymentData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                placeholder="Add any notes about this payment..."
              />
            </Grid>
          </Grid>

          {/* Preview of Updated Totals */}
          {paymentData.amount > 0 && (
            <Card sx={{ mb: 3, backgroundColor: 'primary.50' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Updated Totals After This Payment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      New Total Paid
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(newTotalPaid)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      New Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      color={newRemainingAmount > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(newRemainingAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Status
                    </Typography>
                    <Chip
                      label={newRemainingAmount <= 0 ? 'Fully Paid' : 'Partially Paid'}
                      color={newRemainingAmount <= 0 ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Existing Payments */}
          {existingPayments.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" gutterBottom>
                Previous Payments ({existingPayments.length})
              </Typography>
              {existingPayments.map((payment, index) => (
                <Card key={payment.id} sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">
                          Method
                        </Typography>
                        <Chip
                          label={payment.paymentMethod}
                          color={getPaymentMethodColor(payment.paymentMethod)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body2">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        {payment.remark && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Remark
                            </Typography>
                            <Typography variant="body2" noWrap>
                              {payment.remark}
                            </Typography>
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || remainingAmount <= 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Adding Payment...' : 'Add Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentDialog;