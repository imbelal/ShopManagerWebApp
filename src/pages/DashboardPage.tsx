import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme,
  Container,
  alpha,
} from '@mui/material';
import {
  RevenueKpiCard,
  SalesKpiCard,
  InventoryKpiCard,
  CustomerKpiCard,
} from '../components/dashboard';
import SalesTrendChart from '../components/dashboard/charts/SalesTrendChart';
import TopProductsChart from '../components/dashboard/charts/TopProductsChart';
import RecentSalesTable from '../components/dashboard/tables/RecentSalesTable';
import LowStockTable from '../components/dashboard/tables/LowStockTable';
import dashboardService, {
  DashboardMetrics,
  RecentSale,
  TopProduct,
  LowStockProduct,
  SalesTrend,
} from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend | null>(null);
  const [loading, setLoading] = useState({
    metrics: true,
    sales: true,
    products: true,
    stock: true,
    trends: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setError(null);
    try {
      // Load all data in parallel
      const [metricsResponse, salesResponse, productsResponse, stockResponse, trendsResponse] = await Promise.allSettled([
        dashboardService.getDashboardMetrics(),
        dashboardService.getRecentSales(10),
        dashboardService.getTopProducts(10, 30),
        dashboardService.getLowStockProducts(15),
        dashboardService.getSalesTrends(30),
      ]);

      // Handle metrics
      if (metricsResponse.status === 'fulfilled' && metricsResponse.value.succeeded) {
        setMetrics(metricsResponse.value.data);
      } else {
        console.error('Failed to load metrics:', metricsResponse);
      }

      // Handle recent sales
      if (salesResponse.status === 'fulfilled' && salesResponse.value.succeeded) {
        setRecentSales(salesResponse.value.data.items);
      } else {
        console.error('Failed to load recent sales:', salesResponse);
      }

      // Handle top products
      if (productsResponse.status === 'fulfilled' && productsResponse.value.succeeded) {
        setTopProducts(productsResponse.value.data);
      } else {
        console.error('Failed to load top products:', productsResponse);
      }

      // Handle low stock products
      if (stockResponse.status === 'fulfilled' && stockResponse.value.succeeded) {
        setLowStockProducts(stockResponse.value.data);
      } else {
        console.error('Failed to load low stock products:', stockResponse);
      }

      // Handle sales trends
      if (trendsResponse.status === 'fulfilled' && trendsResponse.value.succeeded) {
        setSalesTrends(trendsResponse.value.data);
      } else {
        console.error('Failed to load sales trends:', trendsResponse);
      }
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading({
        metrics: false,
        sales: false,
        products: false,
        stock: false,
        trends: false,
      });
    }
  };

  const handleViewSaleDetails = (sale: RecentSale) => {
    navigate(`/sales?id=${sale.id}`);
  };

  const handleViewProductDetails = (product: LowStockProduct | TopProduct) => {
    navigate(`/products?id=${product.productId}`);
  };

  const handleQuickReorder = (product: LowStockProduct) => {
    navigate(`/purchases?productId=${product.productId}`);
  };

  const handleKpiClick = (type: string) => {
    switch (type) {
      case 'revenue':
        navigate('/reports');
        break;
      case 'sales':
        navigate('/sales');
        break;
      case 'inventory':
        navigate('/products');
        break;
      case 'customers':
        navigate('/customers');
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
          Welcome back, {user?.firstName || user?.username}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's what's happening with your business today.
        </Typography>
      </Box>

      {/* KPI Cards - Each taking full row width */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <RevenueKpiCard
            metrics={metrics || {} as DashboardMetrics}
            loading={loading.metrics}
            onClick={() => handleKpiClick('revenue')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SalesKpiCard
            metrics={metrics || {} as DashboardMetrics}
            loading={loading.metrics}
            onClick={() => handleKpiClick('sales')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <InventoryKpiCard
            metrics={metrics || {} as DashboardMetrics}
            loading={loading.metrics}
            onClick={() => handleKpiClick('inventory')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <CustomerKpiCard
            metrics={metrics || {} as DashboardMetrics}
            loading={loading.metrics}
            onClick={() => handleKpiClick('customers')}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SalesTrendChart
            height={400}
            loading={loading.trends}
            title="Sales Trend - Last 30 Days"
            data={salesTrends?.dailySales?.map(day => ({
              date: new Date(day.date).toISOString().split('T')[0], // Format date to YYYY-MM-DD
              revenue: day.totalRevenue,
              sales: day.totalSales,
            })) || []}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <TopProductsChart
            height={400}
            data={topProducts}
            loading={loading.products}
            title="Top Products"
            limit={5}
          />
        </Grid>
      </Grid>

      {/* Tables Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentSalesTable
            data={recentSales}
            loading={loading.sales}
            title="Recent Sales"
            onViewDetails={handleViewSaleDetails}
            maxRows={8}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <LowStockTable
            data={lowStockProducts}
            loading={loading.stock}
            title="Low Stock Alerts"
            onViewDetails={handleViewProductDetails}
            onReorder={handleQuickReorder}
            maxRows={8}
          />
        </Grid>
      </Grid>

      {/* Quick Actions Card */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Card elevation={0}>
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      border: `2px solid ${theme.palette.primary.main}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                    onClick={() => navigate('/sales')}
                  >
                    <Typography variant="h6" color="primary.main" fontWeight={600}>
                      ➕ New Sale
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      border: `2px solid ${theme.palette.success.main}`,
                      backgroundColor: alpha(theme.palette.success.main, 0.05),
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                      },
                    }}
                    onClick={() => navigate('/products')}
                  >
                    <Typography variant="h6" color="success.main" fontWeight={600}>
                      📦 Add Product
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      border: `2px solid ${theme.palette.info.main}`,
                      backgroundColor: alpha(theme.palette.info.main, 0.05),
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                      },
                    }}
                    onClick={() => navigate('/purchases')}
                  >
                    <Typography variant="h6" color="info.main" fontWeight={600}>
                      🛒 New Purchase
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      border: `2px solid ${theme.palette.secondary.main}`,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      },
                    }}
                    onClick={() => navigate('/reports')}
                  >
                    <Typography variant="h6" color="secondary.main" fontWeight={600}>
                      📊 Reports
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;