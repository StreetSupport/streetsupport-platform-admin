'use client';

import React from 'react';
import Image from 'next/image';
import type { PublicBackground, PublicCTAButton } from '@/types/banners/PreviewTypes';

// Banner utility functions adapted for admin preview (same as other components)
function generateBackgroundClasses(background: PublicBackground): string {
  const { type } = background;
  let classes = '';
  
  switch (type) {
    case 'solid':
      classes = 'bg-gray-900';
      break;
    case 'gradient':
      classes = 'bg-gradient-to-r';
      break;
    case 'image':
      classes = 'bg-cover bg-center bg-no-repeat';
      break;
  }
  
  if (background.overlay) {
    classes += ' relative';
  }
  
  return classes;
}

function generateBackgroundStyles(background: PublicBackground): React.CSSProperties {
  const { type, value } = background;
  const styles: React.CSSProperties = {};
  
  switch (type) {
    case 'solid':
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        styles.backgroundColor = value;
      }
      break;
    case 'gradient':
      styles.background = value;
      break;
    case 'image':
      styles.backgroundImage = `url("${value}")`;
      break;
  }
  
  return styles;
}

function generateTextColourClasses(textColour: string): string {
  return textColour === 'white' ? 'text-white' : 'text-gray-900';
}

function generateLayoutClasses(layoutStyle: string): string {
  switch (layoutStyle) {
    case 'split':
      return 'grid md:grid-cols-2 gap-8 items-center';
    case 'full-width':
      return 'text-center';
    case 'card':
      return 'max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8';
    default:
      return '';
  }
}

function generateCTAClasses(button: PublicCTAButton, textColour: string): string {
  const { variant = 'primary' } = button;
  let baseClasses = 'inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  switch (variant) {
    case 'primary':
      if (textColour === 'white') {
        baseClasses += ' bg-white text-gray-900 hover:bg-gray-100 focus:ring-white';
      } else {
        baseClasses += ' bg-brand-a text-white hover:bg-brand-b focus:ring-brand-a';
      }
      break;
    case 'secondary':
      if (textColour === 'white') {
        baseClasses += ' bg-white/20 text-white border border-white/40 hover:bg-white/30 focus:ring-white';
      } else {
        baseClasses += ' bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500';
      }
      break;
    case 'outline':
      if (textColour === 'white') {
        baseClasses += ' border-2 border-white text-white hover:bg-white hover:text-gray-900 focus:ring-white';
      } else {
        baseClasses += ' border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-900';
      }
      break;
  }
  
  return baseClasses;
}

// TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
// function generateAccentGraphicClasses(position?: string): string {
//   switch (position) {
//     case 'top-left':
//       return 'absolute top-4 left-4 z-10';
//     case 'top-right':
//       return 'absolute top-4 right-4 z-10';
//     case 'bottom-left':
//       return 'absolute bottom-4 left-4 z-10';
//     case 'bottom-right':
//       return 'absolute bottom-4 right-4 z-10';
//     case 'center':
//       return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0';
//     default:
//       return 'absolute top-4 right-4 z-10';
//   }
// }

function getResourceTypeLabel(type?: string): string {
  switch (type) {
    case 'guide':
      return 'User Guide';
    case 'toolkit':
      return 'Toolkit';
    case 'research':
      return 'Research';
    case 'training':
      return 'Training Material';
    case 'event':
      return 'Event';
    default:
      return 'Resource';
  }
}

function getResourceTypeIcon(type?: string): string {
  switch (type) {
    case 'guide':
      return '📖';
    case 'toolkit':
      return '🧰';
    case 'research':
      return '📊';
    case 'training':
      return '🎓';
    case 'event':
      return '📅';
    default:
      return '📄';
  }
}

function getFileTypeIcon(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📽️';
    case 'zip':
      return '🗜️';
    case 'mp4':
    case 'mov':
      return '🎥';
    case 'mp3':
    case 'wav':
      return '🎵';
    default:
      return '💾';
  }
}

