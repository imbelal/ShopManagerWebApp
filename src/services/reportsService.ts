import apiClient, { ApiResponse } from './apiClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for Financial Reports - matching backend DTOs
export interface ExpenseCategoryDto {
  category: string;
  amount: number;
  transactionCount: number;
  percentageOfTotal: number;
  budgetAmount: number;
  variance: number;
  variancePercentage: number;
  formattedAmount: string;
  formattedBudgetAmount: string;
  formattedVariance: string;
}

export interface RevenueCategoryDto {
  categoryId: string;
  categoryName: string;
  revenue: number;
  transactionCount: number;
  percentageOfTotal: number;
  averageTransactionValue: number;
  growthRate: number;
  formattedRevenue: string;
  formattedAverageTransactionValue: string;
  formattedGrowthRate: string;
}

export interface RevenueTrendDto {
  period: string;
  revenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  growthRate: number;
  formattedPeriod: string;
  formattedRevenue: string;
  formattedAverageTransactionValue: string;
  formattedGrowthRate: string;
}

export interface TopSellingProductDto {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  transactionCount: number;
  averageUnitPrice: number;
  formattedRevenue: string;
  formattedProfit: string;
  formattedAverageUnitPrice: string;
}

export interface CustomerRevenueDto {
  customerId: string;
  customerName: string;
  phone: string;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  firstTransactionDate: string;
  lastTransactionDate: string;
  customerType: string;
  formattedTotalRevenue: string;
  formattedAverageTransactionValue: string;
  formattedFirstTransactionDate: string;
  formattedLastTransactionDate: string;
}

export interface ExpenseCategoryBreakdownDto {
  categoryType: string;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
  averageTransactionAmount: number;
  budgetAmount: number;
  variance: number;
  variancePercentage: number;
  formattedTotalAmount: string;
  formattedAverageTransactionAmount: string;
  formattedBudgetAmount: string;
  formattedVariance: string;
}

export interface ExpenseTrendDto {
  period: string;
  totalAmount: number;
  transactionCount: number;
  averageTransactionAmount: number;
  growthRate: number;
  formattedPeriod: string;
  formattedTotalAmount: string;
  formattedAverageTransactionAmount: string;
  formattedGrowthRate: string;
}

export interface ExpenseByVendorDto {
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  transactionCount: number;
  averageTransactionAmount: number;
  categoryType: string;
  percentageOfTotal: number;
  formattedTotalAmount: string;
  formattedAverageTransactionAmount: string;
}

export interface FinancialKpiDto {
  name: string;
  value: number;
  target: number;
  variance: number;
  variancePercentage: number;
  status: string; // "Good", "Warning", "Critical"
  unit: string;
  formattedValue: string;
  formattedTarget: string;
  formattedVariance: string;
}

export interface FinancialRatioDto {
  name: string;
  category: string; // "Liquidity", "Profitability", "Efficiency", "Solvency"
  value: number;
  industryAverage: number;
  variance: number;
  interpretation: string;
  unit: string;
  formattedValue: string;
  formattedIndustryAverage: string;
}

// Main DTOs matching backend
export interface FinancialMetricsDto {
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingMargin: number;
  currentRatio: number;
  quickRatio: number;
  inventoryTurnover: number;
  accountsReceivableTurnover: number;
  returnOnAssets: number;
  returnOnEquity: number;
  debtToEquityRatio: number;
  earningsPerShare: number;
  priceToEarningsRatio: number;
  workingCapital: number;
  cashFlowFromOperations: number;
  keyPerformanceIndicators: FinancialKpiDto[];
  financialRatios: FinancialRatioDto[];
  formattedTotalRevenue: string;
  formattedTotalExpenses: string;
  formattedNetProfit: string;
  formattedWorkingCapital: string;
  formattedCashFlowFromOperations: string;
}

