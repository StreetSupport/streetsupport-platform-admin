'use client';

import React from 'react';
import { IBannerFormData, BannerTemplateType, LayoutStyle } from '@/types/banners/IBanner';
// TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
import { BackgroundType, CTAVariant, type IMediaAsset /*, IAccentGraphic*/, type IResourceFile } from '@/types';
import { GivingCampaignBanner } from './GivingCampaignBanner';
import { PartnershipCharterBanner } from './PartnershipCharterBanner';
import { ResourceProjectBanner } from './ResourceProjectBanner';

interface BannerPreviewProps {
  data: IBannerFormData;
  className?: string;
}

// Type guards
const isMediaAsset = (asset: unknown): asset is IMediaAsset => {
  return !!asset && typeof asset === 'object' && 'Url' in (asset as Record<string, unknown>);
};

// TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
// type AccentGraphicFileMeta = { File: File; Alt?: string; Position?: string; Opacity?: number };
type MediaAssetFileMeta = { File: File; Width?: number; Height?: number };
const isMediaAssetFileMeta = (value: unknown): value is MediaAssetFileMeta => {
  return (
    !!value &&
    typeof value === 'object' &&
    'File' in (value as Record<string, unknown>) &&
    (value as { File?: unknown }).File instanceof File
  );
};
// TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
// const isAccentGraphicFileMeta = (value: unknown): value is AccentGraphicFileMeta => {
//   return (
//     !!value &&
//     typeof value === 'object' &&
//     'File' in (value as Record<string, unknown>) &&
//     (value as { File?: unknown }).File instanceof File
//   );
// };

const isResourceFile = (file: unknown): file is IResourceFile => {
  // File has 'name'; our resource metadata does not
  return !!file && typeof file === 'object' && !('name' in (file as Record<string, unknown>));
};

/**
 * Transform admin data structure (PascalCase, nested) to public website format (camelCase, flat)
 */
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

  // TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
  // const processAccentGraphic = (
  //   graphic: IAccentGraphic | AccentGraphicFileMeta | File | null | undefined
  // ): { url: string; alt: string; position: string; opacity: number } | undefined => {
  //   if (graphic instanceof File) {
  //     return {
  //       url: URL.createObjectURL(graphic),
  //       alt: graphic.name,
  //       position: 'top-right',
  //       opacity: 0.6,
  //     };
  //   }
  //   if (isAccentGraphicFileMeta(graphic)) {
  //     return {
  //       url: URL.createObjectURL(graphic.File),
  //       alt: graphic.Alt || graphic.File.name,
  //       position: graphic.Position?.toLowerCase() || 'top-right',
  //       opacity: graphic.Opacity ?? 0.6,
  //     };
  //   }
  //   if (graphic && typeof graphic === 'object' && 'Url' in (graphic as Record<string, unknown>)) {
  //     const g = graphic as IAccentGraphic;
  //     return {
  //       url: g.Url || '',
  //       alt: g.Alt || '',
  //       position: g.Position?.toLowerCase() || 'top-right',
  //       opacity: g.Opacity ?? 0.6,
  //     };
  //   }
  //   return undefined;
  // };

  // Determine background image URL from BackgroundImage (File or IMediaAsset)
  const bgImage = processMediaAsset(data.BackgroundImage);
  const backgroundType = data.Background?.Type?.toLowerCase() || 'solid';

  let resourceFileUrl: string | undefined;
  if (data.TemplateType === BannerTemplateType.RESOURCE_PROJECT) {
    const resourceFile = data.ResourceProject?.ResourceFile;
    if (resourceFile instanceof File) {
      resourceFileUrl = URL.createObjectURL(resourceFile);
    } else if (isResourceFile(resourceFile) && resourceFile.FileUrl) {
      resourceFileUrl = resourceFile.FileUrl;
    }
  }

  const ctaButtons = data.CtaButtons?.map((btn, index) => {
    const url = (data.TemplateType === BannerTemplateType.RESOURCE_PROJECT && index === 0 && resourceFileUrl) ? resourceFileUrl : btn.Url;
    return {
      label: btn.Label || '',
      url,
      variant: btn.Variant?.toLowerCase() || CTAVariant.PRIMARY,
      external: btn.External || false
    };
  }) || [];



  const commonProps = {
    title: data.Title || '',
    description: data.Description || '',
    subtitle: data.Subtitle || '',
    logo: processMediaAsset(data.Logo),
    image: processMediaAsset(data.MainImage),
    ctaButtons: ctaButtons,
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
    layoutStyle: data.LayoutStyle?.toLowerCase() || LayoutStyle.SPLIT,
    // TODO: Uncomment if AccentGraphic is needed. In the other case, remove.
    // accentGraphic: processAccentGraphic(data.AccentGraphic),
    showDates: data.ShowDates || false,
    startDate: data.StartDate,
    endDate: data.EndDate,
    badgeText: data.BadgeText || ''
  };

  return commonProps;
}

