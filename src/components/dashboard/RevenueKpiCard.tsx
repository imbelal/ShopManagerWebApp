import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../common/CurrencyDisplay';
import {
  TrendingUp as MoneyIcon,
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
  const { t } = useTranslation();

  
  return (
    <KpiCard
      title={t('dashboard.totalRevenue')}
      value={formatCurrency(metrics.totalRevenue || 0)}
      subtitle={`${formatCurrency(metrics.currentMonthRevenue || 0)} ${t('dashboard.thisMonth')}`}
      icon={<MoneyIcon />}
      trend={{
        value: metrics.revenueGrowth || 0,
        label: t('dashboard.vsLastMonth'),
      }}
      loading={loading}
      color="success"
      onClick={onClick}
    />
  );
};

export default RevenueKpiCard;