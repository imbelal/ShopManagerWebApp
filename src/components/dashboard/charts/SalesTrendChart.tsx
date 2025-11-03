import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface SalesTrendChartProps {
  data?: Array<{
    date: string;
    revenue: number;
    sales: number;
  }>;
  loading?: boolean;
  height?: number;
  title?: string;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data = [],
  loading = false,
  height = 300,
  title = "Sales Trend",
}) => {
  const theme = useTheme();

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    formattedRevenue: item.revenue / 1000, // Convert to thousands
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            padding: theme.spacing(1.5),
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              color={entry.color}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                }}
              />
              {entry.name}: {entry.name === 'Revenue' ? '$' : ''}{entry.value.toLocaleString()}
              {entry.name === 'Revenue' ? 'K' : ''}
            </Typography>
          ))}
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
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales trend data will appear here once available
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
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height - 60}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="formattedDate"
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="formattedRevenue"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesTrendChart;