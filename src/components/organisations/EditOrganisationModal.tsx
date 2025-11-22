'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import OrganisationTab, { OrganisationTabRef } from './tabs/OrganisationTab';

type TriggerCancelOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
};
import ServicesTab from './tabs/ServicesTab';
import AccommodationsTab from './tabs/AccommodationsTab';

interface EditOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisation: IOrganisation;
  onOrganisationUpdated: () => void;
  viewMode?: boolean; // When true, all inputs are disabled and edit actions hidden
}

type TabType = 'organisation' | 'services' | 'accommodations';

const EditOrganisationModal: React.FC<EditOrganisationModalProps> = ({
  isOpen,
  onClose,
  organisation,
  onOrganisationUpdated,
  viewMode = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('organisation');
  const organisationTabRef = React.useRef<OrganisationTabRef>(null);

  // Reset to first tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('organisation');
    }
  }, [isOpen]);

  const handleTabClick = (tab: TabType) => {
    if (tab !== activeTab) {
      handleTabSwitch(tab);
    }
  };

  const handleClose = () => {
    // Check if on Organisation tab with unsaved changes
    if (!viewMode && activeTab === 'organisation' && organisationTabRef.current?.hasChanges()) {
      // Trigger OrganisationTab's cancel confirmation with callback to close after
      organisationTabRef.current?.triggerCancel(() => {
        setActiveTab('organisation');
        onClose();
      }, {
        title: 'Close without saving?',
        message: 'You may lose unsaved changes.',
        confirmLabel: 'Close without saving'
      });
      return;
    }
    
    setActiveTab('organisation');
    onClose();
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleTabSwitch = (tab: TabType) => {
    // Check if leaving Organisation tab with unsaved changes
    if (!viewMode && activeTab === 'organisation' && organisationTabRef.current?.hasChanges()) {
      // Trigger OrganisationTab's cancel confirmation with callback to switch tab after
      // Use specific message for tab switching
      organisationTabRef.current?.triggerCancel(() => {
        setActiveTab(tab);
      }, {
        title: 'Switch tab without saving?',
        message: 'You may lose unsaved changes.',
        confirmLabel: 'Switch Without Saving'
      });
      return;
    }
    
    // Switch tabs
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h3 className="heading-3 text-brand-k">
              {viewMode ? 'View Organisation' : 'Edit Organisation'}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-brand-q">
            <nav className="flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
              <button
                type="button"
                onClick={() => handleTabClick('organisation')}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === 'organisation'
                    ? 'border-brand-a text-brand-a'
                    : 'border-transparent text-brand-f hover:text-brand-k hover:border-brand-q'
                }`}
              >
                Organisation
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-brand-a text-brand-a'
                    : 'border-transparent text-brand-f hover:text-brand-k hover:border-brand-q'
                }`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('accommodations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === 'accommodations'
                    ? 'border-brand-a text-brand-a'
                    : 'border-transparent text-brand-f hover:text-brand-k hover:border-brand-q'
                }`}
              >
                Accommodations
              </button>
            </nav>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'organisation' && (
              <OrganisationTab
                ref={organisationTabRef}
                organisation={organisation}
                onOrganisationUpdated={onOrganisationUpdated}
                onClose={() => {
                  setActiveTab('organisation');
                  onClose();
                }}
                onCancel={() => {
                  setActiveTab('organisation');
                  onClose();
                }}
                viewMode={viewMode}
              />
            )}
            {activeTab === 'services' && (
              <ServicesTab
                organisation={organisation}
                viewMode={viewMode}
              />
            )}
            {activeTab === 'accommodations' && (
              <AccommodationsTab
                organisation={organisation}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default EditOrganisationModal;
