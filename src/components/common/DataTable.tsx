import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  TableCellProps,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ContextMenu, { ContextAction, ContextMenuProps } from './ContextMenu';
import EmptyState from './EmptyState';
import LocalizedPagination from './LocalizedPagination';
import { localizeNumber } from '../../utils/numberLocalization';

export interface TableColumn<T = any> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  fontWeight?: TableCellProps['sx'];
}

export interface PaginationProps {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: any, newPage: number) => void;
  onRowsPerPageChange: (event: any) => void;
  rowsPerPageOptions?: number[];
  totalPages?: number;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pagination?: PaginationProps;
  actions?: (row: T) => ContextAction[];
  onRowClick?: (row: T) => void;
  getRowId?: (row: T, index?: number) => string | number;
  rowHover?: boolean;
  headerBackgroundColor?: string;
  dense?: boolean;
  sx?: any;
  errorAction?: {
    label: string;
    onClick: () => void;
  };
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  emptyState,
  pagination,
  actions,
  onRowClick,
  getRowId = (row, index) => row.id || index,
  rowHover = true,
  headerBackgroundColor = '#f8f9fa',
  dense = false,
  sx,
  errorAction
}: DataTableProps<T>) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [contextMenuAnchorEl, setContextMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: T) => {
    event.stopPropagation();
    setContextMenuAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setContextMenuAnchorEl(null);
    setSelectedRow(null);
  };

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  // Calculate total pages
  const calculateTotalPages = () => {
    return Math.ceil(pagination?.totalCount / pagination?.rowsPerPage) || 1;
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert
            severity="error"
            action={errorAction && (
              <button onClick={errorAction.onClick} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                {errorAction.label}
              </button>
            )}
          >
            {error}
          </Alert>
        </Box>
      );
    }

    if (data.length === 0) {
      if (emptyState) {
        return (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
        );
      }
      return (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h6">No data available</Typography>
          <Typography variant="body2">There are no records to display.</Typography>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ backgroundColor: headerBackgroundColor }}>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    fontWeight: 600,
                    ...column.fontWeight
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('common.actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              const rowId = getRowId ? getRowId(row, index) : index;
              const rowActions = actions ? actions(row) : [];

              return (
                <TableRow
                  key={rowId}
                  hover={rowHover}
                  onClick={() => handleRowClick(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id as string];
                    const formattedValue = column.format
                      ? column.format(value, row)
                      : value;

                    return (
                      <TableCell
                        key={String(column.id)}
                        align={column.align || 'left'}
                      >
                        {formattedValue}
                      </TableCell>
                    );
                  })}

                  {actions && (
                    <TableCell align="center">
                      {rowActions.length > 0 && (
                        <Tooltip title={t('common.actions')}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, row)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Card sx={sx}>
      <CardContent sx={{ p: 0 }}>
        {renderTableContent()}

        {pagination && !loading && !error && data.length > 0 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid rgba(224, 224, 224, 1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('products.showingOfItems', {
                  from: localizeNumber(data.length, currentLanguage),
                  to: localizeNumber(pagination.totalCount, currentLanguage)
                })}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>{t('products.pageSize')}</InputLabel>
                <Select
                  value={pagination.rowsPerPage.toString()}
                  label={t('products.pageSize')}
                  onChange={pagination.onRowsPerPageChange}
                  sx={{ borderRadius: 1 }}
                >
                  {(pagination.rowsPerPageOptions || [5, 10, 25, 50, 100]).map((option) => (
                    <MenuItem key={option} value={option.toString()}>
                      {localizeNumber(option, currentLanguage)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <LocalizedPagination
              count={pagination.totalPages || calculateTotalPages()}
              page={pagination.page + 1} // Convert from 0-based to 1-based for display
              onChange={(event, value) => pagination.onPageChange(event, value - 1)} // Convert back to 0-based
              showFirstButton
              showLastButton
              boundaryCount={2}
              siblingCount={1}
            />
          </Box>
        )}

        {/* Context Menu */}
        {actions && selectedRow && (
          <ContextMenu
            actions={actions(selectedRow)}
            anchorEl={contextMenuAnchorEl}
            open={Boolean(contextMenuAnchorEl)}
            onClose={handleMenuClose}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;