import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Alert,
  Paper,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  RemoveRedEye as VisibilityIcon,
  EditOff as VisibilityOffIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { Tenant, TenantFormData } from '../types/tenant';
import { User, UserFormData, PasswordFormData } from '../types/auth';
import { tenantService } from '../services/tenantService';
import { authService } from '../services/authService';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const TenantSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Tenant settings state
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantFormData, setTenantFormData] = useState<TenantFormData>({
    name: '',
    address: '',
    phoneNumber: ''
  });
  const [tenantErrors, setTenantErrors] = useState<Partial<TenantFormData>>({});

  // User profile state
  const [userSaving, setUserSaving] = useState(false);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    email: '',
    firstname: '',
    lastname: ''
  });
  const [userErrors, setUserErrors] = useState<Partial<UserFormData>>({});

  // Password state
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordFormData>>({});
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Initialize user form data when user is available or updated
  useEffect(() => {
    if (user) {
      setUserFormData({
        email: user.email,
        firstname: user.firstName,
        lastname: user.lastName
      });
    }
  }, [user]);

  // Load current tenant data
  const loadTenantData = async () => {
    try {
      setTenantLoading(true);
      const response = await tenantService.getCurrentTenant();

      if (response.data.succeeded && response.data.data) {
        const tenantData = response.data.data;
        setTenant(tenantData);
        setTenantFormData({
          name: tenantData.name,
          address: tenantData.address,
          phoneNumber: tenantData.phoneNumber
        });
      } else {
        showSnackbar(response.data.message || 'Failed to load tenant settings', 'error');
      }
    } catch (error) {
      console.error('Error loading tenant data:', error);
      showSnackbar('Failed to load tenant settings', 'error');
    } finally {
      setTenantLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  // Validate tenant form
  const validateTenantForm = (): boolean => {
    const newErrors: Partial<TenantFormData> = {};

    if (!tenantFormData.name.trim()) {
      newErrors.name = t('settings.organization.errors.nameRequired');
    }

    if (!tenantFormData.address.trim()) {
      newErrors.address = t('settings.organization.errors.addressRequired');
    }

    if (!tenantFormData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('settings.organization.errors.phoneRequired');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(tenantFormData.phoneNumber)) {
      newErrors.phoneNumber = t('settings.organization.errors.phoneInvalid');
    }

    setTenantErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate user profile form
  const validateUserForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!userFormData.email.trim()) {
      newErrors.email = t('settings.userProfile.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      newErrors.email = t('settings.userProfile.errors.emailInvalid');
    }

    if (!userFormData.firstname.trim()) {
      newErrors.firstname = t('settings.userProfile.errors.firstNameRequired');
    }

    if (!userFormData.lastname.trim()) {
      newErrors.lastname = t('settings.userProfile.errors.lastNameRequired');
    }

    setUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!passwordFormData.oldPassword.trim()) {
      newErrors.oldPassword = t('settings.security.errors.currentPasswordRequired');
    }

    if (!passwordFormData.newPassword.trim()) {
      newErrors.newPassword = t('settings.security.errors.newPasswordRequired');
    } else if (passwordFormData.newPassword.length < 6) {
      newErrors.newPassword = t('settings.security.errors.newPasswordTooShort');
    }

    if (!passwordFormData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('settings.security.errors.confirmPasswordRequired');
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      newErrors.confirmPassword = t('settings.security.errors.passwordsNotMatch');
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle tenant form submission
  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTenantForm()) {
      return;
    }

    try {
      setTenantSaving(true);
      const response = await tenantService.updateTenant(tenantFormData);

      if (response.data.succeeded) {
        showSnackbar(t('settings.messages.organization.updated'), 'success');
        await loadTenantData();
      } else {
        showSnackbar(response.data.message || 'Failed to update tenant settings', 'error');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      showSnackbar('Failed to update tenant settings', 'error');
    } finally {
      setTenantSaving(false);
    }
  };

  // Handle user profile submission
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUserForm() || !user) {
      return;
    }

    try {
      setUserSaving(true);
      const response = await authService.updateUserProfile({
        userId: user.id,
        email: userFormData.email,
        firstname: userFormData.firstname,
        lastname: userFormData.lastname
      });

      if (response.data.succeeded) {
        showSnackbar(t('settings.messages.userProfile.updated'), 'success');

        // Reload user profile from backend to get updated data
        try {
          await updateUserProfile({});
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
          showSnackbar(t('settings.messages.userProfile.refreshFailed'), 'warning');
        }
      } else {
        showSnackbar(response.data.message || 'Failed to update user profile', 'error');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      showSnackbar('Failed to update user profile', 'error');
    } finally {
      setUserSaving(false);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm() || !user) {
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await authService.changePassword({
        userId: user.id,
        username: user.username,
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword
      });

      if (response.data.succeeded) {
        showSnackbar(t('settings.security.success.passwordChanged'), 'success');
        setPasswordFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showSnackbar(response.data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showSnackbar('Failed to change password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle tenant form field changes
  const handleTenantInputChange = (field: keyof TenantFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTenantFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    if (tenantErrors[field]) {
      setTenantErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle user form field changes
  const handleUserInputChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    if (userErrors[field]) {
      setUserErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle password form field changes
  const handlePasswordInputChange = (field: keyof PasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (tenantLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        showRefresh
        onRefresh={loadTenantData}
        loading={tenantLoading}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={t('settings.tabs.organization')} />
          <Tab label={t('settings.tabs.userProfile')} />
          <Tab label={t('settings.tabs.security')} />
        </Tabs>
      </Box>

      {/* Organization Settings Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box component="form" onSubmit={handleTenantSubmit} noValidate>
                  <Typography variant="h6" gutterBottom>
                    {t('settings.organization.title')}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.organization.organizationName')}
                        value={tenantFormData.name}
                        onChange={handleTenantInputChange('name')}
                        error={!!tenantErrors.name}
                        helperText={tenantErrors.name}
                        disabled={tenantSaving}
                        InputProps={{
                          startAdornment: (
                            <BusinessIcon sx={{ color: 'action.active', mr: 1 }} />
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('settings.organization.address')}
                        value={tenantFormData.address}
                        onChange={handleTenantInputChange('address')}
                        error={!!tenantErrors.address}
                        helperText={tenantErrors.address}
                        disabled={tenantSaving}
                        InputProps={{
                          startAdornment: (
                            <LocationIcon sx={{ color: 'action.active', mr: 1, mt: 1 }} />
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('settings.organization.phoneNumber')}
                        value={tenantFormData.phoneNumber}
                        onChange={handleTenantInputChange('phoneNumber')}
                        error={!!tenantErrors.phoneNumber}
                        helperText={tenantErrors.phoneNumber}
                        disabled={tenantSaving}
                        InputProps={{
                          startAdornment: (
                            <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />
                          )
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={loadTenantData}
                      disabled={tenantSaving}
                    >
                      {t('common.reset')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={tenantSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={tenantSaving}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        }
                      }}
                    >
                      {tenantSaving ? t('common.saving') : t('settings.organization.saveChanges')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('settings.organization.details.title')}
              </Typography>

              {tenant && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.organization.details.organizationId')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {tenant.id}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.organization.details.status')}
                    </Typography>
                    <Chip
                      label={tenant.isDeleted ? t('settings.organization.details.inactive') : t('settings.organization.details.active')}
                      color={tenant.isDeleted ? 'error' : 'success'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.organization.details.created')}
                    </Typography>
                    <Typography variant="body1">
                      {new Date(tenant.createdUtcDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {tenant.updatedUtcDate && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('settings.organization.details.lastUpdated')}
                      </Typography>
                      <Typography variant="body1">
                        {new Date(tenant.updatedUtcDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {t('settings.organization.info.changesNotice')}
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* User Profile Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box component="form" onSubmit={handleUserSubmit} noValidate>
                  <Typography variant="h6" gutterBottom>
                    {t('settings.userProfile.title')}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('settings.userProfile.firstName')}
                        value={userFormData.firstname}
                        onChange={handleUserInputChange('firstname')}
                        error={!!userErrors.firstname}
                        helperText={userErrors.firstname}
                        disabled={userSaving}
                        InputProps={{
                          startAdornment: (
                            <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('settings.userProfile.lastName')}
                        value={userFormData.lastname}
                        onChange={handleUserInputChange('lastname')}
                        error={!!userErrors.lastname}
                        helperText={userErrors.lastname}
                        disabled={userSaving}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.userProfile.emailAddress')}
                        type="email"
                        value={userFormData.email}
                        onChange={handleUserInputChange('email')}
                        error={!!userErrors.email}
                        helperText={userErrors.email}
                        disabled={userSaving}
                        InputProps={{
                          startAdornment: (
                            <EmailIcon sx={{ color: 'action.active', mr: 1 }} />
                          )
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={userSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={userSaving}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        }
                      }}
                    >
                      {userSaving ? t('common.saving') : t('settings.userProfile.updateProfile')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('settings.userProfile.accountInfo.title')}
              </Typography>

              {user && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.userProfile.accountInfo.username')}
                    </Typography>
                    <Typography variant="body1">{user.username}</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.userProfile.accountInfo.role')}
                    </Typography>
                    <Chip
                      label={user.role}
                      color="primary"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.userProfile.accountInfo.tenantId')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {user.tenantId}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {t('settings.userProfile.info.profileNotice')}
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                  <Typography variant="h6" gutterBottom>
                    {t('settings.security.title')}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.security.currentPassword')}
                        type={showPasswords.oldPassword ? 'text' : 'password'}
                        value={passwordFormData.oldPassword}
                        onChange={handlePasswordInputChange('oldPassword')}
                        error={!!passwordErrors.oldPassword}
                        helperText={passwordErrors.oldPassword}
                        disabled={passwordSaving}
                        InputProps={{
                          startAdornment: (
                            <LockIcon sx={{ color: 'action.active', mr: 1 }} />
                          ),
                          endAdornment: (
                            <IconButton
                              onClick={() => togglePasswordVisibility('oldPassword')}
                              edge="end"
                            >
                              {showPasswords.oldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.security.newPassword')}
                        type={showPasswords.newPassword ? 'text' : 'password'}
                        value={passwordFormData.newPassword}
                        onChange={handlePasswordInputChange('newPassword')}
                        error={!!passwordErrors.newPassword}
                        helperText={passwordErrors.newPassword}
                        disabled={passwordSaving}
                        InputProps={{
                          startAdornment: (
                            <LockIcon sx={{ color: 'action.active', mr: 1 }} />
                          ),
                          endAdornment: (
                            <IconButton
                              onClick={() => togglePasswordVisibility('newPassword')}
                              edge="end"
                            >
                              {showPasswords.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.security.confirmNewPassword')}
                        type={showPasswords.confirmPassword ? 'text' : 'password'}
                        value={passwordFormData.confirmPassword}
                        onChange={handlePasswordInputChange('confirmPassword')}
                        error={!!passwordErrors.confirmPassword}
                        helperText={passwordErrors.confirmPassword}
                        disabled={passwordSaving}
                        InputProps={{
                          startAdornment: (
                            <LockIcon sx={{ color: 'action.active', mr: 1 }} />
                          ),
                          endAdornment: (
                            <IconButton
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                              edge="end"
                            >
                              {showPasswords.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      startIcon={passwordSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={passwordSaving}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                      }}
                    >
                      {passwordSaving ? t('common.saving') : t('settings.security.changePassword')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('settings.security.guidelines.title')}
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {t('settings.security.guidelines.requirements')}
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>{t('settings.security.guidelines.requirement1')}</li>
                  <li>{t('settings.security.guidelines.requirement2')}</li>
                  <li>{t('settings.security.guidelines.requirement3')}</li>
                </ul>
              </Alert>

              <Alert severity="info">
                <Typography variant="body2">
                  {t('settings.security.guidelines.reloginNotice')}
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default TenantSettingsPage;