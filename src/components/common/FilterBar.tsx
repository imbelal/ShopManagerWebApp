import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}

export interface DateFieldOption {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'datetime-local';
}

export interface AutocompleteOption {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  dateFields?: DateFieldOption[];
  autocompleteFields?: AutocompleteOption[];
  onFilterChange: (filterId: string, value: string) => void;
  onClearFilters?: () => void;
  showClearButton?: boolean;
  loading?: boolean;
  sx?: object;
  children?: React.ReactNode;
  hideSearch?: boolean;
  filterMinWidth?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  filters = [],
  dateFields = [],
  autocompleteFields = [],
  onFilterChange,
  onClearFilters,
  showClearButton = true,
  loading = false,
  sx = {},
  children,
  hideSearch = false,
  filterMinWidth = 150
}) => {
  const hasActiveFilters = filters.some(filter => filter.value !== '');
  const hasActiveSearch = searchTerm.trim() !== '';

  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search Field */}
        {!hideSearch && (
          <Grid sx={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <Grid sx={{ xs: 12, sm: 6, md: 2 }} key={filter.id}>
            <FormControl fullWidth size="small" sx={{ minWidth: filterMinWidth }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filter.value}
                label={filter.label}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
              >
                <MenuItem key={`${filter.id}-all`} value="">All {filter.label}</MenuItem>
                {filter.options.map((option, index) => (
                  <MenuItem key={`${filter.id}-option-${index}`} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        {/* Date Fields */}
        {dateFields.map((dateField) => (
          <Grid sx={{ xs: 12, sm: 6, md: 2 }} key={dateField.id}>
            <TextField
              fullWidth
              label={dateField.label}
              type={dateField.type || 'date'}
              value={dateField.value}
              onChange={(e) => dateField.onChange(e.target.value)}
              size="small"
              sx={{ minWidth: filterMinWidth }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        ))}

        {/* Autocomplete Fields */}
        {autocompleteFields.map((autocompleteField) => (
          <Grid sx={{ xs: 12, sm: 6, md: 2 }} key={autocompleteField.id}>
            <Autocomplete
              fullWidth
              size="small"
              options={autocompleteField.options}
              value={autocompleteField.options.find(option => option.value === autocompleteField.value) || null}
              onChange={(event, newValue) => {
                autocompleteField.onChange(newValue ? newValue.value : '');
              }}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={autocompleteField.label}
                  sx={{ minWidth: filterMinWidth }}
                />
              )}
            />
          </Grid>
        ))}

        {/* Action Buttons */}
        <Grid sx={{ xs: 12, md: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {showClearButton && (hasActiveFilters || hasActiveSearch) && (
              <Tooltip title="Clear all filters">
                <Button
                  variant="text"
                  onClick={onClearFilters}
                  disabled={loading}
                  startIcon={<ClearIcon />}
                  size="small"
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Custom Content */}
      {children && (
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default FilterBar;