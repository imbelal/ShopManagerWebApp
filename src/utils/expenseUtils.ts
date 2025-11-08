import { ExpenseType, ExpenseStatus, PaymentMethod } from '../services/expensesService';

export interface Option {
  value: string | number;
  label: string;
}

export const getExpenseTypeOptions = (): Option[] => [
  { value: ExpenseType.Rent, label: 'Rent' },
  { value: ExpenseType.Salary, label: 'Salary' },
  { value: ExpenseType.Utilities, label: 'Utilities' },
  { value: ExpenseType.Food, label: 'Food & Beverages' },
  { value: ExpenseType.Transportation, label: 'Transportation' },
  { value: ExpenseType.OfficeSupplies, label: 'Office Supplies' },
  { value: ExpenseType.Marketing, label: 'Marketing & Advertising' },
  { value: ExpenseType.Insurance, label: 'Insurance' },
  { value: ExpenseType.Taxes, label: 'Taxes' },
  { value: ExpenseType.Maintenance, label: 'Maintenance & Repairs' },
  { value: ExpenseType.Software, label: 'Software & Subscriptions' },
  { value: ExpenseType.Training, label: 'Training & Education' },
  { value: ExpenseType.Entertainment, label: 'Entertainment' },
  { value: ExpenseType.Travel, label: 'Travel & Accommodation' },
  { value: ExpenseType.Equipment, label: 'Equipment & Tools' },
  { value: ExpenseType.Legal, label: 'Legal & Professional' },
  { value: ExpenseType.BankFees, label: 'Bank Fees & Charges' },
  { value: ExpenseType.Other, label: 'Other Expenses' },
  { value: ExpenseType.Inventory, label: 'Inventory & Supplies' },
  { value: ExpenseType.Depreciation, label: 'Depreciation' }
];

export const getStatusOptions = (): Option[] => [
  { value: ExpenseStatus.Pending, label: 'Pending' },
  { value: ExpenseStatus.Approved, label: 'Approved' },
  { value: ExpenseStatus.Rejected, label: 'Rejected' },
  { value: ExpenseStatus.Paid, label: 'Paid' }
];

export const getPaymentMethodOptions = (): Option[] => [
  { value: PaymentMethod.Cash, label: 'Cash' },
  { value: PaymentMethod.BankTransfer, label: 'Bank Transfer' },
  { value: PaymentMethod.CreditCard, label: 'Credit Card' },
  { value: PaymentMethod.DebitCard, label: 'Debit Card' },
  { value: PaymentMethod.Check, label: 'Check' },
  { value: PaymentMethod.MobilePayment, label: 'Mobile Payment' },
  { value: PaymentMethod.OnlinePayment, label: 'Online Payment' },
  { value: PaymentMethod.Other, label: 'Other' }
];

export const getExpenseTypeLabel = (type: ExpenseType): string => {
  const option = getExpenseTypeOptions().find(opt => opt.value === type);
  return option?.label || 'Unknown';
};

export const getStatusLabel = (status: ExpenseStatus): string => {
  const option = getStatusOptions().find(opt => opt.value === status);
  return option?.label || 'Unknown';
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const option = getPaymentMethodOptions().find(opt => opt.value === method);
  return option?.label || 'Unknown';
};