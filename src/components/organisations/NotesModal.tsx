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
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-brand-q">
          <div>
            <h2 className="heading-4">Notes</h2>
            <p className="text-sm text-brand-f mt-1">{organisation.Name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-f hover:text-brand-k transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {organisation.Notes.length === 0 ? (
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

        <div className="flex gap-3 p-6 border-t border-brand-q">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          {organisation.Notes.length > 0 && (
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
  );
};