export const BannerPreview: React.FC<BannerPreviewProps> = ({ data, className = '' }) => {
  const commonProps = transformToPublicFormat(data);

  if (!data.TemplateType) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Banner Preview</h3>
          <p className="text-sm">Select a template type to see your banner preview</p>
        </div>
      </div>
    );
  }

  switch (data.TemplateType) {
    case BannerTemplateType.GIVING_CAMPAIGN:
      return (
        <GivingCampaignBanner
          {...commonProps}
          urgencyLevel={data.GivingCampaign?.UrgencyLevel?.toLowerCase()}
          campaignEndDate={data.GivingCampaign?.CampaignEndDate}
          donationGoal={data.GivingCampaign?.DonationGoal ? {
            current: data.GivingCampaign.DonationGoal.Current || 0,
            target: data.GivingCampaign.DonationGoal.Target || 0,
            currency: data.GivingCampaign.DonationGoal.Currency || 'GBP'
          } : undefined}
          className={className}
        />
      );

    case BannerTemplateType.PARTNERSHIP_CHARTER:
      return (
        <PartnershipCharterBanner
          {...commonProps}
          charterType={data.PartnershipCharter?.CharterType?.toLowerCase()}
          signatoriesCount={data.PartnershipCharter?.SignatoriesCount}
          partnerLogos={
            (data.PartnershipCharter?.PartnerLogos
              ?.map((logo: IMediaAsset | File): { url: string; alt: string; width?: number; height?: number } | null => {
                if (logo instanceof File) {
                  return { url: URL.createObjectURL(logo), alt: logo.name };
                }
                if (isMediaAsset(logo)) {
                  return { url: logo.Url || '', alt: logo.Alt || '', width: logo.Width, height: logo.Height };
                }
                return null;
              })
              .filter((item): item is { url: string; alt: string; width?: number; height?: number } => item !== null)) || []
          }
          className={className}
        />
      );

    case BannerTemplateType.RESOURCE_PROJECT: {
      const resourceFile = data.ResourceProject?.ResourceFile;
      return (
        <ResourceProjectBanner
          {...commonProps}
          resourceType={resourceFile && isResourceFile(resourceFile) ? resourceFile.ResourceType?.toLowerCase() : undefined}
          downloadCount={resourceFile && isResourceFile(resourceFile) ? resourceFile.DownloadCount : undefined}
          lastUpdated={resourceFile && isResourceFile(resourceFile) ? resourceFile.LastUpdated : undefined}
          fileSize={resourceFile && isResourceFile(resourceFile) ? resourceFile.FileSize : undefined}
          fileType={resourceFile && isResourceFile(resourceFile) ? resourceFile.FileType : undefined}
          className={className}
        />
      );
    }
    default:
      return (
        <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center ${className}`}>
          <div className="text-yellow-600">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Unknown Template Type</h3>
            <p className="text-sm">The selected template type &quot;{data.TemplateType}&quot; is not supported</p>
          </div>
        </div>
      );
  }
};

export default BannerPreview;
