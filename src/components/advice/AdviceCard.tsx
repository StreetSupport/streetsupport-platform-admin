'use client';

import React, { useState } from 'react';
import { IFaq } from '@/types/IFaq';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface AdviceCardProps {
  advice: IFaq;
  locationName: string;
  onDelete: (advice: IFaq) => void;
  isLoading?: boolean;
}

const AdviceCard = React.memo(function AdviceCard({ 
  advice, 
  locationName, 
  onDelete, 
  isLoading = false 
}: AdviceCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete(advice);
  };

  // Strip HTML tags for preview
  const getPlainTextPreview = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/advice/${advice._id}`} className="flex-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          
          <Link href={`/advice/${advice._id}/edit`}>
            <Button
              variant="secondary"
              size="sm"
              title="Edit advice"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isLoading}
            title="Delete advice"
            className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="heading-5 mb-2 break-words">{advice.Title}</h3>
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {locationName && (
              <span className="service-tag template-type">
                <MapPin className="w-3 h-3 mr-1" />
                {locationName}
              </span>
            )}
            <span className="service-tag verified">
              Position: {advice.SortPosition}
            </span>
          </div>
        </div>

        {/* Body Preview */}
        <div className="text-sm text-brand-l mb-3 line-clamp-3">
          {getPlainTextPreview(advice.Body)}
        </div>

        {/* Created/Modified Dates */}
        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(advice.DocumentCreationDate)}</span>
          </div>
          {advice.DocumentModifiedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Modified: {formatDate(advice.DocumentModifiedDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Advice?"
        message={`Are you sure you want to delete "${advice.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
});

export default AdviceCard;
