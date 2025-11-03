import React from 'react';
import {
  ShoppingCart as SalesIcon,
} from '@mui/icons-material';
import KpiCard from './KpiCard';
import { DashboardMetrics } from '../../services/dashboardService';

interface SalesKpiCardProps {
  metrics: DashboardMetrics;
  loading?: boolean;
  onClick?: () => void;
}

const SalesKpiCard: React.FC<SalesKpiCardProps> = ({
  metrics,
  loading = false,
  onClick,
}) => {
  return (
    <KpiCard
      title="Total Sales"
      value={(metrics.totalSales || 0).toLocaleString()}
      subtitle={`${(metrics.currentMonthSales || 0).toLocaleString()} this month`}
      icon={<SalesIcon />}
      trend={{
        value: metrics.salesGrowth || 0,
        label: "vs last month",
      }}
      loading={loading}
      color="primary"
      onClick={onClick}
    />
  );
};

export default SalesKpiCard;