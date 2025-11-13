/**
 * Utility functions for number localization
 */

/**
 * Convert English digits to Bengali digits
 * @param num - The number to convert
 * @returns The number string with Bengali digits
 */
export const toBengaliDigits = (num: number | string): string => {
  const numStr = num.toString();
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  return numStr.replace(/[0-9]/g, (digit) => {
    return bengaliDigits[parseInt(digit)];
  });
};

/**
 * Convert numbers to localized digits based on language
 * @param num - The number to convert
 * @param language - The language code ('en' or 'bn')
 * @returns The number string with appropriate digits
 */
export const localizeNumber = (num: number | string, language: string): string => {
  if (language === 'bn') {
    return toBengaliDigits(num);
  }
  return num.toString();
};