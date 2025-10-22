'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import OrganisationTab from './tabs/OrganisationTab';
import ServicesTab from './tabs/ServicesTab';
import AccommodationsTab from './tabs/AccommodationsTab';

interface EditOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisation: IOrganisation;
  onOrganisationUpdated: () => void;
}

type TabType = 'organisation' | 'services' | 'accommodations';

const EditOrganisationModal: React.FC<EditOrganisationModalProps> = ({
  isOpen,
  onClose,
  organisation,
  onOrganisationUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('organisation');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Reset to first tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('organisation');
    }
  }, [isOpen]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleClose = () => {
    setActiveTab('organisation');
    onClose();
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    handleClose();
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
            <h2 className="heading-2 text-brand-k">Edit Organisation</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
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
                onClick={() => handleTabChange('organisation')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'organisation'
                    ? 'border-brand-a text-brand-a'
                    : 'border-transparent text-brand-f hover:text-brand-k hover:border-brand-q'
                }`}
              >
                Organisation
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-brand-a text-brand-a'
                    : 'border-transparent text-brand-f hover:text-brand-k hover:border-brand-q'
                }`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('accommodations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
                organisation={organisation}
                onOrganisationUpdated={onOrganisationUpdated}
                onClose={() => setShowConfirmModal(true)}
              />
            )}
            {activeTab === 'services' && (
              <ServicesTab
                organisation={organisation}
              />
            )}
            {activeTab === 'accommodations' && (
              <AccommodationsTab
                organisation={organisation}
              />
            )}
          </div>
        </div>
      </div>

    <ConfirmModal
      isOpen={showConfirmModal}
      onClose={() => setShowConfirmModal(false)}
      onConfirm={confirmCancel}
      title="Close without saving?"
      message="You may lose unsaved changes."
      confirmLabel="Close Without Saving"
      cancelLabel="Continue Editing"
      variant="warning"
    />
    </>
  );
};

export default EditOrganisationModal;
