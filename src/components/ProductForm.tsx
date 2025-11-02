import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { productService, Product, Category, Tag, CreateProductRequest, UpdateProductRequest } from '../services/productService';
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
    unit: '',
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
      unit: '',
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
          console.log('Categories loaded:', categoriesResponse.data.data);
        } else {
          console.error('Failed to load categories:', categoriesResponse.data.message);
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

    console.log('Validating form data:', formData);

    if (!formData.title.trim()) {
      errors.title = 'Product title is required';
      console.log('Title validation failed');
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      console.log('Description validation failed');
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
      console.log('Category validation failed');
    }

    if (!formData.unit || formData.unit.toString().trim() === '') {
      errors.unit = 'Unit is required';
      console.log('Unit validation failed');
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      errors.sellingPrice = 'Selling price must be greater than 0';
      console.log('Selling price validation failed');
    }

    console.log('Form errors:', errors);
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
    console.log('Form submission started');

    if (!validateForm()) {
      console.log('Form validation failed');
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
          unit: formData.unit,
          sellingPrice: parseFloat(formData.sellingPrice)
        };

        console.log('Updating product:', updateData);
        response = await productService.updateProduct(updateData);
      } else {
        // Create new product
        const createData: CreateProductRequest = {
          title: formData.title,
          description: formData.description,
          size: formData.size,
          color: formData.color,
          categoryId: formData.categoryId,
          unit: formData.unit,
          sellingPrice: parseFloat(formData.sellingPrice),
          tagIds: formData.tagIds
        };

        console.log('Creating product:', createData);
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
            setError('Product saved but image upload failed: ' + (uploadError.message || 'Unknown error'));
          }
        }

        onSave(editProduct || { ...response.data.data, id: productId } as Product);
        onClose();
        resetForm();
      } else {
        throw new Error(response.data.message || 'Failed to save product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // Get unit name from ProductUnit enum value
  const getUnitName = (unitValue: number) => {
    const unitMap: { [key: number]: string } = {
      0: 'Box',
      1: 'Piece',
      2: 'Square Feet',
      3: 'Kilogram',
      4: 'Gram',
      5: 'Liter',
      6: 'Milliliter',
      7: 'Meter',
      8: 'Centimeter',
      9: 'Inch',
      10: 'Yard',
      11: 'Ton',
      12: 'Pack',
      13: 'Dozen',
      14: 'Pair',
      15: 'Roll',
      16: 'Bundle',
      17: 'Carton',
      18: 'Bag',
      19: 'Set',
      20: 'Barrel',
      21: 'Gallon',
      22: 'Can',
      23: 'Tube',
      24: 'Packet',
      25: 'Unit'
    };

    return unitMap[unitValue] || 'Unit';
  };

  // Common units for products - using the enum values that match backend
  const commonUnits = [
    { value: 0, label: 'Box' },
    { value: 1, label: 'Piece' },
    { value: 2, label: 'Square Feet' },
    { value: 3, label: 'Kilogram' },
    { value: 4, label: 'Gram' },
    { value: 5, label: 'Liter' },
    { value: 6, label: 'Milliliter' },
    { value: 7, label: 'Meter' },
    { value: 8, label: 'Centimeter' },
    { value: 9, label: 'Inch' },
    { value: 10, label: 'Yard' },
    { value: 11, label: 'Ton' },
    { value: 12, label: 'Pack' },
    { value: 13, label: 'Dozen' },
    { value: 14, label: 'Pair' },
    { value: 15, label: 'Roll' },
    { value: 16, label: 'Bundle' },
    { value: 17, label: 'Carton' },
    { value: 18, label: 'Bag' },
    { value: 19, label: 'Set' },
    { value: 20, label: 'Barrel' },
    { value: 21, label: 'Gallon' },
    { value: 22, label: 'Can' },
    { value: 23, label: 'Tube' },
    { value: 24, label: 'Packet' },
    { value: 25, label: 'Unit' }
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
          {editProduct ? 'Edit Product' : 'Add New Product'}
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
            <Grid item xs={12} sx={{ width: '100%', marginBottom: 2 }}>
              <TextField
                fullWidth
                label="Product Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />
            </Grid>

            {/* Description - Single Field Row */}
            <Grid item xs={12} sx={{ width: '100%', marginBottom: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </Grid>

            {/* Category, Unit and Selling Price - Three Fields in One Row */}
            <Grid container item spacing={2} sx={{ marginBottom: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <FormControl fullWidth required error={!!formErrors.categoryId} sx={{ minWidth: 250 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.categoryId}
                      label="Category"
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Add new category">
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
              <Grid item xs={4}>
                <FormControl fullWidth required error={!!formErrors.unit} sx={{ minWidth: 150 }}>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Unit"
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  >
                    {commonUnits.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Selling Price"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  error={!!formErrors.sellingPrice}
                  helperText={formErrors.sellingPrice}
                  required
                  InputProps={{
                    startAdornment: <Typography variant="body2">$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* Size and Color - Two Fields in One Row */}
            <Grid container item spacing={2} sx={{ marginBottom: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="e.g., M, L, XL"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Red, Blue"
                />
              </Grid>
            </Grid>

            {/* Product Images */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>
                Product Images
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
                    Upload Images
                  </Button>
                </label>
              </Box>

              {/* Show existing photos in edit mode */}
              {editProduct && existingPhotos.length > 0 && (
                <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                  {existingPhotos.map((photo) => (
                    <Grid item xs={12} sm={6} md={4} key={photo.id}>
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
                            label="Primary"
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
                    <Grid item xs={12} sm={6} md={4} key={`new-${index}`}>
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
                            label="Primary"
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
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            onClick={() => console.log('Submit button clicked')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
              }
            }}
          >
            {editProduct ? 'Update Product' : 'Add Product'}
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