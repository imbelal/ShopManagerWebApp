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
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

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
    setSelectedTags([]);
    setPreviewImages([]);
    setFormErrors({});
    setError(null);
  };

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          productService.getCategories(),
          productService.getTags()
        ]);

        if (categoriesResponse.data.succeeded && categoriesResponse.data.data) {
          setCategories(categoriesResponse.data.data);
        }

        if (tagsResponse.data.succeeded && tagsResponse.data.data) {
          setTags(tagsResponse.data.data);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    if (open) {
      loadData();
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
      setSelectedTags(editProduct.productTags || []);

      // Load product photos for preview
      if (editProduct.productPhotos && editProduct.productPhotos.length > 0) {
        setPreviewImages(editProduct.productPhotos.map(photo => photo.blobUrl));
      }
    } else {
      resetForm();
    }
  }, [editProduct, open]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Product title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    if (!formData.unit.trim()) {
      errors.unit = 'Unit is required';
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      errors.sellingPrice = 'Selling price must be greater than 0';
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

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newSelectedTags);
    setFormData(prev => ({
      ...prev,
      tagIds: newSelectedTags
    }));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === files.length) {
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
          unit: formData.unit,
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
          unit: formData.unit,
          sellingPrice: parseFloat(formData.sellingPrice),
          tagIds: selectedTags
        };

        response = await productService.createProduct(createData);
      }

      if (response.data.succeeded) {
        onSave(editProduct || { ...response.data.data, id: response.data.data } as Product);
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {editProduct ? 'Edit Product' : 'Add New Product'}
        </Typography>
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

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.categoryId}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Category"
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Product Attributes */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>
                Product Attributes
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="e.g., M, L, XL"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="e.g., Red, Blue"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth required error={!!formErrors.unit}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  label="Unit"
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {commonUnits.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.title}
                    clickable
                    color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                    onClick={() => handleTagToggle(tag.id)}
                    variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
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
                    sx={{ borderRadius: 2 }}
                  >
                    Upload Images
                  </Button>
                </label>
              </Box>

              {previewImages.length > 0 && (
                <Grid container spacing={2}>
                  {previewImages.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ position: 'relative', borderRadius: 2 }}>
                        {editProduct ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={image}
                            alt={`Product image ${index + 1}`}
                          />
                        ) : (
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
                              alt={`Preview ${index + 1}`}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </Box>
                        )}
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
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              borderRadius: 2,
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
  );
};

export default ProductForm;