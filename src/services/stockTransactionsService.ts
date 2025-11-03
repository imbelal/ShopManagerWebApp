import { AxiosResponse } from 'axios';
import { ApiResponse } from '../types/auth';
import apiClient, { handleApiError } from './apiClient';

// Enums
export enum StockTransactionType {
  IN = 0,   // Stock increase
  OUT = 1   // Stock decrease
}

export enum StockReferenceType {
  Purchase = 0,
  Sale = 1,
  SalesReturn = 2,
  Adjustment = 3,
  SalesCancellation = 4,
  PurchaseCancellation = 5
}

// DTOs
export interface StockTransactionDto {
  id: string;
  productId: string;
  productName: string;
  type: StockTransactionType;
  typeName: string;
  refType: StockReferenceType;
  refTypeName: string;
  refId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  transactionDate: string;
  createdBy: string;
  createdDate: string;
}

export interface CreateStockAdjustmentCommand {
  productId: string;
  type: StockTransactionType;
  quantity: number;
  reason: string;
}

// Filter and Request interfaces
export interface StockTransactionFilters {
  productId?: string;
  type?: StockTransactionType;
  refType?: StockReferenceType;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface StockTransactionListRequest {
  pageSize?: number;
  pageNumber?: number;
  productId?: string;
  type?: StockTransactionType;
  refType?: StockReferenceType;
  fromDate?: string;
  toDate?: string;
}

export interface StockTransactionListResponse {
  items: StockTransactionDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Stock Transaction Service
export const stockTransactionsService = {
  // Get all stock transactions with pagination and filtering
  async getTransactions(params: StockTransactionListRequest): Promise<AxiosResponse<ApiResponse<StockTransactionListResponse>>> {
    const queryParams = new URLSearchParams();

    const pageSize = params.pageSize || 50;
    const pageNumber = params.pageNumber || 1;

    // Add query parameters
    if (params.productId) queryParams.append('ProductId', params.productId);
    if (params.type !== undefined) queryParams.append('Type', params.type.toString());
    if (params.refType !== undefined) queryParams.append('RefType', params.refType.toString());
    if (params.fromDate) queryParams.append('FromDate', params.fromDate);
    if (params.toDate) queryParams.append('ToDate', params.toDate);
    queryParams.append('PageNumber', pageNumber.toString());
    queryParams.append('PageSize', pageSize.toString());

    const queryString = queryParams.toString();
    const url = `/StockTransactions${queryString ? '?' + queryString : ''}`;

    return apiClient.get(url);
  },

  // Get transactions for a specific product
  async getTransactionsByProduct(productId: string): Promise<AxiosResponse<ApiResponse<StockTransactionDto[]>>> {
    return apiClient.get(`/StockTransactions/product/${productId}`);
  },

  // Create a stock adjustment
  async createAdjustment(command: CreateStockAdjustmentCommand): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.post('/StockTransactions/adjustment', command);
  },

  // Helper method to get transaction type options
  getTransactionTypeOptions(): { value: StockTransactionType; label: string }[] {
    return [
      { value: StockTransactionType.IN, label: 'Stock In' },
      { value: StockTransactionType.OUT, label: 'Stock Out' }
    ];
  },

  // Helper method to get reference type options
  getReferenceTypeOptions(): { value: StockReferenceType; label: string }[] {
    return [
      { value: StockReferenceType.Purchase, label: 'Purchase' },
      { value: StockReferenceType.Sale, label: 'Sale' },
      { value: StockReferenceType.SalesReturn, label: 'Sales Return' },
      { value: StockReferenceType.Adjustment, label: 'Adjustment' },
      { value: StockReferenceType.SalesCancellation, label: 'Sales Cancellation' },
      { value: StockReferenceType.PurchaseCancellation, label: 'Purchase Cancellation' }
    ];
  }
};

export default stockTransactionsService;