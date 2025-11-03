import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ShoppingCart as SalesIcon,
  Person as CustomerIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { RecentSale } from '../../../services/dashboardService';

interface RecentSalesTableProps {
  data?: RecentSale[];
  loading?: boolean;
  title?: string;
  onViewDetails?: (sale: RecentSale) => void;
  maxRows?: number;
}

const RecentSalesTable: React.FC<RecentSalesTableProps> = ({
  data = [],
  loading = false,
  title = "Recent Sales",
  onViewDetails,
  maxRows = 10,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'partially paid':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'info';
      case 'failed':
        return 'error';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const displayData = data.slice(0, maxRows);

  if (loading) {
    return (
      <Card elevation={0}>
        <CardContent sx={{ padding: theme.spacing(2), '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0}>
      <CardContent sx={{ padding: theme.spacing(2), '&:last-child': { pb: 2 } }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>

        {displayData.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={6}
            textAlign="center"
          >
            <SalesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No recent sales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent sales will appear here once available
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Items
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Payment Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Date
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.map((sale, index) => (
                  <TableRow
                    key={sale.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                          <CustomerIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.customerName || 'Walk-in Customer'}
                          </Typography>
                          {sale.customerPhone && (
                            <Typography variant="caption" color="text.secondary">
                              {sale.customerPhone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SalesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {sale.totalItems}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2" fontWeight={500} color="success.main">
                          ${sale.formattedTotalAmount}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.paymentStatus}
                        size="small"
                        color={getPaymentStatusColor(sale.paymentStatus)}
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {onViewDetails && (
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails(sale)}
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <ViewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalesTable;