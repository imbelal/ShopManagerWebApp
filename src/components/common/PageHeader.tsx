import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
  secondaryAction?: {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
  };
  showRefresh?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actionButton,
  secondaryAction,
  showRefresh = false,
  onRefresh,
  loading = false
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showRefresh && onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}

        {secondaryAction && (
          <Tooltip title={secondaryAction.tooltip}>
            <IconButton onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
            </IconButton>
          </Tooltip>
        )}

        {actionButton && (
          <Button
            variant={actionButton.variant || 'contained'}
            color={actionButton.color || 'primary'}
            startIcon={actionButton.icon || <AddIcon />}
            onClick={actionButton.onClick}
            disabled={loading}
            sx={{
              ...(actionButton.variant === 'contained' && {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                borderRadius: 1,
                px: 3,
                py: 1,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              })
            }}
          >
            {actionButton.label}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;