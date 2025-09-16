'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface BannerPreviewProps {
  data: any;
}

export function BannerPreview({ data }: BannerPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-500">Configure banner settings to see preview</p>
          </div>
        </div>
      </div>
    );
  }

  const getPreviewContainerClass = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  const getLayoutClass = () => {
    switch (data.layoutStyle) {
      case 'split':
        return 'grid md:grid-cols-2 gap-8 items-center';
      case 'card':
        return 'rounded-lg shadow-lg backdrop-blur-sm max-w-4xl mx-auto';
      default:
        return 'text-center';
    }
  };

  const getBackgroundStyle = () => {
    const { background } = data;
    let style: React.CSSProperties = {};

    switch (background.type) {
      case 'solid':
        style.backgroundColor = background.value;
        break;
      case 'gradient':
        style.background = background.value;
        break;
      case 'image':
        style.backgroundImage = `url(${background.value})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
        break;
    }

    return style;
  };

  const getTextColorClass = () => {
    return data.textColour === 'white' ? 'text-white' : 'text-gray-900';
  };

  const getUrgencyBadgeColor = () => {
    switch (data.urgencyLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    if (!data.donationGoal) return 0;
    return Math.min(Math.round((data.donationGoal.current / data.donationGoal.target) * 100), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: data.donationGoal?.currency || 'GBP'
    }).format(amount);
  };

  const renderTemplateContent = () => {
    switch (data.templateType) {
      case 'giving-campaign':
        return (
          <>
            {/* Urgency Badge */}
            {data.urgencyLevel && (
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getUrgencyBadgeColor()}>
                  {data.urgencyLevel === 'critical' && '🚨 '}
                  {data.urgencyLevel === 'high' && '⚡ '}
                  {data.urgencyLevel.charAt(0).toUpperCase() + data.urgencyLevel.slice(1)} Appeal
                </Badge>
              </div>
            )}

            {/* Progress Section */}
            {data.donationGoal && (
              <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">
                    {formatCurrency(data.donationGoal.current)} raised
                  </span>
                  <span className="opacity-80">
                    of {formatCurrency(data.donationGoal.target)} goal
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <p className="text-sm opacity-70">
                  {calculateProgress()}% funded • {100 - calculateProgress()}% to go
                </p>
              </div>
            )}
          </>
        );

      case 'partnership-charter':
        return (
          <>
            {/* Charter Badge */}
            {data.charterType && (
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-blue-100 text-blue-800">
                  {data.charterType.split('-').map((word: string) => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Badge>
              </div>
            )}

            {/* Signatories Count */}
            {data.signatoriesCount > 0 && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{data.signatoriesCount}</div>
                  <div className="text-sm opacity-80">Organizations Signed</div>
                </div>
              </div>
            )}
          </>
        );

      case 'resource-project':
        return (
          <>
            {/* Resource Badge */}
            {data.resourceType && (
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-purple-100 text-purple-800">
                  📄 {data.resourceType.charAt(0).toUpperCase() + data.resourceType.slice(1)}
                </Badge>
                {data.fileType && (
                  <Badge className="bg-gray-100 text-gray-800">
                    {data.fileType.toUpperCase()}
                  </Badge>
                )}
              </div>
            )}

            {/* Resource Metadata */}
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {data.downloadCount > 0 && (
                  <div>
                    <div className="font-semibold">{data.downloadCount.toLocaleString()}</div>
                    <div className="opacity-80">Downloads</div>
                  </div>
                )}
                {data.fileSize && (
                  <div>
                    <div className="font-semibold">{data.fileSize}</div>
                    <div className="opacity-80">File Size</div>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
      </div>
      
      <div className="p-6">
        {/* Preview Controls */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview Options</h3>
          <div className="flex gap-2">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-3 py-1 text-xs border rounded hover:bg-gray-50 ${
                  previewMode === mode ? 'bg-white border-gray-300' : 'border-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Preview */}
        <div className={getPreviewContainerClass()}>
          <div 
            className={`relative overflow-hidden py-12 px-6 rounded-lg ${getTextColorClass()}`}
            style={getBackgroundStyle()}
          >
            {/* Overlay */}
            {data.background.overlay && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: data.background.overlay.colour,
                  opacity: data.background.overlay.opacity
                }}
              />
            )}

            {/* Content */}
            <div className={`relative z-10 ${getLayoutClass()}`}>
              <div className="space-y-4">
                {/* Badge Text */}
                {data.badgeText && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white">
                    {data.badgeText}
                  </Badge>
                )}

                {/* Template-specific content */}
                {renderTemplateContent()}

                {/* Title */}
                <h1 className="text-3xl font-bold leading-tight">
                  {data.title || 'Banner Title'}
                </h1>
                
                {/* Subtitle */}
                {data.subtitle && (
                  <h2 className="text-xl font-semibold opacity-90">
                    {data.subtitle}
                  </h2>
                )}
                
                {/* Description */}
                {data.description && (
                  <p className="text-lg opacity-80 leading-relaxed max-w-2xl">
                    {data.description}
                  </p>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {data.ctaButtons.map((button: any, index: number) => {
                    const baseClasses = "inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all duration-200";
                    
                    let buttonClasses = baseClasses;
                    switch (button.variant) {
                      case 'primary':
                        buttonClasses += data.textColour === 'white' 
                          ? " bg-white text-gray-900 hover:bg-gray-100"
                          : " bg-gray-900 text-white hover:bg-gray-800";
                        break;
                      case 'secondary':
                        buttonClasses += data.textColour === 'white'
                          ? " bg-white/20 text-white border border-white/40 hover:bg-white/30"
                          : " bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200";
                        break;
                      case 'outline':
                        buttonClasses += data.textColour === 'white'
                          ? " bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900"
                          : " bg-transparent text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white";
                        break;
                    }

                    return (
                      <button
                        key={index}
                        className={buttonClasses}
                        disabled
                      >
                        {button.label || `Button ${index + 1}`}
                        {button.external && (
                          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo/Media placeholder */}
              {data.layoutStyle === 'split' && (
                <div className="flex justify-center">
                  <div className="w-48 h-32 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <span className="text-sm opacity-70">Logo/Image</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Banner Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Template:</span> {data.templateType}
            </div>
            <div>
              <span className="font-medium">Layout:</span> {data.layoutStyle}
            </div>
            <div>
              <span className="font-medium">Text Color:</span> {data.textColour}
            </div>
            <div>
              <span className="font-medium">Priority:</span> {data.priority}
            </div>
            <div>
              <span className="font-medium">Location:</span> {data.locationSlug || 'All Locations'}
            </div>
            <div>
              <span className="font-medium">Status:</span> {data.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
