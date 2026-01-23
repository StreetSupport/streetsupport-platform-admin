'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MediaUpload } from '@/components/ui/MediaUpload';
import { FormField } from '@/components/ui/FormField';
import type { ICity, ICTAButton, IUploadedFile } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, Trash, Youtube, ImageIcon, FileUp } from 'lucide-react';
import { IBannerFormData, LayoutStyle, TextColour, BackgroundType, CTAVariant, MediaType } from '@/types';
import { errorToast } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

const UPLOAD_FILE_ACCEPT_STRING = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.m4v';
const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext;
}

interface IValidationError {
  path: string;
  message: string;
  code: string;
}

interface BannerEditorProps {
  initialData?: Partial<IBannerFormData>;
  onDataChange: (data: IBannerFormData) => void;
  onSave: (data: IBannerFormData) => void;
  saving?: boolean;
  onCancel: () => void;
  errorMessage?: string | null;
  validationErrors?: IValidationError[];
}

const LAYOUT_STYLES = [
  { value: LayoutStyle.SPLIT, label: 'Split Layout' },
  { value: LayoutStyle.FULL_WIDTH, label: 'Full Width' }
];

const TEXT_COLOURS = [
  { value: TextColour.WHITE, label: 'White' },
  { value: TextColour.BLACK, label: 'Black' }
];

const BACKGROUND_TYPES = [
  { value: BackgroundType.SOLID, label: 'Solid Colour' },
  { value: BackgroundType.GRADIENT, label: 'Gradient' },
  { value: BackgroundType.IMAGE, label: 'Image' }
];

const CTA_VARIANTS = [
  { value: CTAVariant.PRIMARY, label: 'Primary' },
  { value: CTAVariant.SECONDARY, label: 'Secondary' },
  { value: CTAVariant.OUTLINE, label: 'Outline' }
];

