'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import AddRoleModal from './AddRoleModal';
import { IUser } from '@/types/IUser';
import { parseAuthClaimsForDisplay, canRemoveRole, RoleDisplay, hasGenericSwepAdmin } from '@/lib/userService';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { ROLES } from '@/constants/roles';
import { validateUser } from '@/schemas/userSchema';
import { useSession } from 'next-auth/react';
import { getUserLocationSlugs } from '@/utils/locationUtils';

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
  const { data: session } = useSession();
  const [roleDisplays, setRoleDisplays] = useState<RoleDisplay[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Get current user's accessible locations
  const userAuthClaims = session?.user?.authClaims;
  const currentUserLocations = userAuthClaims ? getUserLocationSlugs(userAuthClaims, true) : null;
  const isSuperAdmin = userAuthClaims?.roles.includes(ROLES.SUPER_ADMIN) || false;

  useEffect(() => {
    if (user && isOpen) {
      const displays = parseAuthClaimsForDisplay(user.AuthClaims);
      // Filter out base roles (CityAdmin, SwepAdmin, OrgAdmin) - only show specific location/org roles
      const filteredDisplays = displays.filter(role => 
        role.type !== 'base' || 
        (role.id !== ROLES.CITY_ADMIN && role.id !== ROLES.SWEP_ADMIN && role.id !== ROLES.ORG_ADMIN)
      );
      setRoleDisplays(filteredDisplays);
      
      // Check for generic SwepAdmin when modal opens
      if (hasGenericSwepAdmin(user.AuthClaims)) {
        setShowWarningModal(true);
      }
    } else if (!isOpen) {
      // Reset warning modal state when edit modal closes
      setShowWarningModal(false);
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

  /**
   * Check if current user can manage this role (for location/org specific roles)
   * CityAdmin can only manage roles from their own locations
   */
  const canManageRole = (role: RoleDisplay): { canManage: boolean; reason?: string } => {
    // SuperAdmin can manage all roles
    if (isSuperAdmin) {
      return { canManage: true };
    }

    // For location-specific roles (CityAdmin and SwepAdmin)
    if (role.type === 'location' && role.specificValue) {
      // If current user has no specific locations (shouldn't happen for CityAdmin), deny
      if (!currentUserLocations || currentUserLocations.length === 0) {
        return { canManage: false, reason: 'No location permissions' };
      }

      // Check if the role's location is in the current user's locations
      if (!currentUserLocations.includes(role.specificValue)) {
        return { 
          canManage: false, 
          reason: 'User doesn\'t have permission to manage this location' 
        };
      }
    }

    // For org-specific roles, would need org validation (future enhancement)
    // For now, allow if user is CityAdmin
    if (role.type === 'org') {
      // This would require checking if the org belongs to CityAdmin's location
      // For now, assuming CityAdmin can manage orgs in their locations
      // It's too complicated to get organisation on each permisison. API validation is enough
      return { canManage: true };
    }

    return { canManage: true };
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
      const validation = validateUser(updateData);
      if (!validation.success) {
        const errorMessages = validation.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages || 'Validation failed');
      }

      const response = await authenticatedFetch(`/api/users/${user._id}`, {
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
                        const managementCheck = canManageRole(role);
                        const canActuallyRemove = isRemovable && managementCheck.canManage;
                        const tooltipText = !managementCheck.canManage 
                          ? managementCheck.reason 
                          : !isRemovable 
                          ? 'Cannot remove the last role'
                          : '';

                        return (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-3 bg-brand-q rounded-md"
                          >
                            <span className="text-base text-brand-k font-medium">
                              {role.label}
                            </span>
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => {
                                  if (canActuallyRemove) {
                                    handleRemoveRole(role.id);
                                  } else if (tooltipText) {
                                    // Show toast notification when clicking disabled button
                                    errorToast.generic(tooltipText);
                                  }
                                }}
                                disabled={!canActuallyRemove}
                                className={`p-2 rounded-full transition-colors ${
                                  canActuallyRemove
                                    ? 'hover:bg-brand-g hover:bg-opacity-10 cursor-pointer' 
                                    : 'opacity-40 cursor-not-allowed'
                                }`}
                                aria-label={`Remove ${role.label}`}
                                title={tooltipText}
                              >
                                <Trash2 className="w-4 h-4 text-brand-g" />
                              </button>
                              {/* Tooltip */}
                              {!canActuallyRemove && tooltipText && (
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                  <div className="bg-brand-l text-brand-q text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                                    {tooltipText}
                                    <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-brand-l"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

      {/* Warning Modal for Generic SwepAdmin */}
      <ConfirmModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => setShowWarningModal(false)}
        title="Role Configuration Required"
        message="You should add more specific location role for your Swep Administrator"
        variant="warning"
        confirmLabel="OK"
        cancelLabel=""
      />
    </>
  );
}
