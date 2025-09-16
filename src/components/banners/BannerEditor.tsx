'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, Trash } from 'lucide-react';

export interface CtaButton {
  label: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  external: boolean;
}

export interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  templateType: 'giving-campaign' | 'partnership-charter' | 'resource-project';
  layoutStyle: 'split' | 'full-width' | 'card';
  textColour: 'white' | 'black';
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    overlay: {
      colour: string;
      opacity: number;
    };
  };
  ctaButtons: CtaButton[];
  isActive: boolean;
  priority: number;
  locationSlug: string;
  badgeText: string;
  donationGoal: {
    target: number;
    current: number;
    currency: string;
  };
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  campaignEndDate: string;
  charterType: 'homeless-charter' | 'real-change' | 'alternative-giving' | 'partnership';
  signatoriesCount: number;
  resourceType: 'guide' | 'toolkit' | 'research' | 'training' | 'event';
  downloadCount: number;
  fileSize: string;
  fileType: string;
  lastUpdated: string;
  partnerLogos?: File[];
  logo?: File;
  image?: File;
}

interface BannerEditorProps {
  initialData?: Partial<BannerFormData>;
  onDataChange: (data: BannerFormData) => void;
  onSave: (data: BannerFormData) => void;
  saving?: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'giving-campaign', label: 'Giving Campaign' },
  { value: 'partnership-charter', label: 'Partnership Charter' },
  { value: 'resource-project', label: 'Resource Project' }
];

const LAYOUT_STYLES = [
  { value: 'split', label: 'Split Layout' },
  { value: 'full-width', label: 'Full Width' },
  { value: 'card', label: 'Card Layout' }
];

const TEXT_COLOURS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' }
];

