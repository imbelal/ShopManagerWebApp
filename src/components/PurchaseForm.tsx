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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import purchasesService, {
  Purchase,
  Supplier,
  Product,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  CreatePurchaseItemRequest
} from '../services/purchasesService';
import { handleApiError } from '../services/apiClient';

interface PurchaseFormProps {
  open: boolean;
  onClose: () => void;
  editPurchase?: Purchase | null;
  suppliers: Supplier[];
  products: Product[];
  onPurchaseAdded: () => void;
  onPurchaseUpdated: () => void;
}

interface PurchaseItemForm {
  productId: string;
  quantity: number;
  costPerUnit: number;
  productName: string;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  open,
  onClose,
  editPurchase,
  suppliers,
  products,
  onPurchaseAdded,
  onPurchaseUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    remark: ''
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemForm[]>([]);
  const [newItem, setNewItem] = useState<PurchaseItemForm>({
    productId: '',
    quantity: 1,
    costPerUnit: 0,
    productName: ''
  });

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      resetForm();
      if (editPurchase) {
        // Load existing purchase data
        setFormData({
          supplierId: editPurchase.supplierId,
          purchaseDate: editPurchase.purchaseDate.split('T')[0],
          remark: editPurchase.remark
        });
        setPurchaseItems(editPurchase.purchaseItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPerUnit: item.costPerUnit,
          productName: item.productName
        })));
      }
    }
  }, [open, editPurchase]);

  const resetForm = () => {
    setFormData({
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      remark: ''
    });
    setPurchaseItems([]);
    setNewItem({
      productId: '',
      quantity: 1,
      costPerUnit: 0,
      productName: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNewItemChange = (field: string, value: any) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        productId: product.id,
        productName: product.title,
        quantity: 1,
        costPerUnit: product.costPrice || 0
      });
    }
  };

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0 && newItem.costPerUnit > 0) {
      setPurchaseItems(prev => [...prev, newItem]);
      setNewItem({
        productId: '',
        quantity: 1,
        costPerUnit: 0,
        productName: ''
      });
    }
  };

  
  const removePurchaseItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItemForm, value: any) => {
    setPurchaseItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        // Update product name when product is selected
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.title;
            // Auto-fill cost price if not set
            if (!updatedItem.costPerUnit) {
              updatedItem.costPerUnit = product.costPrice || 0;
            }
          }
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotalCost = () => {
    return purchaseItems.reduce((total, item) => {
      return total + (item.quantity * item.costPerUnit);
    }, 0);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.supplierId) {
      errors.push('Supplier is required');
    }

    if (!formData.purchaseDate) {
      errors.push('Purchase date is required');
    }

    if (purchaseItems.length === 0) {
      errors.push('At least one purchase item is required');
    }

    purchaseItems.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Product is required for item ${index + 1}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Valid quantity is required for item ${index + 1}`);
      }
      if (!item.costPerUnit || item.costPerUnit <= 0) {
        errors.push(`Valid cost per unit is required for item ${index + 1}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }

    return true;
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

      if (editPurchase) {
        // For updates, use UpdatePurchaseRequest interface
        const updateData: UpdatePurchaseRequest = {
          Id: editPurchase.id, // Include the purchase ID for backend validation
          supplierId: formData.supplierId,
          purchaseDate: formData.purchaseDate,
          remark: formData.remark,
          purchaseItems: purchaseItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            costPerUnit: item.costPerUnit
          }))
        };

        response = await purchasesService.updatePurchase(editPurchase.id, updateData);
      } else {
        // For creates, use CreatePurchaseRequest interface
        const createData: CreatePurchaseRequest = {
          supplierId: formData.supplierId,
          purchaseDate: formData.purchaseDate,
          remark: formData.remark,
          purchaseItems: purchaseItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            costPerUnit: item.costPerUnit
          }))
        };

        response = await purchasesService.createPurchase(createData);
      }

      if (response.data.succeeded) {
        setSuccess(editPurchase ? 'Purchase updated successfully!' : 'Purchase created successfully!');

        // Clear messages and close dialog
        setTimeout(() => {
          setError(null);
          setSuccess(null);
          onClose();
          resetForm();

          if (editPurchase) {
            onPurchaseUpdated();
          } else {
            onPurchaseAdded();
          }
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save purchase');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {editPurchase ? 'Edit Purchase' : 'Create New Purchase'}
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

          {/* Purchase Information */}
          <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
            Purchase Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} minWidth={220}>
              <FormControl fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplierId}
                  label="Supplier"
                  onChange={(e) => handleInputChange('supplierId', e.target.value)}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedSupplier && (
                <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {selectedSupplier.email} | {selectedSupplier.contactNo}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6} minWidth={220}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks (Optional)"
                multiline
                rows={2}
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                placeholder="Add any notes about this purchase..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Purchase Items */}
          <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
            Purchase Items
          </Typography>

          {/* Items List */}
          {purchaseItems.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Cost per Unit</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.costPerUnit)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.quantity * item.costPerUnit)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => removePurchaseItem(index)}
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
                <Grid item xs={4} minWidth={220}>
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
                    label="Cost per Unit"
                    type="number"
                    value={newItem.costPerUnit}
                    onChange={(e) => handleNewItemChange('costPerUnit', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={!newItem.productId || newItem.quantity <= 0 || newItem.costPerUnit <= 0}
                    sx={{ height: '56px', borderRadius: 1 }}
                  >
                    Add Item
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="h6">
              Total Cost:
            </Typography>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(calculateTotalCost())}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : (editPurchase ? 'Update Purchase' : 'Create Purchase')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PurchaseForm;