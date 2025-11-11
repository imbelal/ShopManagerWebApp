import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertProps } from '@mui/material';

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertProps['severity']>('info');

  const showSnackbar = useCallback((newMessage: string, newSeverity: AlertProps['severity'] = 'info') => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const value = {
    showSnackbar,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};