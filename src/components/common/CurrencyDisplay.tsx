import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import i18n from 'i18next';

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
  currency,
  locale,
  showSign = false,
  color = 'default',
  fontWeight = 500,
  sx,
  ...typographyProps
}) => {
  // Auto-detect currency and locale based on current language if not provided
  const currentLanguage = i18n.language;
  const finalCurrency = currency || (currentLanguage === 'bn' ? 'BDT' : 'USD');
  const finalLocale = locale || (currentLanguage === 'bn' ? 'en-US' : 'en-US');

  // Format the currency
  const formatCurrency = (value: number, showCurrencySign = true) => {
    if (showCurrencySign) {
      if (currentLanguage === 'bn' && finalCurrency === 'BDT') {
        // For Bengali, use BDT with custom formatting
        const formattedNumber = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
        return `৳${formattedNumber}`;
      } else {
        return new Intl.NumberFormat(finalLocale, {
          style: 'currency',
          currency: finalCurrency
        }).format(value);
      }
    } else {
      return new Intl.NumberFormat(finalLocale, {
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
  currency?: string,
  locale?: string
): string => {
  const currentLanguage = i18n.language;
  const finalCurrency = currency || (currentLanguage === 'bn' ? 'BDT' : 'USD');
  const finalLocale = locale || 'en-US';

  if (currentLanguage === 'bn' && finalCurrency === 'BDT') {
    // For Bengali, use BDT with custom formatting
    const formattedNumber = new Intl.NumberFormat(finalLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `৳${formattedNumber}`;
  } else {
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: finalCurrency
    }).format(amount);
  }
};