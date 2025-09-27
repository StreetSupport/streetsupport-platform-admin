'use client';

import { useState } from 'react';
import { Button } from './Button';
import { FileUpload } from './FileUpload';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { IMediaAsset } from '@/types';

interface MediaUploadProps {
  value?: File | IMediaAsset | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
  multiple?: boolean;
}

interface MediaArrayUploadProps {
  value?: (File | IMediaAsset)[];
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
}

// Union type and guards for media-like values
type MediaLike = File | IMediaAsset | { File: File } | null | undefined;

const isFileWrapper = (item: unknown): item is { File: File } =>
  !!item && typeof item === 'object' && 'File' in (item as Record<string, unknown>) && (item as { File?: unknown }).File instanceof File;

const isMediaAsset = (item: unknown): item is IMediaAsset =>
  !!item && typeof item === 'object' && 'Url' in (item as Record<string, unknown>);

// Helper function to get preview URL
const getPreviewUrl = (item: MediaLike): string => {
  if (item instanceof File) {
    return URL.createObjectURL(item);
  }
  if (isFileWrapper(item)) {
    return URL.createObjectURL(item.File);
  }
  if (isMediaAsset(item) && item.Url) {
    return item.Url;
  }
  return '';
};

// Helper function to get display name
const getDisplayName = (item: MediaLike): string => {
  if (item instanceof File) return item.name;
  if (isFileWrapper(item)) return item.File.name;
  if (isMediaAsset(item)) return item.Filename || item.Alt || 'Uploaded file';
  return 'Uploaded file';
};

// Single media upload component
export function MediaUpload({ 
  value, 
  onUpload, 
  onRemove, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024,
  label,
  description 
}: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onUpload(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      {value ? (
        <div className="relative group">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {accept.includes('image') ? (
                  <img 
                    src={getPreviewUrl(value)} 
                    alt={getDisplayName(value)}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getDisplayName(value)}
                </p>
                <p className="text-xs text-gray-500">
                  {(() => {
                    if (value instanceof File) return `${(value.size / 1024).toFixed(1)} KB`;
                    if (isFileWrapper(value)) return `${(value.File.size / 1024).toFixed(1)} KB`;
                    if (isMediaAsset(value) && typeof value.Size === 'number') return `${(value.Size / 1024).toFixed(1)} KB`;
                    return '';
                  })()}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-brand-a bg-brand-a/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop an image here, or click to select
          </p>
          <FileUpload
            accept={accept}
            onUpload={(files) => {
              const file = Array.isArray(files) ? files[0] : files;
              if (file) onUpload(file);
            }}
            maxSize={maxSize}
            className="inline-block"
          />
        </div>
      )}
    </div>
  );
}

// Multiple media upload component
export function MediaArrayUpload({ 
  value = [], 
  onUpload, 
  onRemove, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024,
  label,
  description 
}: MediaArrayUploadProps) {
  return (
    <div className="space-y-4">
      {label && <h3 className="text-sm font-medium text-gray-700">{label}</h3>}
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}

      {/* Existing files */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="relative group">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {accept.includes('image') ? (
                      <img 
                        src={getPreviewUrl(item)} 
                        alt={getDisplayName(item)}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getDisplayName(item)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        if (item instanceof File) return `${(item.size / 1024).toFixed(1)} KB`;
                        if (isFileWrapper(item)) return `${(item.File.size / 1024).toFixed(1)} KB`;
                        if (isMediaAsset(item) && typeof item.Size === 'number') return `${(item.Size / 1024).toFixed(1)} KB`;
                        return '';
                      })()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload new files */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Add more images
        </p>
        <FileUpload
          accept={accept}
          onUpload={(files) => {
            const file = Array.isArray(files) ? files[0] : files;
            if (file) onUpload(file);
          }}
          maxSize={maxSize}
          className="inline-block"
        />
      </div>
    </div>
  );
}
