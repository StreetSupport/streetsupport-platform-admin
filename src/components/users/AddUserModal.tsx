'use client';
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddRoleModal from '@/components/users/AddRoleModal';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { validateUser } from '@/schemas/userSchema';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { parseAuthClaimsForDisplay, RoleDisplay } from '@/lib/userService';
import { ROLE_PREFIXES, ROLES } from '@/constants/roles';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [authClaims, setAuthClaims] = useState<string[]>([]);
  const [roleDisplays, setRoleDisplays] = useState<RoleDisplay[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState<string>('');

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.push({ Path: 'Email', Message: 'Email is required' });
    } else if (!emailRegex.test(email)) {
      errors.push({ Path: 'Email', Message: 'Please enter a valid email address' });
    }
    
    // Roles validation
    if (authClaims.length === 0) {
      errors.push({ Path: 'Roles', Message: 'Please add at least one role' });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddRole = (newClaims: string[]) => {
    // Merge new claims with existing, avoiding duplicates
    const mergedClaims = [...new Set([...authClaims, ...newClaims])];
    setAuthClaims(mergedClaims);
    
    // Update role displays
    const displays = parseAuthClaimsForDisplay(mergedClaims);
    // Filter out base roles (CityAdmin, SwepAdmin, OrgAdmin) - only show specific location/org roles
    const filteredDisplays = displays.filter(role => 
      role.type !== 'base' || 
      (role.id !== ROLES.CITY_ADMIN && role.id !== ROLES.SWEP_ADMIN && role.id !== ROLES.ORG_ADMIN)
    );
    setRoleDisplays(filteredDisplays);
    
    // Clear validation errors since roles have been added
    setValidationErrors([]);
    
    setIsRoleModalOpen(false);
  };

  const handleRemoveRole = (roleId: string) => {
    const roleToRemove = roleDisplays.find(r => r.id === roleId);
    if (!roleToRemove) return;

    let updatedClaims = authClaims.filter(c => c !== roleId);

    // Auto-remove parent base roles when last specific role is removed
    if (roleToRemove.type === 'location') {
      const remainingLocationRoles = updatedClaims.filter(
        c => c.startsWith(`${roleToRemove.baseRole === ROLES.CITY_ADMIN ? ROLE_PREFIXES.CITY_ADMIN_FOR : ROLE_PREFIXES.SWEP_ADMIN_FOR}`)
      );
      
      if (remainingLocationRoles.length === 0 && roleToRemove.baseRole) {
        updatedClaims = updatedClaims.filter(c => c !== roleToRemove.baseRole);
      }
    }

    if (roleToRemove.type === 'org') {
      const remainingOrgRoles = updatedClaims.filter(c => c.startsWith(ROLE_PREFIXES.ADMIN_FOR));
      
      if (remainingOrgRoles.length === 0) {
        updatedClaims = updatedClaims.filter(c => c !== ROLES.ORG_ADMIN);
      }
    }

    setAuthClaims(updatedClaims);
    const displays = parseAuthClaimsForDisplay(updatedClaims);
    // Filter out base roles (CityAdmin, SwepAdmin, OrgAdmin) - only show specific location/org roles
    const filteredDisplays = displays.filter(role => 
      role.type !== 'base' || 
      (role.id !== ROLES.CITY_ADMIN && role.id !== ROLES.SWEP_ADMIN && role.id !== ROLES.ORG_ADMIN)
    );
    setRoleDisplays(filteredDisplays);
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
      const userData = {
        Email: email,
        UserName: email.split('@')[0], // Use email prefix as username
        AuthClaims: authClaims,
      };

      // Validate user data before sending
      const validation = validateUser(userData);
      if (!validation.success) {
        const errors = validation.errors.map(err => ({
          Path: err.path || 'Unknown',
          Message: err.message
        }));
        setValidationErrors(errors);
        toastUtils.dismiss(toastId);
        errorToast.validation();
        return;
      }

      const response = await authenticatedFetch('/api/users', {
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
      setAuthClaims([]);
      setRoleDisplays([]);
      setValidationErrors([]);
      setGeneralError('');
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      toastUtils.dismiss(toastId);
      setGeneralError(errorMessage);
      errorToast.create('user', errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setAuthClaims([]);
    setRoleDisplays([]);
    setValidationErrors([]);
    setGeneralError('');
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
                  setValidationErrors([]);
                }}
                placeholder="user@example.com"
              />
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
              {roleDisplays.length > 0 ? (
                <div className="border border-brand-q rounded-lg p-4 space-y-3">
                  {roleDisplays.map((role) => (
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
                    No roles added yet. Click &quot;Add Role&quot; to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-brand-q px-6 py-4">
            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                Create
              </Button>
            </div>
            
            {/* Error Display */}
            <ErrorDisplay
              ErrorMessage={generalError || undefined}
              ValidationErrors={validationErrors}
              ClassName="mt-4"
            />
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <AddRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onAdd={handleAddRole}
        currentRoles={authClaims}
      />
    </>
  );
}
