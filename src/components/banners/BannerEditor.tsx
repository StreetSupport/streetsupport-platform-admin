'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MediaUpload, MediaArrayUpload } from '@/components/ui/MediaUpload';
import { FormField } from '@/components/ui/FormField';
import type { ICity, ICTAButton, IResourceFile, IMediaAsset } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, Trash } from 'lucide-react';
import { BannerTemplateType, UrgencyLevel, CharterType, ResourceType, IBannerFormData, LayoutStyle, TextColour, BackgroundType, CTAVariant } from '@/types';
import { RESOURCE_FILE_ACCEPT_STRING, MAX_RESOURCE_FILE_SIZE, getFileTypeFromMimeType, isValidResourceFileType } from '@/types/banners/IResourceFile';
import { errorToast } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

// Resource file mode enum
enum ResourceFileMode {
  UPLOAD = 'upload',
  MANUAL = 'manual'
}

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
  onCancel: () => void;
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


export function BannerEditor({ initialData, onDataChange, onSave, saving = false, onCancel, errorMessage, validationErrors = [] }: BannerEditorProps) {
  const [cities, setCities] = useState<ICity[]>([]);
  const [resourceFileMode, setResourceFileMode] = useState<ResourceFileMode>(ResourceFileMode.UPLOAD); // Toggle between upload file or manual URL
  const emptyResourceFile = {
        FileUrl: '',
        ResourceType: ResourceType.GUIDE,
        DownloadCount: 0,
        LastUpdated: new Date(),
        FileSize: '',
        FileType: '',
      } as IResourceFile;

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

  // Define default form data - used for both initialization and cancel on create
  const getDefaultFormData = (): IBannerFormData => {
    const templateType = initialData?.TemplateType || BannerTemplateType.GIVING_CAMPAIGN;
    
    return {
      Title: 'Title',
      Subtitle: 'Subtitle',
      Description: 'Description',
      TemplateType: templateType,
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
          Label: templateType === BannerTemplateType.RESOURCE_PROJECT ? 'Download' : 'Click',
          Url: '/',
          Variant: CTAVariant.PRIMARY,
          External: false
        }
      ],
    IsActive: true,
    Priority: 5,
    LocationSlug: '',
    LocationName: '',
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
        ResourceFile: emptyResourceFile
      },
      StartDate: undefined,
      EndDate: undefined,
      ShowDates: false,
      _id: '',
    };
  };

  
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

  // Store original data from formData for cancel comparison
  // Use useRef to store the initial data without re-running
  const originalDataRef = useRef(JSON.parse(JSON.stringify(formData)));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  useEffect(() => {
    // Clear all errors when the template type changes as they may no longer be relevant.
    setErrors({});
  }, [formData.TemplateType]);

  const handleTemplateTypeChange = (newTemplateType: BannerTemplateType, currentData: IBannerFormData): IBannerFormData => {
    const newData = { ...currentData };
    
    // Handle change from RESOURCE_PROJECT to another type
    if (currentData.TemplateType === BannerTemplateType.RESOURCE_PROJECT && 
        newTemplateType !== BannerTemplateType.RESOURCE_PROJECT) {
      
      // Clear the ResourceProject section (which includes the resource file)
      if (newData.ResourceProject) {
        // Log the file URL that would be cleaned up on the server side
        // Check if ResourceFile exists and is not a File object (i.e., it's an IResourceFile with FileUrl)
        // Resource file cleanup is handled on the server side
        // Clear the ResourceProject section immediately for UI feedback
        delete newData.ResourceProject;
      }
      
      // Remove first CTA button if it contains a blob URL
      if (newData.CtaButtons && Array.isArray(newData.CtaButtons) && newData.CtaButtons.length > 0) {
        const firstButton = newData.CtaButtons[0];
        if (firstButton?.Url && firstButton.Url.includes('blob.core.windows.net')) {
          // Remove the first CTA button with blob URL
          newData.CtaButtons = newData.CtaButtons.slice(1);
        }
      }
    }
    
    // Handle change TO RESOURCE_PROJECT - ensure required CTA button exists
    if (currentData.TemplateType !== BannerTemplateType.RESOURCE_PROJECT && 
        newTemplateType === BannerTemplateType.RESOURCE_PROJECT) {
      
      // Ensure CtaButtons array exists and has at least 1 button for RESOURCE_PROJECT
      if (!newData.CtaButtons || newData.CtaButtons.length === 0) {
        newData.CtaButtons = [{
          Label: 'Download',
          Url: '/',
          Variant: CTAVariant.PRIMARY,
          External: false
        }];
      }
    }
    
    return newData;
  };

  const updateFormData = (path: string, value: unknown) => {
    setFormData(prev => {
      const keys = path.split('.');
      // Start with a shallow copy of the root (object expected for IBannerFormData)
      let newData: IBannerFormData = { ...(prev as IBannerFormData) };
      
      // Handle template type change specifically
      if (path === 'TemplateType') {
        const newTemplateType = value as BannerTemplateType;
        newData = handleTemplateTypeChange(newTemplateType, newData);
      }
      
      // Handle background type change: when switching away from IMAGE, reset Background.Value
      if (path === 'Background.Type') {
        debugger
        const newBackgroundType = value as BackgroundType;
        const previousBackgroundType = (prev as IBannerFormData).Background.Type;

        if (previousBackgroundType === BackgroundType.IMAGE && newBackgroundType !== BackgroundType.IMAGE) {
          newData.Background.Value = '#38ae8e';
        }
      }
      
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
    setFormData(prev => {
      // Prevent removing the last button for RESOURCE_PROJECT templates
      if (prev.TemplateType === BannerTemplateType.RESOURCE_PROJECT && 
          (prev.CtaButtons?.length ?? 0) <= 1) {
        return prev; // Don't allow removal
      }
      
      return {
        ...prev,
        CtaButtons: (prev.CtaButtons ?? []).filter((_, i) => i !== index)
      };
    });
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
  const removeFile = (fieldName: 'Logo' | 'BackgroundImage' | 'MainImage') => {
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
        setErrors(e => ({ ...e, 'Partner Logos': 'You can only upload a maximum of 5 logos.' }));
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
    // Helper to check if object contains any File objects
    const hasFileObjects = (obj: unknown): boolean => {
      if (obj instanceof File) return true;
      if (Array.isArray(obj)) return obj.some(hasFileObjects);
      if (obj && typeof obj === 'object') {
        return Object.values(obj as Record<string, unknown>).some(hasFileObjects);
      }
      return false;
    };
    
    // If current data has any File objects, that's automatically a change
    if (hasFileObjects(formData)) {
      setShowConfirmModal(true);
      return;
    }
    
    // Check if images were removed (had value in original, null in current)
    const imageFields = ['Logo', 'BackgroundImage', 'MainImage'] as const;
    for (const field of imageFields) {
      const originalValue = originalDataRef.current[field];
      const currentValue = formData[field];
      if (originalValue && !currentValue) {
        setShowConfirmModal(true);
        return;
      }
    }
    
    // No file changes, compare other data
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
    const cleanedData = cleanTemplateData(formData);
    onSave(cleanedData);
  };

  const renderTemplateSpecificFields = () => {
    switch (formData.TemplateType) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Campaign Settings</h3>
            
            <FormField label="Urgency Level" required>
              <Select
                value={formData.GivingCampaign?.UrgencyLevel}
                onChange={(e) => updateFormData('GivingCampaign.UrgencyLevel', e.target.value)}
                options={URGENCY_LEVELS}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Target Amount (£)" error={errors.DonationTarget} required>
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
                type="date"
                value={
                  formData.GivingCampaign?.CampaignEndDate
                    ? new Date(formData.GivingCampaign.CampaignEndDate).toISOString().split('T')[0]
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
            
            <FormField label="Charter Type" required>
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

      case BannerTemplateType.RESOURCE_PROJECT: {
        // Check if we have an uploaded file (File object or object with File property)
        const hasUploadedFile = formData.ResourceProject?.ResourceFile instanceof File || 
          (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'File' in formData.ResourceProject.ResourceFile);
        
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Resource Settings</h3>
            
            {/* Radio buttons to choose between upload and manual URL */}
            <FormField label="Upload file or provide link to file">
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceFileMode"
                    value={ResourceFileMode.UPLOAD}
                    checked={resourceFileMode === ResourceFileMode.UPLOAD}
                    onChange={() => setResourceFileMode(ResourceFileMode.UPLOAD)}
                    className="w-4 h-4 text-brand-a focus:ring-brand-a"
                  />
                  <span className="text-sm text-brand-k">Upload file</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceFileMode"
                    value={ResourceFileMode.MANUAL}
                    checked={resourceFileMode === ResourceFileMode.MANUAL}
                    onChange={() => {
                      setResourceFileMode(ResourceFileMode.MANUAL);
                      // Clear the uploaded file if switching to manual mode
                      if (hasUploadedFile) {
                        updateFormData('ResourceProject.ResourceFile', emptyResourceFile);
                      }
                    }}
                    className="w-4 h-4 text-brand-a focus:ring-brand-a"
                  />
                  <span className="text-sm text-brand-k">Add link to file</span>
                </label>
              </div>
            </FormField>

            {/* File Upload Section - only show when "Upload file" is selected */}
            {resourceFileMode === ResourceFileMode.UPLOAD && (
              <div className="space-y-3">
                <FormField label="Resource File">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label 
                        htmlFor="resource-file"
                        className="btn-base btn-primary btn-md cursor-pointer inline-flex items-center"
                      >
                        Choose File
                      </label>
                      <Input
                        type="file"
                        id="resource-file"
                        accept={RESOURCE_FILE_ACCEPT_STRING}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!isValidResourceFileType(file.type)) {
                              errorToast.fileType('PDF, DOT, DOC, XLS, PPT, MP3, M4V, MP4, ZIP, JPG, JPEG, JFIF, PJP, PJPEG, PNG');
                              e.target.value = '';
                              return;
                            }
                            if (file.size > MAX_RESOURCE_FILE_SIZE) {
                              errorToast.fileSize(formatFileSize(MAX_RESOURCE_FILE_SIZE));
                              e.target.value = '';
                              return;
                            }
                            
                            const fileName = file.name;
                            const newResourceFile: IResourceFile & { File: File } = {
                              FileUrl: `/${fileName}`,
                              FileName: fileName,
                              ResourceType: (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'ResourceType' in formData.ResourceProject.ResourceFile) 
                                ? formData.ResourceProject.ResourceFile.ResourceType 
                                : ResourceType.GUIDE,
                              LastUpdated: new Date(),
                              FileSize: formatFileSize(file.size),
                              FileType: getFileTypeFromMimeType(file.type) || 'unknown',
                              DownloadCount: 0,
                              File: file
                            };
                            
                            updateFormData('ResourceProject.ResourceFile', newResourceFile);
                            
                            // Update first CTA button
                            if (formData.CtaButtons && formData.CtaButtons.length > 0) {
                              const updatedButtons = [...formData.CtaButtons];
                              updatedButtons[0] = {
                                ...updatedButtons[0],
                                Label: 'Download',
                                Url: `/${fileName}`
                              };
                              updateFormData('CtaButtons', updatedButtons);
                            }
                            
                            // Clear validation errors
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors['Resource File'];
                              delete newErrors.ResourceFile;
                              return newErrors;
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-sm text-brand-f">
                        {hasUploadedFile 
                          ? (formData.ResourceProject?.ResourceFile instanceof File 
                              ? formData.ResourceProject.ResourceFile.name 
                              : (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && !(formData.ResourceProject.ResourceFile instanceof File) && 'FileName' in formData.ResourceProject.ResourceFile ? formData.ResourceProject.ResourceFile.FileName : 'No file chosen'))
                          : 'No file chosen'}
                      </span>
                    </div>
                    
                    {/* Show Remove button if file is uploaded */}
                    {hasUploadedFile && (
                      <div className="flex items-center justify-between p-3 bg-brand-q rounded-md border border-brand-q">
                        <span className="text-sm text-brand-k font-medium">
                          {formData.ResourceProject?.ResourceFile instanceof File 
                            ? formData.ResourceProject.ResourceFile.name
                            : (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && !(formData.ResourceProject.ResourceFile instanceof File) && 'FileName' in formData.ResourceProject.ResourceFile ? formData.ResourceProject.ResourceFile.FileName : '')}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateFormData('ResourceProject.ResourceFile', emptyResourceFile);
                            // Reset first button
                            if (formData.CtaButtons && formData.CtaButtons.length > 0) {
                              const updatedButtons = [...formData.CtaButtons];
                              updatedButtons[0] = {
                                ...updatedButtons[0],
                                Label: 'Download',
                                Url: '/'
                              };
                              updateFormData('CtaButtons', updatedButtons);
                            }
                            // Clear the file input
                            const fileInput = document.getElementById('resource-file') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    )}
                    
                    <p className="text-xs text-brand-f">
                      Accepted formats: PDF, DOT, DOC, XLS, PPT, MP3, M4V, MP4, ZIP, JPG, JPEG, JFIF, PJP, PJPEG, PNG. Maximum file size: 10MB.
                    </p>
                  </div>
                </FormField>
              </div>
            )}

            {/* File URL Field */}
            <FormField label="File URL" required>
              <Input
                value={
                  formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'FileUrl' in formData.ResourceProject.ResourceFile
                    ? formData.ResourceProject.ResourceFile.FileUrl || ''
                    : ''
                }
                disabled={resourceFileMode === ResourceFileMode.UPLOAD}
                onChange={(e) => {
                  const url = e.target.value;
                  // If in manual mode, update or create the ResourceFile object
                  if (resourceFileMode === ResourceFileMode.MANUAL) {
                    const existingFile = formData.ResourceProject?.ResourceFile && 
                      typeof formData.ResourceProject.ResourceFile === 'object' && 
                      !('File' in formData.ResourceProject.ResourceFile) &&
                      'FileUrl' in formData.ResourceProject.ResourceFile
                      ? formData.ResourceProject.ResourceFile as IResourceFile
                      : null;
                    
                    const updatedFile: IResourceFile = {
                      FileUrl: url,
                      FileName: existingFile?.FileName || '',
                      ResourceType: existingFile?.ResourceType || ResourceType.GUIDE,
                      FileSize: existingFile?.FileSize || '',
                      FileType: existingFile?.FileType || '',
                      DownloadCount: existingFile?.DownloadCount || 0,
                      LastUpdated: existingFile?.LastUpdated || new Date()
                    };
                    
                    updateFormData('ResourceProject.ResourceFile', updatedFile);
                    
                    // Update first CTA button URL
                    if (formData.CtaButtons && formData.CtaButtons.length > 0) {
                      const updatedButtons = [...formData.CtaButtons];
                      updatedButtons[0] = {
                        ...updatedButtons[0],
                        Label: 'Download',
                        Url: url
                      };
                      updateFormData('CtaButtons', updatedButtons);
                    }
                  }
                }}
                placeholder="e.g., https://example.com/file.pdf"
                className={resourceFileMode === ResourceFileMode.UPLOAD ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
              />
              {resourceFileMode === ResourceFileMode.UPLOAD && (
                <p className="text-xs text-brand-f mt-1">
                  URL is taken automatically from the uploaded file
                </p>
              )}
            </FormField>

            <FormField label="File Name" required>
              <Input
                value={
                  formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'FileName' in formData.ResourceProject.ResourceFile
                    ? formData.ResourceProject.ResourceFile.FileName || ''
                    : ''
                }
                disabled={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile === true}
                onChange={(e) => {
                  if (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && !(formData.ResourceProject.ResourceFile instanceof File) && 'FileName' in formData.ResourceProject.ResourceFile) {
                    updateFormData('ResourceProject.ResourceFile', { 
                      ...formData.ResourceProject.ResourceFile, 
                      FileName: e.target.value 
                    });
                  }
                }}
                placeholder="e.g., Annual Report 2024.pdf"
                className={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
              />
              {resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile && (
                <p className="text-xs text-brand-f mt-1">
                  Auto-populated from uploaded file
                </p>
              )}
            </FormField>
            
            <FormField label="Resource Type" required>
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
              <FormField label="File Size" required>
                <Input
                  value={
                    formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'FileSize' in formData.ResourceProject.ResourceFile
                      ? formData.ResourceProject.ResourceFile.FileSize || ''
                      : ''
                  }
                  disabled={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile === true}
                  onChange={(e) => {
                    if (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && !(formData.ResourceProject.ResourceFile instanceof File) && 'FileSize' in formData.ResourceProject.ResourceFile) {
                      updateFormData('ResourceProject.ResourceFile', { 
                        ...formData.ResourceProject.ResourceFile, 
                        FileSize: e.target.value 
                      });
                    }
                  }}
                  placeholder="e.g., 2.5 MB"
                  className={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
                />
                {resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile && (
                  <p className="text-xs text-brand-f mt-1">
                    Auto-populated from uploaded file
                  </p>
                )}
              </FormField>
              <FormField label="File Type" required>
                <Input
                  value={
                    formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && 'FileType' in formData.ResourceProject.ResourceFile
                      ? formData.ResourceProject.ResourceFile.FileType || ''
                      : ''
                  }
                  disabled={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile === true}
                  onChange={(e) => {
                    if (formData.ResourceProject?.ResourceFile && typeof formData.ResourceProject.ResourceFile === 'object' && !(formData.ResourceProject.ResourceFile instanceof File) && 'FileType' in formData.ResourceProject.ResourceFile) {
                      updateFormData('ResourceProject.ResourceFile', { 
                        ...formData.ResourceProject.ResourceFile, 
                        FileType: e.target.value 
                      });
                    }
                  }}
                  placeholder="e.g., PDF"
                  className={resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
                />
                {resourceFileMode === ResourceFileMode.UPLOAD && hasUploadedFile && (
                  <p className="text-xs text-brand-f mt-1">
                    Auto-populated from uploaded file
                  </p>
                )}
              </FormField>
            </div>

            {/* TODO: Uncomment it when we get value of downloadCount from GA4 */}
            {/* <FormField label="Download Count">
              <Input
                type="number"
                value={(formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) ? formData.ResourceProject.ResourceFile.DownloadCount || 0 : 0}
                disabled={true}
                min={0}
                className="bg-gray-50 cursor-not-allowed"
              />
            </FormField> */}

            <FormField label="Last Updated" required>
              <Input
                type="date"
                value={(
                  (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File) && formData.ResourceProject.ResourceFile.LastUpdated)
                    ? new Date(formData.ResourceProject.ResourceFile.LastUpdated).toISOString().slice(0, 10)
                    : ''
                )}
                onChange={(e) => {
                  if (formData.ResourceProject?.ResourceFile && !(formData.ResourceProject.ResourceFile instanceof File)) {
                    const dateValue = e.target.value;
                    updateFormData('ResourceProject.ResourceFile.LastUpdated', dateValue ? new Date(dateValue) : undefined);
                  }
                }}
              />
            </FormField>
          </div>
        );
      }

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
          <FormField label={<>Banner Type <span className="text-brand-g">*</span></>}>
            <Select
              value={formData.TemplateType}
              onChange={(e) => updateFormData('TemplateType', e.target.value)}
              options={TEMPLATE_TYPES}
            />
          </FormField>

          <FormField label={<>Title <span className="text-brand-g">*</span></>} error={errors.Title}>
            <Input
              value={formData.Title}
              onChange={(e) => updateFormData('Title', e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Title.length}/50 characters
            </p>
          </FormField>
          
          <FormField label="Subtitle">
            <Input
              value={formData.Subtitle}
              onChange={(e) => updateFormData('Subtitle', e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Subtitle?.length}/50 characters
            </p>
          </FormField>
          
          <FormField label="Description">
            <Textarea
              value={formData.Description}
              onChange={(e) => updateFormData('Description', e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-brand-f mt-1">
              {formData.Description?.length}/200 characters
            </p>
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
            
            <FormField label="Text Color" required>
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
            <FormField label="Background Color" required>
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
                  // Set a default value to pass validation (will be overridden on API side)
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
                <FormField label="Overlay Color" required>
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
                    <FormField label="Button Label" required>
                      <Input
                        value={button.Label}
                        onChange={(e) => updateCTAButton(index, 'Label', e.target.value)}
                        placeholder="Click"
                      />
                    </FormField>
                    <FormField label="Button URL" required>
                      <Input
                        value={button.Url}
                        onChange={(e) => updateCTAButton(index, 'Url', e.target.value)}
                        disabled={isShowAutomaticallyPopulatedUrl === true}
                        className={isShowAutomaticallyPopulatedUrl ? 'bg-brand-q text-brand-f cursor-not-allowed' : ''}
                      />
                      {isShowAutomaticallyPopulatedUrl && (
                        <p className="text-xs text-brand-f mt-1">
                          URL is taken automatically from the File URL field
                        </p>
                      )}
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
                      disabled={index === 0 && formData.TemplateType === BannerTemplateType.RESOURCE_PROJECT}
                      className={index === 0 && formData.TemplateType === BannerTemplateType.RESOURCE_PROJECT ? 'opacity-50 cursor-not-allowed' : 'p-2 hover:bg-brand-g hover:bg-opacity-10 rounded-full transition-colors'}
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
            <FormField label="Location" required>
              <Select
                id="locationSlug"
                value={formData.LocationSlug}
                onChange={(e) => {
                  const selectedLocationSlug = e.target.value;
                  updateFormData('LocationSlug', selectedLocationSlug);
                  
                  // Auto-populate LocationName when LocationSlug changes
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
