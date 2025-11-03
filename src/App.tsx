import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#42a5f5',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={3}
          textAlign="center"
        >
          <Typography variant="h4" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We encountered an unexpected error. Please try refreshing the page.
          </Typography>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          {import.meta.env.DEV && (
            <Box mt={2}>
              <Typography variant="body2" component="pre" textAlign="left">
                {this.state.error?.stack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProductsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SalesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Box p={3}>
                        <Typography variant="h4">Categories Page</Typography>
                        <Typography variant="body1" color="text.secondary">
                          Categories management will be implemented here.
                        </Typography>
                      </Box>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Box p={3}>
                        <Typography variant="h4">Customers Page</Typography>
                        <Typography variant="body1" color="text.secondary">
                          Customer management will be implemented here.
                        </Typography>
                      </Box>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Box p={3}>
                        <Typography variant="h4">Reports Page</Typography>
                        <Typography variant="body1" color="text.secondary">
                          Reports and analytics will be implemented here.
                        </Typography>
                      </Box>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Box p={3}>
                        <Typography variant="h4">Settings Page</Typography>
                        <Typography variant="body1" color="text.secondary">
                          Application settings will be implemented here.
                        </Typography>
                      </Box>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="*"
                element={
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="100vh"
                    p={3}
                    textAlign="center"
                  >
                    <Typography variant="h4" gutterBottom>
                      Page Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      The page you're looking for doesn't exist.
                    </Typography>
                    <button onClick={() => window.history.back()}>
                      Go Back
                    </button>
                  </Box>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
