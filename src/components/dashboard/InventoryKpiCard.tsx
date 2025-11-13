import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import KpiCard from './KpiCard';
import { DashboardMetrics } from '../../services/dashboardService';

interface InventoryKpiCardProps {
  metrics: DashboardMetrics;
  loading?: boolean;
  onClick?: () => void;
}

const InventoryKpiCard: React.FC<InventoryKpiCardProps> = ({
  metrics,
  loading = false,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <KpiCard
      title={t('dashboard.totalProducts')}
      value={(metrics.totalProducts || 0).toLocaleString()}
      subtitle={`${metrics.lowStockProducts || 0} ${t('dashboard.lowStockItems')}`}
      icon={<InventoryIcon />}
      loading={loading}
      color="warning"
      onClick={onClick}
    />
  );
};

export default InventoryKpiCard;