import { AxiosResponse } from 'axios';
import { ApiResponse } from '../types/auth';
import apiClient from './apiClient';

// Types for Customer
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  remark: string;
  totalDueAmount: number;
  totalSales: number;
  totalSalesAmount: number;
  createdBy: string;
  createdDate: string;
  lastSaleDate: string | null;
  formattedLastSaleDate: string;
  formattedTotalDueAmount: string;
  formattedTotalSalesAmount: string;
}

export interface CustomerListRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface CustomerListResponse {
  items: Customer[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  remark: string;
}

export interface UpdateCustomerRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  remark: string;
}

export const customersService = {
  // Get all customers with pagination and search
  async getCustomers(params: CustomerListRequest = {}): Promise<AxiosResponse<ApiResponse<CustomerListResponse>>> {
    const queryParams = new URLSearchParams();

    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

    const queryString = queryParams.toString();
    const url = `/Customer/paginated${queryString ? '?' + queryString : ''}`;

    return await apiClient.get(url);
  },

  // Get all customers for dropdown (simple list)
  async getCustomersForDropdown(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return await apiClient.get('/Customer');
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<AxiosResponse<ApiResponse<Customer>>> {
    return await apiClient.get(`/Customer/${id}`);
  },

  // Create new customer
  async createCustomer(customerData: CreateCustomerRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return await apiClient.post('/Customer', customerData);
  },

  // Update existing customer
  async updateCustomer(customerData: UpdateCustomerRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return await apiClient.put('/Customer', customerData);
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<AxiosResponse<ApiResponse<string>>> {
    // Send the ID as string, backend will parse it as GUID
    return await apiClient.delete('/Customer', { data: { id } });
  },

  // Helper function to format currency
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Helper function to format date
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  },

  // Helper function to get customer full name
  getFullName(customer: { firstName: string; lastName: string }): string {
    return `${customer.firstName} ${customer.lastName}`.trim();
  }
};

export default customersService;