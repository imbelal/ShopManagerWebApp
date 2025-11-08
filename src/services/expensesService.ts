import apiClient, { handleApiError } from './apiClient';

// Enums matching the backend
export const ExpenseType = {
  Rent: 1,
  Salary: 2,
  Utilities: 3,
  Food: 4,
  Maintenance: 5,
  Supplies: 6,
  Transportation: 7,
  Marketing: 8,
  Insurance: 9,
  Taxes: 10,
  Legal: 11,
  Training: 12,
  Entertainment: 13,
  Communication: 14,
  Software: 15,
  Equipment: 16,
  Cleaning: 17,
  Security: 18,
  BankCharges: 19,
  Other: 20
} as const;

export const ExpenseStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
  Paid: 4
} as const;

export const PaymentMethod = {
  Cash: 1,
  BankTransfer: 2,
  Mobile: 3,
  CreditCard: 4,
  DebitCard: 5,
  Check: 6,
  Online: 7,
  Other: 8
} as const;

// Types
export type ExpenseType = typeof ExpenseType[keyof typeof ExpenseType];
export type ExpenseStatus = typeof ExpenseStatus[keyof typeof ExpenseStatus];
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  remarks: string;
  expenseDate: string;
  expenseType: number;
  expenseTypeName: string;
  status: number;
  statusName: string;
  paymentMethod: number;
  paymentMethodName: string;
  receiptNumber?: string;
  paidDate?: string;
  approvedByUserName?: string;
  approvedDate?: string;
  createdDate: string;
  createdByUserName: string;
}

export interface CreateExpenseRequest {
  title: string;
  description: string;
  amount: number;
  remarks: string;
  expenseDate: string;
  expenseType: number;
  paymentMethod: number;
  receiptNumber?: string;
}

export interface UpdateExpenseRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  remarks: string;
  expenseDate: string;
  expenseType: number;
  paymentMethod: number;
  receiptNumber?: string;
}

export interface ExpensesFilter {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  expenseType?: number;
  status?: number;
  paymentMethod?: number;
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedExpenses {
  items: Expense[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Helper functions for enum names
export const getExpenseTypeName = (type: number): string => {
  const entries = Object.entries(ExpenseType);
  const entry = entries.find(([_, value]) => value === type);
  return entry ? entry[0] : 'Unknown';
};

export const getStatusName = (status: number): string => {
  const entries = Object.entries(ExpenseStatus);
  const entry = entries.find(([_, value]) => value === status);
  return entry ? entry[0] : 'Unknown';
};

export const getPaymentMethodName = (method: number): string => {
  const entries = Object.entries(PaymentMethod);
  const entry = entries.find(([_, value]) => value === method);
  return entry ? entry[0] : 'Unknown';
};

export const getExpenseTypeOptions = () => {
  return Object.entries(ExpenseType).map(([key, value]) => ({
    value: value,
    label: key
  }));
};

export const getStatusOptions = () => {
  return Object.entries(ExpenseStatus).map(([key, value]) => ({
    value: value,
    label: key
  }));
};

export const getPaymentMethodOptions = () => {
  return Object.entries(PaymentMethod).map(([key, value]) => ({
    value: value,
    label: key
  }));
};

// Service
class ExpensesService {
  private baseUrl = '/expenses';

  // Get all expenses with filtering and pagination
  async getExpenses(filter: ExpensesFilter): Promise<PaginatedExpenses> {
    const params = new URLSearchParams();

    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    if (filter.expenseType !== undefined) params.append('expenseType', filter.expenseType.toString());
    if (filter.status !== undefined) params.append('status', filter.status.toString());
    if (filter.paymentMethod !== undefined) params.append('paymentMethod', filter.paymentMethod.toString());

    params.append('pageNumber', filter.pageNumber.toString());
    params.append('pageSize', filter.pageSize.toString());

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  // Get expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    const response = await apiClient.get(`${this.baseUrl}/GetById/${id}`);
    return response.data;
  }

  // Create new expense
  async createExpense(expense: CreateExpenseRequest): Promise<Expense> {
    const response = await apiClient.post(this.baseUrl, expense);
    return response.data;
  }

  // Update existing expense
  async updateExpense(expense: UpdateExpenseRequest): Promise<Expense> {
    const response = await apiClient.put(this.baseUrl, expense);
    return response.data;
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    await apiClient.delete(this.baseUrl, { params: { id } });
  }

  // Approve expense
  async approveExpense(id: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/approve`, { id });
  }

  // Reject expense
  async rejectExpense(id: string, rejectionReason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/reject`, { id, rejectionReason });
  }

  // Mark expense as paid
  async markExpenseAsPaid(id: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/markaspaid`, { id });
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Get status color for UI
  getStatusColor(status: number): string {
    switch (status) {
      case ExpenseStatus.Pending:
        return 'warning';
      case ExpenseStatus.Approved:
        return 'info';
      case ExpenseStatus.Paid:
        return 'success';
      case ExpenseStatus.Rejected:
        return 'error';
      default:
        return 'default';
    }
  }

  // Check if expense can be edited
  canEditExpense(status: number): boolean {
    return status === ExpenseStatus.Pending || status === ExpenseStatus.Rejected;
  }

  // Check if expense can be approved
  canApproveExpense(status: number): boolean {
    return status === ExpenseStatus.Pending;
  }

  // Check if expense can be rejected
  canRejectExpense(status: number): boolean {
    return status === ExpenseStatus.Pending;
  }

  // Check if expense can be marked as paid
  canMarkAsPaid(status: number): boolean {
    return status === ExpenseStatus.Approved;
  }

  // Generate PDF for expenses within date range
  async generateExpensesPdf(startDate?: string, endDate?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`${this.baseUrl}/pdf${params.toString() ? '?' + params.toString() : ''}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with date range
      const today = new Date().toISOString().split('T')[0];
      const startFileName = startDate ? startDate.split('T')[0] : 'all';
      const endFileName = endDate ? endDate.split('T')[0] : 'all';
      link.download = `Expenses_${startFileName}_to_${endFileName}_${today}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }
}

export const expensesService = new ExpensesService();
export default expensesService;