export interface ProfitLossDto {
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: ExpenseCategoryDto[];
  totalOperatingExpenses: number;
  operatingIncome: number;
  operatingMargin: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  netProfitMargin: number;
  totalSalesTransactions: number;
  totalPurchaseTransactions: number;
  averageOrderValue: number;
  formattedTotalRevenue: string;
  formattedGrossProfit: string;
  formattedOperatingIncome: string;
  formattedNetIncome: string;
  formattedAverageOrderValue: string;
}

export interface FinancialRevenueBreakdownDto {
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  categoryBreakdown: RevenueCategoryDto[];
  monthlyTrends: RevenueTrendDto[];
  topProducts: TopSellingProductDto[];
  customerBreakdown: CustomerRevenueDto[];
  previousPeriodRevenue: number;
  growthRate: number;
  averageRevenuePerTransaction: number;
  totalTransactions: number;
  formattedTotalRevenue: string;
  formattedGrowthRate: string;
  formattedAverageRevenuePerTransaction: string;
}

export interface ExpenseAnalysisDto {
  periodStart: string;
  periodEnd: string;
  totalExpenses: number;
  categoryBreakdown: ExpenseCategoryBreakdownDto[];
  monthlyTrends: ExpenseTrendDto[];
  vendorBreakdown: ExpenseByVendorDto[];
  previousPeriodExpenses: number;
  growthRate: number;
  averageExpensePerTransaction: number;
  totalTransactions: number;
  budgetVsActual: number;
  budgetUtilizationPercentage: number;
  formattedTotalExpenses: string;
  formattedGrowthRate: string;
  formattedAverageExpensePerTransaction: string;
  formattedBudgetVsActual: string;
}

export interface FinancialReportParams {
  startDate?: string;
  endDate?: string;
}

class ReportsService {
  /**
   * Get financial metrics for the specified period
   */
  async getFinancialMetrics(params?: FinancialReportParams): Promise<ApiResponse<FinancialMetricsDto>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      queryParams.append('includeKPIs', 'true');
      queryParams.append('includeRatios', 'true');
      queryParams.append('includeCashFlow', 'true');
      queryParams.append('currency', 'USD');

      const response = await apiClient.get(`/reports/financial/metrics?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      throw error;
    }
  }

  /**
   * Get profit & loss statement for the specified period
   */
  async getProfitLossStatement(params?: FinancialReportParams): Promise<ApiResponse<ProfitLossDto>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      queryParams.append('groupBy', 'month');
      queryParams.append('includeComparisons', 'true');
      queryParams.append('currency', 'USD');

      const response = await apiClient.get(`/reports/financial/profit-loss?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching P&L statement:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueBreakdown(params?: FinancialReportParams): Promise<ApiResponse<FinancialRevenueBreakdownDto>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      queryParams.append('groupBy', 'month');
      queryParams.append('includeTopProducts', 'true');
      queryParams.append('includeCustomerBreakdown', 'true');
      queryParams.append('topProductsCount', '10');
      queryParams.append('topCustomersCount', '10');
      queryParams.append('currency', 'USD');

      const response = await apiClient.get(`/reports/financial/revenue-breakdown?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      throw error;
    }
  }

  /**
   * Get expense analysis by category
   */
  async getExpenseAnalysis(params?: FinancialReportParams): Promise<ApiResponse<ExpenseAnalysisDto>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      queryParams.append('groupBy', 'month');
      queryParams.append('includeVendorBreakdown', 'true');
      queryParams.append('includeBudgetComparison', 'true');
      queryParams.append('topVendorsCount', '10');
      queryParams.append('currency', 'USD');

      const response = await apiClient.get(`/reports/financial/expense-analysis?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense analysis:', error);
      throw error;
    }
  }

