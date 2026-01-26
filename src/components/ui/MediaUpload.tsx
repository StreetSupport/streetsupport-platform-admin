'use client';

import { useState, ReactNode } from 'react';
import Image from 'next/image';
import { Button } from './Button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { IMediaAsset } from '@/types';

interface MediaUploadProps {
  value?: File | IMediaAsset | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  maxSize?: number;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  multiple?: boolean;
}

interface MediaArrayUploadProps {
  value?: (File | IMediaAsset)[];
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
  accept?: string;
  maxSize?: number;
  label?: ReactNode;
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
  description,
  required = false
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
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      {value ? (
        <div className="relative group">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {accept.includes('image') ? (
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                    <Image 
                      src={getPreviewUrl(value)} 
                      alt={getDisplayName(value)}
                      fill
                      className="object-cover"
                    />
                  </div>
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
                    if (value instanceof File && value.size > 0) return `${(value.size / 1024).toFixed(1)} KB`;
                    if (isFileWrapper(value) && value.File.size > 0) return `${(value.File.size / 1024).toFixed(1)} KB`;
                    if (isMediaAsset(value) && typeof value.Size === 'number' && value.Size > 0) return `${(value.Size / 1024).toFixed(1)} KB`;
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
        <label
          className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-brand-a bg-brand-a/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > maxSize) {
                  return;
                }
                onUpload(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept === 'image/*' ? 'Images only' : 'Any file type'} &bull; Max {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </label>
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
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                        <Image 
                          src={getPreviewUrl(item)} 
                          alt={getDisplayName(item)}
                          fill
                          className="object-cover"
                        />
                      </div>
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
                        if (item instanceof File && item.size > 0) return `${(item.size / 1024).toFixed(1)} KB`;
                        if (isFileWrapper(item) && item.File.size > 0) return `${(item.File.size / 1024).toFixed(1)} KB`;
                        if (isMediaAsset(item) && typeof item.Size === 'number' && item.Size > 0) return `${(item.Size / 1024).toFixed(1)} KB`;
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
      <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > maxSize) {
                return;
              }
              onUpload(file);
            }
            e.target.value = '';
          }}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Add more images
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept === 'image/*' ? 'Images only' : 'Any file type'} &bull; Max {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </label>
    </div>
  );
}
