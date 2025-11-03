import React from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

interface TrendIndicatorProps {
  value: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  showIcon?: boolean;
  compact?: boolean;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  label,
  color = 'primary',
  showIcon = true,
  compact = false,
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (value > 0) return TrendingUpIcon;
    if (value < 0) return TrendingDownIcon;
    return TrendingFlatIcon;
  };

  const getTrendColor = () => {
    if (value > 0) return 'success';
    if (value < 0) return 'error';
    return 'info'; // Use 'info' instead of 'default' as it's a valid palette color
  };

  const getBackgroundColor = () => {
    const trendColor = getTrendColor();
    return alpha(theme.palette[trendColor]?.main || theme.palette.text.primary, 0.1);
  };

  const TrendIcon = getTrendIcon();

  if (compact) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        sx={{
          color: `${getTrendColor()}.main`,
          backgroundColor: getBackgroundColor(),
          padding: theme.spacing(0.5, 1),
          borderRadius: 1,
        }}
      >
        {showIcon && <TrendIcon sx={{ fontSize: 16 }} />}
        <Typography variant="caption" fontWeight={600}>
          {Math.abs(value).toFixed(1)}%
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {showIcon && (
        <Box
          display="flex"
          alignItems="center"
          gap={0.5}
          sx={{
            color: `${getTrendColor()}.main`,
            backgroundColor: getBackgroundColor(),
            padding: theme.spacing(0.5, 1),
            borderRadius: 1,
            mb: 0.5,
          }}
        >
          <TrendIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={600}>
            {value > 0 ? '+' : ''}{value.toFixed(1)}%
          </Typography>
        </Box>
      )}
      {label && (
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default TrendIndicator;