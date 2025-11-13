import React from 'react';
import { useTranslation } from 'react-i18next';
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
  Warning as WarningIcon,
  ShoppingCart as CartIcon,
  Inventory as StockIcon,
  ArrowUpward as UpIcon,
} from '@mui/icons-material';
import { LowStockProduct } from '../../../services/dashboardService';

interface LowStockTableProps {
  data?: LowStockProduct[];
  loading?: boolean;
  title?: string;
  onReorder?: (product: LowStockProduct) => void;
  onViewDetails?: (product: LowStockProduct) => void;
  maxRows?: number;
}

const LowStockTable: React.FC<LowStockTableProps> = ({
  data = [],
  loading = false,
  title,
  onReorder,
  onViewDetails,
  maxRows = 10,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const tableTitle = title || t('dashboard.lowStockAlerts');

  const getUrgencyColor = (urgency: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    if (urgency?.includes('Critical')) return 'error';
    if (urgency?.includes('High')) return 'warning';
    if (urgency?.includes('Medium')) return 'info';
    return 'success';
  };

  const getStockStatusColor = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) return 'error';
    if (currentStock <= minimumStock * 0.5) return 'warning';
    return 'info';
  };

  const displayData = data.slice(0, maxRows);

  if (loading) {
    return (
      <Card elevation={0}>
        <CardContent sx={{ padding: theme.spacing(2), '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {tableTitle}
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
          {tableTitle}
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
            <StockIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              All products well stocked
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No products require immediate attention
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.product')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.category')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.stockLevel')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.urgency')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.lastMonthSales')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                    {t('dashboard.tableHeaders.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.map((product, index) => (
                  <TableRow
                    key={product.productId}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {product.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.productCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {product.categoryName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: getStockStatusColor(product.currentStock, product.minimumStock) + '.main',
                            fontSize: 12,
                          }}
                        >
                          {product.currentStock}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {product.currentStock} units
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Min: {product.minimumStock}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.urgency}
                        size="small"
                        color={getUrgencyColor(product.urgency)}
                        variant="filled"
                        sx={{
                          fontSize: '0.7rem',
                          height: 24,
                          fontWeight: 500,
                        }}
                        icon={
                          product.urgency?.includes('Critical') ? (
                            <WarningIcon sx={{ fontSize: 14 }} />
                          ) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {product.lastMonthQuantitySold > 0 && (
                          <UpIcon
                            sx={{
                              fontSize: 16,
                              color: 'error.main',
                              transform: 'rotate(45deg)',
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          color={
                            product.lastMonthQuantitySold > product.currentStock
                              ? 'error.main'
                              : 'text.secondary'
                          }
                          fontWeight={
                            product.lastMonthQuantitySold > product.currentStock ? 600 : 400
                          }
                        >
                          {product.lastMonthQuantitySold} units
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {onReorder && (
                          <Tooltip title={t('dashboard.tableHeaders.quickReorder')}>
                            <IconButton
                              size="small"
                              onClick={() => onReorder(product)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.success.main,
                                  color: theme.palette.success.contrastText,
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <CartIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onViewDetails && (
                          <Tooltip title={t('dashboard.tableHeaders.viewDetails')}>
                            <IconButton
                              size="small"
                              onClick={() => onViewDetails(product)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.primary.main,
                                  color: theme.palette.primary.contrastText,
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <StockIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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

export default LowStockTable;