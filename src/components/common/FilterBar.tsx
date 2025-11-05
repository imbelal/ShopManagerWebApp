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
  Tooltip
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

export interface FilterBarProps {
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  onFilterChange: (filterId: string, value: string) => void;
  onClearFilters?: () => void;
  showClearButton?: boolean;
  loading?: boolean;
  sx?: object;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  filters = [],
  onFilterChange,
  onClearFilters,
  showClearButton = true,
  loading = false,
  sx = {}
}) => {
  const hasActiveFilters = filters.some(filter => filter.value !== '');
  const hasActiveSearch = searchTerm.trim() !== '';

  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search Field */}
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

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <Grid sx={{ xs: 12, sm: 6, md: 2 }} key={filter.id}>
            <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filter.value}
                label={filter.label}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
              >
                <MenuItem value="">All {filter.label}</MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
    </Box>
  );
};

export default FilterBar;