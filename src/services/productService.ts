import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types/auth';

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

// Create axios instance for product API
const productApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
productApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
productApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/Users/RefreshToken`,
            { refreshToken }
          );

          if (response.data.succeeded && response.data.data) {
            const { accessToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return productApi(originalRequest);
          }
        }

        // If refresh fails, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

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

    return productApi.get(url);
  },

  // Get product by ID
  async getProductById(id: string): Promise<AxiosResponse<ApiResponse<Product>>> {
    return productApi.get(`/Products/GetById/${id}`);
  },

  // Create new product
  async createProduct(productData: CreateProductRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.post('/Products', productData);
  },

  // Update existing product
  async updateProduct(productData: UpdateProductRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.put('/Products', productData);
  },

  // Delete product
  async deleteProduct(id: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.delete(`/Products/${id}`);
  },

  // Get product select list (for dropdowns)
  async getProductSelectList(): Promise<AxiosResponse<ApiResponse<Array<{ id: string; title: string }>>>> {
    return productApi.get('/Products/select-list');
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
    return productApi.get('/Products/profitability');
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
    return productApi.get(`/Products/low-profit${params}`);
  },

  // Get categories for dropdown
  async getCategories(): Promise<AxiosResponse<ApiResponse<Array<Category>>>> {
    return productApi.get('/Categories');
  },

  // Get tags for dropdown
  async getTags(): Promise<AxiosResponse<ApiResponse<Array<Tag>>>> {
    return productApi.get('/Tags');
  },

  // Create new category
  async createCategory(title: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.post('/Categories', { title });
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

    return productApi.post(`/Products/${productId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete product photo
  async deleteProductPhoto(productId: string, photoId: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.delete(`/Products/photos/${photoId}`);
  },

  // Set primary product photo
  async setPrimaryPhoto(productId: string, photoId: string): Promise<AxiosResponse<ApiResponse<string>>> {
    return productApi.put(`/Products/${productId}/photos/${photoId}/set-primary`);
  },
};

export default productService;