function formatFileSize(sizeString?: string): string {
  if (!sizeString) return '';
  
  // If already formatted (contains 'MB', 'KB', etc.), return as is
  if (/\d+\s*(KB|MB|GB)/i.test(sizeString)) {
    return sizeString;
  }
  
  // If it's a number (bytes), convert to appropriate unit
  const bytes = parseInt(sizeString);
  if (isNaN(bytes)) return sizeString;
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
}

interface ResourceProjectBannerProps {
  title: string;
  description?: string;
  subtitle?: string;
  logo?: { url: string; alt: string; width?: number; height?: number };
  image?: { url: string; alt: string; width?: number; height?: number };
  ctaButtons: Array<{ label: string; url: string; variant: string; external: boolean }>;
  background: { type: string; value: string; overlay?: { colour: string; opacity: number } };
  textColour: string;
  layoutStyle: string;
  // TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
  // accentGraphic?: { url: string; alt: string; position: string; opacity: number };
  showDates?: boolean;
  startDate?: Date;
  endDate?: Date;
  badgeText?: string;
  resourceType?: string;
  downloadCount?: number;
  lastUpdated?: Date;
  fileSize?: string;
  fileType?: string;
  className?: string;
}

export const ResourceProjectBanner: React.FC<ResourceProjectBannerProps> = ({
  title,
  description,
  subtitle,
  logo,
  image,
  ctaButtons,
  background,
  textColour,
  layoutStyle,
  // TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
  // accentGraphic,
  showDates,
  startDate,
  endDate,
  badgeText,
  resourceType,
  downloadCount,
  lastUpdated,
  fileSize,
  fileType,
  className = ''
}) => {
  const backgroundClasses = generateBackgroundClasses(background);
  const backgroundStyles = generateBackgroundStyles(background);
  const textColourClasses = generateTextColourClasses(textColour);
  const layoutClasses = generateLayoutClasses(layoutStyle);

  return (
    <section 
      className={`
        relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8
        ${backgroundClasses}
        ${textColourClasses}
        ${className}
      `}
      style={backgroundStyles}
      role="banner"
      aria-labelledby="resource-project-title"
    >
      {/* Background overlay */}
      {background.overlay && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: background.overlay.colour,
            opacity: background.overlay.opacity
          }}
          aria-hidden="true"
        />
      )}

      {/* TODO: Uncomment if AccentGraphic is needed. In the other case, remove. Don't forget about the API part. */}
      {/* Accent graphic */}
      {/* {accentGraphic && (
        <div className={generateAccentGraphicClasses(accentGraphic.position)}>
          <Image
            src={accentGraphic.url}
            alt={accentGraphic.alt}
            width={100}
            height={100}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            style={{ opacity: accentGraphic.opacity || 0.6 }}
          />
        </div>
      )} */}

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className={layoutClasses}>
          {/* Content Section */}
          <div className={layoutStyle === 'split' ? 'order-2 md:order-1' : ''}>
            {/* Badge and resource type */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {badgeText && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                  {badgeText}
                </span>
              )}
              {resourceType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white">
                  {getResourceTypeIcon(resourceType)} {getResourceTypeLabel(resourceType)}
                </span>
              )}
              {fileType && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-white/20 backdrop-blur-sm uppercase">
                  {getFileTypeIcon(fileType)} {fileType}
                </span>
              )}
            </div>

            {/* Logo */}
            {logo && (
              <div className="mb-6">
                <Image
                  src={logo.url}
                  alt={logo.alt}
                  width={logo.width || 200}
                  height={logo.height || 60}
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
            )}

            {/* Title */}
            <h1 
              id="resource-project-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
            >
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 opacity-90">
                {subtitle}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg sm:text-xl mb-6 opacity-80 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}

            {/* Resource Stats */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloadCount !== undefined && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Downloads</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {downloadCount.toLocaleString('en-GB')}
                  </div>
                </div>
              )}

              {fileSize && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">File Size</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatFileSize(fileSize)}
                  </div>
                </div>
              )}

              {lastUpdated && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Last Updated</span>
                  </div>
                  <div className="text-sm">
                    {new Date(lastUpdated).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {ctaButtons.map((button, index) => {
                const isDownload = button.label.toLowerCase().includes('download');

                return (
                  <a
                    key={index}
                    href={button.url || '#'}
                    target={button.external ? '_blank' : '_self'}
                    rel={button.external ? 'noopener noreferrer' : ''}
                    className={generateCTAClasses(button, textColour)}
                    aria-describedby={index === 0 ? 'resource-project-title' : undefined}
                    download={isDownload}
                  >
                    {isDownload && (
                      <svg 
                        className="mr-2 w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                    )}
                    {button.label}
                    {button.external && !isDownload && (
                      <svg 
                        className="ml-2 w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                        />
                      </svg>
                    )}
                  </a>
                );
              })}
            </div>

            {/* Resource metadata */}
            {resourceType && (
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 text-left">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  About This {getResourceTypeLabel(resourceType)}
                </h3>
                <p className="text-sm opacity-80">
                  {resourceType === 'guide' && 
                    "This user guide provides step-by-step instructions and best practices to help you get the most out of Street Support Network services."
                  }
                  {resourceType === 'toolkit' && 
                    "This comprehensive toolkit includes templates, resources, and guidance to support your work in tackling homelessness."
                  }
                  {resourceType === 'research' && 
                    "This research document presents evidence-based insights and data to inform policy and practice in homelessness support."
                  }
                  {resourceType === 'training' && 
                    "This training material provides educational content to enhance understanding and skills in homelessness support work."
                  }
                  {resourceType === 'event' && 
                    "This event brings together professionals and volunteers to share knowledge, network, and collaborate on homelessness solutions."
                  }
                </p>
              </div>
            )}
            
            {/* Date range */}
            {showDates && (startDate || endDate) && (
              <div className="mt-6 text-sm opacity-70 text-left">
                {startDate && endDate && (
                  <p>
                    Available: {new Date(startDate).toLocaleDateString('en-GB')} - {new Date(endDate).toLocaleDateString('en-GB')}
                  </p>
                )}
                {startDate && !endDate && (
                  <p>Available from {new Date(startDate).toLocaleDateString('en-GB')}</p>
                )}
                {!startDate && endDate && (
                  <p>Available until {new Date(endDate).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            )}
          </div>

          {/* Media Section */}
          {layoutStyle === 'split' && image && image.url && (
            <div className="order-1 md:order-2 h-full">
              <div className="relative h-full flex items-center justify-center">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="object-contain mx-auto rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}
          {layoutStyle === 'split' && (!image || !image.url) && (
            <div className="order-1 md:order-2">
              <div className="relative rounded-lg overflow-hidden h-full">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/assets/img/image-placeholder.png"
                    alt="Image placeholder"
                    width={300}
                    height={300}
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                </div>
              </div>
            </div>
          )}
          {layoutStyle === 'full-width' && image && image.url && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="relative">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="object-contain mx-auto rounded-lg"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            </div>
          )}
          {layoutStyle === 'full-width' && (!image || !image.url) && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/assets/img/image-placeholder.png"
                    alt="Image placeholder"
                    width={300}
                    height={300}
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 300px"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card layout media */}
          {layoutStyle === 'card' && image && image.url && (
            <div className="mt-6">
              <div className="relative">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="object-contain mx-auto rounded-lg"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
            </div>
          )}
          {layoutStyle === 'card' && (!image || !image.url) && (
            <div className="mt-6">
              <div className="relative rounded-lg overflow-hidden">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/assets/img/image-placeholder.png"
                    alt="Image placeholder"
                    width={300}
                    height={300}
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 300px"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResourceProjectBanner;
