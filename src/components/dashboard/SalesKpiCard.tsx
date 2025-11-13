import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <KpiCard
      title={t('dashboard.totalSales')}
      value={(metrics.totalSales || 0).toLocaleString()}
      subtitle={`${(metrics.currentMonthSales || 0).toLocaleString()} ${t('dashboard.thisMonth')}`}
      icon={<SalesIcon />}
      trend={{
        value: metrics.salesGrowth || 0,
        label: t('dashboard.vsLastMonth'),
      }}
      loading={loading}
      color="primary"
      onClick={onClick}
    />
  );
};

export default SalesKpiCard;