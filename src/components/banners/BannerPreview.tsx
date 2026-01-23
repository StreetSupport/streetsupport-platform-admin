'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IBannerFormData, LayoutStyle, MediaType } from '@/types/banners/IBanner';
import { BackgroundType, CTAVariant, type IMediaAsset } from '@/types';

interface BannerPreviewProps {
  data: IBannerFormData;
  className?: string;
}

const isMediaAsset = (asset: unknown): asset is IMediaAsset => {
  return !!asset && typeof asset === 'object' && 'Url' in (asset as Record<string, unknown>);
};

type MediaAssetFileMeta = { File: File; Width?: number; Height?: number };
const isMediaAssetFileMeta = (value: unknown): value is MediaAssetFileMeta => {
  return (
    !!value &&
    typeof value === 'object' &&
    'File' in (value as Record<string, unknown>) &&
    (value as { File?: unknown }).File instanceof File
  );
};

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function transformToPublicFormat(data: IBannerFormData) {
  const processMediaAsset = (
    asset: IMediaAsset | File | MediaAssetFileMeta | null | undefined
  ): { url: string; alt: string; width?: number; height?: number } | undefined => {
    if (asset instanceof File) {
      return { url: URL.createObjectURL(asset), alt: asset.name };
    }
    if (isMediaAssetFileMeta(asset)) {
      return {
        url: URL.createObjectURL(asset.File),
        alt: asset.File.name,
        width: asset.Width,
        height: asset.Height,
      };
    }
    if (isMediaAsset(asset)) {
      return { url: asset.Url || '', alt: asset.Alt || '', width: asset.Width, height: asset.Height };
    }
    return undefined;
  };

  const bgImage = processMediaAsset(data.BackgroundImage);
  const backgroundType = data.Background?.Type?.toLowerCase() || 'solid';

  const ctaButtons = data.CtaButtons?.map((btn) => ({
    label: btn.Label || '',
    url: btn.Url || '/',
    variant: btn.Variant?.toLowerCase() || CTAVariant.PRIMARY,
    external: btn.External || false
  })) || [];

  return {
    title: data.Title || '',
    description: data.Description || '',
    subtitle: data.Subtitle || '',
    logo: processMediaAsset(data.Logo),
    image: processMediaAsset(data.MainImage),
    mediaType: data.MediaType || MediaType.IMAGE,
    youTubeUrl: data.YouTubeUrl || '',
    ctaButtons,
    background: {
      type: backgroundType,
      value: backgroundType === BackgroundType.IMAGE ? (bgImage?.url || data.Background?.Value || '') : (data.Background?.Value || '#38ae8e'),
      backgroundImage: bgImage,
      overlay: data.Background?.Overlay ? {
        colour: data.Background.Overlay.Colour || 'rgba(0,0,0,0.5)',
        opacity: data.Background.Overlay.Opacity || 0.5
      } : undefined
    },
    textColour: data.TextColour?.toLowerCase() || 'white',
    layoutStyle: data.LayoutStyle?.toLowerCase() || LayoutStyle.SPLIT
  };
}

export const BannerPreview: React.FC<BannerPreviewProps> = ({ data, className = '' }) => {
  const props = transformToPublicFormat(data);

  const generateBackgroundStyles = () => {
    const styles: React.CSSProperties = {};
    if (props.background.type === 'solid') {
      styles.backgroundColor = props.background.value;
    } else if (props.background.type === 'gradient') {
      styles.backgroundImage = props.background.value;
    } else if (props.background.type === 'image' && props.background.backgroundImage?.url) {
      styles.backgroundImage = `url(${props.background.backgroundImage.url})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
    }
    return styles;
  };

  const textColourClass = props.textColour === 'white' ? 'text-white' : 'text-gray-900';
  const layoutIsFullWidth = props.layoutStyle === 'full-width';

  return (
    <section
      className={`relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 ${textColourClass} ${className}`}
      style={generateBackgroundStyles()}
      role="banner"
      aria-labelledby="banner-title"
    >
      {props.background.overlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: props.background.overlay.colour,
            opacity: props.background.overlay.opacity
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className={layoutIsFullWidth ? 'text-center' : 'grid md:grid-cols-2 gap-8 items-center'}>
          <div className={!layoutIsFullWidth ? 'order-2 md:order-1' : ''}>
            {props.logo && (
              <div className={`mb-6 ${layoutIsFullWidth ? 'flex justify-center' : ''}`}>
                <Image
                  src={props.logo.url}
                  alt={props.logo.alt}
                  width={props.logo.width || 200}
                  height={props.logo.height || 60}
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
            )}

            <h1
              id="banner-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
            >
              {props.title}
            </h1>

            {props.subtitle && (
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 opacity-90">
                {props.subtitle}
              </h2>
            )}

            {props.description && (
              <p className={`text-lg sm:text-xl mb-6 opacity-80 leading-relaxed max-w-2xl ${layoutIsFullWidth ? 'mx-auto' : ''}`}>
                {props.description}
              </p>
            )}

            {props.ctaButtons.length > 0 && (
              <div className={`flex flex-col sm:flex-row gap-4 ${layoutIsFullWidth ? 'justify-center' : ''}`}>
                {props.ctaButtons.map((button, index) => {
                  const buttonClasses = `
                    inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all
                    ${button.variant === 'primary'
                      ? props.textColour === 'white'
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      : button.variant === 'secondary'
                        ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                        : 'border-2 border-current hover:bg-white/10'
                    }
                  `;

                  if (button.external) {
                    return (
                      <a
                        key={index}
                        href={button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses}
                      >
                        {button.label}
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    );
                  }

                  return (
                    <Link key={index} href={button.url} className={buttonClasses}>
                      {button.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {!layoutIsFullWidth && (
            <div className="order-1 md:order-2">
              {props.mediaType === MediaType.YOUTUBE && props.youTubeUrl ? (
                <div className="relative rounded-lg overflow-hidden shadow-2xl aspect-video">
                  <iframe
                    src={getYouTubeEmbedUrl(props.youTubeUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video"
                  />
                </div>
              ) : props.image ? (
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={props.image.url}
                    alt={props.image.alt}
                    width={props.image.width || 600}
                    height={props.image.height || 400}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : null}
            </div>
          )}

          {layoutIsFullWidth && (props.mediaType === MediaType.YOUTUBE && props.youTubeUrl ? (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden shadow-2xl aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(props.youTubeUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video"
                />
              </div>
            </div>
          ) : props.image && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={props.image.url}
                  alt={props.image.alt}
                  width={props.image.width || 800}
                  height={props.image.height || 400}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerPreview;
