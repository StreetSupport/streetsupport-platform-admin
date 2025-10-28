'use client';

import React from 'react';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { Button } from '@/components/ui/Button';
import { X, Calendar, User } from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearNotes: () => void;
  organisation: IOrganisation | null;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  onClearNotes,
  organisation
}) => {
  if (!isOpen || !organisation) return null;

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <div>
              <h2 className="heading-4">Notes</h2>
              <p className="text-sm text-brand-f mt-1">{organisation.Name}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {organisation?.Notes?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base text-brand-f">No notes available for this organisation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organisation.Notes.map((note, index) => (
                <div
                  key={index}
                  className="bg-brand-q rounded-lg p-4 border border-brand-q hover:border-brand-a transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-brand-f">
                      <User className="w-4 h-4" />
                      <span className="font-medium text-brand-k">{note.StaffName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-f">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(note.Date)}</span>
                    </div>
                  </div>
                  <p className="text-base text-brand-l whitespace-pre-wrap">{note.Reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Footer - fixed at bottom */}
          <div className="border-t border-brand-q p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          {organisation?.Notes?.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onClearNotes}
              className="flex-1 text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
            >
              Clear All Notes
            </Button>
          )}
        </div>
        </div>
      </div>
    </>
  );
};
