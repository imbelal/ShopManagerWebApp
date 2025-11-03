import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Pagination,
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
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Handle page size change
  const handlePageSizeChange = (event: any) => {
    setPageSize(event.target.value);
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
    handleMenuClose();
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
    handleMenuClose();
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
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  // Handle view customer details
  const handleViewCustomer = async () => {
    if (!selectedCustomer) return;

    setViewLoading(true);
    setViewDialogOpen(true);
    setViewCustomer(selectedCustomer);
    handleMenuClose();

    try {
      // Load customer details (you could add additional data here if needed)
      setViewCustomer(selectedCustomer);
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

      {/* Customers Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : customers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No customers found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total Sales</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Due Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Sale</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {customer.firstName} {customer.lastName}
                              </Typography>
                              {customer.remark && (
                                <Typography variant="caption" color="text.secondary">
                                  {customer.remark}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.contactNo}</Typography>
                            </Box>
                            {customer.address && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {customer.address}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SalesIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                              <Typography variant="body2" fontWeight={600}>
                                {customer.totalSales} sales
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {customersService.formatCurrency(customer.totalSalesAmount)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<MoneyIcon sx={{ fontSize: 16 }} />}
                            label={customersService.formatCurrency(customer.totalDueAmount)}
                            color={getDueAmountColor(customer.totalDueAmount)}
                            size="small"
                            variant={customer.totalDueAmount === 0 ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SaleDateIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {customersService.formatDate(customer.lastSaleDate)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {customersService.formatDate(customer.createdDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, customer)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{
                              elevation: 3,
                              sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                '& .MuiAvatar-root': {
                                  width: 32,
                                  height: 32,
                                  ml: -0.5,
                                  mr: 1,
                                },
                                '&:before': {
                                  content: '""',
                                  display: 'block',
                                  position: 'absolute',
                                  top: 0,
                                  right: 14,
                                  width: 10,
                                  height: 10,
                                  bgcolor: 'background.paper',
                                  transform: 'translateY(-50%) rotate(45deg)',
                                  zIndex: 0,
                                },
                              },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                          >
                            <MenuItem onClick={handleViewCustomer}>
                              <ViewIcon sx={{ mr: 1 }} /> View Details
                            </MenuItem>
                            <MenuItem onClick={() => selectedCustomer && handleEditCustomerClick(selectedCustomer)}>
                              <EditIcon sx={{ mr: 1 }} /> Edit Customer
                            </MenuItem>
                            <MenuItem
                              onClick={() => selectedCustomer && handleDeleteCustomerClick(selectedCustomer)}
                              disabled={selectedCustomer ? !!selectedCustomer.lastSaleDate : false}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon sx={{ mr: 1 }} />
                              Delete Customer
                              {selectedCustomer?.lastSaleDate && (
                                <Typography variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>
                                  (Has sales)
                                </Typography>
                              )}
                            </MenuItem>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {(totalPages > 1 || customers.length > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {customers.length} of {totalCount} customers
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Page Size</InputLabel>
                      <Select
                        value={pageSize}
                        label="Page Size"
                        onChange={handlePageSizeChange}
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                      </Select>
                    </FormControl>
                    {totalPages > 1 && (
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && customers.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
                    <Grid item xs={12} md={6}>
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
                    <Grid item xs={12} md={6}>
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
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary.main">
                          {viewCustomer.totalSales}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h4" color="success.main">
                          {customersService.formatCurrency(viewCustomer.totalSalesAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales Value
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
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
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Customer Since"
                            secondary={customersService.formatDate(viewCustomer.createdDate)}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
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