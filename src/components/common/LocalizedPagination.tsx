import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Tooltip
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { localizeNumber } from '../../utils/numberLocalization';

export interface LocalizedPaginationProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  boundaryCount?: number;
  siblingCount?: number;
}

const LocalizedPagination: React.FC<LocalizedPaginationProps> = ({
  count,
  page,
  onChange,
  showFirstButton = true,
  showLastButton = true,
  boundaryCount = 2,
  siblingCount = 1
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handlePageChange = (newPage: number) => {
    onChange({} as any, newPage);
  };

  const renderPageNumber = (pageNumber: number, isCurrent = false) => (
    <Button
      key={pageNumber}
      variant={isCurrent ? 'contained' : 'outlined'}
      size="small"
      onClick={() => handlePageChange(pageNumber)}
      sx={{
        minWidth: 36,
        height: 36,
        mx: 0.25,
        fontSize: '0.875rem'
      }}
    >
      {localizeNumber(pageNumber, currentLanguage)}
    </Button>
  );

  const renderPaginationItems = () => {
    const items = [];
    const startPage = Math.max(1, page - siblingCount);
    const endPage = Math.min(count, page + siblingCount);

    // First page and ellipsis
    if (boundaryCount > 0 && startPage > 1) {
      for (let i = 1; i <= Math.min(boundaryCount, startPage - 1); i++) {
        items.push(renderPageNumber(i));
      }
      if (startPage - boundaryCount > 1) {
        items.push(
          <Typography key="start-ellipsis" sx={{ mx: 1 }}>
            ...
          </Typography>
        );
      }
    }

    // Current page range
    for (let i = startPage; i <= endPage; i++) {
      items.push(renderPageNumber(i, i === page));
    }

    // Last page and ellipsis
    if (boundaryCount > 0 && endPage < count) {
      if (count - boundaryCount > endPage) {
        items.push(
          <Typography key="end-ellipsis" sx={{ mx: 1 }}>
            ...
          </Typography>
        );
      }
      for (let i = Math.max(endPage + 1, count - boundaryCount + 1); i <= count; i++) {
        items.push(renderPageNumber(i));
      }
    }

    return items;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      {/* First page button */}
      {showFirstButton && (
        <Tooltip title={t('common.first')}>
          <IconButton
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            size="small"
          >
            <FirstPageIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Previous page button */}
      <Tooltip title={t('common.previous')}>
        <IconButton
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          size="small"
        >
          <PrevIcon />
        </IconButton>
      </Tooltip>

      {/* Page numbers */}
      {renderPaginationItems()}

      {/* Next page button */}
      <Tooltip title={t('common.next')}>
        <IconButton
          onClick={() => handlePageChange(Math.min(count, page + 1))}
          disabled={page === count}
          size="small"
        >
          <NextIcon />
        </IconButton>
      </Tooltip>

      {/* Last page button */}
      {showLastButton && (
        <Tooltip title={t('common.last')}>
          <IconButton
            onClick={() => handlePageChange(count)}
            disabled={page === count}
            size="small"
          >
            <LastPageIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default LocalizedPagination;