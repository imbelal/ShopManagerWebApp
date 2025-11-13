import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TopProduct } from '../../../services/dashboardService';

interface TopProductsChartProps {
  data?: TopProduct[];
  loading?: boolean;
  height?: number;
  limit?: number;
  title?: string;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data = [],
  loading = false,
  height = 300,
  limit = 5,
  title,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const chartTitle = title || t('dashboard.topProducts');

  // Prepare chart data with limited items
  const chartData = data
    .slice(0, limit)
    .map(item => ({
      name: item.productName.length > 15
        ? item.productName.substring(0, 15) + '...'
        : item.productName,
      fullName: item.productName,
      revenue: item.totalRevenue / 1000, // Convert to thousands
      quantity: item.totalQuantitySold,
      growth: item.growthPercentage,
    }));

  // Generate colors for bars
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            padding: theme.spacing(1.5),
            boxShadow: theme.shadows[2],
            maxWidth: 200,
          }}
        >
          <Typography variant="subtitle2" gutterBottom noWrap>
            {data.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.tableHeaders.revenue')}: ${data.revenue.toFixed(1)}K
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.tableHeaders.quantity')}: {data.quantity.toLocaleString()} {t('dashboard.tableHeaders.units')}
          </Typography>
          {data.growth !== 0 && (
            <Typography
              variant="body2"
              color={data.growth > 0 ? 'success.main' : 'error.main'}
            >
              Growth: {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card elevation={0} sx={{ height }}>
        <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box textAlign="center">
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading chart data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card elevation={0} sx={{ height }}>
        <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('dashboard.noData')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.topProductsDataWillAppear')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ height }}>
      <CardContent sx={{ height: '100%', padding: theme.spacing(2), '&:last-child': { pb: 2 } }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {chartTitle}
        </Typography>
        <ResponsiveContainer width="100%" height={height - 60}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="name"
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TopProductsChart;