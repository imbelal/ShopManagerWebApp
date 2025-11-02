import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  AttachMoney,
  People,
  Category,
  Warning,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ title, value, subtitle, icon, color, trend }) => {
  const theme = useTheme();

  return (
    <StyledCard elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
              boxShadow: `0 4px 15px ${alpha(color, 0.3)}`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

const QuickStat: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
}> = ({ label, value, total, color }) => {
  const percentage = (value / total) * 100;

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value}/{total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: alpha(color, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // Mock data - In real app, this would come from API
  const stats = [
    {
      title: 'Total Sales',
      value: '$24,563',
      subtitle: 'This month',
      icon: <ShoppingCart />,
      color: theme.palette.primary.main,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Total Products',
      value: 1234,
      subtitle: 'In inventory',
      icon: <Inventory />,
      color: theme.palette.success.main,
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: 'Customers',
      value: 892,
      subtitle: 'Active customers',
      icon: <People />,
      color: theme.palette.info.main,
      trend: { value: 3.1, isPositive: true },
    },
    {
      title: 'Categories',
      value: 45,
      subtitle: 'Product categories',
      icon: <Category />,
      color: theme.palette.warning.main,
      trend: { value: 2.4, isPositive: false },
    },
  ];

  const lowStockItems = [
    { name: 'Laptop Stand', stock: 3, minStock: 5 },
    { name: 'Wireless Mouse', stock: 7, minStock: 10 },
    { name: 'USB Cable', stock: 12, minStock: 15 },
  ];

  const recentActivities = [
    { action: 'New sale', details: 'Laptop - $899', time: '2 minutes ago' },
    { action: 'Product added', details: 'Gaming Mouse', time: '15 minutes ago' },
    { action: 'Customer registered', details: 'John Doe', time: '1 hour ago' },
    { action: 'Low stock alert', details: 'USB Cable', time: '2 hours ago' },
  ];

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Welcome back, {user?.firstName || user?.username}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your shop today.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Stock Overview
              </Typography>
              <QuickStat
                label="In Stock"
                value={1180}
                total={1234}
                color={theme.palette.success.main}
              />
              <QuickStat
                label="Low Stock"
                value={42}
                total={1234}
                color={theme.palette.warning.main}
              />
              <QuickStat
                label="Out of Stock"
                value={12}
                total={1234}
                color={theme.palette.error.main}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Low Stock Alerts
              </Typography>
              {lowStockItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  All items are well stocked!
                </Typography>
              ) : (
                <Box>
                  {lowStockItems.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < lowStockItems.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <Warning
                          sx={{
                            color: theme.palette.warning.main,
                            mr: 1,
                            fontSize: 20,
                          }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {item.stock} (Min: {item.minStock})
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={item.stock <= item.minStock ? 'Critical' : 'Low'}
                        size="small"
                        color={item.stock <= item.minStock ? 'error' : 'warning'}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Activity
              </Typography>
              <Box>
                {recentActivities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      py: 1.5,
                      borderBottom: index < recentActivities.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {activity.action}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.details}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <AttachMoney color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight={500}>
                      New Sale
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <Inventory color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight={500}>
                      Add Product
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <People color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight={500}>
                      Add Customer
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <Category color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight={500}>
                      Add Category
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;