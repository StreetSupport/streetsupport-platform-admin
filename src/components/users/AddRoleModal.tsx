'use client';
import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { errorToast } from '@/utils/toast';
import { UserAuthClaims } from '@/types/auth';
import { ROLE_PREFIXES, ROLES } from '@/constants/roles';
import { getAvailableLocations } from '@/utils/locationUtils';

interface Location {
  _id: string;
  Key: string;
  Name: string;
}

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (authClaims: string[]) => void;
  currentRoles: string[]; // Array of existing authClaim strings
}

type RoleType = 'super-admin' | 'location-admin' | 'org-admin' | 'volunteer-admin' | 'swep-admin' | '';

export default function AddRoleModal({ isOpen, onClose, onAdd, currentRoles }: AddRoleModalProps) {
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<RoleType>('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const userAuthClaims = (session?.user?.authClaims || { roles: [], specificClaims: [] }) as UserAuthClaims;
  const isSuperAdmin = userAuthClaims.roles.includes(ROLES.SUPER_ADMIN);
  const isVolunteerAdmin = userAuthClaims.roles.includes(ROLES.VOLUNTEER_ADMIN);
  const isCityAdmin = userAuthClaims.roles.includes(ROLES.CITY_ADMIN) || userAuthClaims.specificClaims.includes(ROLE_PREFIXES.CITY_ADMIN_FOR);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await fetch('/api/cities');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data.data || []);
    } catch {
      errorToast.generic('Failed to load locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  if (!isOpen) return null;

  const handleLocationToggle = (locationKey: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationKey)
        ? prev.filter(k => k !== locationKey)
        : [...prev, locationKey]
    );
  };

  const handleSave = () => {
    if (!selectedRole) {
      errorToast.generic('Please select a role');
      return;
    }

    if ((selectedRole === 'location-admin' || selectedRole === 'swep-admin') && selectedLocations.length === 0) {
      errorToast.generic('Please select at least one location');
      return;
    }

    const newAuthClaims: string[] = [];

    switch (selectedRole) {
      case 'super-admin':
        if (!currentRoles.includes(ROLES.SUPER_ADMIN)) {
          newAuthClaims.push(ROLES.SUPER_ADMIN);
        }
        break;
      
      case 'location-admin':
        // Add CityAdmin base role if not present
        if (!currentRoles.includes(ROLES.CITY_ADMIN)) {
          newAuthClaims.push(ROLES.CITY_ADMIN);
        }
        // Add each location as separate claim
        selectedLocations.forEach(locationKey => {
          const claim = `CityAdminFor:${locationKey}`;
          if (!currentRoles.includes(claim)) {
            newAuthClaims.push(claim);
          }
        });
        break;
      
      case 'volunteer-admin':
        if (!currentRoles.includes(ROLES.VOLUNTEER_ADMIN)) {
          newAuthClaims.push(ROLES.VOLUNTEER_ADMIN);
        }
        break;
      
      case 'swep-admin':
        // Add SwepAdmin base role if not present
        if (!currentRoles.includes(ROLES.SWEP_ADMIN)) {
          newAuthClaims.push(ROLES.SWEP_ADMIN);
        }
        // Add each location as separate claim
        selectedLocations.forEach(locationKey => {
          const claim = `SwepAdminFor:${locationKey}`;
          if (!currentRoles.includes(claim)) {
            newAuthClaims.push(claim);
          }
        });
        break;
      
      case 'org-admin':
        // This case should never be reached since button is disabled for org-admin
        // But included for completeness
        break;
      
      default:
        return;
    }

    if (newAuthClaims.length > 0) {
      onAdd(newAuthClaims);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedRole('');
    setSelectedLocations([]);
    onClose();
  };

  // Filter locations based on current user's permissions using shared utility
  const availableLocations = getAvailableLocations(userAuthClaims, locations);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-brand-q px-6 py-4 flex items-center justify-between">
            <h3 className="heading-5">Add Role / Select Role</h3>
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
            <div className="space-y-3">
              <label className="field-label">Role (select)</label>
              
              {/* Super Administrator */}
              {isSuperAdmin && (
                <label className="flex items-center p-3 hover:bg-brand-i rounded-md cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="radio-field"
                    name="role"
                    value="super-admin"
                    checked={selectedRole === 'super-admin'}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as RoleType);
                      setSelectedLocations([]);
                    }}
                  />
                  <span className="text-base text-brand-k ml-2">Super Administrator</span>
                </label>
              )}

              {/* Location Administrator */}
              {(isSuperAdmin || isVolunteerAdmin || isCityAdmin) && (
                <label className="flex items-center p-3 hover:bg-brand-i rounded-md cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="radio-field"
                    name="role"
                    value="location-admin"
                    checked={selectedRole === 'location-admin'}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as RoleType);
                      setSelectedLocations([]);
                    }}
                  />
                  <span className="text-base text-brand-k ml-2">Location Administrator</span>
                </label>
              )}

              {/* Organisation Administrator - Always show */}
              <label className="flex items-center p-3 hover:bg-brand-i rounded-md cursor-pointer transition-colors">
                <input
                  type="radio"
                  className="radio-field"
                  name="role"
                  value="org-admin"
                  checked={selectedRole === 'org-admin'}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as RoleType);
                    setSelectedLocations([]);
                  }}
                />
                <span className="text-base text-brand-k ml-2">Organisation Administrator</span>
              </label>

              {/* Volunteer Administrator */}
              {(isSuperAdmin || isVolunteerAdmin) && (
                <label className="flex items-center p-3 hover:bg-brand-i rounded-md cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="radio-field"
                    name="role"
                    value="volunteer-admin"
                    checked={selectedRole === 'volunteer-admin'}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as RoleType);
                      setSelectedLocations([]);
                    }}
                  />
                  <span className="text-base text-brand-k ml-2">Volunteer Administrator</span>
                </label>
              )}

              {/* SWEP Administrator */}
              {(isSuperAdmin || isVolunteerAdmin || isCityAdmin) && (
                <label className="flex items-center p-3 hover:bg-brand-i rounded-md cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="radio-field"
                    name="role"
                    value="swep-admin"
                    checked={selectedRole === 'swep-admin'}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as RoleType);
                      setSelectedLocations([]);
                    }}
                  />
                  <span className="text-base text-brand-k ml-2">SWEP Administrator</span>
                </label>
              )}
            </div>

            {/* Location Selection for Location Admin and SWEP Admin */}
            {(selectedRole === 'location-admin' || selectedRole === 'swep-admin') && (
              <div className="space-y-3">
                <label className="field-label">
                  Select Location{availableLocations.length > 1 ? 's' : ''}
                </label>
                
                {loadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-a"></div>
                  </div>
                ) : availableLocations.length > 0 ? (
                  <div className="border border-brand-q rounded-lg max-h-64 overflow-y-auto">
                    {availableLocations.map((location) => (
                      <label
                        key={location.Key}
                        className="flex items-center p-3 hover:bg-brand-i cursor-pointer border-b border-brand-q last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          className="checkbox-field"
                          checked={selectedLocations.includes(location.Key)}
                          onChange={() => handleLocationToggle(location.Key)}
                        />
                        <span className="text-base text-brand-k ml-2">{location.Name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-small text-brand-f">No locations available</p>
                )}
              </div>
            )}

          </div>

          {/* Organisation Administrator Warning - Always show when selected */}
          {selectedRole === 'org-admin' && (
            <div className="px-6 pb-4">
              <div className="bg-brand-j bg-opacity-10 border border-brand-j rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-j flex-shrink-0 mt-0.5" />
                <p className="text-small text-brand-k">
                  Organisation Administrator can be created only from Organisation page.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-brand-q px-6 py-4 flex items-center justify-end gap-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={!selectedRole || selectedRole === 'org-admin'}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
