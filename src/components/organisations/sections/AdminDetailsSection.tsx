'use client';

import React, { useState } from 'react';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { Button } from '@/components/ui/Button';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast } from '@/utils/toast';
import toast from 'react-hot-toast';

interface AdminDetailsSectionProps {
  organisation: IOrganisation;
  onUpdate?: (updatedOrg: IOrganisation) => void;
}

export function AdminDetailsSection({ 
  organisation, 
  onUpdate,
}: AdminDetailsSectionProps) {
  const [selectedEmail, setSelectedEmail] = useState<string>(
    organisation.Administrators?.find(admin => admin.IsSelected)?.Email || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Calculate days since last update
  const daysSinceUpdate = React.useMemo(() => {
    if (!organisation.DocumentModifiedDate) return 0;
    const lastUpdate = new Date(organisation.DocumentModifiedDate);
    const today = new Date();
    return Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  }, [organisation.DocumentModifiedDate]);

  // Get warning level based on days
  const getWarningLevel = () => {
    if (daysSinceUpdate >= 100) return 'expired';
    if (daysSinceUpdate >= 90) return 'warning';
    if (daysSinceUpdate >= 75) return 'info';
    return 'ok';
  };

  const warningLevel = getWarningLevel();

  const handleAdministratorChange = async (email: string) => {
    if (!email || email === selectedEmail) return;

    setIsUpdating(true);
    try {
      const response = await authenticatedFetch(
        `/api/organisations/${organisation._id}/administrator`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedEmail: email })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update administrator');
      }

      const updatedOrg = await response.json();
      setSelectedEmail(email);
      
      if (onUpdate) {
        onUpdate(updatedOrg);
      }
      
      toast.success('Administrator updated successfully');
    } catch (error) {
      console.error('Error updating administrator:', error);
      errorToast.generic('Failed to update administrator');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmInfo = async () => {
    setIsConfirming(true);
    try {
      const response = await authenticatedFetch(
        `/api/organisations/${organisation._id}/confirm-info`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to confirm information');
      }

      const updatedOrg = await response.json();
      
      if (onUpdate) {
        onUpdate(updatedOrg);
      }
      
      toast.success('Information confirmed as up to date');
    } catch (error) {
      console.error('Error confirming information:', error);
      errorToast.generic('Failed to confirm information');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-brand-q p-6 rounded-lg border border-brand-f/20">
      <h3 className="heading-3 mb-4">Admin Details</h3>
      
      <p className="text-small text-brand-l mb-6">
        Please choose the administrator who will be responsible for making updates to your organisation. 
        They will be contacted after 90 days of inactivity to check that the information is still correct.
      </p>

      {/* Administrator Dropdown */}
      <div className="mb-6">
        <label htmlFor="administrator" className="block text-sm font-semibold text-brand-k mb-2">
          Administrator
        </label>
        <select
          id="administrator"
          value={selectedEmail}
          onChange={(e) => handleAdministratorChange(e.target.value)}
          className="w-full px-4 py-2 border border-brand-f/30 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent disabled:bg-brand-q disabled:cursor-not-allowed text-brand-k"
        >
          {organisation.Administrators && organisation.Administrators.length > 0 ? (
            organisation.Administrators.map((admin, index) => (
              <option key={index} value={admin.Email}>
                {admin.Email}
              </option>
            ))
          ) : (
            <option value="">No administrators available</option>
          )}
        </select>
      </div>

      {/* Days Since Last Update */}
      <div className="mb-6">
        <div className={`p-4 rounded-md ${
          warningLevel === 'expired' ? 'bg-red-50 border border-brand-g' :
          warningLevel === 'warning' ? 'bg-yellow-50 border border-brand-j' :
          warningLevel === 'info' ? 'bg-blue-50 border border-blue-300' :
          'bg-green-50 border border-brand-b'
        }`}>
          <p className={`text-sm font-medium ${
            warningLevel === 'expired' ? 'text-brand-g' :
            warningLevel === 'warning' ? 'text-brand-j' :
            warningLevel === 'info' ? 'text-blue-700' :
            'text-brand-b'
          }`}>
            {daysSinceUpdate} {daysSinceUpdate === 1 ? 'day' : 'days'} since last update
          </p>
          
          {warningLevel === 'expired' && (
            <p className="text-xs text-brand-g mt-1">
              ⚠️ Organisation has been unverified due to inactivity over 100 days
            </p>
          )}
          {warningLevel === 'warning' && (
            <p className="text-xs text-brand-j mt-1">
              ⚠️ Reminder sent. Organisation will be unverified in {100 - daysSinceUpdate} days without action
            </p>
          )}
          {warningLevel === 'info' && (
            <p className="text-xs text-blue-700 mt-1">
              ℹ️ Approaching 90-day review period
            </p>
          )}
        </div>
      </div>

      {/* Information Up to Date Button - Only in edit mode */}
      <Button
        onClick={handleConfirmInfo}
        disabled={isConfirming}
        variant="primary"
        className="w-full bg-brand-d hover:bg-brand-e text-white"
      >
        {isConfirming ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Confirming...
          </div>
        ) : (
          'Information up to date'
        )}
      </Button>
  </div>
  );
}
