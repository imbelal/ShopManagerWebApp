import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Pause as PausedIcon,
  Block as BlockedIcon
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
  active: (t: TFunction, status: string | number): StatusConfig => ({
    label: t('products.active'),
    color: 'success',
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
  }),

  inactive: (t: TFunction, status: string | number): StatusConfig => ({
    label: t('products.inactive'),
    color: 'warning',
    icon: <PendingIcon sx={{ fontSize: 16 }} />
  }),

  // Product status
  productStatus: (t: TFunction, status: string | number): StatusConfig => {
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
  salesStatus: (t: TFunction, status: string | number): StatusConfig => {
    const statusValue = typeof status === 'number' ? status : parseInt(status);
    switch (statusValue) {
      case 1: // Pending
        return {
          label: t('products.pending'),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 2: // Paid
        return {
          label: t('products.paid'),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 3: // Cancelled
        return {
          label: t('products.cancelled'),
          color: 'error',
          icon: <BlockedIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: t('products.unknown'),
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
    }
  },

  // Stock status
  stockStatus: (t: TFunction, quantity: number): StatusConfig => ({
    label: quantity > 0 ? t('products.inStock') : t('products.outOfStock'),
    color: quantity > 0 ? 'success' : 'error',
    icon: quantity > 0 ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <BlockedIcon sx={{ fontSize: 16 }} />
  })
};