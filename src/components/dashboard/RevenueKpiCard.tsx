import React from 'react';
import {
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import KpiCard from './KpiCard';
import { DashboardMetrics } from '../../services/dashboardService';

interface RevenueKpiCardProps {
  metrics: DashboardMetrics;
  loading?: boolean;
  onClick?: () => void;
}

const RevenueKpiCard: React.FC<RevenueKpiCardProps> = ({
  metrics,
  loading = false,
  onClick,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <KpiCard
      title="Total Revenue"
      value={formatCurrency(metrics.totalRevenue || 0)}
      subtitle={`${formatCurrency(metrics.currentMonthRevenue || 0)} this month`}
      icon={<MoneyIcon />}
      trend={{
        value: metrics.revenueGrowth || 0,
        label: "vs last month",
      }}
      loading={loading}
      color="success"
      onClick={onClick}
    />
  );
};

export default RevenueKpiCard;