import React from 'react';
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
  return (
    <KpiCard
      title="Total Products"
      value={(metrics.totalProducts || 0).toLocaleString()}
      subtitle={`${metrics.lowStockProducts || 0} low stock items`}
      icon={<InventoryIcon />}
      loading={loading}
      color="warning"
      onClick={onClick}
    />
  );
};

export default InventoryKpiCard;