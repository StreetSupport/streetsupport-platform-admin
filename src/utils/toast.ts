import toast from 'react-hot-toast';

/**
 * Utility functions for consistent toast notifications across the application
 * Following Street Support design system colors and patterns
 */

export const toastUtils = {
  // Success notifications
  success: {
    create: (itemName: string) => toast.success(`${itemName} created successfully!`),
    update: (itemName: string) => toast.success(`${itemName} updated successfully!`),
    delete: (itemName: string) => toast.success(`${itemName} deleted successfully!`),
    save: () => toast.success('Changes saved successfully!'),
    upload: (fileName?: string) => toast.success(`${fileName ? `${fileName} uploaded` : 'File uploaded'} successfully!`),
    copy: () => toast.success('Copied to clipboard!'),
    activate: (itemName: string) => toast.success(`${itemName} activated successfully!`),
    deactivate: (itemName: string) => toast.success(`${itemName} deactivated successfully!`),
  },

  // Error notifications
  error: {
    create: (itemName: string, error?: string) => 
      toast.error(`Failed to create ${itemName}${error ? `: ${error}` : ''}`),
    update: (itemName: string, error?: string) => 
      toast.error(`Failed to update ${itemName}${error ? `: ${error}` : ''}`),
    delete: (itemName: string, error?: string) => 
      toast.error(`Failed to delete ${itemName}${error ? `: ${error}` : ''}`),
    load: (itemName: string, error?: string) => 
      toast.error(`Failed to load ${itemName}${error ? `: ${error}` : ''}`),
    upload: (fileName?: string, error?: string) => 
      toast.error(`Failed to upload ${fileName || 'file'}${error ? `: ${error}` : ''}`),
    validation: (message?: string) => 
      toast.error(message || 'Please fix the validation errors in the form'),
    network: () => toast.error('Network error. Please check your connection and try again.'),
    permission: () => toast.error('You do not have permission to perform this action'),
    fileSize: (maxSize: string) => toast.error(`File too large. Maximum size is ${maxSize}`),
    fileType: (allowedTypes: string) => toast.error(`Invalid file type. Allowed types: ${allowedTypes}`),
    auth: () => toast.error('Please sign in to access this feature'),
    generic: (message?: string) => toast.error(message || 'An unexpected error occurred'),
  },

  // Loading notifications
  loading: {
    create: (itemName: string) => toast.loading(`Creating ${itemName}...`),
    update: (itemName: string) => toast.loading(`Updating ${itemName}...`),
    delete: (itemName: string) => toast.loading(`Deleting ${itemName}...`),
    load: (itemName: string) => toast.loading(`Loading ${itemName}...`),
    upload: (fileName?: string) => toast.loading(`Uploading ${fileName || 'file'}...`),
    save: () => toast.loading('Saving changes...'),
    process: (action: string) => toast.loading(`${action}...`),
  },

  // Warning notifications
  warning: {
    unsavedChanges: () => toast('You have unsaved changes. Save before leaving?', {
      icon: '⚠️',
      duration: 6000,
    }),
    lowStorage: () => toast('Storage space is running low', {
      icon: '⚠️',
      duration: 5000,
    }),
    sessionExpiring: () => toast('Your session will expire soon. Please save your work.', {
      icon: '⚠️',
      duration: 8000,
    }),
    custom: (message: string) => toast(message, {
      icon: '⚠️',
      duration: 5000,
    }),
  },

  // Info notifications
  info: {
    autoSave: () => toast('Auto-saved', {
      icon: 'ℹ️',
      duration: 2000,
    }),
    copied: () => toast('Copied to clipboard', {
      icon: 'ℹ️',
      duration: 2000,
    }),
    offline: () => toast('You are currently offline', {
      icon: 'ℹ️',
      duration: 4000,
    }),
    online: () => toast('Connection restored', {
      icon: 'ℹ️',
      duration: 2000,
    }),
    custom: (message: string) => toast(message, {
      icon: 'ℹ️',
      duration: 4000,
    }),
  },

  // Utility functions
  dismiss: (toastId: string) => toast.dismiss(toastId),
  dismissAll: () => toast.dismiss(),
  
  // Promise-based notifications for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),

  // Custom toast with Street Support branding
  custom: (message: string, options?: {
    type?: 'success' | 'error' | 'loading' | 'blank';
    duration?: number;
    icon?: string;
  }) => {
    const { type = 'blank', duration = 4000, icon } = options || {};
    
    switch (type) {
      case 'success':
        return toast.success(message, { duration, icon });
      case 'error':
        return toast.error(message, { duration, icon });
      case 'loading':
        return toast.loading(message, { duration, icon });
      default:
        return toast(message, { duration, icon });
    }
  },
};

// Export individual categories for easier imports
export const successToast = toastUtils.success;
export const errorToast = toastUtils.error;
export const loadingToast = toastUtils.loading;
export const warningToast = toastUtils.warning;
export const infoToast = toastUtils.info;

export default toastUtils;
