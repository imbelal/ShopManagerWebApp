import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from './common/CurrencyDisplay';
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
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  AddCircle as PlusIcon
} from '@mui/icons-material';
import { salesService, SalesItemRequest, Product, Customer } from '../services/salesService';
import { productService } from '../services/productService';
import { handleApiError } from '../services/apiClient';

interface SalesFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (sale: any) => void;
  editSale?: any | null;
}

interface SalesItemForm extends SalesItemRequest {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

const SalesForm: React.FC<SalesFormProps> = ({
  open,
  onClose,
  onSave,
  editSale
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    taxPercentage: 0,
    discountPercentage: 0,
    totalPaid: 0,
    remark: ''
  });

  // Sales items
  const [salesItems, setSalesItems] = useState<SalesItemForm[]>([]);
  const [newItem, setNewItem] = useState<SalesItemForm>({
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    availableStock: 0
  });

  // Calculated values
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    address: '',
    remark: ''
  });

  // Reset form
  const resetForm = () => {
    isCreatingCustomerRef.current = false;
    setFormData({
      customerId: '',
      taxPercentage: 0,
      discountPercentage: 0,
      totalPaid: 0,
      remark: ''
    });
    setSalesItems([]);
    setNewItem({
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      availableStock: 0
    });
    setSubTotal(0);
    setDiscountAmount(0);
    setTaxAmount(0);
    setGrandTotal(0);
    setRemainingAmount(0);
    setNewCustomer({
      firstName: '',
      lastName: '',
      email: '',
      contactNo: '',
      address: '',
      remark: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Load data
  useEffect(() => {
    if (open) {
      loadCustomers();
      loadProducts();
    }
  }, [open]);

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

  // Initialize edit form with a ref to track if we're in the middle of customer creation
  const isCreatingCustomerRef = React.useRef(false);
  const previousOpenRef = React.useRef(open);

  useEffect(() => {
    if (editSale && open) {
      setFormData({
        customerId: editSale.customerId || '',
        taxPercentage: editSale.taxPercentage,
        discountPercentage: editSale.discountPercentage,
        totalPaid: editSale.totalPaid,
        remark: editSale.remark || ''
      });

      const items = editSale.salesItems.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        availableStock: 0 // We don't have this info in edit mode
      }));

      setSalesItems(items);
      isCreatingCustomerRef.current = false;
    } else if (open && !editSale) {
      // Check if this is a new form opening (not a re-render)
      const isNewFormOpening = !previousOpenRef.current;

      // Only reset if this is a fresh form opening AND we're not creating a customer AND no customerId exists
      if (isNewFormOpening && !isCreatingCustomerRef.current && !formData.customerId) {
        resetForm();
      }
    }

    // Update the previous open ref
    previousOpenRef.current = open;
  }, [editSale, open]);

  // Calculate totals
  useEffect(() => {
    const newSubTotal = salesItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const newDiscountAmount = newSubTotal * (formData.discountPercentage / 100);
    const discountedPrice = newSubTotal - newDiscountAmount;
    const newTaxAmount = discountedPrice * (formData.taxPercentage / 100);
    const newGrandTotal = discountedPrice + newTaxAmount;
    const newRemaining = newGrandTotal - formData.totalPaid;

    setSubTotal(newSubTotal);
    setDiscountAmount(newDiscountAmount);
    setTaxAmount(newTaxAmount);
    setGrandTotal(newGrandTotal);
    setRemainingAmount(newRemaining);
  }, [salesItems, formData.discountPercentage, formData.taxPercentage, formData.totalPaid]);

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle new item change
  const handleNewItemChange = (field: string, value: any) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  // Handle product selection
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        productId: product.id,
        productName: product.title,
        quantity: 1,
        unitPrice: product.sellingPrice,
        availableStock: product.stockQuantity
      });
    }
  };

  // Add item to sales
  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0 && newItem.unitPrice > 0) {
      setSalesItems(prev => [...prev, newItem]);
      setNewItem({
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        availableStock: 0
      });
    }
  };

  // Remove item from sales
  const handleRemoveItem = (index: number) => {
    setSalesItems(prev => prev.filter((_, i) => i !== index));
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.firstName?.trim() || !newCustomer.lastName?.trim()) {
      setError(t('salesForm.customerNameRequired'));
      return;
    }

    try {
      // Set the flag to indicate we're creating a customer
      isCreatingCustomerRef.current = true;

      const customerData = {
        firstName: newCustomer.firstName?.trim() || '',
        lastName: newCustomer.lastName?.trim() || '',
        email: newCustomer.email?.trim() || '',
        contactNo: newCustomer.contactNo?.trim() || '',
        address: newCustomer.address?.trim() || '',
        remark: newCustomer.remark?.trim() || ''
      };

      const response = await salesService.createCustomer(customerData);

      if (response.data.succeeded && response.data.data) {
        const createdCustomer = response.data.data;

        // Reload customers from backend to get the latest list
        loadCustomers().then(() => {
          // Set the newly created customer as selected immediately after reload
          setFormData(prev => ({ ...prev, customerId: createdCustomer.id }));
        });

        // Close dialog and reset customer form
        setCustomerDialogOpen(false);
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          contactNo: '',
          address: '',
          remark: ''
        });
        setError('');

        // Reset the flag after a delay to ensure the form initialization effect doesn't interfere
        setTimeout(() => {
          isCreatingCustomerRef.current = false;
        }, 1000);

      } else {
        setError(response.data.message || t('salesForm.failedToCreateCustomer'));
        isCreatingCustomerRef.current = false;
      }
    } catch (err: any) {
      setError(handleApiError(err));
      isCreatingCustomerRef.current = false;
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customerId) {
      errors.customerId = t('salesForm.customerRequired');
    }

    if (salesItems.length === 0) {
      errors.items = t('salesForm.atLeastOneItemRequired');
    }

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(', '));
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
      const salesData = {
        customerId: formData.customerId,
        totalPrice: subTotal,
        discountPercentage: formData.discountPercentage,
        totalPaid: formData.totalPaid,
        taxPercentage: formData.taxPercentage,
        remark: formData.remark,
        salesItems: salesItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      if (editSale) {
        // Update existing sale
        // await salesService.updateSale(editSale.id, salesData);
      } else {
        // Create new sale
        const response = await salesService.createSale(salesData);
        if (response.data.succeeded) {
          onSave(response.data.data);
          setSuccess(t('salesForm.saleCreatedSuccessfully'));
          // Reset form after successful sale creation
          resetForm();
          // Close dialog after a brief delay to show success
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        }
      }

      onClose();
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            {editSale ? t('salesForm.editSale') : t('salesForm.newSale')}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
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

            {/* Customer Selection */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid sx={{ xs: 9, minWidth: 250 }}>
                <Autocomplete
                  fullWidth
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: `${customer.firstName} ${customer.lastName}`
                  }))}
                  value={customers.find((customer) => customer.id === formData.customerId) ?
                    { value: formData.customerId, label: customers.find((customer) => customer.id === formData.customerId)?.firstName + ' ' + customers.find((customer) => customer.id === formData.customerId)?.lastName || '' } : null}
                  onChange={(event, newValue) => {
                    handleInputChange('customerId', newValue ? newValue.value : '');
                  }}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('sales.customer')}
                      required
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
              </Grid>
              <Grid sx={{ xs: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlusIcon />}
                  onClick={() => setCustomerDialogOpen(true)}
                  sx={{ height: '56px', borderRadius: 1 }}
                >
                  {t('salesForm.newCustomer')}
                </Button>
              </Grid>
            </Grid>

            {/* Sales Items */}
            <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
              {t('salesForm.salesItems')}
            </Typography>

            {/* Items List */}
            {salesItems.length > 0 && (
              <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('salesForm.tableColumns.product')}</TableCell>
                      <TableCell align="right">{t('salesForm.tableColumns.quantity')}</TableCell>
                      <TableCell align="right">{t('salesForm.tableColumns.unitPrice')}</TableCell>
                      <TableCell align="right">{t('salesForm.tableColumns.total')}</TableCell>
                      <TableCell align="center">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleRemoveItem(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Add New Item */}
            <Card sx={{ mb: 3, borderRadius: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('salesForm.addItem')}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid sx={{ xs: 4, minWidth: 250 }}>
                    <Autocomplete
                      fullWidth
                      options={products.map((product) => ({
                        value: product.id,
                        label: product.title,
                        stock: product.stockQuantity
                      }))}
                      value={products.find((product) => product.id === newItem.productId) ?
                        { value: newItem.productId, label: products.find((product) => product.id === newItem.productId)?.title || '', stock: products.find((product) => product.id === newItem.productId)?.stockQuantity || 0 } : null}
                      onChange={(event, newValue) => {
                        handleProductChange(newValue ? newValue.value : '');
                      }}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      disabled={newItem.productId !== ''}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{option.label}</Typography>
                            {option.stock > 0 && (
                              <Chip
                                label={t('salesForm.inStock', { stock: option.stock })}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('salesForm.product')}
                          sx={{ minWidth: 200 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid sx={{ xs: 2 }}>
                    <TextField
                      fullWidth
                      label={t('salesForm.quantity')}
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>
                  <Grid sx={{ xs: 3 }}>
                    <TextField
                      fullWidth
                      label={t('salesForm.unitPrice')}
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => handleNewItemChange('unitPrice', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>
                  <Grid sx={{ xs: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      disabled={!newItem.productId || newItem.quantity <= 0 || newItem.unitPrice <= 0}
                      sx={{ height: '56px', borderRadius: 1 }}
                    >
                      {t('salesForm.addItemButton')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Discount, Tax, and Payment */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid sx={{ xs: 3 }}>
                <TextField
                  fullWidth
                  label={t('salesForm.discount')}
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  helperText={t('salesForm.discountHelper', { amount: formatCurrency(discountAmount) })}
                />
              </Grid>
              <Grid sx={{ xs: 3 }}>
                <TextField
                  fullWidth
                  label={t('salesForm.tax')}
                  type="number"
                  value={formData.taxPercentage}
                  onChange={(e) => handleInputChange('taxPercentage', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  helperText={t('salesForm.taxHelper', { amount: formatCurrency(taxAmount) })}
                />
              </Grid>
              <Grid sx={{ xs: 3 }}>
                <TextField
                  fullWidth
                  label={t('salesForm.totalPaid')}
                  type="number"
                  value={formData.totalPaid}
                  onChange={(e) => handleInputChange('totalPaid', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid sx={{ xs: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('salesForm.grandTotal', { amount: formatCurrency(grandTotal) })}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: remainingAmount > 0 ? 'error.main' : 'success.main',
                      fontWeight: 600
                    }}
                  >
                    {t('salesForm.balance', { amount: formatCurrency(remainingAmount) })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Remark */}
            <TextField
              fullWidth
              label={t('salesForm.remark')}
              multiline
              rows={3}
              value={formData.remark}
              onChange={(e) => handleInputChange('remark', e.target.value)}
              placeholder={t('salesForm.remarkPlaceholder')}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} disabled={loading}>
              {t('salesForm.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editSale ? t('salesForm.updateSale') : t('salesForm.createSale')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle>{t('salesForm.newCustomerDialog.title')}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid sx={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.firstName')}
                value={newCustomer.firstName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            <Grid sx={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.lastName')}
                value={newCustomer.lastName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.email')}
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.phone')}
                value={newCustomer.contactNo || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, contactNo: e.target.value }))}
              />
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.address')}
                multiline
                rows={2}
                value={newCustomer.address || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('salesForm.newCustomerDialog.remark')}
                multiline
                rows={2}
                value={newCustomer.remark || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, remark: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCustomerDialogOpen(false)}>
            {t('salesForm.cancel')}
          </Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.firstName?.trim() || !newCustomer.lastName?.trim()}
          >
            {t('salesForm.newCustomerDialog.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesForm;