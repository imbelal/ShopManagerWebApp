import apiClient, { ApiResponse, AxiosResponse } from './apiClient';

// Types
export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalCost: number;
  remark: string;
  status: PurchaseStatus;
  createdBy: string;
  createdDate: string;
  purchaseItems: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  purchaseDate: string;
  remark: string;
  purchaseItems: CreatePurchaseItemRequest[];
}

export interface CreatePurchaseItemRequest {
  productId: string;
  quantity: number;
  costPerUnit: number;
}

export interface UpdatePurchaseRequest {
  Id: string; // Note: Capital 'Id' to match backend convention
  supplierId: string;
  purchaseDate: string;
  remark: string;
  purchaseItems: CreatePurchaseItemRequest[];
}

export enum PurchaseStatus {
  Pending = 0,
  Completed = 1,
  Cancelled = 2
}

export interface PurchaseFilters {
  pageNumber?: number;
  pageSize?: number;
  supplierId?: string;
  status?: PurchaseStatus;
  productId?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseListResponse {
  items: Purchase[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  contactNo: string;
  address: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  minStockThreshold: number;
  isActive: boolean;
  categoryName?: string;
}

const purchasesService = {
  // Get all purchases with pagination and filtering
  async getPurchases(filters: PurchaseFilters = {}): Promise<AxiosResponse<ApiResponse<PurchaseListResponse>>> {
    const params = new URLSearchParams();

    if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.supplierId) params.append('supplierId', filters.supplierId);
    if (filters.status !== undefined) params.append('status', filters.status.toString());
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const url = query ? `/Purchases?${query}` : '/Purchases';

    return await apiClient.get(url);
  },

  // Get purchase by ID
  async getPurchaseById(id: string): Promise<AxiosResponse<ApiResponse<Purchase>>> {
    return await apiClient.get(`/Purchases/${id}`);
  },

  // Create new purchase
  async createPurchase(purchaseData: CreatePurchaseRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return await apiClient.post('/Purchases', purchaseData);
  },

  // Update existing purchase
  async updatePurchase(id: string, purchaseData: UpdatePurchaseRequest): Promise<AxiosResponse<ApiResponse<null>>> {
    return await apiClient.put(`/Purchases/${id}`, purchaseData);
  },

  // Cancel purchase
  async cancelPurchase(id: string): Promise<AxiosResponse<ApiResponse<null>>> {
    return await apiClient.put(`/Purchases/${id}/cancel`);
  },

  // Delete purchase
  async deletePurchase(id: string): Promise<AxiosResponse<ApiResponse<null>>> {
    return await apiClient.delete(`/Purchases/${id}`);
  },

  // Get suppliers for dropdown
  async getSuppliers(): Promise<AxiosResponse<ApiResponse<Supplier[]>>> {
    return await apiClient.get('/Suppliers');
  },

  // Get products for dropdown
  async getProducts(): Promise<AxiosResponse<ApiResponse<Product[]>>> {
    return await apiClient.get('/Products');
  },

  // Helper function to format purchase status
  formatPurchaseStatus(status: PurchaseStatus | number | string): string {
    const statusValue = typeof status === 'string' ? parseInt(status) : status;

    switch (statusValue) {
      case PurchaseStatus.Pending:
        return 'Pending';
      case PurchaseStatus.Completed:
        return 'Completed';
      case PurchaseStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  },

  // Helper function to get status color
  getPurchaseStatusColor(status: PurchaseStatus | number | string): 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary' {
    const statusValue = typeof status === 'string' ? parseInt(status) : status;

    switch (statusValue) {
      case PurchaseStatus.Pending:
        return 'warning';
      case PurchaseStatus.Completed:
        return 'success';
      case PurchaseStatus.Cancelled:
        return 'error';
      default:
        return 'secondary';
    }
  },

  // Helper function to calculate purchase total
  calculatePurchaseTotal(items: CreatePurchaseItemRequest[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.costPerUnit), 0);
  },

  // Helper function to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};

export default purchasesService;