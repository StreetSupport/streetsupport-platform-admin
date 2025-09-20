'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { MediaUpload, MediaArrayUpload } from '@/components/ui/MediaUpload';
import { FormField } from '@/components/ui/FormField';
import type { ICity, ICTAButton } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, Trash } from 'lucide-react';
import { BannerTemplateType, UrgencyLevel, CharterType, ResourceType, IBannerFormData, LayoutStyle, TextColour, BackgroundType, CTAVariant } from '@/types';
import { RESOURCE_FILE_ACCEPT_STRING, MAX_RESOURCE_FILE_SIZE, getFileTypeFromMimeType, isValidResourceFileType } from '@/types/IResourceFile';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface BannerEditorProps {
  initialData?: Partial<IBannerFormData>;
  onDataChange: (data: IBannerFormData) => void;
  onSave: (data: IBannerFormData) => void;
  saving?: boolean;
  onCancel?: () => void;
}

const TEMPLATE_TYPES = [
  { value: BannerTemplateType.GIVING_CAMPAIGN, label: 'Giving Campaign' },
  { value: BannerTemplateType.PARTNERSHIP_CHARTER, label: 'Partnership Charter' },
  { value: BannerTemplateType.RESOURCE_PROJECT, label: 'Resource Project' }
];

const LAYOUT_STYLES = [
  { value: LayoutStyle.SPLIT, label: 'Split Layout' },
  { value: LayoutStyle.FULL_WIDTH, label: 'Full Width' },
  { value: LayoutStyle.CARD, label: 'Card Layout' }
];

const TEXT_COLOURS = [
  { value: TextColour.WHITE, label: 'White' },
  { value: TextColour.BLACK, label: 'Black' }
];

const BACKGROUND_TYPES = [
  { value: BackgroundType.SOLID, label: 'Solid Color' },
  { value: BackgroundType.GRADIENT, label: 'Gradient' },
  { value: BackgroundType.IMAGE, label: 'Image' }
];

const CTA_VARIANTS = [
  { value: CTAVariant.PRIMARY, label: 'Primary' },
  { value: CTAVariant.SECONDARY, label: 'Secondary' },
  { value: CTAVariant.OUTLINE, label: 'Outline' }
];

const URGENCY_LEVELS = [
  { value: UrgencyLevel.LOW, label: 'Low' },
  { value: UrgencyLevel.MEDIUM, label: 'Medium' },
  { value: UrgencyLevel.HIGH, label: 'High' },
  { value: UrgencyLevel.CRITICAL, label: 'Critical' }
];

const CHARTER_TYPES = [
  { value: CharterType.HOMELESS_CHARTER, label: 'Homeless Charter' },
  { value: CharterType.REAL_CHANGE, label: 'Real Change' },
  { value: CharterType.ALTERNATIVE_GIVING, label: 'Alternative Giving' },
  { value: CharterType.PARTNERSHIP, label: 'Partnership' }
];

const RESOURCE_TYPES = [
  { value: ResourceType.GUIDE, label: 'Guide' },
  { value: ResourceType.TOOLKIT, label: 'Toolkit' },
  { value: ResourceType.RESEARCH, label: 'Research' },
  { value: ResourceType.TRAINING, label: 'Training' },
  { value: ResourceType.EVENT, label: 'Event' }
];


