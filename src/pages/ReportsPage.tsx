import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../components/common/CurrencyDisplay';
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
  const { t } = useTranslation();
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
      const errorMessage = err.response?.data?.message || err.message || t('reports.error.failedToLoad');
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
      label: t('reports.dateRange.thisMonth'),
      value: () => [startOfMonth(new Date()), endOfMonth(new Date())],
    },
    {
      label: t('reports.dateRange.lastMonth'),
      value: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
    },
    {
      label: t('reports.dateRange.last3Months'),
      value: () => [startOfMonth(subMonths(new Date(), 3)), endOfMonth(new Date())],
    },
    {
      label: t('reports.dateRange.last6Months'),
      value: () => [startOfMonth(subMonths(new Date(), 6)), endOfMonth(new Date())],
    },
    {
      label: t('reports.dateRange.thisYear'),
      value: () => [new Date(new Date().getFullYear(), 0, 1), new Date(new Date().getFullYear(), 11, 31)],
    },
    {
      label: t('reports.dateRange.lastYear'),
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
          title={t('reports.title')}
          subtitle={t('reports.subtitle')}
          icon={<ReportsIcon />}
        />

        {/* Date Range Selector */}
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label={t('reports.dateRange.startDate')}
                    value={startDate}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label={t('reports.dateRange.endDate')}
                    value={endDate}
                    onChange={handleEndDateChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
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

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>{t('reports.dateRange.period')}</InputLabel>
                    <Select
                      value={reportPeriod}
                      onChange={handlePeriodChange}
                      label={t('reports.dateRange.period')}
                    >
                      <MenuItem value="daily">{t('reports.dateRange.daily')}</MenuItem>
                      <MenuItem value="weekly">{t('reports.dateRange.weekly')}</MenuItem>
                      <MenuItem value="monthly">{t('reports.dateRange.monthly')}</MenuItem>
                      <MenuItem value="quarterly">{t('reports.dateRange.quarterly')}</MenuItem>
                      <MenuItem value="yearly">{t('reports.dateRange.yearly')}</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportPdf}
                    disabled={loading}
                    sx={{ borderRadius: 1 }}
                  >
                    {t('reports.actions.exportPdf')}
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
              <Tab label={t('reports.tabs.dashboard')} icon={<TableChartIcon />} />
              <Tab label={t('reports.tabs.profitLossStatement')} icon={<BarChartIcon />} />
              <Tab label={t('reports.tabs.revenueAnalysis')} icon={<TrendingUpIcon />} />
              <Tab label={t('reports.tabs.expenseAnalysis')} icon={<PieChartIcon />} />
            </Tabs>

            { activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Key Metrics Cards */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('reports.metrics.totalRevenue')}
                    </Typography>
                    <Typography variant="h4" component="div" color="primary.main">
                      {financialMetrics ? formatCurrency(financialMetrics.totalRevenue) : formatCurrency(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('reports.metrics.totalExpenses')}
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main">
                      {financialMetrics ? formatCurrency(financialMetrics.totalExpenses) : formatCurrency(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('reports.metrics.netProfit')}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: getProfitMarginColor(financialMetrics?.netProfitMargin || 0) }}>
                      {financialMetrics ? formatCurrency(financialMetrics.netProfit) : formatCurrency(0)}
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

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('reports.labels.profitMargin')}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {financialMetrics ? formatPercentage(financialMetrics.netProfitMargin * 100) : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.performanceOverview')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="success.main">
                            {profitLoss ? formatCurrency(profitLoss.grossProfit) : formatCurrency(0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('reports.labels.grossProfit')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="info.main">
                            {profitLoss ? formatCurrency(profitLoss.operatingIncome) : formatCurrency(0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('reports.metrics.operatingIncome')}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.profitLossSummary')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.statements.totalRevenue')}</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(profitLoss.totalRevenue)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.costOfGoodsSold')}:</Typography>
                        <Typography variant="body1" color="error.main">
                          ({profitLoss.costOfGoodsSold.toLocaleString()})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.grossProfit')}:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {formatCurrency(profitLoss.grossProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.operatingExpenses')}:</Typography>
                        <Typography variant="body1" color="error.main">
                          ({profitLoss.totalOperatingExpenses.toLocaleString()})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.statements.operatingIncome')}:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="info.main">
                          {formatCurrency(profitLoss.operatingIncome)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.netIncome')}:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(profitLoss.netIncome)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Metrics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.keyPerformanceMetrics')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.grossProfitMargin')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.grossProfitMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.operatingMargin')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.operatingMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.statements.netProfitMargin')}</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPercentage(profitLoss.netProfitMargin * 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.averageOrderValue')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(profitLoss.averageOrderValue)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.salesTransactions')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {profitLoss.totalSalesTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{t('reports.labels.purchaseTransactions')}:</Typography>
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
              <Grid size={{ xs: 12, md: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.revenueSummary')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.statements.totalRevenue')}</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {formatCurrency(revenueBreakdown.totalRevenue)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.growthRate')}:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {revenueBreakdown.formattedGrowthRate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.totalTransactions')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {revenueBreakdown.totalTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{t('reports.labels.avgTransaction')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(revenueBreakdown.averageRevenuePerTransaction || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Revenue Categories */}
              <Grid size={{ xs: 12, md: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.revenueByCategory')}
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
                              {formatCurrency(category.revenue)}
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
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.topSellingProducts')}
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
                              {formatCurrency(product.revenue)}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              {t('reports.labels.profit')}: {formatCurrency(product.profit)} ({formatPercentage(product.profitMargin * 100)})
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.expenseSummary')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.statements.totalExpenses')}</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(expenseAnalysis.totalExpenses)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.growthRate')}:</Typography>
                        <Typography variant="body1" fontWeight="bold" color={expenseAnalysis.growthRate > 0 ? 'error.main' : 'success.main'}>
                          {expenseAnalysis.formattedGrowthRate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.totalTransactions')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {expenseAnalysis.totalTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{t('reports.labels.avgTransaction')}:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(expenseAnalysis.averageExpensePerTransaction || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Expense Categories */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.expensesByCategory')}
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
                              {formatCurrency(category.totalAmount)}
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
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.labels.budgetAnalysis')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">{t('reports.labels.budgetVsActual')}:</Typography>
                        <Typography variant="h6" fontWeight="bold" color={expenseAnalysis.budgetVsActual > 0 ? 'error.main' : 'success.main'}>
                          {formatCurrency(expenseAnalysis.budgetVsActual)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{t('reports.labels.budgetUtilization')}:</Typography>
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
