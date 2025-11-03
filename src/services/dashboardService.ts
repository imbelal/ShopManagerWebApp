import { AxiosResponse } from 'axios';
import apiClient, { handleApiError } from './apiClient';

// Dashboard DTO Interfaces
export interface DashboardMetrics {
  // Financial KPIs
  totalRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
  totalExpenses: number;
  currentMonthExpenses: number;
  totalProfit: number;
  currentMonthProfit: number;
  averageOrderValue: number;

  // Sales KPIs
  totalSales: number;
  currentMonthSales: number;
  previousMonthSales: number;
  salesGrowth: number;
  totalSalesAmount: number;

  // Purchase KPIs
  totalPurchases: number;
  currentMonthPurchases: number;
  totalPurchasesAmount: number;

  // Product & Inventory KPIs
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;

  // Customer KPIs
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;

  // Order Management
  pendingOrders: number;
  ordersToday: number;

  // Profit Metrics
  grossProfit: number;
  netProfit: number;
  profitMargin: number;

  // Period Information
  currentPeriodStart: string;
  currentPeriodEnd: string;
  previousPeriodStart: string;
  previousPeriodEnd: string;
}

export interface RecentSale {
  id: string;
  saleDate: string;
  customerName: string;
  customerPhone: string;
  totalItems: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  createdBy: string;
  formattedSaleDate: string;
  formattedTotalAmount: string;
}

export interface RecentPurchase {
  id: string;
  purchaseDate: string;
  supplierName: string;
  invoiceNumber: string;
  totalItems: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  createdBy: string;
  formattedPurchaseDate: string;
  formattedTotalAmount: string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  categoryName: string;
  productCode: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  salesCount: number;
  growthPercentage: number;
  currentStock: number;
  imageUrl: string;
  formattedTotalRevenue: string;
  formattedAverageUnitPrice: string;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  categoryName: string;
  productCode: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  unitCost: number;
  unitPrice: number;
  lastMonthQuantitySold: number;
  isOutOfStock: boolean;
  urgency: string;
  formattedUnitCost: string;
  formattedUnitPrice: string;
}

export interface SalesTrend {
  dailySales: DailySale[];
  monthlySales: MonthlySale[];
  growthRate: number;
  totalTransactions: number;
  averageTransactionValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface DailySale {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  formattedDate: string;
  formattedRevenue: string;
  formattedAverageOrderValue: string;
}

export interface MonthlySale {
  year: number;
  month: number;
  monthName: string;
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  totalProfit: number;
  formattedMonth: string;
  formattedRevenue: string;
  formattedAverageOrderValue: string;
  formattedProfit: string;
}

export interface CategoryStock {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalStockQuantity: number;
  totalStockValue: number;
  lowStockProducts: number;
  percentageOfTotalStock: number;
  formattedTotalStockValue: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  succeeded: boolean;
  errors?: string[];
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Service Methods
class DashboardService {
  private baseUrl = '/Dashboard';

  // Get comprehensive dashboard metrics
  async getDashboardMetrics(startDate?: string, endDate?: string): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: AxiosResponse<ApiResponse<DashboardMetrics>> = await apiClient.get(
        `${this.baseUrl}/metrics`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get recent sales
  async getRecentSales(limit: number = 10, pageNumber: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedResponse<RecentSale>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<RecentSale>>> = await apiClient.get(
        `${this.baseUrl}/recent-sales`,
        { params: { limit, pageNumber, pageSize } }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get top performing products
  async getTopProducts(limit: number = 10, daysPeriod: number = 30): Promise<ApiResponse<TopProduct[]>> {
    try {
      const response: AxiosResponse<ApiResponse<TopProduct[]>> = await apiClient.get(
        `${this.baseUrl}/top-products`,
        { params: { limit, daysPeriod } }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get low stock products
  async getLowStockProducts(limit: number = 20, includeOutOfStock: boolean = true): Promise<ApiResponse<LowStockProduct[]>> {
    try {
      const response: AxiosResponse<ApiResponse<LowStockProduct[]>> = await apiClient.get(
        `${this.baseUrl}/low-stock-products`,
        { params: { limit, includeOutOfStock } }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get sales trends (placeholder for future implementation)
  async getSalesTrends(days: number = 30): Promise<ApiResponse<SalesTrend>> {
    try {
      const response: AxiosResponse<ApiResponse<SalesTrend>> = await apiClient.get(
        `${this.baseUrl}/sales-trends`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Helper methods for formatting data
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  formatPercentage(value: number): string {
    return `${Math.round(value * 100) / 100}%`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Calculate growth indicator styling
  getGrowthColor(growth: number): 'success' | 'error' | 'default' {
    if (growth > 0) return 'success';
    if (growth < 0) return 'error';
    return 'default';
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return '↑';
    if (growth < 0) return '↓';
    return '→';
  }

  // Helper method to generate random colors for charts
  generateChartColors(count: number): string[] {
    const colors = [
      '#1976d2', // primary
      '#dc004e', // secondary
      '#388e3c', // success
      '#f57c00', // warning
      '#7b1fa2', // purple
      '#c62828', // red
      '#00796b', // teal
      '#5d4037', // brown
      '#455a64', // blue grey
      '#f06292', // pink
    ];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Export types and service
export default dashboardService;