import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'bn',
    name: 'বাংলা',
    flag: '🇧🇩'
  }
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);

    // Store language preference in localStorage
    localStorage.setItem('language', newLanguage);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="language-select-label">Language</InputLabel>
      <Select
        labelId="language-select-label"
        id="language-select"
        value={i18n.language}
        label="Language"
        onChange={handleLanguageChange}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{language.flag}</span>
              <Typography variant="body2">
                {language.name}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;