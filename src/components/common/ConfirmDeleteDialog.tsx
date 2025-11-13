import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: string;
  loading?: boolean;
  warning?: string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  entityName,
  entityType,
  loading = false,
  warning
}) => {
  const { t } = useTranslation();

  // Function to get translated entity type
  const getTranslatedEntityType = (type: string): string => {
    const lowerCaseType = type.toLowerCase();
    return t(`entityTypes.${lowerCaseType}`) || type;
  };

  const translatedEntityType = getTranslatedEntityType(entityType);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {t('confirmDeleteDialog.title', { entityType: translatedEntityType })}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" gutterBottom>
            {t('confirmDeleteDialog.message', { entityType: translatedEntityType })}
          </Typography>
          <Typography variant="body2" color="error.main" fontWeight={500}>
            <strong>{entityName}</strong>
          </Typography>
          {warning && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>{t('confirmDeleteDialog.warning')}</strong> {warning}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('confirmDeleteDialog.cannotUndo')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('confirmDeleteDialog.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? t('confirmDeleteDialog.deleting') : t('confirmDeleteDialog.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;