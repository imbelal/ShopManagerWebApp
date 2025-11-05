import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Chip,
  Avatar,
  Grid,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as SalesIcon,
  Event as SaleDateIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { customersService, Customer, CustomerListRequest } from '../services/customersService';
import {
  DataTable,
  StatusChip,
  CurrencyDisplay,
  createStandardActions,
  EmptyState
} from '../components/common';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting states
  const [sortBy, setSortBy] = useState<'totalDueAmount' | 'lastSaleDate' | 'createdDate'>('lastSaleDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog and Menu states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add Customer Dialog states
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    address: '',
    remark: ''
  });
  const [createCustomerLoading, setCreateCustomerLoading] = useState(false);

  // Edit Customer Dialog states
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    address: '',
    remark: ''
  });
  const [updateCustomerLoading, setUpdateCustomerLoading] = useState(false);

  // Delete Customer Dialog states
  const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteCustomerLoading, setDeleteCustomerLoading] = useState(false);

  // Load customers
  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: CustomerListRequest = {
        pageNumber: currentPage,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        sortBy,
        sortOrder
      };

      const response = await customersService.getCustomers(params);

      if (response.data.succeeded) {
        setCustomers(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      } else {
        setError(response.data.errors?.join(', ') || 'Failed to load customers');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while loading customers');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadCustomers();
  };

  // Handle page change
  // Pagination handlers for DataTable
  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, value: number) => {
    setCurrentPage(value + 1); // Convert from 0-based to 1-based
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.firstName?.trim() || !newCustomer.lastName?.trim()) {
      setError('Customer first name and last name are required');
      return;
    }

    try {
      setCreateCustomerLoading(true);
      setError(null);

      const customerData = {
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        email: newCustomer.email?.trim() || '',
        contactNo: newCustomer.contactNo?.trim() || '',
        address: newCustomer.address?.trim() || '',
        remark: newCustomer.remark?.trim() || ''
      };

      const response = await customersService.createCustomer(customerData);

      if (response.data.succeeded) {
        // Close dialog and reset form
        setAddCustomerDialogOpen(false);
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          contactNo: '',
          address: '',
          remark: ''
        });

        // Reload customers to show the new one
        await loadCustomers();
      } else {
        setError(response.data.message || 'Failed to create customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreateCustomerLoading(false);
    }
  };

  // Open edit customer dialog
  const handleEditCustomerClick = (customer: Customer) => {
    setEditingCustomer({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      contactNo: customer.contactNo,
      address: customer.address,
      remark: customer.remark
    });
    setEditCustomerDialogOpen(true);
  };

  // Update existing customer
  const handleUpdateCustomer = async () => {
    if (!editingCustomer.firstName?.trim() || !editingCustomer.lastName?.trim()) {
      setError('Customer first name and last name are required');
      return;
    }

    try {
      setUpdateCustomerLoading(true);
      setError(null);

      const customerData = {
        id: editingCustomer.id,
        firstName: editingCustomer.firstName.trim(),
        lastName: editingCustomer.lastName.trim(),
        email: editingCustomer.email?.trim() || '',
        contactNo: editingCustomer.contactNo?.trim() || '',
        address: editingCustomer.address?.trim() || '',
        remark: editingCustomer.remark?.trim() || ''
      };

      const response = await customersService.updateCustomer(customerData);

      if (response.data.succeeded) {
        // Close dialog and reload customers
        setEditCustomerDialogOpen(false);
        await loadCustomers();
      } else {
        setError(response.data.message || 'Failed to update customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setUpdateCustomerLoading(false);
    }
  };

  // Open delete customer dialog
  const handleDeleteCustomerClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteCustomerDialogOpen(true);
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteCustomerLoading(true);
      setError(null);

      const response = await customersService.deleteCustomer(customerToDelete.id);

      if (response.data.succeeded) {
        // Close dialog and reload customers
        setDeleteCustomerDialogOpen(false);
        setCustomerToDelete(null);
        await loadCustomers();
      } else {
        setError(response.data.message || 'Failed to delete customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleteCustomerLoading(false);
    }
  };

  // Handle menu actions
  // Handle view customer details
  const handleViewCustomer = async (customer: Customer) => {
    setViewLoading(true);
    setViewDialogOpen(true);
    setViewCustomer(customer);

    try {
      // Load customer details (you could add additional data here if needed)
      setViewCustomer(customer);
    } catch (error) {
      console.error('Failed to load customer details:', error);
    } finally {
      setViewLoading(false);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadCustomers();
  }, [currentPage, pageSize, sortBy, sortOrder]);

  // Handle Enter key in search
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Get due amount color
  const getDueAmountColor = (amount: number): 'success' | 'warning' | 'error' | 'default' => {
    if (amount === 0) return 'success';
    if (amount < 100) return 'warning';
    return 'error';
  };

  // Define table columns matching original structure
  const columns = [
    {
      id: 'name',
      label: 'Customer',
      minWidth: 200,
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'contact',
      label: 'Contact',
      minWidth: 150,
      format: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            {row.contactNo}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon sx={{ fontSize: 14 }} />
            {row.address}
          </Typography>
        </Box>
      )
    },
    {
      id: 'totalSales',
      label: 'Total Sales',
      minWidth: 100,
      format: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.totalSales}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <CurrencyDisplay amount={row.totalSalesAmount} showSign={false} />
          </Typography>
        </Box>
      )
    },
    {
      id: 'totalDueAmount',
      label: 'Due Amount',
      minWidth: 120,
      format: (value) => (
        <CurrencyDisplay
          amount={value}
          color={value > 0 ? 'error' : 'success'}
          fontWeight={600}
        />
      )
    },
    {
      id: 'lastSaleDate',
      label: 'Last Sale',
      minWidth: 120,
      format: (value) => value ? (
        <Typography variant="body2">
          {new Date(value).toLocaleDateString()}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No sales
        </Typography>
      )
    },
    {
      id: 'createdDate',
      label: 'Created',
      minWidth: 120,
      format: (value) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(value).toLocaleDateString()}
        </Typography>
      )
    }
  ];

  // Define row actions
  const getRowActions = (customer: Customer) => {
    return createStandardActions(
      customer,
      () => handleViewCustomer(customer),
      () => handleEditCustomerClick(customer),
      () => handleDeleteCustomerClick(customer)
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddCustomerDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search customers by name, email, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(1);
                    loadCustomers();
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="totalDueAmount">Due Amount</MenuItem>
                  <MenuItem value="lastSaleDate">Last Sale Date</MenuItem>
                  <MenuItem value="createdDate">Created Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e) => {
                    setSortOrder(e.target.value as any);
                    setCurrentPage(1);
                    loadCustomers();
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Search
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Button
                variant="text"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  setTimeout(loadCustomers, 100);
                }}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Customers DataTable */}
      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        error={error}
        emptyState={{
          icon: '👥',
          title: 'No customers found',
          description: searchTerm
            ? 'Try adjusting your search terms'
            : 'Get started by adding your first customer',
          action: {
            label: 'Add Customer',
            onClick: () => setAddCustomerDialogOpen(true)
          }
        }}
        actions={getRowActions}
        getRowId={(customer) => customer.id}
        pagination={{
          page: currentPage - 1, // Material-UI uses 0-based indexing
          rowsPerPage: pageSize,
          totalCount: totalCount,
          totalPages: totalPages,
          onPageChange: handlePageChange,
          onRowsPerPageChange: handleRowsPerPageChange,
          rowsPerPageOptions: [5, 10, 25, 50, 100]
        }}
        errorAction={{
          label: 'Retry',
          onClick: loadCustomers
        }}
      />

      {/* Summary Stats */}
      {!loading && customers.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {totalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Customers with Due
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {customers.filter(c => c.totalDueAmount > 0).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main" gutterBottom>
                  Total Due Amount
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {customersService.formatCurrency(
                    customers.reduce((sum, c) => sum + c.totalDueAmount, 0)
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Total Sales Value
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {customersService.formatCurrency(
                    customers.reduce((sum, c) => sum + c.totalSalesAmount, 0)
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Customer View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Customer Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {viewCustomer?.firstName} {viewCustomer?.lastName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewCustomer ? (
            <Box>
              {/* Customer Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Customer Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Full Name"
                            secondary={`${viewCustomer.firstName} ${viewCustomer.lastName}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Email"
                            secondary={viewCustomer.email}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Phone"
                            secondary={viewCustomer.contactNo}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Address"
                            secondary={viewCustomer.address || 'No address provided'}
                          />
                        </ListItem>
                        {viewCustomer.remark && (
                          <ListItem>
                            <ListItemText
                              primary="Remarks"
                              secondary={viewCustomer.remark}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Sales Statistics */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    Sales Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid sx={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary.main">
                          {viewCustomer.totalSales}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h4" color="success.main">
                          {customersService.formatCurrency(viewCustomer.totalSalesAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales Value
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h4" color={getDueAmountColor(viewCustomer.totalDueAmount)}>
                          {customersService.formatCurrency(viewCustomer.totalDueAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due Amount
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Activity Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    Activity Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Customer Since"
                            secondary={customersService.formatDate(viewCustomer.createdDate)}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 6 }}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Last Sale Date"
                            secondary={customersService.formatDate(viewCustomer.lastSaleDate)}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="h6">Customer information not available</Typography>
              <Typography variant="body2">Unable to load customer details.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog
        open={addCustomerDialogOpen}
        onClose={() => setAddCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={newCustomer.firstName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={newCustomer.lastName || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Contact Number"
                value={newCustomer.contactNo || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, contactNo: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={newCustomer.address || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Remark"
                value={newCustomer.remark || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, remark: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAddCustomerDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.firstName?.trim() || !newCustomer.lastName?.trim() || createCustomerLoading}
            startIcon={createCustomerLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {createCustomerLoading ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editCustomerDialogOpen}
        onClose={() => setEditCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={editingCustomer.firstName || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={editingCustomer.lastName || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingCustomer.email || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Contact Number"
                value={editingCustomer.contactNo || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, contactNo: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={editingCustomer.address || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, address: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Remark"
                value={editingCustomer.remark || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, remark: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditCustomerDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCustomer}
            variant="contained"
            disabled={!editingCustomer.firstName?.trim() || !editingCustomer.lastName?.trim() || updateCustomerLoading}
            startIcon={updateCustomerLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {updateCustomerLoading ? 'Updating...' : 'Update Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <Dialog
        open={deleteCustomerDialogOpen}
        onClose={() => setDeleteCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
            Delete Customer
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this customer?
          </Typography>
          {customerToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary">
                {customerToDelete.firstName} {customerToDelete.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {customerToDelete.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {customerToDelete.contactNo}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteCustomerDialogOpen(false)}
            disabled={deleteCustomerLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCustomer}
            variant="contained"
            color="error"
            disabled={deleteCustomerLoading}
            startIcon={deleteCustomerLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteCustomerLoading ? 'Deleting...' : 'Delete Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;