import { useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  handlePageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  resetPage: () => void;
}

export interface PaginationProps {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  totalPages?: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rowsPerPageOptions?: number[];
}

export const usePagination = (
  initialPage: number = 1,
  initialPageSize: number = 10
): [PaginationState, PaginationActions] => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage + 1); // Convert from 0-based to 1-based
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const resetPage = () => {
    setPage(1);
  };

  const paginationActions: PaginationActions = {
    setPage,
    setPageSize,
    handlePageChange,
    handleRowsPerPageChange,
    resetPage
  };

  const paginationState: PaginationState = {
    page,
    pageSize
  };

  return [paginationState, paginationActions];
};

export const usePaginationProps = (
  state: PaginationState,
  actions: PaginationActions,
  totalCount: number,
  totalPages?: number,
  rowsPerPageOptions: number[] = [5, 10, 25, 50, 100]
): PaginationProps => {
  return {
    page: state.page - 1, // Convert to 0-based for DataTable
    rowsPerPage: state.pageSize,
    totalCount,
    totalPages,
    onPageChange: actions.handlePageChange,
    onRowsPerPageChange: actions.handleRowsPerPageChange,
    rowsPerPageOptions
  };
};

export default usePagination;