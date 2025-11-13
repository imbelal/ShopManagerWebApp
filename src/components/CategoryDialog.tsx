import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { productService } from '../services/productService';

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated: (categoryId: string, categoryName: string) => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onClose,
  onCategoryCreated
}) => {
  const { t } = useTranslation();
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError(t('products.categoryDialog.categoryNameRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await productService.createCategory(categoryName.trim());

      if (response.data.succeeded && response.data.data) {
        const newCategoryId = response.data.data;
        onCategoryCreated(newCategoryId, categoryName.trim());
        handleClose();
      } else {
        setError(response.data.message || t('products.categoryDialog.failedToCreateCategory'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('products.categoryDialog.failedToCreateCategory'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 1 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">{t('products.categoryDialog.addNewCategory')}</Typography>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label={t('products.categoryDialog.name')}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={loading}
            placeholder={t('products.categoryDialog.name')}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            inputProps={{ maxLength: 100 }}
            helperText={`${categoryName.length}/100 ${t('common.characters')}`}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ borderRadius: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !categoryName.trim()}
            sx={{ borderRadius: 1 }}
          >
            {loading ? <CircularProgress size={20} /> : t('products.categoryDialog.createCategory')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryDialog;