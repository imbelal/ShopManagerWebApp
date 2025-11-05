import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

export interface CurrencyDisplayProps extends Omit<TypographyProps, 'children'> {
  amount: number;
  currency?: string;
  locale?: string;
  showSign?: boolean;
  color?: 'default' | 'positive' | 'negative' | 'neutral';
  fontWeight?: TypographyProps['fontWeight'];
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'USD',
  locale = 'en-US',
  showSign = false,
  color = 'default',
  fontWeight = 500,
  sx,
  ...typographyProps
}) => {
  // Format the currency
  const formatCurrency = (value: number, showCurrencySign = true) => {
    if (showCurrencySign) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    } else {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Math.abs(value));
    }
  };

  // Determine color based on amount and color prop
  const getTextColor = () => {
    switch (color) {
      case 'positive':
        return 'success.main';
      case 'negative':
        return 'error.main';
      case 'neutral':
        return 'text.secondary';
      case 'default':
      default:
        if (amount > 0) return 'success.main';
        if (amount < 0) return 'error.main';
        return 'text.primary';
    }
  };

  const formattedAmount = formatCurrency(amount);
  const sign = showSign && amount > 0 ? '+' : '';

  return (
    <Typography
      component="span"
      sx={{
        color: getTextColor(),
        fontWeight,
        ...sx
      }}
      {...typographyProps}
    >
      {sign}{formattedAmount}
    </Typography>
  );
};

export default CurrencyDisplay;

// Helper function for direct formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};