export function BannerEditor({ initialData, onDataChange, onSave, saving = false, onCancel }: BannerEditorProps) {
  const [cities, setCities] = useState<ICity[]>([]);
  const [originalData, setOriginalData] = useState<Partial<IBannerFormData> | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        const result = await response.json();
        if (result.success) {
          setCities(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    }
    fetchCities();
  }, []);

  // Store original data for cancel functionality
  useEffect(() => {
    if (initialData && !originalData) {
      setOriginalData(initialData);
    }
  }, [initialData, originalData]);

  const [formData, setFormData] = useState<IBannerFormData>(() => {
    const defaults: IBannerFormData = {
      Title: '',
      Subtitle: '',
      Description: '',
      TemplateType: BannerTemplateType.GIVING_CAMPAIGN,
      LayoutStyle: LayoutStyle.SPLIT,
      TextColour: TextColour.WHITE,
      Background: {
        Type: BackgroundType.SOLID,
        Value: '#38ae8e',
        Overlay: {
          Colour: 'rgba(0,0,0,0.5)',
          Opacity: 0.5
        }
      },
      CtaButtons: [
        {
          Label: 'Learn More',
          Url: '/about',
          Variant: CTAVariant.PRIMARY,
          External: false
        }
      ],
      IsActive: true,
      Priority: 5,
      LocationSlug: '',
      BadgeText: '',
      DonationGoal: {
        Target: 10000,
        Current: 0,
        Currency: 'GBP'
      },
      UrgencyLevel: UrgencyLevel.MEDIUM,
      StartDate: undefined,
      EndDate: undefined,
      CampaignEndDate: undefined,
      ShowDates: false,
      CharterType: CharterType.HOMELESS_CHARTER,
      SignatoriesCount: 0,
      ResourceFile: {
        FileUrl: '',
        ResourceType: ResourceType.GUIDE,
        DownloadCount: 0,
        FileSize: '',
        FileType: '',
        LastUpdated: undefined
      },
      _id: '',
      DocumentCreationDate: new Date(),
      DocumentModifiedDate: new Date(),
      CreatedBy: ''
    };

    return {
      ...defaults,
      ...initialData,
      Background: {
        ...defaults.Background,
        ...initialData?.Background,
        Overlay: {
          ...defaults.Background.Overlay,
          ...initialData?.Background?.Overlay,
        },
      },
      DonationGoal: {
        ...defaults.DonationGoal,
        ...initialData?.DonationGoal,
      },
      CtaButtons: initialData?.CtaButtons && initialData.CtaButtons.length > 0
        ? initialData.CtaButtons
        : defaults.CtaButtons,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      // Start with a shallow copy of the root
      const newData: any = Array.isArray(prev) ? [...(prev as any)] : { ...(prev as any) };
      // Walk the path, cloning each branch as we go
      let current: any = newData;
      let source: any = prev as any;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextSource = source[key];
        // Clone arrays vs objects appropriately to maintain immutability
        const next = Array.isArray(nextSource) ? [...nextSource] : { ...nextSource };
        current[key] = next;
        current = next;
        source = nextSource;
      }
      current[keys[keys.length - 1]] = value;
      return newData as IBannerFormData;
    });
  };

  const addCTAButton = () => {
    if (formData.CtaButtons.length < 3) {
      setFormData(prev => ({
        ...prev,
        CtaButtons: [
          ...prev.CtaButtons,
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
    if (formData.CtaButtons.length > 1) {
      setFormData(prev => ({
        ...prev,
        CtaButtons: prev.CtaButtons.filter((_, i) => i !== index)
      }));
    }
  };

  const updateCTAButton = (index: number, field: keyof ICTAButton, value: any) => {
    setFormData(prev => ({
      ...prev,
      CtaButtons: prev.CtaButtons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  // File management functions
  const removeFile = (fieldName: 'Logo' | 'BackgroundImage' | 'SplitImage') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const removePartnerLogo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      PartnerLogos: prev.PartnerLogos?.filter((_, i) => i !== index) || []
    }));
  };

  const addPartnerLogo = (file: File) => {
    setFormData(prev => {
      if ((prev.PartnerLogos?.length || 0) >= 5) {
        // Optionally, set an error message to inform the user
        setErrors(e => ({ ...e, PartnerLogos: 'You can only upload a maximum of 5 logos.' }));
        return prev;
      }
      return {
        ...prev,
        PartnerLogos: [...(prev.PartnerLogos || []), file]
      };
    });
  };

  // Cancel functionality - revert to original data
  const handleCancel = () => {
    if (originalData) {
      const revertedData: IBannerFormData = {
        _id: originalData._id || '',
        DocumentCreationDate: originalData.DocumentCreationDate || new Date(),
        DocumentModifiedDate: originalData.DocumentModifiedDate || new Date(),
        CreatedBy: originalData.CreatedBy || '',
        Title: originalData.Title || '',
        Subtitle: originalData.Subtitle || '',
        Description: originalData.Description || '',
        TemplateType: originalData.TemplateType || BannerTemplateType.GIVING_CAMPAIGN,
        LayoutStyle: originalData.LayoutStyle || LayoutStyle.SPLIT,
        TextColour: originalData.TextColour || TextColour.WHITE,
        Background: originalData.Background || {
          Type: BackgroundType.SOLID,
          Value: '#38ae8e',
          Overlay: { Colour: 'rgba(0,0,0,0.5)', Opacity: 0.5 }
        },
        CtaButtons: originalData.CtaButtons || [{
          Label: 'Learn More',
          Url: '/about',
          Variant: CTAVariant.PRIMARY,
          External: false
        }],
        IsActive: originalData.IsActive ?? true,
        Priority: originalData.Priority || 5,
        LocationSlug: originalData.LocationSlug || '',
        BadgeText: originalData.BadgeText || '',
        DonationGoal: originalData.DonationGoal || { Target: 10000, Current: 0, Currency: 'GBP' },
        UrgencyLevel: originalData.UrgencyLevel || UrgencyLevel.MEDIUM,
        StartDate: originalData.StartDate instanceof Date ? originalData.StartDate : undefined,
        EndDate: originalData.EndDate instanceof Date ? originalData.EndDate : undefined,
        CampaignEndDate: originalData.CampaignEndDate instanceof Date ? originalData.CampaignEndDate : undefined,
        ShowDates: originalData.ShowDates || false,
        CharterType: originalData.CharterType || CharterType.HOMELESS_CHARTER,
        SignatoriesCount: originalData.SignatoriesCount || 0,
        ResourceFile: originalData.ResourceFile || {
          FileUrl: '',
          ResourceType: ResourceType.GUIDE,
          DownloadCount: 0,
          FileSize: '',
          FileType: '',
          LastUpdated: undefined
        },
        // Restore original media files
        Logo: originalData.Logo || null,
        BackgroundImage: originalData.BackgroundImage || null,
        SplitImage: originalData.SplitImage || null,
        PartnerLogos: originalData.PartnerLogos || []
      };
      setFormData(revertedData);
      setErrors({});
    }
    onCancel?.();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.Title.trim()) {
      newErrors.Title = 'Title is required';
    }

    if (formData.CtaButtons.some(btn => !btn.Label.trim() || !btn.Url.trim())) {
      newErrors.CtaButtons = 'All CTA buttons must have a label and URL';
    }

        if (formData.TemplateType === BannerTemplateType.GIVING_CAMPAIGN && formData.DonationGoal && (formData.DonationGoal.Target === undefined || formData.DonationGoal.Target <= 0)) {
      newErrors.DonationTarget = 'Donation target must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const renderTemplateSpecificFields = () => {
    switch (formData.TemplateType) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Campaign Settings</h3>
            
            <FormField label="Urgency Level">
              <Select
                value={formData.UrgencyLevel}
                onChange={(e) => updateFormData('UrgencyLevel', e.target.value)}
                options={URGENCY_LEVELS}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Target Amount (£)" error={errors.DonationTarget}>
                <Input
                  type="number"
                  value={formData.DonationGoal?.Target}
                  onChange={(e) => updateFormData('DonationGoal.Target', Number(e.target.value))}
                  min={1}
                />
              </FormField>
              <FormField label="Current Amount (£)">
                <Input
                  type="number"
                  value={formData.DonationGoal?.Current}
                  onChange={(e) => updateFormData('DonationGoal.Current', Number(e.target.value))}
                  min={0}
                />
              </FormField>
            </div>
            
            <FormField label="Campaign End Date">
              <Input
                type="datetime-local"
                value={formData.CampaignEndDate ? new Date(formData.CampaignEndDate as any).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateFormData('CampaignEndDate', e.target.value ? new Date(e.target.value) : undefined)}
              />
            </FormField>
          </div>
        );

      case BannerTemplateType.PARTNERSHIP_CHARTER:
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Charter Settings</h3>
            
            <FormField label="Charter Type">
              <Select
                value={formData.CharterType}
                onChange={(e) => updateFormData('CharterType', e.target.value)}
                options={CHARTER_TYPES}
              />
            </FormField>
            
            <FormField label="Signatories Count">
              <Input
                type="number"
                value={formData.SignatoriesCount}
                onChange={(e) => updateFormData('SignatoriesCount', Number(e.target.value))}
                min={0}
              />
            </FormField>
            
            <FormField label="Partner Logos" error={errors.PartnerLogos}>
              <MediaArrayUpload
                description="Upload logos of partner organizations (max 2MB each)"
                value={formData.PartnerLogos}
                onUpload={addPartnerLogo}
                onRemove={removePartnerLogo}
                accept="image/*"
                maxSize={2 * 1024 * 1024}
              />
            </FormField>
          </div>
        );

      case BannerTemplateType.RESOURCE_PROJECT:
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Resource Settings</h3>
            
            <FormField label="Resource File">
              <div className="space-y-2">
                <input
                  type="file"
                  accept={RESOURCE_FILE_ACCEPT_STRING}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      if (!isValidResourceFileType(file.type)) {
                        alert(`Unsupported file type: ${file.type}. Please select a valid resource file.`);
                        e.target.value = ''; // Clear the input
                        return;
                      }
                      
                      // Validate file size
                      if (file.size > MAX_RESOURCE_FILE_SIZE) {
                        alert(`File too large: ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(MAX_RESOURCE_FILE_SIZE)}.`);
                        e.target.value = ''; // Clear the input
                        return;
                      }
                      
                      // Create resource file object with auto-populated metadata
                      const resourceFileData = {
                        FileUrl: '', // Will be set after upload
                        ResourceType: (formData.ResourceFile && !(formData.ResourceFile instanceof File)) 
                          ? formData.ResourceFile.ResourceType 
                          : ResourceType.GUIDE,
                        DownloadCount: 0, // Always start at 0 for new files
                        FileSize: formatFileSize(file.size),
                        FileType: getFileTypeFromMimeType(file.type),
                        LastUpdated: new Date()
                      };
                      
                      // Store the file object for upload, but also store metadata
                      updateFormData('ResourceFile', file);
                      
                      // Update form data with auto-populated fields (for display purposes)
                      setFormData(prev => ({
                        ...prev,
                        ResourceFile: file,
                        // Store metadata separately for form display
                        _resourceFileMetadata: resourceFileData
                      }));
                    }
                  }}
                  className="block w-full text-sm text-brand-k file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-a file:text-white hover:file:bg-brand-b"
                />
                {formData.ResourceFile && !(formData.ResourceFile instanceof File) && (
                  <div className="flex items-center justify-between p-2 bg-brand-q rounded">
                    <span className="text-sm text-brand-k">Current: {formData.ResourceFile.FileUrl}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateFormData('ResourceFile', null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                {formData.ResourceFile instanceof File && (
                  <div className="flex items-center justify-between p-2 bg-brand-q rounded">
                    <span className="text-sm text-brand-k">Selected: {formData.ResourceFile.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateFormData('ResourceFile', null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </FormField>
            
            <FormField label="Resource Type">
              <Select
                value={(formData.ResourceFile && !(formData.ResourceFile instanceof File)) ? formData.ResourceFile.ResourceType || '' : ''}
                onChange={(e) => {
                  if (formData.ResourceFile && !(formData.ResourceFile instanceof File)) {
                    updateFormData('ResourceFile', { 
                      ...formData.ResourceFile, 
                      ResourceType: e.target.value 
                    });
                  }
                }}
                options={RESOURCE_TYPES}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="File Size">
                <Input
                  value={
                    formData.ResourceFile instanceof File 
                      ? (formData as any)._resourceFileMetadata?.FileSize || formatFileSize(formData.ResourceFile.size)
                      : (formData.ResourceFile && !(formData.ResourceFile instanceof File)) 
                        ? formData.ResourceFile.FileSize || '' 
                        : ''
                  }
                  disabled={formData.ResourceFile instanceof File}
                  onChange={(e) => {
                    if (formData.ResourceFile && !(formData.ResourceFile instanceof File)) {
                      updateFormData('ResourceFile', { 
                        ...formData.ResourceFile, 
                        FileSize: e.target.value 
                      });
                    }
                  }}
                  placeholder="e.g., 2.5 MB"
                />
              </FormField>
              <FormField label="File Type">
                <Input
                  value={
                    formData.ResourceFile instanceof File 
                      ? (formData as any)._resourceFileMetadata?.FileType || getFileTypeFromMimeType(formData.ResourceFile.type)
                      : (formData.ResourceFile && !(formData.ResourceFile instanceof File)) 
                        ? formData.ResourceFile.FileType || '' 
                        : ''
                  }
                  disabled={formData.ResourceFile instanceof File}
                  onChange={(e) => {
                    if (formData.ResourceFile && !(formData.ResourceFile instanceof File)) {
                      updateFormData('ResourceFile', { 
                        ...formData.ResourceFile, 
                        FileType: e.target.value 
                      });
                    }
                  }}
                  placeholder="e.g., PDF"
                />
              </FormField>
            </div>
            
            <FormField label="Download Count">
              <Input
                type="number"
                value={(formData.ResourceFile && !(formData.ResourceFile instanceof File)) ? formData.ResourceFile.DownloadCount || 0 : 0}
                disabled={true}
                min={0}
                className="bg-gray-50 cursor-not-allowed"
              />
            </FormField>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="card-header border-b border-brand-q">
        <h2 className="heading-4">Banner Editor</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="card-content space-y-6">
        {/* Basic Content */}
        <div className="space-y-4">
          <h3 className="heading-5 border-b border-brand-q pb-2 pt-4">Basic Information</h3>
          <FormField label="Banner Type *">
            <Select
              value={formData.TemplateType}
              onChange={(e) => updateFormData('TemplateType', e.target.value)}
              options={TEMPLATE_TYPES}
            />
          </FormField>

          <FormField label="Title *" error={errors.Title}>
            <Input
              value={formData.Title}
              onChange={(e) => updateFormData('Title', e.target.value)}
              maxLength={200}
              required
            />
          </FormField>
          
          <FormField label="Subtitle">
            <Input
              value={formData.Subtitle}
              onChange={(e) => updateFormData('Subtitle', e.target.value)}
              maxLength={300}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea
              value={formData.Description}
              onChange={(e) => updateFormData('Description', e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </FormField>
        </div>

        {/* Media Assets */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Media Assets</h3>
          
          <MediaUpload
            label="Logo"
            value={formData.Logo}
            onUpload={(file) => updateFormData('Logo', file)}
            onRemove={() => removeFile('Logo')}
            accept="image/*"
            maxSize={2 * 1024 * 1024}
          />
          
          <MediaUpload
            label="Background Image"
            value={formData.BackgroundImage}
            onUpload={(file) => updateFormData('BackgroundImage', file)}
            onRemove={() => removeFile('BackgroundImage')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          />
          
          <MediaUpload
            label="Split Layout Image"
            description="Separate image displayed in split layout (not used as background)"
            value={formData.SplitImage}
            onUpload={(file) => updateFormData('SplitImage', file)}
            onRemove={() => removeFile('SplitImage')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          />
        </div>

        {/* Styling Options */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Styling Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Layout Style">
              <Select
                value={formData.LayoutStyle}
                onChange={(e) => updateFormData('LayoutStyle', e.target.value)}
                options={LAYOUT_STYLES}
              />
            </FormField>
            
            <FormField label="Text Color">
              <Select
                value={formData.TextColour}
                onChange={(e) => updateFormData('TextColour', e.target.value)}
                options={TEXT_COLOURS}
              />
            </FormField>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Type</label>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateFormData('Background.Type', type.value)}
                  className={`btn-base btn-sm ${
                    formData.Background.Type === type.value
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {formData.Background.Type === BackgroundType.SOLID && (
            <FormField label="Background Color">
              <Input
                type="color"
                value={formData.Background.Value}
                onChange={(e) => updateFormData('Background.Value', e.target.value)}
                className="h-10"
              />
            </FormField>
          )}
          
          {formData.Background.Type === BackgroundType.GRADIENT && (
            <FormField label="CSS Gradient">
              <Input
                value={formData.Background.Value}
                onChange={(e) => updateFormData('Background.Value', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </FormField>
          )}
          
          <FormField label="Badge Text">
            <Input
              value={formData.BadgeText}
              onChange={(e) => updateFormData('BadgeText', e.target.value)}
              maxLength={50}
            />
          </FormField>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <div className="flex justify-between items-center">
            <h3 className="heading-5">Call-to-Action Buttons</h3>
            {formData.CtaButtons.length < 3 && (
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
            {formData.CtaButtons.map((button, index) => (
              <div key={index} className="card-compact border border-brand-q">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField label="Button Label">
                    <Input
                      value={button.Label}
                      onChange={(e) => updateCTAButton(index, 'Label', e.target.value)}
                      placeholder="Learn More"
                    />
                  </FormField>
                  <FormField label="Button URL">
                    <Input
                      value={button.Url}
                      onChange={(e) => updateCTAButton(index, 'Url', e.target.value)}
                      placeholder="/about"
                    />
                  </FormField>
                </div>
                <div className="flex justify-between items-center">
                  <FormField label="Button Style">
                    <Select
                      value={button.Variant}
                      onChange={(e) => updateCTAButton(index, 'Variant', (e.target as HTMLSelectElement).value as any)}
                      options={CTA_VARIANTS}
                    />
                  </FormField>
                  {formData.CtaButtons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCTAButton(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
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

        {/* Template-specific fields */}
        {renderTemplateSpecificFields()}

        {/* Publishing Options */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Publishing Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location">
              <select
                id="locationSlug"
                className="form-input"
                value={formData.LocationSlug}
                onChange={(e) => updateFormData('LocationSlug', e.target.value)}
              >
                <option value="general">All Locations</option>
                {cities.map(city => (
                  <option key={city.Key} value={city.Key}>{city.Name}</option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Priority (1-10)">
              <Input
                type="number"
                value={formData.Priority}
                onChange={(e) => updateFormData('Priority', Number(e.target.value))}
                min={1}
                max={10}
              />
            </FormField>
          </div>
          
          <Checkbox
            label="Active (visible to users)"
            checked={formData.IsActive}
            onChange={(e) => updateFormData('IsActive', (e.target as HTMLInputElement).checked)}
          />

          <div className="border-t border-brand-q pt-4">
            <h4 className="heading-6 pb-2">Scheduling</h4>
            <Checkbox
              label="Enable visibility date range"
              checked={formData.ShowDates}
              onChange={(e) => updateFormData('ShowDates', (e.target as HTMLInputElement).checked)}
            />
            {formData.ShowDates && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField label="Start Date">
                  <Input
                    type="datetime-local"
                    value={formData.StartDate ? new Date(formData.StartDate as any).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFormData('StartDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="datetime-local"
                    value={formData.EndDate ? new Date(formData.EndDate as any).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFormData('EndDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormField>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="card-footer">
          {onCancel && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </Button>
        </div>
      </form>
    </div>
  );
}
export type { IBannerFormData };

