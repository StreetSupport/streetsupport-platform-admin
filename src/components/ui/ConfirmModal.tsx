'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  // Handle escape key (only if cancel button is available)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && cancelLabel) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-brand-g';
      case 'warning':
        return 'text-brand-j';
      case 'info':
        return 'text-brand-a';
      default:
        return 'text-brand-g';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'btn-base btn-danger';
      case 'warning':
        return 'btn-base btn-warning';
      case 'info':
        return 'btn-base btn-primary';
      default:
        return 'btn-base btn-danger';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && cancelLabel) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`flex-shrink-0 ${getIconColor()}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              {title && (
                <h2 
                  id="confirm-modal-title" 
                  className="heading-5 text-brand-k mb-2"
                >
                  {title}
                </h2>
              )}
              <p 
                id="confirm-modal-description" 
                className="text-base text-brand-l leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>
          {!isLoading && cancelLabel && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-brand-f hover:text-brand-k transition-colors ml-4"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          {cancelLabel && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelLabel}
            </Button>
          )}
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`${getConfirmButtonClasses()} min-w-[100px] btn-md`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for easier usage
export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    message: ''
  });
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (props: Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
    setConfig(props);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  };

  const ConfirmModalComponent = () => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  );

  return {
    confirm,
    ConfirmModalComponent
  };
};
