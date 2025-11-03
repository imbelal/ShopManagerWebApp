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
  FormControlLabel
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
      setError('Customer first name and last name are required');
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
        setError(response.data.message || 'Failed to create customer');
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
      errors.customerId = 'Customer is required';
    }

    if (salesItems.length === 0) {
      errors.items = 'At least one item is required';
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
          setSuccess('Sale created successfully!');
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            {editSale ? 'Edit Sale' : 'New Sale'}
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
              <Grid item xs={9} minWidth={250}>
                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={formData.customerId || ''}
                    label="Customer"
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                  >
                    <MenuItem value="">Select Customer</MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <Button
                  variant="outlined"
                  startIcon={<PlusIcon />}
                  onClick={() => setCustomerDialogOpen(true)}
                  sx={{ height: '56px', borderRadius: 1 }}
                >
                  New Customer
                </Button>
              </Grid>
            </Grid>

            {/* Sales Items */}
            <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
              Sales Items
            </Typography>

            {/* Items List */}
            {salesItems.length > 0 && (
              <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Actions</TableCell>
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
                  Add Item
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={4} minWidth={250}>
                    <FormControl fullWidth>
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={newItem.productId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        disabled={newItem.productId !== ''}
                      >
                      <MenuItem value="">Select Product</MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.title}
                          {product.stockQuantity > 0 && (
                            <Chip
                              label={`${product.stockQuantity} in stock`}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Unit Price"
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => handleNewItemChange('unitPrice', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      disabled={!newItem.productId || newItem.quantity <= 0 || newItem.unitPrice <= 0}
                      sx={{ height: '56px', borderRadius: 1 }}
                    >
                      Add Item
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Discount, Tax, and Payment */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Discount %"
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  helperText={`${formatCurrency(discountAmount)} discount`}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Tax %"
                  type="number"
                  value={formData.taxPercentage}
                  onChange={(e) => handleInputChange('taxPercentage', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  helperText={`${formatCurrency(taxAmount)} tax`}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Total Paid"
                  type="number"
                  value={formData.totalPaid}
                  onChange={(e) => handleInputChange('totalPaid', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Grand Total: {formatCurrency(grandTotal)}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: remainingAmount > 0 ? 'error.main' : 'success.main',
                      fontWeight: 600
                    }}
                  >
                    Balance: {formatCurrency(remainingAmount)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Remark */}
            <TextField
              fullWidth
              label="Remark"
              multiline
              rows={3}
              value={formData.remark}
              onChange={(e) => handleInputChange('remark', e.target.value)}
              placeholder="Add any notes or special instructions..."
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editSale ? 'Update Sale' : 'Create Sale'}
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
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newCustomer.firstName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newCustomer.lastName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomer.contactNo || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, contactNo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newCustomer.address || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remark"
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
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.firstName?.trim() || !newCustomer.lastName?.trim()}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesForm;