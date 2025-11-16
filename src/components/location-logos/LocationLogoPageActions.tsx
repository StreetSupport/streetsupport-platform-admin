'use client';

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LocationLogoPageActionsProps {
  logoId: string;
  onDelete: () => void;
}

/**
 * Reusable action buttons component for Location Logo view pages
 * Provides Edit and Delete buttons with consistent styling
 * 
 * @param logoId - The ID of the location logo
 * @param onDelete - Callback function when delete button is clicked
 */
export function LocationLogoPageActions({ logoId, onDelete }: LocationLogoPageActionsProps) {
  return (
    <>
      <Link href={`/location-logos/${logoId}/edit`}>
        <Button variant="secondary" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </>
  );
}
