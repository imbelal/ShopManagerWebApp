import { AxiosResponse } from 'axios';
import { ApiResponse } from '../types/auth';
import apiClient, { handleApiError } from './apiClient';

export interface Product {
  id: string;
  title: string;
  description: string;
  size: string;
  color: string;
  stockQuantity: number;
  unit: string;
  categoryId: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
  createdBy: string;
  createdDate: string;
  productTags: string[];
  productPhotos: ProductPhoto[];
  status: string;
}

export interface ProductPhoto {
  id: string;
  productId: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  blobUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  createdBy: string;
  createdDate: string;
}

export interface Category {
  id: string;
  title: string;
  description?: string;
}

export interface Tag {
  id: string;
  title: string;
}

export interface ProductListRequest {
  pageSize?: number;
  pageNumber?: number;
  searchTerm?: string;
  categoryId?: string;
  unit?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'title' | 'price' | 'stockQuantity' | 'createdDate';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  items: Product[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  size: string;
  color: string;
  categoryId: string;
  unit: string;
  sellingPrice: number;
  tagIds: string[];
}

export interface UpdateProductRequest {
  productId: string;
  title: string;
  description: string;
  size: string;
  color: string;
  categoryId: string;
  unit: string;
  sellingPrice: number;
}

// Use the global API client that already has refresh token handling

export const productService = {
  // Get products with pagination and filtering
  async getProducts(params: ProductListRequest): Promise<AxiosResponse<ApiResponse<ProductListResponse>>> {
    const queryParams = new URLSearchParams();

    // pageSize and pageNumber go in the URL path
    const pageSize = params.pageSize || 10;
    const pageNumber = params.pageNumber || 1;

    // Other parameters go as query parameters
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.unit) queryParams.append('unit', params.unit);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/Products/GetProductWithPaging/${pageSize}/${pageNumber}${queryString ? '?' + queryString : ''}`;

    return apiClient.get(url);
  },

  // Get product by ID
  async getProductById(id: string): Promise<AxiosResponse<ApiResponse<Product>>> {
    return apiClient.get(`/Products/GetById/${id}`);
  },

  // Create new product
  async createProduct(productData: CreateProductRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.post('/Products', productData);
  },

  // Update existing product
  async updateProduct(productData: UpdateProductRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put('/Products', productData);
  },

  // Delete product
  async deleteProduct(id: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.delete(`/Products/${id}`);
  },

  // Get product select list (for dropdowns)
  async getProductSelectList(): Promise<AxiosResponse<ApiResponse<Array<{ id: string; title: string }>>>> {
    return apiClient.get('/Products/select-list');
  },

  // Get profitability analysis
  async getProfitabilityAnalysis(): Promise<AxiosResponse<ApiResponse<Array<{
    productId: string;
    title: string;
    sellingPrice: number;
    costPrice: number;
    profitMargin: number;
    stockQuantity: number;
    totalValue: number;
  }>>>> {
    return apiClient.get('/Products/profitability');
  },

  // Get low profit products
  async getLowProfitProducts(threshold?: number): Promise<AxiosResponse<ApiResponse<Array<{
    productId: string;
    title: string;
    profitMargin: number;
    sellingPrice: number;
    costPrice: number;
  }>>>> {
    const params = threshold ? `?threshold=${threshold}` : '';
    return apiClient.get(`/Products/low-profit${params}`);
  },

  // Get categories for dropdown
  async getCategories(): Promise<AxiosResponse<ApiResponse<Array<Category>>>> {
    return apiClient.get('/Categories');
  },

  // Get tags for dropdown
  async getTags(): Promise<AxiosResponse<ApiResponse<Array<Tag>>>> {
    return apiClient.get('/Tags');
  },

  // Create new category
  async createCategory(title: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.post('/Categories', { title });
  },

  // Upload product photo
  async uploadProductPhoto(
    productId: string,
    file: File,
    isPrimary: boolean = false,
    displayOrder: number = 0
  ): Promise<AxiosResponse<ApiResponse<string>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());
    formData.append('displayOrder', displayOrder.toString());

    return apiClient.post(`/Products/${productId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete product photo
  async deleteProductPhoto(productId: string, photoId: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.delete(`/Products/photos/${photoId}`);
  },

  // Set primary product photo
  async setPrimaryPhoto(productId: string, photoId: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put(`/Products/${productId}/photos/${photoId}/set-primary`);
  },
};

export default productService;