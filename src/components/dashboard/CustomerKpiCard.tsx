import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  People as PeopleIcon,
} from '@mui/icons-material';
import KpiCard from './KpiCard';
import { DashboardMetrics } from '../../services/dashboardService';

interface CustomerKpiCardProps {
  metrics: DashboardMetrics;
  loading?: boolean;
  onClick?: () => void;
}

const CustomerKpiCard: React.FC<CustomerKpiCardProps> = ({
  metrics,
  loading = false,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <KpiCard
      title={t('dashboard.totalCustomers')}
      value={(metrics.totalCustomers || 0).toLocaleString()}
      subtitle={`${metrics.newCustomersThisMonth || 0} ${t('dashboard.newThisMonth', 'new this month')}`}
      icon={<PeopleIcon />}
      loading={loading}
      color="secondary"
      onClick={onClick}
    />
  );
};

export default CustomerKpiCard;