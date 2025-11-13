import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  People,
  Assessment,
  Settings,
  AccountCircle,
  Logout,
  Store,
  Notifications,
  ShoppingBasket as PurchaseIcon,
  SwapHoriz as StockTransactionsIcon,
  ReceiptLong as ExpenseIcon,
} from '@mui/icons-material';
import { styled, useTheme as useStyledTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageSwitcher from './common/LanguageSwitcher';

const drawerWidth = 280;

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.95)} 100%)`,
  backdropFilter: 'blur(10px)',
  boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`,
}));

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const StyledListItem = styled(ListItem, { shouldForwardProp: (prop) => prop !== 'active' })<{
  active?: boolean;
}>(({ theme, active }) => ({
  borderRadius: theme.spacing(1.5),
  margin: theme.spacing(0.5, 1),
  '& .MuiListItemButton-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.2s ease-in-out',
    ...(active && {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.dark, 0.15)} 100%)`,
      color: theme.palette.primary.main,
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
    }),
    '&:hover': {
      background: active
        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`
        : alpha(theme.palette.action.hover, 0.08),
    },
  },
}));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const getNavigationItems = (t: any): NavigationItem[] => [
  { text: t('navigation.dashboard'), icon: <Dashboard />, path: '/dashboard' },
  { text: t('navigation.products'), icon: <Inventory />, path: '/products' },
  { text: t('navigation.sales'), icon: <ShoppingCart />, path: '/sales' },
  { text: t('navigation.purchases'), icon: <PurchaseIcon />, path: '/purchases' },
  { text: t('navigation.expenses'), icon: <ExpenseIcon />, path: '/expenses' },
  { text: t('navigation.stockTransactions'), icon: <StockTransactionsIcon />, path: '/stock-transactions' },
  { text: t('navigation.customers'), icon: <People />, path: '/customers' },
  { text: t('navigation.reports'), icon: <Assessment />, path: '/reports' },
  { text: t('navigation.settings'), icon: <Settings />, path: '/settings' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const theme = useStyledTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = getNavigationItems(t);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isProfileMenuOpen = Boolean(anchorEl);

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const drawer = (
    <Box>
      <LogoContainer>
        <Store
          sx={{
            fontSize: 32,
            color: theme.palette.primary.main,
            mr: 1,
          }}
        />
        {open && (
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ShopManager
          </Typography>
        )}
      </LogoContainer>

      <Divider />

      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <StyledListItem key={item.text} active={isActive} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{ opacity: open ? 1 : 0 }}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </StyledListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {navigationItems.find(item => item.path === location.pathname)?.text || t('navigation.dashboard')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />

            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Box>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(theme.palette.common.white, 0.2),
                color: theme.palette.common.white,
              }}
            >
              {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={isProfileMenuOpen}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" noWrap>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
              <Typography variant="caption" color="primary" noWrap>
                {user?.role}
              </Typography>
            </Box>

            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('settings.userProfile')}</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation.settings')}</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('auth.logout')}</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <StyledDrawer variant="permanent" open={open}>
        {drawer}
      </StyledDrawer>

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;