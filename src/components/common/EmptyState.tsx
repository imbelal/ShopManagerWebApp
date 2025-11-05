import React from 'react';
import {
  Box,
  Typography,
  Button,
  SxProps,
  Theme
} from '@mui/material';
import { styled } from '@mui/material/styles';

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(4),
  minHeight: 200,
  color: theme.palette.text.secondary,
}));

const IconContainer = styled(Box)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
  };
  sx?: SxProps<Theme>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  sx
}) => {
  return (
    <EmptyStateContainer sx={sx}>
      <IconContainer>
        {icon}
      </IconContainer>

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
      )}

      {action && (
        <Button
          variant={action.variant || 'contained'}
          onClick={action.onClick}
          sx={{ mt: 2 }}
        >
          {action.label}
        </Button>
      )}
    </EmptyStateContainer>
  );
};

export default EmptyState;