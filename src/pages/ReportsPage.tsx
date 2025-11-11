import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as ReportsIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableChartIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, startOfMonth, endOfMonth, subMonths, subYears } from 'date-fns';
import { reportsService } from '../services/reportsService';
import {
  FinancialMetricsDto,
  FinancialRevenueBreakdownDto,
  ExpenseAnalysisDto,
  ProfitLossDto,
  RevenueCategoryDto,
  ExpenseCategoryBreakdownDto,
  RevenueTrendDto,
  ExpenseTrendDto,
  TopSellingProductDto,
  CustomerRevenueDto,
  FinancialKpiDto
} from '../services/reportsService';
import { useSnackbar } from '../context/SnackbarContext';

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));

  const [activeTab, setActiveTab] = useState(0);
  const [reportPeriod, setReportPeriod] = useState('monthly');

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsDto | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<FinancialRevenueBreakdownDto | null>(null);
  const [expenseAnalysis, setExpenseAnalysis] = useState<ExpenseAnalysisDto | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossDto | null>(null);

  // Load financial reports from backend API
  const loadFinancialReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (startDate) {
        const start = startDate.toISOString().split('T')[0];
        params.startDate = start;
        console.log('Start date:', start);
      }
      if (endDate) {
        const end = endDate.toISOString().split('T')[0];
        params.endDate = end;
        console.log('End date:', end);
      }

      // Load all financial data in parallel
      const [metricsResponse, pnlResponse, revenueResponse, expenseResponse] = await Promise.all([
        reportsService.getFinancialMetrics(params),
        reportsService.getProfitLossStatement(params),
        reportsService.getRevenueBreakdown(params),
        reportsService.getExpenseAnalysis(params)
      ]);

      console.log('API Responses:', {
        metricsResponse,
        pnlResponse,
        revenueResponse,
        expenseResponse
      });

      if (metricsResponse && metricsResponse.data) {
        console.log('Setting financial metrics:', metricsResponse.data);
        setFinancialMetrics(metricsResponse.data);
      }

      if (pnlResponse && pnlResponse.data) {
        console.log('Setting profit loss:', pnlResponse.data);
        setProfitLoss(pnlResponse.data);
      }

      if (revenueResponse && revenueResponse.data) {
        console.log('Setting revenue breakdown:', revenueResponse.data);
        setRevenueBreakdown(revenueResponse.data);
      }

      if (expenseResponse && expenseResponse.data) {
        console.log('Setting expense analysis:', expenseResponse.data);
        setExpenseAnalysis(expenseResponse.data);
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load financial reports';
      setError(errorMessage);
      console.error('Error loading financial reports:', err);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialReports();
  }, [startDate, endDate]);

  const handleStartDateChange = (newDate: Date | null) => {
    setStartDate(newDate);
  };

  const handleEndDateChange = (newDate: Date | null) => {
    setEndDate(newDate);
  };

  const handlePeriodChange = (event: any) => {
    setReportPeriod(event.target.value);
  };

  const handleExportPdf = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString().split('T')[0];
      if (endDate) params.endDate = endDate.toISOString().split('T')[0];

      console.log('Exporting PDF with params:', params);
      const pdfBlob = await reportsService.generateFinancialReportPdf(params);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar('Financial report exported successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export PDF';
      console.error('Error exporting PDF:', err);
      showSnackbar(errorMessage, 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return theme.palette.success.main;
    if (margin >= 20) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getTrendIcon = (current: number, previous: number) => {
    return current >= previous ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTrendColor = (current: number, previous: number) => {
    return current >= previous ? theme.palette.success.main : theme.palette.error.main;
  };

  // Predefined date range shortcuts
  const dateRanges = [
    {
      label: 'This Month',
      value: () => [startOfMonth(new Date()), endOfMonth(new Date())],
    },
    {
      label: 'Last Month',
      value: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
    },
    {
      label: 'Last 3 Months',
      value: () => [startOfMonth(subMonths(new Date(), 3)), endOfMonth(new Date())],
    },
    {
      label: 'Last 6 Months',
      value: () => [startOfMonth(subMonths(new Date(), 6)), endOfMonth(new Date())],
    },
    {
      label: 'This Year',
      value: () => [new Date(new Date().getFullYear(), 0, 1), new Date(new Date().getFullYear(), 11, 31)],
    },
    {
      label: 'Last Year',
      value: () => [subYears(new Date(), 1), new Date()],
    },
  ];

  const handleQuickDateRange = (getRange: () => [Date | null, Date | null]) => {
    const [start, end] = getRange();
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: theme.palette.background.default }}>
        <PageHeader
          title="Financial Reports"
          subtitle="Comprehensive financial analytics and reporting"
          icon={<ReportsIcon />}
        />

        {/* Date Range Selector */}
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {dateRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="outlined"
                      size="small"
                      onClick={() => handleQuickDateRange(range.value)}
                      sx={{ borderRadius: 1 }}
                    >
                      {range.label}
                    </Button>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={reportPeriod}
                      onChange={handlePeriodChange}
                      label="Period"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportPdf}
                    disabled={loading}
                    sx={{ borderRadius: 1 }}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Main Reports Content */}
        {!loading && (
          <>
            <Tabs
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab label="Dashboard" icon={<TableChartIcon />} />
              <Tab label="P&L Statement" icon={<BarChartIcon />} />
              <Tab label="Revenue Analysis" icon={<TrendingUpIcon />} />
              <Tab label="Expense Analysis" icon={<PieChartIcon />} />
            </Tabs>

            { activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Key Metrics Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" component="div" color="primary.main">
                      {financialMetrics ? financialMetrics.formattedTotalRevenue : '$0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Total Expenses
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main">
                      {financialMetrics ? financialMetrics.formattedTotalExpenses : '$0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Net Profit
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: getProfitMarginColor(financialMetrics?.netProfitMargin || 0) }}>
                      {financialMetrics ? financialMetrics.formattedNetProfit : '$0'}
                    </Typography>
                    <Chip
                      label={financialMetrics ? formatPercentage(financialMetrics.netProfitMargin * 100) : '0%'}
                      size="small"
                      sx={{
                        backgroundColor: getProfitMarginColor(financialMetrics?.netProfitMargin * 100 || 0),
                        color: 'white',
                        mt: 1,
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" component="div">
                      {financialMetrics ? formatPercentage(financialMetrics.netProfitMargin * 100) : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Overview
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="success.main">
                            {profitLoss ? profitLoss.formattedGrossProfit : '$0'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Gross Profit
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="info.main">
                            {profitLoss ? profitLoss.formattedOperatingIncome : '$0'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Operating Income
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* P&L Statement Tab */}
          {activeTab === 1 && profitLoss && (
            <Grid container spacing={3}>
              {/* P&L Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Profit & Loss Summary
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Total Revenue:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {profitLoss.formattedTotalRevenue}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Cost of Goods Sold:</Typography>
                        <Typography variant="body1" color="error.main">
                          ({profitLoss.costOfGoodsSold.toLocaleString()})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Gross Profit:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {profitLoss.formattedGrossProfit}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Operating Expenses:</Typography>
                        <Typography variant="body1" color="error.main">
                          ({profitLoss.totalOperatingExpenses.toLocaleString()})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Operating Income:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="info.main">
                          {profitLoss.formattedOperatingIncome}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Net Income:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {profitLoss.formattedNetIncome}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Metrics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Key Performance Metrics
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Gross Profit Margin:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.grossProfitMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Operating Margin:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.operatingMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Net Profit Margin:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.netProfitMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Average Order Value:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {profitLoss.formattedAverageOrderValue}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Sales Transactions:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {profitLoss.totalSalesTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Purchase Transactions:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {profitLoss.totalPurchaseTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Revenue Analysis Tab */}
          {activeTab === 2 && revenueBreakdown && (
            <Grid container spacing={3}>
              {/* Revenue Summary */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Revenue Summary
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Total Revenue:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {revenueBreakdown.formattedTotalRevenue}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Growth Rate:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {revenueBreakdown.formattedGrowthRate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Total Transactions:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {revenueBreakdown.totalTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Avg Transaction:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {revenueBreakdown.formattedAverageRevenuePerTransaction}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Revenue Categories */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Revenue by Category
                    </Typography>
                    <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
                      {revenueBreakdown.categoryBreakdown.map((category, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {category.categoryName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.transactionCount} transactions
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {category.formattedRevenue}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatPercentage(category.percentageOfTotal * 100)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Products */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Selling Products
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {revenueBreakdown.topProducts.slice(0, 5).map((product, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {product.productName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {product.quantitySold} units sold • {product.transactionCount} transactions
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {product.formattedRevenue}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              Profit: {product.formattedProfit} ({formatPercentage(product.profitMargin * 100)})
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Expense Analysis Tab */}
          {activeTab === 3 && expenseAnalysis && (
            <Grid container spacing={3}>
              {/* Expense Summary */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Expense Summary
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Total Expenses:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {expenseAnalysis.formattedTotalExpenses}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Growth Rate:</Typography>
                        <Typography variant="body1" fontWeight="bold" color={expenseAnalysis.growthRate > 0 ? 'error.main' : 'success.main'}>
                          {expenseAnalysis.formattedGrowthRate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Total Transactions:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {expenseAnalysis.totalTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Avg Transaction:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {expenseAnalysis.formattedAverageExpensePerTransaction}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Expense Categories */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Expenses by Category
                    </Typography>
                    <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
                      {expenseAnalysis.categoryBreakdown.map((category, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {category.categoryType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.transactionCount} transactions
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {category.formattedTotalAmount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatPercentage(category.percentageOfTotal * 100)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Budget Analysis */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Budget Analysis
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">Budget vs Actual:</Typography>
                        <Typography variant="h6" fontWeight="bold" color={expenseAnalysis.budgetVsActual > 0 ? 'error.main' : 'success.main'}>
                          {expenseAnalysis.formattedBudgetVsActual}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Budget Utilization:</Typography>
                        <Typography variant="body1" fontWeight="bold"
                          sx={{
                            color: expenseAnalysis.budgetUtilizationPercentage > 100 ? 'error.main' :
                                   expenseAnalysis.budgetUtilizationPercentage > 80 ? 'warning.main' : 'success.main'
                          }}>
                          {formatPercentage(expenseAnalysis.budgetUtilizationPercentage * 100)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
            </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsPage;
