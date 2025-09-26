'use client';

import React from 'react';
import Image from 'next/image';

// Banner utility functions adapted for admin preview (same as GivingCampaignBanner)
function generateBackgroundClasses(background: any): string {
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

function generateBackgroundStyles(background: any): React.CSSProperties {
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

function generateCTAClasses(button: any, textColour: string): string {
  const { variant = 'primary' } = button;
  let baseClasses = 'inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
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

function generateAccentGraphicClasses(position?: string): string {
  switch (position) {
    case 'top-left':
      return 'absolute top-4 left-4 z-10';
    case 'top-right':
      return 'absolute top-4 right-4 z-10';
    case 'bottom-left':
      return 'absolute bottom-4 left-4 z-10';
    case 'bottom-right':
      return 'absolute bottom-4 right-4 z-10';
    case 'center':
      return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0';
    default:
      return 'absolute top-4 right-4 z-10';
  }
}

function getCharterTypeLabel(type?: string): string {
  switch (type) {
    case 'homeless-charter':
      return 'Homeless Charter';
    case 'real-change':
      return 'Real Change Campaign';
    case 'alternative-giving':
      return 'Alternative Giving';
    case 'partnership':
      return 'Partnership Initiative';
    default:
      return 'Charter Initiative';
  }
}

function getCharterTypeIcon(type?: string): string {
  switch (type) {
    case 'homeless-charter':
      return '📋';
    case 'real-change':
      return '💰';
    case 'alternative-giving':
      return '🎁';
    case 'partnership':
      return '🤝';
    default:
      return '📋';
  }
}

interface PartnershipCharterBannerProps {
  title: string;
  description?: string;
  subtitle?: string;
  logo?: { url: string; alt: string; width?: number; height?: number };
  image?: { url: string; alt: string; width?: number; height?: number };
  ctaButtons: Array<{ label: string; url: string; variant: string; external: boolean }>;
  background: { type: string; value: string; overlay?: { colour: string; opacity: number } };
  textColour: string;
  layoutStyle: string;
  accentGraphic?: { url: string; alt: string; position: string; opacity: number };
  showDates?: boolean;
  startDate?: Date;
  endDate?: Date;
  badgeText?: string;
  charterType?: string;
  signatoriesCount?: number;
  partnerLogos: Array<{ url: string; alt: string; width?: number; height?: number }>;
  className?: string;
}

export const PartnershipCharterBanner: React.FC<PartnershipCharterBannerProps> = ({
  title,
  description,
  subtitle,
  logo,
  image,
  ctaButtons,
  background,
  textColour,
  layoutStyle,
  accentGraphic,
  showDates,
  startDate,
  endDate,
  badgeText,
  charterType,
  signatoriesCount,
  partnerLogos = [],
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
      aria-labelledby="partnership-charter-title"
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

      {/* Accent graphic */}
      {accentGraphic && (
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
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className={layoutClasses}>
          {/* Content Section */}
          <div className={layoutStyle === 'split' ? 'order-2 md:order-1' : ''}>
            {/* Badge and charter type */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {badgeText && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                  {badgeText}
                </span>
              )}
              {charterType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                  {getCharterTypeIcon(charterType)} {getCharterTypeLabel(charterType)}
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
              id="partnership-charter-title"
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

            {/* Signatory Count */}
            {signatoriesCount && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">
                    {signatoriesCount.toLocaleString('en-GB')}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {signatoriesCount === 1 ? 'Signatory' : 'Signatories'}
                    </p>
                    <p className="text-sm opacity-70">
                      {signatoriesCount === 1 ? 'Organisation has' : 'Organisations have'} signed up
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Partner Logos */}
            {partnerLogos.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold mb-4 opacity-80">
                  In partnership with:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {partnerLogos.map((partnerLogo, index) => (
                    <div 
                      key={index} 
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-center"
                    >
                      <Image
                        src={partnerLogo.url}
                        alt={partnerLogo.alt}
                        width={partnerLogo.width || 80}
                        height={partnerLogo.height || 50}
                        className="w-full h-auto max-h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {ctaButtons.map((button, index) => (
                <button
                  key={index}
                  className={generateCTAClasses(button, textColour)}
                  aria-describedby={index === 0 ? 'partnership-charter-title' : undefined}
                >
                  {button.label}
                  {button.external && (
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
                </button>
              ))}
            </div>

            {/* Charter commitment statement */}
            {charterType && (
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Our Commitment
                </h3>
                <p className="text-sm opacity-80">
                  {charterType === 'homeless-charter' && 
                    "We're committed to working together to end rough sleeping and prevent homelessness in our community through coordinated, evidence-based approaches."
                  }
                  {charterType === 'real-change' && 
                    "We believe in supporting people to make real, lasting changes to their lives through dignified giving and comprehensive support services."
                  }
                  {charterType === 'alternative-giving' && 
                    "We're dedicated to channelling generosity towards sustainable solutions that address the root causes of homelessness."
                  }
                  {charterType === 'partnership' && 
                    "We're working in partnership to create lasting change and improve outcomes for people experiencing homelessness."
                  }
                </p>
              </div>
            )}

            {/* Date range */}
            {showDates && (startDate || endDate) && (
              <div className="mt-6 text-sm opacity-70">
                {startDate && endDate && (
                  <p>
                    {new Date(startDate).toLocaleDateString('en-GB')} - {new Date(endDate).toLocaleDateString('en-GB')}
                  </p>
                )}
                {startDate && !endDate && (
                  <p>From {new Date(startDate).toLocaleDateString('en-GB')}</p>
                )}
                {!startDate && endDate && (
                  <p>Until {new Date(endDate).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            )}
          </div>

          {/* Media Section */}
          {image && layoutStyle === 'split' && (
            <div className="order-1 md:order-2">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width || 600}
                  height={image.height || 400}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}

          {/* Full-width media */}
          {image && layoutStyle === 'full-width' && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width || 800}
                  height={image.height || 400}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            </div>
          )}

          {/* Card layout media */}
          {image && layoutStyle === 'card' && (
            <div className="mt-6">
              <div className="relative rounded-lg overflow-hidden shadow-xl">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={image.width || 600}
                  height={image.height || 300}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PartnershipCharterBanner;