  /**
   * Generate financial report PDF
   */
  async generateFinancialReportPdf(params: FinancialReportParams): Promise<Blob> {
    try {
      // Get all financial data for the report
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      queryParams.append('currency', 'USD');

      // Fetch all data needed for the report
      const [metricsResponse, pnlResponse, revenueResponse, expenseResponse] = await Promise.all([
        apiClient.get(`/reports/financial/metrics?${queryParams.toString()}`),
        apiClient.get(`/reports/financial/profit-loss?${queryParams.toString()}`),
        apiClient.get(`/reports/financial/revenue-breakdown?${queryParams.toString()}`),
        apiClient.get(`/reports/financial/expense-analysis?${queryParams.toString()}`)
      ]);

      const reportData = {
        metrics: metricsResponse.data?.data,
        profitLoss: pnlResponse.data?.data,
        revenue: revenueResponse.data?.data,
        expenses: expenseResponse.data?.data,
        period: {
          start: params?.startDate || 'N/A',
          end: params?.endDate || 'N/A'
        }
      };

      const pdfBlob = this.generatePdfReport(reportData);
      return pdfBlob;
    } catch (error) {
      console.error('Error generating financial report PDF:', error);
      throw error;
    }
  }

  private generatePdfReport(data: any): Blob {
    const doc = new jsPDF();

    // Set font sizes and styles
    doc.setFontSize(20);
    doc.text('Financial Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Period: ${data.period.start} to ${data.period.end}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 37);

    let yPosition = 50;

    // Profit & Loss Summary
    if (data.profitLoss) {
      doc.setFontSize(16);
      doc.text('Profit & Loss Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      const pnlData = [
        ['Metric', 'Amount'],
        ['Total Revenue', data.profitLoss.formattedTotalRevenue || 'N/A'],
        ['Cost of Goods Sold', data.profitLoss.costOfGoodsSold?.toLocaleString() || 'N/A'],
        ['Gross Profit', data.profitLoss.formattedGrossProfit || 'N/A'],
        ['Operating Income', data.profitLoss.formattedOperatingIncome || 'N/A'],
        ['Net Income', data.profitLoss.formattedNetIncome || 'N/A'],
      ];

      (doc as any).autoTable({
        head: [pnlData[0]],
        body: pnlData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Financial Metrics
    if (data.metrics) {
      doc.setFontSize(16);
      doc.text('Financial Metrics', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      const metricsData = [
        ['Metric', 'Amount'],
        ['Total Revenue', data.metrics.formattedTotalRevenue || 'N/A'],
        ['Total Expenses', data.metrics.formattedTotalExpenses || 'N/A'],
        ['Net Profit', data.metrics.formattedNetProfit || 'N/A'],
        ['Net Profit Margin', `${((data.metrics.netProfitMargin || 0) * 100).toFixed(1)}%`],
        ['Working Capital', data.metrics.formattedWorkingCapital || 'N/A'],
      ];

      (doc as any).autoTable({
        head: [metricsData[0]],
        body: metricsData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [92, 184, 92] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Revenue Breakdown (Top 5 categories)
    if (data.revenue?.categoryBreakdown) {
      doc.setFontSize(16);
      doc.text('Revenue by Category (Top 5)', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      const revenueData = [
        ['Category', 'Revenue', 'Transactions', '% of Total'],
        ...data.revenue.categoryBreakdown.slice(0, 5).map((cat: any) => [
          cat.categoryName,
          cat.formattedRevenue,
          cat.transactionCount.toString(),
          `${(cat.percentageOfTotal * 100).toFixed(1)}%`
        ])
      ];

      (doc as any).autoTable({
        head: [revenueData[0]],
        body: revenueData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [91, 192, 222] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expense Breakdown (Top 5 categories)
    if (data.expenses?.categoryBreakdown) {
      doc.setFontSize(16);
      doc.text('Expenses by Category (Top 5)', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      const expenseData = [
        ['Category', 'Amount', 'Transactions', '% of Total'],
        ...data.expenses.categoryBreakdown.slice(0, 5).map((cat: any) => [
          cat.categoryType,
          cat.formattedTotalAmount,
          cat.transactionCount.toString(),
          `${(cat.percentageOfTotal * 100).toFixed(1)}%`
        ])
      ];

      (doc as any).autoTable({
        head: [expenseData[0]],
        body: expenseData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [240, 173, 78] }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (doc as any).setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} - Generated by Shop Manager`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }
}

export const reportsService = new ReportsService();