import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Pause as PausedIcon,
  Block as BlockedIcon,
  Paid as PaidIcon
} from '@mui/icons-material';
import { TFunction } from 'i18next';

export interface StatusConfig {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: React.ReactNode;
}

export interface StatusChipProps extends Omit<ChipProps, 'color' | 'label' | 'icon'> {
  status: string | number;
  statusConfig: StatusConfig | ((status: string | number) => StatusConfig);
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  statusConfig,
  size = 'small',
  variant = 'filled',
  sx,
  ...chipProps
}) => {
  const config = typeof statusConfig === 'function'
    ? statusConfig(status)
    : statusConfig;

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon as React.ReactNode}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
        '& .MuiChip-icon': {
          fontSize: 14,
        },
        ...sx
      }}
      {...chipProps}
    />
  );
};

export default StatusChip;

// Predefined status configurations
export const commonStatusConfigs = {
  // Generic active/inactive
  active: (t: TFunction) => (_status: string | number): StatusConfig => ({
    label: t('products.active'),
    color: 'success',
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
  }),

  inactive: (t: TFunction) => (_status: string | number): StatusConfig => ({
    label: t('products.inactive'),
    color: 'warning',
    icon: <PendingIcon sx={{ fontSize: 16 }} />
  }),

  // Product status
  productStatus: (t: TFunction) => (status: string | number): StatusConfig => {
    const statusValue = typeof status === 'number' ? status : parseInt(status);
    switch (statusValue) {
      case 1: // Active
        return {
          label: t('products.active'),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 2: // InActive
        return {
          label: t('products.inactive'),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: t('products.unknown'),
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
    }
  },

  // Sales status
  salesStatus: (t: TFunction) => (status: string | number): StatusConfig => {
    const statusValue = typeof status === 'number' ? status : status.toLowerCase();

    switch (statusValue) {
      case 0: // Pending
        return {
          label: t('sales.pending'),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 1: // PartiallyPaid
        return {
          label: t('sales.partiallyPaid'),
          color: 'info',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 2: // Paid
        return {
          label: t('sales.paid'),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 'paid':
      case 'completed':
        return {
          label: t('sales.paid'),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 3: // Cancelled
        return {
          label: t('sales.cancelled'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      case 'cancelled':
        return {
          label: t('sales.cancelled'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: t('common.unknown'),
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
    }
  },

  // Stock status
  stockStatus: (t: TFunction) => (quantity: number): StatusConfig => ({
    label: quantity > 0 ? t('products.inStock') : t('products.outOfStock'),
    color: quantity > 0 ? 'success' : 'error',
    icon: quantity > 0 ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <BlockedIcon sx={{ fontSize: 16 }} />
  }),

  // Purchase status
  purchaseStatus: (t: TFunction) => (status: string | number): StatusConfig => {
    const statusValue = typeof status === 'number' ? status : parseInt(status);

    switch (statusValue) {
      case 0: // Pending
        return {
          label: t('purchases.pending'),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 1: // Completed
        return {
          label: t('purchases.completed'),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 2: // Cancelled
        return {
          label: t('purchases.cancelled'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: t('common.unknown'),
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
    }
  },

  // Expense status
  expenseStatus: (t: TFunction) => (status: string | number): StatusConfig => {
    const statusValue = typeof status === 'number' ? status : parseInt(status);

    switch (statusValue) {
      case 0: // Pending
        return {
          label: t('expenses.status.pending'),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 1: // Approved
        return {
          label: t('expenses.status.approved'),
          color: 'info',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 2: // Rejected
        return {
          label: t('expenses.status.rejected'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      case 3: // Paid
        return {
          label: t('expenses.status.paid'),
          color: 'success',
          icon: <PaidIcon sx={{ fontSize: 16 }} />
        };
      case 4: // Overdue
        return {
          label: t('expenses.status.overdue'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: t('common.unknown'),
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
    }
  }
};

