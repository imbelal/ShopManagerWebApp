import { AxiosResponse } from 'axios';
import { ApiResponse } from '../types/auth';
import apiClient, { handleApiError } from './apiClient';

// Types

// Backend SalesStatus Enum Values for Reference:
// 0 = Pending (No payment made yet)
// 1 = PartiallyPaid (Some payment made but not full)
// 2 = Paid (Full payment received)
// 3 = Cancelled (Order cancelled)

export interface Sales {
  id: string;
  salesNumber: string;
  customerId: string;
  customerName: string;
  totalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  discountedPrice: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  totalPaid: number;
  remainingAmount: number;
  status: number; // Changed to number to match backend enum (0=Pending, 1=PartiallyPaid, 2=Paid, 3=Cancelled)
  remark: string;
  createdBy: string;
  createdDate: string;
  salesItems: SalesItem[];
  salesTotalCost: number;
  salesProfit: number;
  salesProfitMargin: number;
}

export interface SalesItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateSalesRequest {
  customerId: string;
  totalPrice: number;
  discountPercentage: number;
  totalPaid: number;
  taxPercentage: number;
  remark: string;
  salesItems: SalesItemRequest[];
}

export interface SalesItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  remark: string;
}

export interface Payment {
  id: string;
  salesId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  remark?: string;
}

export interface AddPaymentRequest {
  salesId: string;
  amount: number;
  paymentMethod: string;
  remark?: string;
}

export interface SalesListRequest {
  pageNumber?: number;
  pageSize?: number;
  customerId?: string;
  searchTerm?: string;
}

export interface SalesListResponse {
  items: Sales[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const salesService = {
  // Get all sales with pagination and filtering
  async getSales(params: SalesListRequest): Promise<AxiosResponse<ApiResponse<SalesListResponse>>> {
    const queryParams = new URLSearchParams();

    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

    const queryString = queryParams.toString();
    const url = `/Sales${queryString ? '?' + queryString : ''}`;

    return await apiClient.get(url);
  },

  // Get sale by ID
  async getSaleById(id: string): Promise<AxiosResponse<ApiResponse<Sales>>> {
    return await apiClient.get(`/Sales/${id}`);
  },

  // Create new sale
  async createSale(saleData: CreateSalesRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return await apiClient.post('/Sales', saleData);
  },

  // Update existing sale
  async updateSale(id: string, saleData: Partial<Sales>): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put(`/Sales/${id}`, saleData);
  },

  // Cancel sale
  async cancelSale(id: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put(`/Sales/${id}/cancel`);
  },

  // Delete sale
  async deleteSale(id: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.delete(`/Sales/${id}`);
  },

  // Get all customers
  async getCustomers(): Promise<AxiosResponse<ApiResponse<Customer[]>>> {
    return await apiClient.get('/Customer');
  },

  // Create new customer
  async createCustomer(customerData: {
    firstName: string;
    lastName: string;
    email: string;
    contactNo: string;
    address: string;
    remark: string;
  }): Promise<AxiosResponse<ApiResponse<Customer>>> {
    return await apiClient.post('/Customer', customerData);
  },

  // Get sale payments
  async getSalePayments(salesId: string): Promise<AxiosResponse<ApiResponse<Payment[]>>> {
    return apiClient.get(`/Sales/${salesId}/payments`);
  },

  // Add payment to sale
  async addPayment(paymentData: AddPaymentRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.post(`/Sales/${paymentData.salesId}/payments`, paymentData);
  },

  // Generate and download PDF
  async generateSalesPdf(salesId: string): Promise<void> {
    try {
      const response = await apiClient.get(`/Sales/${salesId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sales_${salesId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get profit summary
  async getProfitSummary(
    startDate: Date,
    endDate: Date,
    groupBy: string = 'day'
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());
    params.append('groupBy', groupBy);

    return apiClient.get(`/Sales/profit-summary?${params.toString()}`);
  },

  // Helper function to get status color
  getStatusColor(status: string | number | null | undefined): string {
    if (status === null || status === undefined) {
      return 'default';
    }

    // Handle both string and number status values
    const statusValue = typeof status === 'number' ? status : status.toLowerCase();

    switch (statusValue) {
      case 2:  // Paid
      case 'paid':
      case 'completed':
        return 'success';
      case 0:  // Pending
      case 'pending':
      case 1:  // PartiallyPaid
      case 'partiallypaid':
        return 'warning';
      case 3:  // Cancelled
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  },

  // Helper function to get status text
  getStatusText(status: string | number | null | undefined): string {
    if (status === null || status === undefined) {
      return 'Unknown';
    }

    // Handle both string and number status values
    const statusValue = typeof status === 'number' ? status : status.toLowerCase();

    switch (statusValue) {
      case 0:  // Pending
        return 'Pending';
      case 1:  // PartiallyPaid
        return 'Partially Paid';
      case 2:  // Paid
        return 'Paid';
      case 3:  // Cancelled
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      case 'partiallypaid':
        return 'Partially Paid';
      case 'paid':
      case 'completed':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return typeof status === 'string' ? status : 'Unknown';
    }
  },

  // Helper function to get payment method color
  getPaymentMethodColor(method: string | null | undefined): string {
    if (!method || typeof method !== 'string') {
      return 'default';
    }
    switch (method.toLowerCase()) {
      case 'cash':
        return 'success';
      case 'card':
        return 'info';
      case 'bank':
        return 'warning';
      case 'online':
        return 'primary';
      default:
        return 'default';
    }
  }
};

export default salesService;