import { AxiosResponse } from 'axios';
import { Tenant, UpdateTenantRequest } from '../types/tenant';
import apiClient, { handleApiError } from './apiClient';

interface ApiResponse<T> {
  data?: T;
  succeeded: boolean;
  message?: string;
  errors?: string[];
}

export const tenantService = {
  // Get current tenant information
  async getCurrentTenant(): Promise<AxiosResponse<ApiResponse<Tenant>>> {
    return apiClient.get('/Tenants');
  },

  // Update tenant information
  async updateTenant(request: UpdateTenantRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put('/Tenants', request);
  },

  // Helper function to get user-friendly error messages
  getErrorMessage(error: any): string {
    return handleApiError(error);
  },
};

export default tenantService;