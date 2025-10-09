'use client';
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddRoleModal from '@/components/users/AddRoleModal';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { validateCreateUser } from '@/schemas/userSchema';
import { HTTP_METHODS } from '@/constants/httpMethods';

interface UserRole {
  id: string;
  type: 'SuperAdmin' | 'CityAdminFor' | 'VolunteerAdmin' | 'SwepAdminFor';
  label: string;
  claim: string;
  locationIds?: string[];
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [emailError, setEmailError] = useState('');

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleAddRole = (role: UserRole) => {
    // Check if role already exists
    const isDuplicate = roles.some(r => r.claim === role.claim);
    if (isDuplicate) {
      errorToast.generic('This role has already been added');
      return;
    }
    setRoles([...roles, role]);
    setIsRoleModalOpen(false);
  };

  const handleRemoveRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
  };

  const handleCreate = async () => {
    if (!validateEmail(email)) {
      return;
    }

    if (roles.length === 0) {
      errorToast.generic('Please add at least one role');
      return;
    }

    const toastId = loadingToast.create('user');

    try {
      // Build AuthClaims array from roles
      const authClaims: string[] = [];
      
      roles.forEach(role => {
        if (role.type === 'SuperAdmin') {
          authClaims.push('SuperAdmin');
        } else if (role.type === 'VolunteerAdmin') {
          authClaims.push('VolunteerAdmin');
        } else if (role.type === 'CityAdminFor' && role.locationIds) {
          authClaims.push('CityAdmin');
          role.locationIds.forEach(locId => {
            authClaims.push(`CityAdminFor:${locId}`);
          });
        } else if (role.type === 'SwepAdminFor' && role.locationIds) {
          authClaims.push('SwepAdmin');
          role.locationIds.forEach(locId => {
            authClaims.push(`SwepAdminFor:${locId}`);
          });
        }
      });

      const userData = {
        Email: email,
        UserName: email.split('@')[0], // Use email prefix as username
        AuthClaims: authClaims,
      };

      // Validate user data before sending
      const validation = validateCreateUser(userData);
      if (!validation.success) {
        const firstError = validation.errors?.issues[0];
        throw new Error(firstError?.message || 'Validation failed');
      }

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
      setRoles([]);
      setEmailError('');
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      toastUtils.dismiss(toastId);
      errorToast.create('user', errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRoles([]);
    setEmailError('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-brand-q px-6 py-4 flex items-center justify-between">
            <h2 className="heading-4">Add User</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-brand-q rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-brand-k" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email Input */}
            <div className="field-group">
              <label htmlFor="email" className="field-label required">
                Email
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                onBlur={() => validateEmail(email)}
                placeholder="user@example.com"
                className={emailError ? 'border-brand-g' : ''}
              />
              {emailError && (
                <div className="field-error text-brand-g text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </div>
              )}
            </div>

            {/* Roles Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="field-label">Roles</label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRoleModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>

              {/* Display Added Roles */}
              {roles.length > 0 ? (
                <div className="border border-brand-q rounded-lg p-4 space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 bg-brand-q rounded-md"
                    >
                      <span className="text-base text-brand-k font-medium">
                        {role.label}
                      </span>
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="p-2 hover:bg-brand-g hover:bg-opacity-10 rounded-full transition-colors"
                        aria-label={`Remove ${role.label}`}
                      >
                        <Trash2 className="w-4 h-4 text-brand-g" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-brand-f rounded-lg p-8 text-center">
                  <p className="text-base text-brand-f">
                    No roles added yet. Click "Add Role" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-brand-q px-6 py-4 flex items-center justify-end gap-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <AddRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSave={handleAddRole}
        existingRoles={roles}
      />
    </>
  );
}
