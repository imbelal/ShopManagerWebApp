import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import TrendIndicator from './TrendIndicator';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  height?: number;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  color = 'primary',
  height = 140,
  onClick,
}) => {
  const theme = useTheme();

  const getCardBackground = () => {
    const colorMap = {
      primary: alpha(theme.palette.primary.main, 0.08),
      secondary: alpha(theme.palette.secondary.main, 0.08),
      success: alpha(theme.palette.success.main, 0.08),
      warning: alpha(theme.palette.warning.main, 0.08),
      error: alpha(theme.palette.error.main, 0.08),
      info: alpha(theme.palette.info.main, 0.08),
    };

    const borderColorMap = {
      primary: alpha(theme.palette.primary.main, 0.2),
      secondary: alpha(theme.palette.secondary.main, 0.2),
      success: alpha(theme.palette.success.main, 0.2),
      warning: alpha(theme.palette.warning.main, 0.2),
      error: alpha(theme.palette.error.main, 0.2),
      info: alpha(theme.palette.info.main, 0.2),
    };

    return {
      backgroundColor: colorMap[color],
      borderLeft: `4px solid ${theme.palette[color].main}`,
      borderColor: borderColorMap[color],
    };
  };

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          height,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...getCardBackground(),
          borderRadius: 2,
          transition: 'all 0.3s ease-in-out',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <CircularProgress size={24} color={color} />
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        height,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...getCardBackground(),
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: onClick ? 'translateY(-2px)' : 'none',
          boxShadow: onClick ? theme.shadows[4] : 'none',
          '& .icon-container': {
            transform: 'scale(1.1)',
          },
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ height: '100%', padding: theme.spacing(2), '&:last-child': { pb: 2 } }}>
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          justifyContent="space-between"
        >
          {/* Header */}
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ fontWeight: 500, lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color={`${color}.main`}
              sx={{ lineHeight: 1.1 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Footer with trend */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {trend && (
              <TrendIndicator
                value={trend.value}
                label={trend.label}
                color={color}
              />
            )}

            {/* Icon */}
            <Box
              className="icon-container"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              {React.cloneElement(icon as React.ReactElement, {
                sx: {
                  fontSize: 32,
                  color: `${color}.main`,
                  opacity: 0.8,
                },
              })}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;