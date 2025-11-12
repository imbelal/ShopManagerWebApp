export interface Tenant {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  isDeleted: boolean;
  createdUtcDate: string;
  updatedUtcDate?: string;
  createdBy: string;
  updatedBy?: string;
}

export interface UpdateTenantRequest {
  name: string;
  address: string;
  phoneNumber: string;
}

export interface TenantFormData {
  name: string;
  address: string;
  phoneNumber: string;
}

export interface TenantSettings {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
}