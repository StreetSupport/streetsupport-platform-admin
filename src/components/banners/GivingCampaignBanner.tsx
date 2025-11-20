'use client';

import React from 'react';
import Image from 'next/image';
import type { PublicBackground, PublicCTAButton } from '@/types/banners/PreviewTypes';
import { CTAVariant, LayoutStyle, UrgencyLevel } from '@/types';

// Banner utility functions adapted for admin preview
function generateBackgroundClasses(background: PublicBackground): string {
  const { type } = background;
  let classes = '';
  
  switch (type) {
    case 'solid':
      classes = 'bg-gray-900'; // Fallback, will be overridden with inline style
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
    case LayoutStyle.SPLIT:
      return 'grid md:grid-cols-2 gap-8 items-center';
    case LayoutStyle.FULL_WIDTH:
      return 'text-center';
    case LayoutStyle.CARD:
      return 'max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8';
    default:
      return '';
  }
}

function generateCTAClasses(button: PublicCTAButton, textColour: string): string {
  const { variant = CTAVariant.PRIMARY } = button;
  let baseClasses = 'inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  switch (variant) {
    case CTAVariant.PRIMARY:
      if (textColour === 'white') {
        baseClasses += ' bg-white text-gray-900 hover:bg-gray-100 focus:ring-white';
      } else {
        baseClasses += ' bg-brand-a text-white hover:bg-brand-b focus:ring-brand-a';
      }
      break;
    case CTAVariant.SECONDARY:
      if (textColour === 'white') {
        baseClasses += ' bg-white/20 text-white border border-white/40 hover:bg-white/30 focus:ring-white';
      } else {
        baseClasses += ' bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500';
      }
      break;
    case CTAVariant.OUTLINE:
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

function generateUrgencyClasses(urgencyLevel: string): string {
  switch (urgencyLevel) {
    case UrgencyLevel.CRITICAL:
      return 'bg-red-600 text-white animate-pulse';
    case UrgencyLevel.HIGH:
      return 'bg-red-500 text-white';
    case UrgencyLevel.MEDIUM:
      return 'bg-yellow-500 text-gray-900';
    case UrgencyLevel.LOW:
      return 'bg-green-500 text-white';
    default:
      return 'bg-blue-500 text-white';
  }
}

function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculateProgress(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

interface GivingCampaignBannerProps {
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
  urgencyLevel?: string;
  campaignEndDate?: Date;
  donationGoal?: { current: number; target: number; currency: string };
  className?: string;
}

export const GivingCampaignBanner: React.FC<GivingCampaignBannerProps> = ({
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
  urgencyLevel,
  campaignEndDate,
  donationGoal,
  className = ''
}) => {
  const backgroundClasses = generateBackgroundClasses(background);
  const backgroundStyles = generateBackgroundStyles(background);
  const textColourClasses = generateTextColourClasses(textColour);
  const layoutClasses = generateLayoutClasses(layoutStyle);

  const progress = donationGoal ? calculateProgress(donationGoal.current, donationGoal.target) : 0;

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
      aria-labelledby="giving-campaign-title"
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
          <div className={layoutStyle === LayoutStyle.SPLIT ? 'order-2 md:order-1' : ''}>
            {/* Badge and urgency indicator */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {urgencyLevel && urgencyLevel !== UrgencyLevel.LOW && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${generateUrgencyClasses(urgencyLevel)}`}>
                  {urgencyLevel === UrgencyLevel.CRITICAL && '🚨 Critical'}
                  {urgencyLevel === UrgencyLevel.HIGH && '⚡ Urgent'}
                  {urgencyLevel === UrgencyLevel.MEDIUM && '📢 Important'}
                </span>
              )}
              {badgeText && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                  {badgeText}
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
              id="giving-campaign-title"
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
              <p className={`text-lg sm:text-xl mb-6 opacity-80 leading-relaxed max-w-2xl ${layoutStyle === LayoutStyle.FULL_WIDTH ? 'mx-auto' : ''}`}>
                {description}
              </p>
            )}

            {/* Donation Goal Progress */}
            {donationGoal && (
              <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">
                    {formatCurrency(donationGoal.current, donationGoal.currency)} raised
                  </span>
                  <span className="opacity-80">
                    of {formatCurrency(donationGoal.target, donationGoal.currency)} goal
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${progress}% of donation goal reached`}
                  />
                </div>
                <p className="text-sm opacity-70">
                  {progress}% funded • {100 - progress}% to go
                </p>
              </div>
            )}

            {/* Campaign End Date */}
            {campaignEndDate && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <p className="font-semibold mb-1">Campaign ends:</p>
                <p className="text-lg">
                  {new Date(campaignEndDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {ctaButtons.map((button, index) => (
                <a
                  key={index}
                  href={button.url || '#'}
                  target={button.external ? '_blank' : '_self'}
                  rel={button.external ? 'noopener noreferrer' : ''}
                  className={generateCTAClasses(button, textColour)}
                  aria-describedby={index === 0 ? 'giving-campaign-title' : undefined}
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
                </a>
              ))}
            </div>
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
          {layoutStyle === LayoutStyle.SPLIT && image && image.url && (
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
          {layoutStyle === LayoutStyle.SPLIT && (!image || !image.url) && (
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
          {layoutStyle === LayoutStyle.FULL_WIDTH && image && image.url && (
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
          {layoutStyle === LayoutStyle.FULL_WIDTH && (!image || !image.url) && (
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
          {layoutStyle === LayoutStyle.CARD && image && image.url && (
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
          {layoutStyle === LayoutStyle.CARD && (!image || !image.url) && (
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

export default GivingCampaignBanner;
