import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { productService, Product, Category, Tag, CreateProductRequest, UpdateProductRequest, ProductPhoto } from '../services/productService';
import CategoryDialog from './CategoryDialog';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editProduct?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  onSave,
  editProduct
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ProductPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    size: '',
    color: '',
    categoryId: '',
    unit: 0, // Default to number instead of empty string
    sellingPrice: '',
    tagIds: [] as string[]
  });

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      size: '',
      color: '',
      categoryId: '',
      unit: 0, // Default to number instead of empty string
      sellingPrice: '',
      tagIds: []
    });
    setPreviewImages([]);
    setImageFiles([]);
    setExistingPhotos([]);
    setPhotosToDelete([]);
    setFormErrors({});
    setError(null);
  };

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesResponse = await productService.getCategories();

        if (categoriesResponse.data.succeeded && categoriesResponse.data.data) {
          setCategories(categoriesResponse.data.data);
        } else {
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      setFormData({
        title: editProduct.title,
        description: editProduct.description,
        size: editProduct.size,
        color: editProduct.color,
        categoryId: editProduct.categoryId,
        unit: editProduct.unit,
        sellingPrice: editProduct.sellingPrice.toString(),
        tagIds: editProduct.productTags || []
      });

      // Load existing product photos
      if (editProduct.productPhotos && editProduct.productPhotos.length > 0) {
        setExistingPhotos(editProduct.productPhotos);
        // Don't add existing photos to previewImages - only show them in existingPhotos section
        setPreviewImages([]); // Only new uploads should go here
      } else {
        setExistingPhotos([]);
        setPreviewImages([]);
      }
    } else {
      resetForm();
    }
  }, [editProduct, open]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('products.validation.productTitleRequired');
    }

    if (!formData.description.trim()) {
      errors.description = t('products.validation.descriptionRequired');
    }

    if (!formData.categoryId) {
      errors.categoryId = t('products.validation.categoryRequired');
    }

    if (!formData.unit || formData.unit === 0) {
      errors.unit = t('products.validation.unitRequired');
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      errors.sellingPrice = t('products.validation.sellingPricePositive');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const newImages: string[] = [];

    // Store the actual files
    setImageFiles(prev => [...prev, ...fileArray]);

    // Create preview images
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === fileArray.length) {
            setPreviewImages(prev => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove preview image
  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing photo
  const removeExistingPhoto = (photoId: string) => {
    setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    setPhotosToDelete(prev => [...prev, photoId]);
  };

  // Handle category creation
  const handleCategoryCreated = async (categoryId: string, categoryName: string) => {
    // Add the new category to the categories list
    const newCategory: Category = {
      id: categoryId,
      title: categoryName
    };
    setCategories(prev => [...prev, newCategory]);

    // Set the newly created category as selected
    setFormData(prev => ({ ...prev, categoryId: categoryId }));

    setCategoryDialogOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (editProduct) {
        // Update existing product
        const updateData: UpdateProductRequest = {
          productId: editProduct.id,
          title: formData.title,
          description: formData.description,
          size: formData.size,
          color: formData.color,
          categoryId: formData.categoryId,
          unit: formData.unit, // Already a number
          sellingPrice: parseFloat(formData.sellingPrice)
        };

        response = await productService.updateProduct(updateData);
      } else {
        // Create new product
        const createData: CreateProductRequest = {
          title: formData.title,
          description: formData.description,
          size: formData.size,
          color: formData.color,
          categoryId: formData.categoryId,
          unit: formData.unit, // Already a number
          sellingPrice: parseFloat(formData.sellingPrice),
          tagIds: formData.tagIds
        };

        response = await productService.createProduct(createData);
      }

      if (response.data.succeeded) {
        const productId = editProduct?.id || response.data.data;

        // Delete marked photos first
        if (photosToDelete.length > 0) {
          try {
            for (const photoId of photosToDelete) {
              await productService.deleteProductPhoto(productId, photoId);
            }
          } catch (deleteError: any) {
            console.error('Photo deletion failed:', deleteError);
            // Continue with upload even if deletion fails
          }
        }

        // Upload images if any
        if (imageFiles.length > 0) {
          try {
            for (let i = 0; i < imageFiles.length; i++) {
              const file = imageFiles[i];
              // First image (index 0) should be primary, others should be secondary
              const isPrimary = i === 0;
              await productService.uploadProductPhoto(productId, file, isPrimary, i);
            }
          } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            // Don't fail the entire operation if image upload fails, just log the error
            setError(t('products.productSavedButImageUploadFailed') + ': ' + (uploadError.message || 'Unknown error'));
          }
        }

        onSave(editProduct || { ...response.data.data, id: productId } as Product);
        onClose();
        resetForm();
      } else {
        throw new Error(response.data.message || t('products.failedToSaveProduct'));
      }
    } catch (err: any) {
      setError(err.message || t('products.failedToSaveProduct'));
    } finally {
      setLoading(false);
    }
  };

  // Get unit name from ProductUnit enum value
  const getUnitName = (unitValue: number) => {
    const unitMap: { [key: number]: string } = {
      0: t('products.units.box'),
      1: t('products.units.piece'),
      2: t('products.units.squareFeet'),
      3: t('products.units.kilogram'),
      4: t('products.units.gram'),
      5: t('products.units.liter'),
      6: t('products.units.milliliter'),
      7: t('products.units.meter'),
      8: t('products.units.centimeter'),
      9: t('products.units.inch'),
      10: t('products.units.yard'),
      11: t('products.units.ton'),
      12: t('products.units.pack'),
      13: t('products.units.dozen'),
      14: t('products.units.pair'),
      15: t('products.units.roll'),
      16: t('products.units.bundle'),
      17: t('products.units.carton'),
      18: t('products.units.bag'),
      19: t('products.units.set'),
      20: t('products.units.barrel'),
      21: t('products.units.gallon'),
      22: t('products.units.can'),
      23: t('products.units.tube'),
      24: t('products.units.packet'),
      25: t('products.units.unit')
    };

    return unitMap[unitValue] || t('products.units.unit');
  };

  // Common units for products - using the enum values that match backend
  const commonUnits = [
    { value: 0, label: t('products.units.box') },
    { value: 1, label: t('products.units.piece') },
    { value: 2, label: t('products.units.squareFeet') },
    { value: 3, label: t('products.units.kilogram') },
    { value: 4, label: t('products.units.gram') },
    { value: 5, label: t('products.units.liter') },
    { value: 6, label: t('products.units.milliliter') },
    { value: 7, label: t('products.units.meter') },
    { value: 8, label: t('products.units.centimeter') },
    { value: 9, label: t('products.units.inch') },
    { value: 10, label: t('products.units.yard') },
    { value: 11, label: t('products.units.ton') },
    { value: 12, label: t('products.units.pack') },
    { value: 13, label: t('products.units.dozen') },
    { value: 14, label: t('products.units.pair') },
    { value: 15, label: t('products.units.roll') },
    { value: 16, label: t('products.units.bundle') },
    { value: 17, label: t('products.units.carton') },
    { value: 18, label: t('products.units.bag') },
    { value: 19, label: t('products.units.set') },
    { value: 20, label: t('products.units.barrel') },
    { value: 21, label: t('products.units.gallon') },
    { value: 22, label: t('products.units.can') },
    { value: 23, label: t('products.units.tube') },
    { value: 24, label: t('products.units.packet') },
    { value: 25, label: t('products.units.unit') }
  ];

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {editProduct ? t('products.editProduct') : t('products.addNewProduct')}
        </span>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} direction="column" sx={{ width: '100%' }}>
            {/* Product Title - Single Field Row */}
            <Grid sx={{ xs: 12, width: '100%', marginBottom: 2 }}>
              <TextField
                fullWidth
                label={t('products.form.productTitle')}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />
            </Grid>

            {/* Description - Single Field Row */}
            <Grid sx={{ xs: 12, width: '100%', marginBottom: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('products.form.description')}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </Grid>

            {/* Category, Unit and Selling Price - Three Fields in One Row */}
            <Grid container spacing={2} sx={{ marginBottom: 2 }}>
              <Grid sx={{ xs: 4, minWidth: 200 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Autocomplete
                    fullWidth
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.title
                    }))}
                    value={categories.find((category) => category.id === formData.categoryId) ?
                      { value: formData.categoryId, label: categories.find((category) => category.id === formData.categoryId)?.title || '' } : null}
                    onChange={(event, newValue) => {
                      handleInputChange('categoryId', newValue ? newValue.value : '');
                    }}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('products.form.category')}
                        required
                        error={!!formErrors.categoryId}
                        helperText={formErrors.categoryId}
                        sx={{ minWidth: 200 }}
                      />
                    )}
                  />
                  <Tooltip title={t('products.addNewCategory')}>
                    <IconButton
                      onClick={() => setCategoryDialogOpen(true)}
                      sx={{
                        mt: 1,
                        backgroundColor: '#667eea',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#5a6fd8',
                        },
                        borderRadius: 1
                      }}
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid sx={{ xs: 4, minWidth: 200 }}>
                <Autocomplete
                  fullWidth
                  options={commonUnits.map((unit) => ({
                    value: unit.value,
                    label: unit.label
                  }))}
                  value={commonUnits.find((unit) => unit.value.toString() === formData.unit.toString()) ?
                    { value: parseInt(formData.unit), label: commonUnits.find((unit) => unit.value.toString() === formData.unit.toString())?.label || '' } : null}
                  onChange={(event, newValue) => {
                    handleInputChange('unit', newValue ? newValue.value : 0);
                  }}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('products.form.unit')}
                      required
                      error={!!formErrors.unit}
                      helperText={formErrors.unit}
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
              </Grid>
              <Grid sx={{ xs: 4, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label={t('products.form.sellingPrice')}
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  error={!!formErrors.sellingPrice}
                  helperText={formErrors.sellingPrice}
                  required
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: <Typography variant="body2">$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* Size and Color - Two Fields in One Row */}
            <Grid container spacing={2} sx={{ marginBottom: 2 }}>
              <Grid sx={{ xs: 6, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label={t('products.form.size')}
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder={t('products.placeholders.size')}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
              <Grid sx={{ xs: 6, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label={t('products.form.color')}
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder={t('products.placeholders.color')}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
            </Grid>

            {/* Product Images */}
            <Grid sx={{ xs: 12, minWidth: 200 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>
                {t('products.form.productImages')}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  id="product-images"
                  multiple
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <label htmlFor="product-images">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    {t('products.form.uploadImages')}
                  </Button>
                </label>
              </Box>

              {/* Show existing photos in edit mode */}
              {editProduct && existingPhotos.length > 0 && (
                <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                  {existingPhotos.map((photo) => (
                    <Grid sx={{ xs: 12, sm: 6, md: 4, minWidth: 200 }} key={photo.id}>
                      <Card sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={photo.blobUrl}
                          alt={photo.originalFileName}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeExistingPhoto(photo.id)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {photo.isPrimary && (
                          <Chip
                            label={t('products.primary')}
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              backgroundColor: 'rgba(25, 118, 210, 0.9)',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Show new image previews */}
              {previewImages.length > 0 && (
                <Grid container spacing={2}>
                  {previewImages.map((image, index) => (
                    <Grid sx={{ xs: 12, sm: 6, md: 4, minWidth: 200 }} key={`new-${index}`}>
                      <Card sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'grey.100'
                          }}
                        >
                          <img
                            src={image}
                            alt={`New image ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removePreviewImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {(!editProduct || existingPhotos.length === 0) && index === 0 && (
                          <Chip
                            label={t('products.primary')}
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              backgroundColor: 'rgba(25, 118, 210, 0.9)',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            disabled={loading}
          >
            {t('products.form.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
              }
            }}
          >
            {editProduct ? t('products.form.updateProduct') : t('products.form.addProduct')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Category Dialog */}
    <CategoryDialog
      open={categoryDialogOpen}
      onClose={() => setCategoryDialogOpen(false)}
      onCategoryCreated={handleCategoryCreated}
    />
    </>
  );
};

export default ProductForm;