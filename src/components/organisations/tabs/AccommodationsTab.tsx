'use client';

import React from 'react';
import { IOrganisation } from '@/types/organisations/IOrganisation';

interface AccommodationsTabProps {
  organisation: IOrganisation;
}

const AccommodationsTab: React.FC<AccommodationsTabProps> = ({ organisation }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          <div className="text-center py-8">
            <h3 className="heading-3 mb-4">Accommodations</h3>
            <p className="text-brand-f">
              Accommodations management will be implemented later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationsTab;
