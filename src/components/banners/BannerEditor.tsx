'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { MediaUpload, MediaArrayUpload } from '@/components/ui/MediaUpload';
import { FormField } from '@/components/ui/FormField';
import type { ICity, ICTAButton, IResourceFile, IMediaAsset } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, Trash } from 'lucide-react';
import { BannerTemplateType, UrgencyLevel, CharterType, ResourceType, IBannerFormData, LayoutStyle, TextColour, BackgroundType, CTAVariant } from '@/types';
import { RESOURCE_FILE_ACCEPT_STRING, MAX_RESOURCE_FILE_SIZE, getFileTypeFromMimeType, isValidResourceFileType } from '@/types/IResourceFile';
import { errorToast } from '@/utils/toast';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  onCancel?: () => void;
  errorMessage?: string | null;
  validationErrors?: IValidationError[];
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


export function BannerEditor({ initialData, onDataChange, onSave, saving = false, errorMessage, validationErrors = [] }: BannerEditorProps) {
  const [cities, setCities] = useState<ICity[]>([]);
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);
  const [originalData, setOriginalData] = useState<Partial<IBannerFormData> | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        const result = await response.json();
        if (result.success) {
          setCities(result.data);
        } else {
          errorToast.load('cities data');
        }
      } catch {
        errorToast.load('cities data');
      }
    }
    fetchCities();
  }, []);

  // Define default form data - used for both initialization and cancel on create
  const getDefaultFormData = (): IBannerFormData => ({
    Title: 'Title',
    Subtitle: 'Subtitle',
    Description: 'Description',
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
        Label: 'Click',
        Url: '/',
        Variant: CTAVariant.PRIMARY,
        External: false
      }
    ],
    IsActive: true,
    Priority: 5,
    LocationSlug: 'general',
    BadgeText: 'Badge text',
    GivingCampaign: {
      UrgencyLevel: UrgencyLevel.MEDIUM,
      CampaignEndDate: undefined,
      DonationGoal: {
        Target: 10000,
        Current: 5000,
        Currency: 'GBP'
      }
    },
    PartnershipCharter: {
      CharterType: CharterType.HOMELESS_CHARTER,
      SignatoriesCount: 1,
      PartnerLogos: []
    },
    ResourceProject: {
      ResourceFile: {
        FileUrl: '',
        ResourceType: ResourceType.GUIDE,
        DownloadCount: 0,
        LastUpdated: new Date(),
        FileSize: '',
        FileType: '',
      } as IResourceFile
    },
    StartDate: undefined,
    EndDate: undefined,
    ShowDates: false,
    _id: '',
  });

  // Store original data for cancel functionality
  useEffect(() => {
    if (initialData && !originalData) {
      setOriginalData(initialData);
    }
  }, [initialData, originalData]);

  const [formData, setFormData] = useState<IBannerFormData>(() => {
    const defaults = getDefaultFormData();

    // If no initialData, just return defaults
    if (!initialData || Object.keys(initialData).length === 0) {
      return defaults;
    }

    // Safely merge initialData with defaults
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
      GivingCampaign: initialData.GivingCampaign ? {
        ...defaults.GivingCampaign,
        ...initialData.GivingCampaign,
        DonationGoal: initialData.GivingCampaign.DonationGoal ? {
          ...defaults.GivingCampaign?.DonationGoal,
          ...initialData.GivingCampaign.DonationGoal,
        } : defaults.GivingCampaign?.DonationGoal,
      } : defaults.GivingCampaign,
      PartnershipCharter: initialData.PartnershipCharter ? {
        ...defaults.PartnershipCharter,
        ...initialData.PartnershipCharter,
      } : defaults.PartnershipCharter,
      ResourceProject: initialData.ResourceProject ? {
        ...defaults.ResourceProject,
        ...initialData.ResourceProject,
      } : defaults.ResourceProject,
      CtaButtons: initialData?.CtaButtons ?? defaults.CtaButtons,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  useEffect(() => {
    // Clear all errors when the template type changes as they may no longer be relevant.
    setErrors({});
  }, [formData.TemplateType]);

  const updateFormData = (path: string, value: unknown) => {
    setFormData(prev => {
      const keys = path.split('.');
      // Start with a shallow copy of the root (object expected for IBannerFormData)
      const newData: IBannerFormData = { ...(prev as IBannerFormData) };
      // Walk the path, cloning each branch as we go using indexable records
      let current: Record<string, unknown> = newData as unknown as Record<string, unknown>;
      let source: Record<string, unknown> = prev as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextSource = source[key] as unknown;
        // Clone arrays vs objects appropriately to maintain immutability
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

  // File management functions
  const removeFile = (fieldName: 'Logo' | 'BackgroundImage' | 'MainImage' | 'AccentGraphic') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const removePartnerLogo = (index: number) => {
    setFormData(prev => {
      const newLogos = prev.PartnershipCharter?.PartnerLogos?.filter((_: IMediaAsset | File, i: number) => i !== index) || [];
      
      // If removing a logo brings the count below the max, clear the specific error.
      if (newLogos.length < 5) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.PartnerLogos;
          return newErrors;
        });
      }

      return {
        ...prev,
        PartnershipCharter: {
          ...prev.PartnershipCharter,
          PartnerLogos: newLogos
        }
      };
    });
  };

  const addPartnerLogo = (file: File) => {
    setFormData(prev => {
      if ((prev.PartnershipCharter?.PartnerLogos?.length || 0) >= 5) {
        // Optionally, set an error message to inform the user
        setErrors(e => ({ ...e, PartnerLogos: 'You can only upload a maximum of 5 logos.' }));
        return prev;
      }
      return {
        ...prev,
        PartnershipCharter: {
          ...prev.PartnershipCharter,
          PartnerLogos: [...(prev.PartnershipCharter?.PartnerLogos || []), file]
        }
      };
    });
  };

  // Cancel functionality - revert to original data (edit) or defaults (create)
  const handleCancel = () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel? All unsaved changes will be lost.'
    );
    
    if (confirmCancel) {
      if (originalData && Object.keys(originalData).length > 0) {
        // Edit mode: restore the original data
        setFormData({ ...originalData } as IBannerFormData);
      } else {
        // Create mode: reset to defaults
        setFormData(getDefaultFormData());
      }
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.Title.trim()) {
      newErrors.Title = 'Title is required';
    }

    if ((formData.CtaButtons?.length ?? 0) > 0 && (formData.CtaButtons ?? []).some(btn => !btn.Label.trim() || !btn.Url.trim())) {
      newErrors.CtaButtons = 'All CTA buttons must have a label and URL';
    }

    if (formData.TemplateType === BannerTemplateType.GIVING_CAMPAIGN && formData.GivingCampaign?.DonationGoal && (formData.GivingCampaign.DonationGoal.Target === undefined || formData.GivingCampaign.DonationGoal.Target <= 0)) {
      newErrors.DonationTarget = 'Donation target must be greater than 0';
    }

    // Require a resource file for Resource Project banners
    if (formData.TemplateType === BannerTemplateType.RESOURCE_PROJECT) {
      const rf = formData.ResourceProject?.ResourceFile;
      const hasNewFile = typeof rf === 'object' && rf !== null && 'File' in (rf as Record<string, unknown>) && (rf as { File?: unknown }).File instanceof File;
      const hasExistingUrl = !!(rf && typeof rf === 'object' && !('File' in (rf as Record<string, unknown>)) && (rf as { FileUrl?: string }).FileUrl);
      if (!hasNewFile && !hasExistingUrl) {
        newErrors.ResourceFile = 'Resource file is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cleanTemplateData = (data: IBannerFormData): IBannerFormData => {
    const cleanedData: Partial<IBannerFormData> = { ...data };

    switch (data.TemplateType) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        delete cleanedData.PartnershipCharter;
        delete cleanedData.ResourceProject;
        break;
      case BannerTemplateType.PARTNERSHIP_CHARTER:
        delete cleanedData.GivingCampaign;
        delete cleanedData.ResourceProject;
        break;
      case BannerTemplateType.RESOURCE_PROJECT:
        delete cleanedData.GivingCampaign;
        delete cleanedData.PartnershipCharter;
        break;
      default: {
        // This should never happen as TemplateType is required and validated
        const errorMessage = `Unexpected template type: ${data.TemplateType}`;
        errorToast.generic(errorMessage);
        throw new Error(errorMessage);
      }
    }

    return cleanedData as IBannerFormData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const cleanedData = cleanTemplateData(formData);
      onSave(cleanedData);
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
                value={formData.GivingCampaign?.UrgencyLevel}
                onChange={(e) => updateFormData('GivingCampaign.UrgencyLevel', e.target.value)}
                options={URGENCY_LEVELS}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Target Amount (£)" error={errors.DonationTarget}>
                <Input
                  type="number"
                  value={formData.GivingCampaign?.DonationGoal?.Target}
                  onChange={(e) => updateFormData('GivingCampaign.DonationGoal.Target', Number(e.target.value))}
                  min={1}
                />
              </FormField>
              <FormField label="Current Amount (£)">
                <Input
                  type="number"
                  value={formData.GivingCampaign?.DonationGoal?.Current}
                  onChange={(e) => updateFormData('GivingCampaign.DonationGoal.Current', Number(e.target.value))}
                  min={0}
                />
              </FormField>
            </div>
            
            <FormField label="Campaign End Date">
              <Input
                type="datetime-local"
                min={minDateTime}
                value={
                  formData.GivingCampaign?.CampaignEndDate
                    ? new Date(formData.GivingCampaign.CampaignEndDate).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => updateFormData('GivingCampaign.CampaignEndDate', e.target.value ? new Date(e.target.value) : undefined)}
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
                value={formData.PartnershipCharter?.CharterType}
                onChange={(e) => updateFormData('PartnershipCharter.CharterType', e.target.value)}
                options={CHARTER_TYPES}
              />
            </FormField>
            
            <FormField label="Signatories Count">
              <Input
                type="number"
                value={formData.PartnershipCharter?.SignatoriesCount}
                onChange={(e) => updateFormData('PartnershipCharter.SignatoriesCount', Number(e.target.value))}
                min={0}
              />
            </FormField>
            
            <FormField label="Partner Logos" error={errors.PartnerLogos}>
              <MediaArrayUpload
                description="Upload logos of partner organizations (max 5MB each)"
                value={formData.PartnershipCharter?.PartnerLogos}
                onUpload={addPartnerLogo}
                onRemove={removePartnerLogo}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
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
                      if (!isValidResourceFileType(file.type)) {
                        errorToast.fileType('PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, TXT, RTF, JPG, PNG, GIF, WEBP, SVG, ZIP, RAR, 7Z, JSON, XML');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > MAX_RESOURCE_FILE_SIZE) {
                        errorToast.fileSize(formatFileSize(MAX_RESOURCE_FILE_SIZE));
                        e.target.value = '';
                        return;
                      }
                      const newResourceFile: IResourceFile = {
                        // Keep existing metadata like ResourceType, but reset others
                        ResourceType: (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) 
                          ? formData.ResourceProject.ResourceFile.ResourceType 
                          : ResourceType.GUIDE,
                        FileName: file.name, // Auto-populate FileName
                        LastUpdated: new Date(),
                        FileSize: formatFileSize(file.size),
                        FileType: getFileTypeFromMimeType(file.type) || 'unknown',
                        DownloadCount: 0,
                      };
                      // Update the state with an object that includes both the metadata and the file
                      updateFormData('ResourceProject.ResourceFile', { ...newResourceFile, File: file });
                      
                      // Clear any existing ResourceFile validation error
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.ResourceFile;
                        return newErrors;
                      });
                    }
                  }}
                  className="block w-full text-sm text-brand-k file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-a file:text-white hover:file:bg-brand-b"
                />
                {formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File) && formData.ResourceProject.ResourceFile !== null && formData.ResourceProject.ResourceFile.FileUrl && (
                  <div className="flex items-center justify-between p-2 bg-brand-q rounded">
                    <span className="text-sm text-brand-k">Current: {formData.ResourceProject?.ResourceFile?.FileUrl}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateFormData('ResourceProject.ResourceFile', null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                {formData.ResourceProject?.ResourceFile instanceof File && (
                  <div className="flex items-center justify-between p-2 bg-brand-q rounded">
                    <span className="text-sm text-brand-k">Selected: {(formData.ResourceProject?.ResourceFile as File)?.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateFormData('ResourceProject.ResourceFile', null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="File Name">
              <Input
                value={
                  formData.ResourceProject?.ResourceFile instanceof File 
                    ? (formData.ResourceProject.ResourceFile as File).name
                    : (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) 
                      ? formData.ResourceProject.ResourceFile.FileName || '' 
                      : ''
                }
                disabled={formData.ResourceProject?.ResourceFile instanceof File}
                onChange={(e) => {
                  if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                    updateFormData('ResourceProject.ResourceFile', { 
                      ...formData.ResourceProject.ResourceFile, 
                      FileName: e.target.value 
                    });
                  }
                }}
                placeholder="e.g., Annual Report 2024.pdf"
              />
            </FormField>
            
            <FormField label="Resource Type">
              <Select
                value={(formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) ? formData.ResourceProject.ResourceFile.ResourceType || '' : ''}
                onChange={(e) => {
                  if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                    updateFormData('ResourceProject.ResourceFile', { 
                      ...formData.ResourceProject.ResourceFile, 
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
                    formData.ResourceProject?.ResourceFile instanceof File 
                      ? formatFileSize((formData.ResourceProject.ResourceFile as File).size)
                      : (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) 
                        ? formData.ResourceProject.ResourceFile.FileSize || '' 
                        : ''
                  }
                  disabled={formData.ResourceProject?.ResourceFile instanceof File}
                  onChange={(e) => {
                    if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                      updateFormData('ResourceProject.ResourceFile', { 
                        ...formData.ResourceProject.ResourceFile, 
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
                    formData.ResourceProject?.ResourceFile instanceof File 
                      ? getFileTypeFromMimeType((formData.ResourceProject.ResourceFile as File).type) || ''
                      : (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) 
                        ? formData.ResourceProject.ResourceFile.FileType || '' 
                        : ''
                  }
                  disabled={formData.ResourceProject?.ResourceFile instanceof File}
                  onChange={(e) => {
                    if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                      updateFormData('ResourceProject.ResourceFile', { 
                        ...formData.ResourceProject.ResourceFile, 
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
                value={(formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) ? formData.ResourceProject.ResourceFile.DownloadCount || 0 : 0}
                disabled={true}
                min={0}
                className="bg-gray-50 cursor-not-allowed"
              />
            </FormField>

            <FormField label="Last Updated">
              <Input
                type="datetime-local"
                value={(
                  (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File) && formData.ResourceProject.ResourceFile.LastUpdated)
                    ? new Date(formData.ResourceProject.ResourceFile.LastUpdated).toISOString().slice(0, 16)
                    : ''
                )}
                onChange={(e) => {
                  if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                    updateFormData('ResourceProject.ResourceFile.LastUpdated', e.target.value ? new Date(e.target.value) : undefined);
                  }
                }}
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
              maxLength={50}
              required
            />
          </FormField>
          
          <FormField label="Subtitle">
            <Input
              value={formData.Subtitle}
              onChange={(e) => updateFormData('Subtitle', e.target.value)}
              maxLength={50}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea
              value={formData.Description}
              onChange={(e) => updateFormData('Description', e.target.value)}
              rows={2}
              maxLength={200}
            />
          </FormField>
        </div>

        {/* Media Assets */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Media Assets</h3>
          
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
          
          <MediaUpload
            label="Logo"
            value={formData.Logo}
            onUpload={(file) => updateFormData('Logo', file)}
            onRemove={() => removeFile('Logo')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          />
          
          <MediaUpload
            label="Background Image"
            value={formData.BackgroundImage}
            onUpload={(file) => updateFormData('BackgroundImage', file)}
            onRemove={() => removeFile('BackgroundImage')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          />

            
          {/* TODO: Uncomment if AccentGraphic is needed. In the other case, remove. */}
          {/* <MediaUpload
            label="Accent Graphic"
            value={formData.AccentGraphic}
            onUpload={(file) => {
              const newAccentGraphic = {
                Filename: file.name,
                Alt: file.name,
                Size: file.size,
                File: file, // Keep the file object for upload
                Position: 'top-left', // Default position
                Opacity: 0.6 // Default opacity
              };
              updateFormData('AccentGraphic', newAccentGraphic);
            }}
            onRemove={() => removeFile('AccentGraphic')}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
          /> */}
          
          {/* Accent Graphic Controls */}
          {/* {formData.AccentGraphic && (
            <div className="ml-4 p-4 bg-brand-i rounded-md space-y-4">
              <h4 className="heading-6">Accent Graphic Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Position">
                  <Select
                    value={(formData.AccentGraphic && !(formData.AccentGraphic instanceof File)) ? formData.AccentGraphic.Position || 'top-left' : 'top-left'}
                    onChange={(e) => updateFormData('AccentGraphic.Position', e.target.value)}
                    options={[
                      { value: 'top-left', label: 'Top Left' },
                      { value: 'top-right', label: 'Top Right' },
                      { value: 'bottom-left', label: 'Bottom Left' },
                      { value: 'bottom-right', label: 'Bottom Right' },
                      { value: 'center', label: 'Center' }
                    ]}
                  />
                </FormField>
                <FormField label="Opacity">
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(formData.AccentGraphic && !(formData.AccentGraphic instanceof File)) ? formData.AccentGraphic.Opacity || 0.6 : 0.6}
                    onChange={(e) => updateFormData('AccentGraphic.Opacity', parseFloat(e.target.value))}
                  />
                </FormField>
              </div>
            </div>
          )} */}
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
              maxLength={25}
            />
          </FormField>
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
            {(formData.CtaButtons ?? []).map((button, index) => {
              const isShowAutomaticallyPopulatedUrl = index === 0 && formData.TemplateType === BannerTemplateType.RESOURCE_PROJECT;

              return (
                <div key={index} className="card-compact border border-brand-q">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <FormField label="Button Label">
                      <Input
                        value={button.Label}
                        onChange={(e) => updateCTAButton(index, 'Label', e.target.value)}
                        placeholder="Click"
                      />
                    </FormField>
                    <FormField label="Button URL">
                      <Input
                        value={button.Url}
                        onChange={(e) => updateCTAButton(index, 'Url', e.target.value)}
                        placeholder="/url"
                        disabled={button.AutomaticallyPopulatedUrl === true}
                        className={button.AutomaticallyPopulatedUrl ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
                      />
                    </FormField>
                  </div>
                  <div className="flex justify-between items-center">
                    <FormField label="Button Style">
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
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <Checkbox
                      label="External link (opens in new tab)"
                      checked={button.External}
                      onChange={(e) => updateCTAButton(index, 'External', (e.target as HTMLInputElement).checked)}
                    />
                    {isShowAutomaticallyPopulatedUrl && (
                      <Checkbox
                        label="Automatically populate Url"
                        checked={button.AutomaticallyPopulatedUrl || false}
                        onChange={(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          updateCTAButton(index, 'AutomaticallyPopulatedUrl', checked);
                          if (checked) {
                            updateCTAButton(index, 'Url', '/');
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
                className="form-input border border-brand-q text-brand-k bg-white"
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
                    min={minDateTime}
                    value={formData.StartDate ? new Date(formData.StartDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFormData('StartDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="datetime-local"
                    min={minDateTime}
                    value={formData.EndDate ? new Date(formData.EndDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFormData('EndDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormField>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="card-footer">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </Button>
        </div>

        {/* Error Messages under Save Button */}
        {(errorMessage || Object.keys(errors).length > 0 || validationErrors.length > 0) && (
          <div className="mt-4 card card-compact border-brand-g bg-red-50">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-small font-medium text-brand-g">Error</h3>
                {errorMessage && (
                  <div className="mt-2 text-small text-brand-g">{errorMessage}</div>
                )}
                {Object.keys(errors).length > 0 && (
                  <ul className="mt-2 text-small text-brand-g list-disc list-inside">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {message}
                      </li>
                    ))}
                  </ul>
                )}
                {validationErrors.length > 0 && (
                  <ul className="mt-2 text-small text-brand-g list-disc list-inside">
                    {validationErrors.map((err, index) => (
                      <li key={index}>
                        <strong>{err.path}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
export type { IBannerFormData };
