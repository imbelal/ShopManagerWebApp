import React from 'react';
import {
  Menu,
  MenuItem,
  MenuProps,
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Payments as PaymentIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

export interface ContextAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  divider?: boolean;
  tooltip?: string;
}

export interface ContextMenuProps extends Omit<MenuProps, 'children'> {
  actions: ContextAction[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  selectedItem?: any;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  actions,
  anchorEl,
  onClose,
  selectedItem,
  ...menuProps
}) => {
  const handleActionClick = (action: ContextAction) => {
    if (action.disabled) return;

    action.onClick?.();
    onClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      {...menuProps}
    >
      {actions.map((action, index) => {
        if (action.divider) {
          return <Divider key={`divider-${index}`} />;
        }

        return (
          <MenuItem
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            sx={{
              color: action.color === 'error' ? 'error.main' : 'inherit',
              '&.Mui-disabled': {
                opacity: 0.5
              }
            }}
          >
            {action.icon && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {action.icon}
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="body2">{action.label}</Typography>
              {action.tooltip && (
                <Typography variant="caption" sx={{ ml: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                  {action.tooltip}
                </Typography>
              )}
            </Box>
          </MenuItem>
        );
      })}
    </Menu>
  );
};

// Predefined action creators
export const createStandardActions = <T = any>(
  item: T,
  onView?: (item: T) => void,
  onEdit?: (item: T) => void,
  onDelete?: (item: T) => void,
  options: {
    canEdit?: (item: T) => boolean;
    canDelete?: (item: T) => boolean;
    deleteTooltip?: string;
    translations?: {
      viewDetails?: string;
      edit?: string;
      delete?: string;
    };
  } = {}
): ContextAction[] => {
  const { canEdit, canDelete, deleteTooltip, translations } = options;

  const actions: ContextAction[] = [
    {
      id: 'view',
      label: translations?.viewDetails || 'View Details',
      icon: <ViewIcon sx={{ fontSize: 16 }} />,
      onClick: () => onView?.(item)
    }
  ];

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: translations?.edit || 'Edit',
      icon: <EditIcon sx={{ fontSize: 16 }} />,
      onClick: () => onEdit?.(item),
      disabled: canEdit ? !canEdit(item) : false
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: translations?.delete || 'Delete',
      icon: <DeleteIcon sx={{ fontSize: 16 }} />,
      onClick: () => onDelete?.(item),
      disabled: canDelete ? !canDelete(item) : false,
      color: 'error',
      tooltip: deleteTooltip
    });
  }

  return actions;
};

export const createSalesActions = (
  sale: any,
  onView?: (sale: any) => void,
  onEdit?: (sale: any) => void,
  onDelete?: (sale: any) => void,
  onAddPayment?: (sale: any) => void,
  onCancel?: (sale: any) => void,
  onDownloadPdf?: (sale: any) => void,
  t?: (key: string) => string
): ContextAction[] => {
  const canEdit = sale.status !== 2 && sale.status !== 3; // Not Paid and Not Cancelled
  const canDelete = sale.status !== 2 && sale.status !== 3; // Not Paid and Not Cancelled
  const canAddPayment = sale.remainingAmount > 0 && sale.status !== 3; // Has balance and not cancelled
  const canCancel = sale.status !== 3 && sale.status !== 2; // Not Cancelled and Not Paid

  const actions: ContextAction[] = [
    {
      id: 'view',
      label: t ? t('sales.actions.viewDetails') : 'View Details',
      icon: <ViewIcon sx={{ fontSize: 16 }} />,
      onClick: () => onView?.(sale)
    }
  ];

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: t ? t('sales.actions.editSale') : 'Edit Sale',
      icon: <EditIcon sx={{ fontSize: 16 }} />,
      onClick: () => onEdit?.(sale),
      disabled: !canEdit
    });
  }

  if (onDownloadPdf) {
    actions.push({
      id: 'pdf',
      label: t ? t('sales.actions.downloadPdf') : 'Download PDF',
      icon: <PdfIcon sx={{ fontSize: 16 }} />,
      onClick: () => onDownloadPdf?.(sale)
    });
  }

  if (onAddPayment) {
    actions.push({
      id: 'payment',
      label: t ? t('sales.actions.addPayment') : 'Add Payment',
      icon: <PaymentIcon sx={{ fontSize: 16 }} />,
      onClick: () => onAddPayment?.(sale),
      disabled: !canAddPayment
    });
  }

  if (onCancel) {
    actions.push({
      id: 'cancel',
      label: t ? t('sales.actions.cancelSale') : 'Cancel Sale',
      icon: <CancelIcon sx={{ fontSize: 16 }} />,
      onClick: () => onCancel?.(sale),
      disabled: !canCancel,
      color: 'warning'
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: t ? t('sales.actions.delete') : 'Delete',
      icon: <DeleteIcon sx={{ fontSize: 16 }} />,
      onClick: () => onDelete?.(sale),
      disabled: !canDelete,
      color: 'error'
    });
  }

  return actions;
};

export const createPurchaseActions = (
  purchase: any,
  onView?: (purchase: any) => void,
  onEdit?: (purchase: any) => void,
  onDelete?: (purchase: any) => void,
  onCancel?: (purchase: any) => void,
  t?: (key: string) => string
): ContextAction[] => {
  const canEdit = purchase.status !== 1 && purchase.status !== 2; // Not Completed and Not Cancelled
  const canDelete = purchase.status !== 1 && purchase.status !== 2; // Not Completed and Not Cancelled
  const canCancel = purchase.status !== 2; // Not Cancelled

  const actions: ContextAction[] = [
    {
      id: 'view',
      label: t ? t('purchases.actions.viewDetails') : 'View Details',
      icon: <ViewIcon sx={{ fontSize: 16 }} />,
      onClick: () => onView?.(purchase)
    }
  ];

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: t ? t('purchases.actions.editPurchase') : 'Edit Purchase',
      icon: <EditIcon sx={{ fontSize: 16 }} />,
      onClick: () => onEdit?.(purchase),
      disabled: !canEdit
    });
  }

  if (onCancel) {
    actions.push({
      id: 'cancel',
      label: t ? t('purchases.actions.cancel') : 'Cancel Purchase',
      icon: <CancelIcon sx={{ fontSize: 16 }} />,
      onClick: () => onCancel?.(purchase),
      disabled: !canCancel,
      color: 'warning'
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: t ? t('purchases.actions.delete') : 'Delete',
      icon: <DeleteIcon sx={{ fontSize: 16 }} />,
      onClick: () => onDelete?.(purchase),
      disabled: !canDelete,
      color: 'error'
    });
  }

  return actions;
};

export default ContextMenu;