const BACKGROUND_TYPES = [
  { value: 'solid', label: 'Solid Color' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' }
];

const CTA_VARIANTS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' }
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const CHARTER_TYPES = [
  { value: 'homeless-charter', label: 'Homeless Charter' },
  { value: 'real-change', label: 'Real Change' },
  { value: 'alternative-giving', label: 'Alternative Giving' },
  { value: 'partnership', label: 'Partnership' }
];

const RESOURCE_TYPES = [
  { value: 'guide', label: 'Guide' },
  { value: 'toolkit', label: 'Toolkit' },
  { value: 'research', label: 'Research' },
  { value: 'training', label: 'Training' },
  { value: 'event', label: 'Event' }
];

const LOCATIONS = [
  { value: '', label: 'All Locations' },
  { value: 'manchester', label: 'Manchester' },
  { value: 'birmingham', label: 'Birmingham' },
  { value: 'leeds', label: 'Leeds' }
];

export function BannerEditor({ initialData, onDataChange, onSave, saving = false }: BannerEditorProps) {
  const [formData, setFormData] = useState<BannerFormData>(() => {
    const defaults: BannerFormData = {
      title: '',
      subtitle: '',
      description: '',
      templateType: 'giving-campaign',
      layoutStyle: 'split',
      textColour: 'white',
      background: {
        type: 'solid',
        value: '#38ae8e',
        overlay: {
          colour: 'rgba(0,0,0,0.5)',
          opacity: 0.5
        }
      },
      ctaButtons: [
        {
          label: 'Learn More',
          url: '/about',
          variant: 'primary',
          external: false
        }
      ],
      isActive: true,
      priority: 5,
      locationSlug: '',
      badgeText: '',
      donationGoal: {
        target: 10000,
        current: 0,
        currency: 'GBP'
      },
      urgencyLevel: 'medium',
      campaignEndDate: '',
      charterType: 'homeless-charter',
      signatoriesCount: 0,
      resourceType: 'guide',
      downloadCount: 0,
      fileSize: '',
      fileType: '',
      lastUpdated: new Date().toISOString(),
    };

    return {
      ...defaults,
      ...initialData,
      background: {
        ...defaults.background,
        ...initialData?.background,
        overlay: {
          ...defaults.background.overlay,
          ...initialData?.background?.overlay,
        },
      },
      donationGoal: {
        ...defaults.donationGoal,
        ...initialData?.donationGoal,
      },
      ctaButtons: initialData?.ctaButtons && initialData.ctaButtons.length > 0
        ? initialData.ctaButtons
        : defaults.ctaButtons,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation issues
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addCTAButton = () => {
    if (formData.ctaButtons.length < 3) {
      setFormData(prev => ({
        ...prev,
        ctaButtons: [
          ...prev.ctaButtons,
          {
            label: '',
            url: '',
            variant: 'secondary',
            external: false
          }
        ]
      }));
    }
  };

  const removeCTAButton = (index: number) => {
    if (formData.ctaButtons.length > 1) {
      setFormData(prev => ({
        ...prev,
        ctaButtons: prev.ctaButtons.filter((_, i) => i !== index)
      }));
    }
  };

  const updateCTAButton = (index: number, field: keyof CtaButton, value: any) => {
    setFormData(prev => ({
      ...prev,
      ctaButtons: prev.ctaButtons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.ctaButtons.some(btn => !btn.label.trim() || !btn.url.trim())) {
      newErrors.ctaButtons = 'All CTA buttons must have a label and URL';
    }

    if (formData.templateType === 'giving-campaign' && formData.donationGoal.target <= 0) {
      newErrors.donationTarget = 'Donation target must be greater than 0';
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
    switch (formData.templateType) {
      case 'giving-campaign':
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Campaign Settings</h3>
            
            <FormField label="Urgency Level">
              <Select
                value={formData.urgencyLevel}
                onChange={(e) => updateFormData('urgencyLevel', e.target.value)}
                options={URGENCY_LEVELS}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Target Amount (£)" error={errors.donationTarget}>
                <Input
                  type="number"
                  value={formData.donationGoal.target}
                  onChange={(e) => updateFormData('donationGoal.target', Number(e.target.value))}
                  min={1}
                />
              </FormField>
              <FormField label="Current Amount (£)">
                <Input
                  type="number"
                  value={formData.donationGoal.current}
                  onChange={(e) => updateFormData('donationGoal.current', Number(e.target.value))}
                  min={0}
                />
              </FormField>
            </div>
            
            <FormField label="Campaign End Date">
              <Input
                type="datetime-local"
                value={formData.campaignEndDate}
                onChange={(e) => updateFormData('campaignEndDate', e.target.value)}
              />
            </FormField>
          </div>
        );

      case 'partnership-charter':
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Charter Settings</h3>
            
            <FormField label="Charter Type">
              <Select
                value={formData.charterType}
                onChange={(e) => updateFormData('charterType', e.target.value)}
                options={CHARTER_TYPES}
              />
            </FormField>
            
            <FormField label="Signatories Count">
              <Input
                type="number"
                value={formData.signatoriesCount}
                onChange={(e) => updateFormData('signatoriesCount', Number(e.target.value))}
                min={0}
              />
            </FormField>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner Logos
              </label>
              <FileUpload
                accept="image/*"
                multiple
                onUpload={(files) => updateFormData('partnerLogos', files)}
                maxSize={2 * 1024 * 1024} // 2MB
              />
            </div>
          </div>
        );

      case 'resource-project':
        return (
          <div className="space-y-4 border-t border-brand-q pt-6">
            <h3 className="heading-5 border-b border-brand-q pb-2">Resource Settings</h3>
            
            <FormField label="Resource Type">
              <Select
                value={formData.resourceType}
                onChange={(e) => updateFormData('resourceType', e.target.value)}
                options={RESOURCE_TYPES}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="File Size">
                <Input
                  value={formData.fileSize}
                  onChange={(e) => updateFormData('fileSize', e.target.value)}
                  placeholder="e.g., 2.5 MB"
                />
              </FormField>
              <FormField label="File Type">
                <Input
                  value={formData.fileType}
                  onChange={(e) => updateFormData('fileType', e.target.value)}
                  placeholder="e.g., PDF"
                />
              </FormField>
            </div>
            
            <FormField label="Download Count">
              <Input
                type="number"
                value={formData.downloadCount}
                onChange={(e) => updateFormData('downloadCount', Number(e.target.value))}
                min={0}
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
              value={formData.templateType}
              onChange={(e) => updateFormData('templateType', e.target.value)}
              options={TEMPLATE_TYPES}
            />
          </FormField>

          <FormField label="Title *" error={errors.title}>
            <Input
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              maxLength={200}
              required
            />
          </FormField>
          
          <FormField label="Subtitle">
            <Input
              value={formData.subtitle}
              onChange={(e) => updateFormData('subtitle', e.target.value)}
              maxLength={300}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </FormField>
        </div>

        {/* Media Assets */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Media Assets</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <FileUpload
              accept="image/*"
              onUpload={(file) => updateFormData('logo', file)}
              maxSize={2 * 1024 * 1024} // 2MB
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
            <FileUpload
              accept="image/*"
              onUpload={(file) => updateFormData('image', file)}
              maxSize={5 * 1024 * 1024} // 5MB
            />
          </div>
        </div>

        {/* Styling Options */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <h3 className="heading-5 border-b border-brand-q pb-2">Styling Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Layout Style">
              <Select
                value={formData.layoutStyle}
                onChange={(e) => updateFormData('layoutStyle', e.target.value)}
                options={LAYOUT_STYLES}
              />
            </FormField>
            
            <FormField label="Text Color">
              <Select
                value={formData.textColour}
                onChange={(e) => updateFormData('textColour', e.target.value)}
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
                  onClick={() => updateFormData('background.type', type.value)}
                  className={`btn-base btn-sm ${
                    formData.background.type === type.value
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {formData.background.type === 'solid' && (
            <FormField label="Background Color">
              <Input
                type="color"
                value={formData.background.value}
                onChange={(e) => updateFormData('background.value', e.target.value)}
                className="h-10"
              />
            </FormField>
          )}
          
          {formData.background.type === 'gradient' && (
            <FormField label="CSS Gradient">
              <Input
                value={formData.background.value}
                onChange={(e) => updateFormData('background.value', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </FormField>
          )}
          
          <FormField label="Badge Text">
            <Input
              value={formData.badgeText}
              onChange={(e) => updateFormData('badgeText', e.target.value)}
              maxLength={50}
            />
          </FormField>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 border-t border-brand-q pt-6">
          <div className="flex justify-between items-center">
            <h3 className="heading-5">Call-to-Action Buttons</h3>
            {formData.ctaButtons.length < 3 && (
              <Button type="button" variant="outline" size="sm" onClick={addCTAButton}>
                <Plus className="h-4 w-4 mr-1" />
                Add Button
              </Button>
            )}
          </div>
          
          {errors.ctaButtons && (
            <p className="text-small text-brand-g">{errors.ctaButtons}</p>
          )}
          
          <div className="space-y-3">
            {formData.ctaButtons.map((button, index) => (
              <div key={index} className="card-compact border border-brand-q">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField label="Button Label">
                    <Input
                      value={button.label}
                      onChange={(e) => updateCTAButton(index, 'label', e.target.value)}
                      placeholder="Learn More"
                    />
                  </FormField>
                  <FormField label="Button URL">
                    <Input
                      value={button.url}
                      onChange={(e) => updateCTAButton(index, 'url', e.target.value)}
                      placeholder="/about"
                    />
                  </FormField>
                </div>
                <div className="flex justify-between items-center">
                  <FormField label="Button Style">
                    <Select
                      value={button.variant}
                      onChange={(value) => updateCTAButton(index, 'variant', value)}
                      options={CTA_VARIANTS}
                    />
                  </FormField>
                  {formData.ctaButtons.length > 1 && (
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
                    checked={button.external}
                    onChange={(checked) => updateCTAButton(index, 'external', checked)}
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
              <Select
                value={formData.locationSlug}
                onChange={(e) => updateFormData('locationSlug', e.target.value)}
                options={LOCATIONS}
              />
            </FormField>
            
            <FormField label="Priority (1-10)">
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => updateFormData('priority', Number(e.target.value))}
                min={1}
                max={10}
              />
            </FormField>
          </div>
          
          <Checkbox
            label="Active (visible to users)"
            checked={formData.isActive}
            onChange={(checked) => updateFormData('isActive', checked)}
          />
        </div>

        {/* Submit Button */}
        <div className="card-footer">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </Button>
        </div>
      </form>
    </div>
  );
}