export function BannerEditor({ initialData, onDataChange, onSave, saving = false, onCancel, errorMessage, validationErrors = [] }: BannerEditorProps) {
  const [cities, setCities] = useState<ICity[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await authenticatedFetch('/api/cities');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch locations');
        }
        const result = await response.json();
        if (result.success) {
          setCities(result.data);
        } else {
          errorToast.load('locations data');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
        errorToast.load(errorMessage);
      }
    }
    fetchLocations();
  }, []);

  const getDefaultFormData = (): IBannerFormData => {
    return {
      Title: 'Banner Title',
      Subtitle: '',
      Description: '',
      MediaType: MediaType.IMAGE,
      YouTubeUrl: '',
      LayoutStyle: LayoutStyle.SPLIT,
      TextColour: TextColour.WHITE,
      Background: {
        Type: BackgroundType.SOLID,
        Value: '#38ae8e',
        Overlay: {
          Colour: '#000000',
          Opacity: 0.5
        }
      },
      CtaButtons: [
        {
          Label: 'Learn More',
          Url: '/',
          Variant: CTAVariant.PRIMARY,
          External: false
        }
      ],
      IsActive: false,
      Priority: 5,
      LocationSlug: '',
      LocationName: '',
      UploadedFile: null,
      StartDate: undefined,
      EndDate: undefined,
      _id: '',
    };
  };

  const [formData, setFormData] = useState<IBannerFormData>(() => {
    const defaults = getDefaultFormData();

    if (!initialData || Object.keys(initialData).length === 0) {
      return defaults;
    }

    return {
      ...defaults,
      ...initialData,
      Background: initialData.Background ? {
        ...defaults.Background,
        ...initialData.Background,
        Overlay: initialData.Background.Overlay ? {
          ...defaults.Background.Overlay,
          ...initialData.Background.Overlay,
        } : defaults.Background.Overlay,
      } : defaults.Background,
      CtaButtons: initialData?.CtaButtons ?? defaults.CtaButtons,
    };
  });

  const originalDataRef = useRef(JSON.parse(JSON.stringify(formData)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const updateFormData = (path: string, value: unknown) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData: IBannerFormData = { ...(prev as IBannerFormData) };

      if (path === 'Background.Type') {
        const newBackgroundType = value as BackgroundType;
        const previousBackgroundType = (prev as IBannerFormData).Background.Type;

        if (previousBackgroundType === BackgroundType.IMAGE && newBackgroundType !== BackgroundType.IMAGE) {
          newData.Background.Value = '#38ae8e';
        }
      }

      let current: Record<string, unknown> = newData as unknown as Record<string, unknown>;
      let source: Record<string, unknown> = prev as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextSource = source[key] as unknown;
        const next = Array.isArray(nextSource)
          ? [...(nextSource as unknown[])]
          : { ...(nextSource as Record<string, unknown>) };
        current[key] = next as unknown;
        current = next as Record<string, unknown>;
        source = (nextSource as Record<string, unknown>);
      }
      current[keys[keys.length - 1]] = value as unknown;
      return newData as IBannerFormData;
    });
  };

  const addCTAButton = () => {
    const count = (formData.CtaButtons?.length ?? 0);
    if (count < 3) {
      setFormData(prev => ({
        ...prev,
        CtaButtons: [
          ...((prev.CtaButtons ?? [])),
          {
            Label: '',
            Url: '',
            Variant: CTAVariant.SECONDARY,
            External: false
          }
        ]
      }));
    }
  };

  const removeCTAButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      CtaButtons: (prev.CtaButtons ?? []).filter((_, i) => i !== index)
    }));
  };

  const updateCTAButton = <K extends keyof ICTAButton>(index: number, field: K, value: ICTAButton[K]) => {
    setFormData(prev => ({
      ...prev,
      CtaButtons: (prev.CtaButtons ?? []).map((button, i) =>
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const removeFile = (fieldName: 'Logo' | 'BackgroundImage' | 'MainImage') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const handleCancel = () => {
    const hasFileObjects = (obj: unknown): boolean => {
      if (obj instanceof File) return true;
      if (Array.isArray(obj)) return obj.some(hasFileObjects);
      if (obj && typeof obj === 'object') {
        return Object.values(obj as Record<string, unknown>).some(hasFileObjects);
      }
      return false;
    };

    if (hasFileObjects(formData)) {
      setShowConfirmModal(true);
      return;
    }

    const imageFields = ['Logo', 'BackgroundImage', 'MainImage'] as const;
    for (const field of imageFields) {
      const originalValue = originalDataRef.current[field];
      const currentValue = formData[field];
      if (originalValue && !currentValue) {
        setShowConfirmModal(true);
        return;
      }
    }

    if (JSON.stringify(formData) !== JSON.stringify(originalDataRef.current)) {
      setShowConfirmModal(true);
    } else {
      confirmCancel();
    }
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (file: File) => {
    const newUploadedFile: IUploadedFile & { File: File } = {
      FileUrl: `/${file.name}`,
      FileName: file.name,
      FileSize: formatFileSize(file.size),
      FileType: getFileTypeFromName(file.name),
      File: file
    };

    updateFormData('UploadedFile', newUploadedFile);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors['UploadedFile'];
      return newErrors;
    });
  };

  const removeUploadedFile = () => {
    updateFormData('UploadedFile', null);
    const fileInput = document.getElementById('uploaded-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const hasUploadedFile = formData.UploadedFile instanceof File ||
    (formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'File' in formData.UploadedFile) ||
    (formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'FileUrl' in formData.UploadedFile && formData.UploadedFile.FileUrl);

  return (
    <div className="card">
      <div className="card-header border-b border-brand-q">
        <h2 className="heading-4">Banner Editor</h2>
      </div>

      <form onSubmit={handleSubmit} className="card-content space-y-6">
        {/* Basic Content */}
        <div className="space-y-4">
          <h3 className="heading-5 border-b border-brand-q pb-2 pt-4">Basic Information</h3>

          <FormField label={<>Title <span className="text-brand-g">*</span></>} error={errors.Title}>
            <Input
              value={formData.Title}
              onChange={(e) => updateFormData('Title', e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Title.length}/100 characters
            </p>
          </FormField>

          <FormField label="Subtitle">
            <Input
              value={formData.Subtitle}
              onChange={(e) => updateFormData('Subtitle', e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Subtitle?.length || 0}/100 characters
            </p>
          </FormField>

          <FormField label="Description">
            <Textarea
              value={formData.Description}
              onChange={(e) => updateFormData('Description', e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Description?.length || 0}/500 characters
            </p>
          </FormField>
        </div>

        {/* Media Type Toggle */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Media</h3>

          <FormField label="Media Type">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.MediaType === MediaType.IMAGE ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateFormData('MediaType', MediaType.IMAGE)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Image
              </Button>
              <Button
                type="button"
                variant={formData.MediaType === MediaType.YOUTUBE ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateFormData('MediaType', MediaType.YOUTUBE)}
                className="flex items-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                YouTube Video
              </Button>
            </div>
          </FormField>

          {formData.MediaType === MediaType.IMAGE && (
            <MediaUpload
              label="Layout Image"
              value={formData.MainImage}
              onUpload={(file) => {
                const imageUrl = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                  const newImage = {
                    ...formData.MainImage,
                    Filename: file.name,
                    Alt: file.name,
                    Size: file.size,
                    File: file,
                    url: imageUrl,
                    Width: img.naturalWidth,
                    Height: img.naturalHeight,
                  };
                  updateFormData('MainImage', newImage);
                };
                img.src = imageUrl;
              }}
              onRemove={() => removeFile('MainImage')}
              accept="image/*"
              maxSize={5 * 1024 * 1024}
            />
          )}

          {formData.MediaType === MediaType.YOUTUBE && (
            <FormField label={<>YouTube URL <span className="text-brand-g">*</span></>} error={errors.YouTubeUrl}>
              <Input
                value={formData.YouTubeUrl || ''}
                onChange={(e) => updateFormData('YouTubeUrl', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-brand-f mt-1">
                Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=abc123 or https://youtu.be/abc123)
              </p>
            </FormField>
          )}

          <MediaUpload
            label="Logo"
            value={formData.Logo}
            onUpload={(file) => updateFormData('Logo', file)}
            onRemove={() => removeFile('Logo')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          />
        </div>

        {/* Styling Options */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Styling Options</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Layout Style" required>
              <Select
                value={formData.LayoutStyle}
                onChange={(e) => updateFormData('LayoutStyle', e.target.value)}
                options={LAYOUT_STYLES}
              />
            </FormField>

            <FormField label="Text Colour" required>
              <Select
                value={formData.TextColour}
                onChange={(e) => updateFormData('TextColour', e.target.value)}
                options={TEXT_COLOURS}
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Type <span className="text-brand-g">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_TYPES.map(type => (
                <Button
                  key={type.value}
                  type="button"
                  variant={formData.Background.Type === type.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => updateFormData('Background.Type', type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {formData.Background.Type === BackgroundType.SOLID && (
            <FormField label="Background Colour" required>
              <Input
                type="color"
                value={formData.Background.Value}
                onChange={(e) => updateFormData('Background.Value', e.target.value)}
                className="h-10"
              />
            </FormField>
          )}

          {formData.Background.Type === BackgroundType.GRADIENT && (
            <FormField label="CSS Gradient" required>
              <Input
                value={formData.Background.Value}
                onChange={(e) => updateFormData('Background.Value', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </FormField>
          )}

          {formData.Background.Type === BackgroundType.IMAGE && (
            <div className="space-y-4 p-4 rounded-md">
              <MediaUpload
                label="Background Image"
                value={formData.BackgroundImage}
                onUpload={(file) => {
                  updateFormData('BackgroundImage', file);
                  updateFormData('Background.Value', 'background-image-url');
                }}
                onRemove={() => {
                  removeFile('BackgroundImage');
                  updateFormData('Background.Value', '');
                }}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
              />

              <h4 className="text-sm font-semibold text-brand-k">Image Overlay Settings</h4>
              <p className="text-xs text-brand-f mb-3">Add a colour overlay to improve text readability on the background image</p>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Overlay Colour" required>
                  <Input
                    type="color"
                    value={formData.Background.Overlay?.Colour?.startsWith('#')
                      ? formData.Background.Overlay.Colour
                      : '#000000'}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateFormData('Background.Overlay.Colour', hex);
                    }}
                    className="h-10"
                  />
                </FormField>

                <FormField label={`Opacity (${Math.round((formData.Background.Overlay?.Opacity ?? 0.5) * 100)}%)`} required>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.Background.Overlay?.Opacity ?? 0.5}
                    onChange={(e) => updateFormData('Background.Overlay.Opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <div className="flex justify-between items-center">
            <h3 className="heading-5">Call-to-Action Buttons</h3>
            {(formData.CtaButtons?.length ?? 0) < 3 && (
              <Button type="button" variant="outline" size="sm" onClick={addCTAButton}>
                <Plus className="h-4 w-4 mr-1" />
                Add Button
              </Button>
            )}
          </div>

          {errors.CtaButtons && (
            <p className="text-small text-brand-g">{errors.CtaButtons}</p>
          )}

          <div className="space-y-3">
            {(formData.CtaButtons ?? []).map((button, index) => (
              <div key={index} className="card-compact border border-brand-q">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField label="Button Label" required>
                    <Input
                      value={button.Label}
                      onChange={(e) => updateCTAButton(index, 'Label', e.target.value)}
                      placeholder="Click"
                      maxLength={30}
                    />
                  </FormField>
                  <FormField label="Button URL" required>
                    <Input
                      value={button.Url}
                      onChange={(e) => updateCTAButton(index, 'Url', e.target.value)}
                      placeholder="/ or https://..."
                    />
                  </FormField>
                </div>
                <div className="flex justify-between items-center">
                  <FormField label="Button Style" required>
                    <Select
                      value={button.Variant}
                      onChange={(e) => updateCTAButton(index, 'Variant', (e.target as HTMLSelectElement).value as CTAVariant)}
                      options={CTA_VARIANTS}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCTAButton(index)}
                    title='Remove button'
                    className="p-2 hover:bg-brand-g hover:bg-opacity-10 rounded-full transition-colors"
                  >
                    <Trash className="w-4 h-4 text-brand-g" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Checkbox
                    label="External link (opens in new tab)"
                    checked={button.External}
                    onChange={(e) => updateCTAButton(index, 'External', (e.target as HTMLInputElement).checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">File Upload (Optional)</h3>
          <p className="text-sm text-brand-f">Upload a file (PDF, document, etc.) that can be linked from a CTA button</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label
                htmlFor="uploaded-file"
                className="btn-base btn-primary btn-md cursor-pointer inline-flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                Choose File
              </label>
              <Input
                type="file"
                id="uploaded-file"
                accept={UPLOAD_FILE_ACCEPT_STRING}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > MAX_UPLOAD_FILE_SIZE) {
                      errorToast.fileSize(formatFileSize(MAX_UPLOAD_FILE_SIZE));
                      e.target.value = '';
                      return;
                    }
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
              />
              <span className="text-sm text-brand-f">
                {hasUploadedFile
                  ? (formData.UploadedFile instanceof File
                    ? formData.UploadedFile.name
                    : (formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'FileName' in formData.UploadedFile
                      ? formData.UploadedFile.FileName
                      : 'No file chosen'))
                  : 'No file chosen'}
              </span>
            </div>

            {hasUploadedFile && (
              <div className="flex items-center justify-between p-3 bg-brand-q rounded-md border border-brand-q">
                <div>
                  <span className="text-sm text-brand-k font-medium block">
                    {formData.UploadedFile instanceof File
                      ? formData.UploadedFile.name
                      : (formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'FileName' in formData.UploadedFile
                        ? formData.UploadedFile.FileName
                        : '')}
                  </span>
                  {formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'FileSize' in formData.UploadedFile && (
                    <span className="text-xs text-brand-f">
                      {formData.UploadedFile.FileSize} - {formData.UploadedFile.FileType}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeUploadedFile}
                >
                  Remove File
                </Button>
              </div>
            )}

            <p className="text-xs text-brand-f">
              Accepted formats: PDF, DOC, XLS, PPT, ZIP, JPG, PNG, MP3, MP4. Maximum file size: 10MB.
            </p>

            {hasUploadedFile && formData.UploadedFile && typeof formData.UploadedFile === 'object' && 'FileUrl' in formData.UploadedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  To link this file from a CTA button, use the URL: <code className="bg-blue-100 px-1 rounded">{formData.UploadedFile.FileUrl}</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Publishing Options */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Publishing Options</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location" required>
              <Select
                id="locationSlug"
                value={formData.LocationSlug}
                onChange={(e) => {
                  const selectedLocationSlug = e.target.value;
                  updateFormData('LocationSlug', selectedLocationSlug);

                  const selectedLocation = cities.find((loc) => loc.Key === selectedLocationSlug);
                  if (selectedLocation) {
                    updateFormData('LocationName', selectedLocation.Name);
                  }
                }}
                options={cities.map(city => ({ value: city.Key, label: city.Name }))}
                placeholder="Select a location..."
              />
            </FormField>

            <FormField label="Priority (1-10)" required>
              <Input
                type="number"
                value={formData.Priority}
                onChange={(e) => updateFormData('Priority', Number(e.target.value))}
                min={1}
                max={10}
              />
            </FormField>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-6 border-t border-brand-q mt-6">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </Button>
        </div>

        {/* Error Messages under Save Button */}
        <ErrorDisplay
          ErrorMessage={errorMessage || undefined}
          FieldErrors={errors}
          ValidationErrors={validationErrors?.map(err => ({
            Path: err.path,
            Message: err.message
          }))}
          ClassName="mt-4"
        />
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        variant="warning"
        confirmLabel="Close Without Saving"
        cancelLabel="Continue Editing"
      />
    </div>
  );
}
export type { IBannerFormData };
