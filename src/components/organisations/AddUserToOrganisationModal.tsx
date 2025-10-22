'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { ROLE_PREFIXES, ROLES } from '@/constants/roles';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';

interface AddUserToOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organisation: IOrganisation | null;
}

export default function AddUserToOrganisationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  organisation 
}: AddUserToOrganisationModalProps) {
  const [email, setEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setEmail('');
      setValidationErrors([]);
      setGeneralError('');
    }
  }, [isOpen]);

  if (!isOpen || !organisation) return null;

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.push({ Path: 'Email', Message: 'Email is required' });
    } else if (!emailRegex.test(email)) {
      errors.push({ Path: 'Email', Message: 'Please enter a valid email address' });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreate = async () => {
    // Clear previous errors
    setValidationErrors([]);
    setGeneralError('');
    
    // Validate form
    if (!validateForm()) {
      errorToast.validation();
      return;
    }

    const toastId = loadingToast.create('user');

    try {
      // Automatically create AuthClaims with OrgAdmin and AdminFor:organisationKey
      const authClaims = [
        ROLES.ORG_ADMIN,
        `${ROLE_PREFIXES.ADMIN_FOR}${organisation.Key}`
      ];

      const userData = {
        Email: email,
        UserName: email.split('@')[0], // Use email prefix as username
        AuthClaims: authClaims,
      };

      const response = await fetch('/api/users', {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toastUtils.dismiss(toastId);
      successToast.create('User');
      
      // Reset form
      setEmail('');
      setValidationErrors([]);
      setGeneralError('');
      
      onSuccess();
      onClose();
    } catch (error) {
      toastUtils.dismiss(toastId);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setGeneralError(errorMessage);
      errorToast.create('user', errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setValidationErrors([]);
    setGeneralError('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <div>
              <h2 className="heading-4">Add User to Organisation</h2>
              <p className="text-sm text-brand-f mt-1">{organisation.Name}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-brand-g rounded-md">
              <p className="text-sm text-brand-g">{generalError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-k mb-2">
                Email <span className="text-brand-g">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={validationErrors.find(e => e.Path === 'Email') ? 'border-brand-g' : ''}
                autoComplete="email"
              />
              <p className="text-xs text-brand-f mt-1">
                User will be invited to create an account with this email
              </p>
            </div>

            <div className="bg-brand-i rounded-lg p-4">
              <p className="text-sm text-brand-k mb-2">
                <strong>Role:</strong> Organisation Administrator
              </p>
              <p className="text-xs text-brand-f">
                This user will automatically be assigned the Organisation Administrator role for <strong>{organisation.Name}</strong> and will have access to manage this organisation.
              </p>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="mt-4">
              <ErrorDisplay ValidationErrors={validationErrors} />
            </div>
          )}
          </div>

          {/* Footer - fixed at bottom */}
          <div className="border-t border-brand-q p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              className="flex-1"
            >
              Add User
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
