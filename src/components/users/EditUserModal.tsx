'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AddRoleModal from './AddRoleModal';
import { IUser } from '@/types/IUser';
import { parseAuthClaimsForDisplay, canRemoveRole, RoleDisplay } from '@/lib/userService';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { ROLES } from '@/constants/roles';
import { validateUpdateUser } from '@/schemas/userSchema';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: IUser | null;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user
}: EditUserModalProps) {
  const [roleDisplays, setRoleDisplays] = useState<RoleDisplay[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const displays = parseAuthClaimsForDisplay(user.AuthClaims);
      // Filter out base roles (CityAdmin, SwepAdmin, OrgAdmin) - only show specific location/org roles
      const filteredDisplays = displays.filter(role => 
        role.type !== 'base' || 
        (role.id !== ROLES.CITY_ADMIN && role.id !== ROLES.SWEP_ADMIN && role.id !== ROLES.ORG_ADMIN)
      );
      setRoleDisplays(filteredDisplays);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const email = typeof user.Email === 'string' ? user.Email : '';

  const handleAddRole = (roleClaims: string[]) => {
    // Parse new roles and add them
    const newDisplays = parseAuthClaimsForDisplay(roleClaims);
    
    // Filter out base roles from new displays
    const filteredNewDisplays = newDisplays.filter(role => 
      role.type !== 'base' || 
      (role.id !== ROLES.CITY_ADMIN && role.id !== ROLES.SWEP_ADMIN && role.id !== ROLES.ORG_ADMIN)
    );
    
    // Merge with existing roles (avoid duplicates)
    const existingIds = new Set(roleDisplays.map(r => r.id));
    const uniqueNewDisplays = filteredNewDisplays.filter(r => !existingIds.has(r.id));
    
    setRoleDisplays([...roleDisplays, ...uniqueNewDisplays]);
  };

  const handleRemoveRole = (roleId: string) => {
    const roleToRemove = roleDisplays.find(r => r.id === roleId);
    if (!roleToRemove) return;

    let updatedRoles = roleDisplays.filter(r => r.id !== roleId);

    // Auto-remove parent base roles when last specific role is removed
    if (roleToRemove.type === 'location') {
      const remainingLocationRoles = updatedRoles.filter(
        r => r.baseRole === roleToRemove.baseRole && r.type === 'location'
      );
      
      if (remainingLocationRoles.length === 0) {
        // Remove the base role (CityAdmin or SwepAdmin)
        updatedRoles = updatedRoles.filter(r => r.id !== roleToRemove.baseRole);
      }
    }

    if (roleToRemove.type === 'org') {
      const remainingOrgRoles = updatedRoles.filter(
        r => r.baseRole === ROLES.ORG_ADMIN && r.type === 'org'
      );
      
      if (remainingOrgRoles.length === 0) {
        // Remove OrgAdmin base role
        updatedRoles = updatedRoles.filter(r => r.id !== ROLES.ORG_ADMIN);
      }
    }

    setRoleDisplays(updatedRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (roleDisplays.length === 0) {
      errorToast.validation('User must have at least one role');
      return;
    }

    setIsSubmitting(true);
    const toastId = loadingToast.update('user');

    try {
      // Convert role displays back to authClaims array
      const authClaims: string[] = [];
      const addedBase = new Set<string>();

      roleDisplays.forEach(role => {
        if (role.type === 'base') {
          authClaims.push(role.id);
          addedBase.add(role.id);
        } else if (role.type === 'location' || role.type === 'org') {
          // Add the specific claim
          authClaims.push(role.id);
          
          // Ensure base role is added (if not already)
          if (role.baseRole && !addedBase.has(role.baseRole)) {
            authClaims.push(role.baseRole);
            addedBase.add(role.baseRole);
          }
        }
      });

      const updateData = {
        AuthClaims: authClaims
      };

      // Validate update data before sending
      const validation = validateUpdateUser(updateData);
      if (!validation.success) {
        const errorMessages = validation.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages || 'Validation failed');
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: HTTP_METHODS.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toastUtils.dismiss(toastId);
      successToast.update('User');
      onSuccess();
      onClose();
    } catch (error) {
      toastUtils.dismiss(toastId);
      const message = error instanceof Error ? error.message : 'Failed to update user';
      errorToast.update('user', message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-brand-q px-6 py-4 flex items-center justify-between">
              <h2 className="heading-4">Edit User</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-brand-q rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-brand-k" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-brand-k mb-2">
                  Email
                </label>
                <div className="p-3 bg-brand-q rounded-lg text-brand-f text-sm">
                  {email}
                </div>
                <p className="text-xs text-brand-f mt-1">Email cannot be changed</p>
              </div>

              {/* Roles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="field-label">Roles</label>
                  <Button
                    type="button"
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
                  <>
                    <div className="border border-brand-q rounded-lg p-4 space-y-3">
                      {roleDisplays.map((role) => {
                        const isRemovable = canRemoveRole(role.id, roleDisplays);

                        return (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-3 bg-brand-q rounded-md"
                          >
                            <span className="text-base text-brand-k font-medium">
                              {role.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => isRemovable && handleRemoveRole(role.id)}
                              disabled={!isRemovable}
                              className={`p-2 rounded-full transition-colors ${
                                isRemovable 
                                  ? 'hover:bg-brand-g hover:bg-opacity-10 cursor-pointer' 
                                  : 'opacity-40 cursor-not-allowed'
                              }`}
                              aria-label={`Remove ${role.label}`}
                            >
                              <Trash2 className="w-4 h-4 text-brand-g" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Info message about role removal */}
                    {roleDisplays.some(role => !canRemoveRole(role.id, roleDisplays)) && (
                      <p className="text-xs text-brand-g mt-2">
                        Cannot remove a single role. User must have at least one role assigned.
                      </p>
                    )}
                  </>
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
            <div className="sticky bottom-0 bg-white border-t border-brand-q px-6 py-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || roleDisplays.length === 0}
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Role Modal */}
      <AddRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onAdd={handleAddRole}
        currentRoles={roleDisplays.map(r => r.id)}
      />
    </>
  );
}
