'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { IMediaAsset } from '@/types';

interface BannerPreviewProps {
  data: any;
}

export function BannerPreview({ data }: BannerPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewImageUrls, setPreviewImageUrls] = useState<{ Logo?: string; BackgroundImage?: string; SplitImage?: string; PartnerLogos?: string[]; AccentGraphic?: string }>({});

  useEffect(() => {
    const urls: { Logo?: string; BackgroundImage?: string; SplitImage?: string; PartnerLogos?: string[]; AccentGraphic?: string } = {};

    const processMedia = (media: any) => {
      if (media instanceof File) { // Handles Logo, BackgroundImage, SplitImage
        return URL.createObjectURL(media);
      }
      if (typeof media === 'object' && media !== null) {
        if (media.File instanceof File) { // Handles the AccentGraphic object structure
          return URL.createObjectURL(media.File);
        }
        if (media.Url) { // Handles existing media assets
          return media.Url;
        }
      }
      return null;
    };

    urls.Logo = processMedia(data?.Logo);
    urls.BackgroundImage = processMedia(data?.BackgroundImage);
    urls.SplitImage = processMedia(data?.SplitImage);
    urls.AccentGraphic = processMedia(data?.AccentGraphic);

    if (data?.PartnerLogos && Array.isArray(data.PartnerLogos)) {
      urls.PartnerLogos = data.PartnerLogos.map((logo: File | IMediaAsset) =>
        logo instanceof File ? URL.createObjectURL(logo) : logo.Url
      ).filter(Boolean);
    }

    setPreviewImageUrls(urls);

    return () => {
      // Clean up all created blob URLs
      const allUrls = [urls.Logo, urls.BackgroundImage, urls.SplitImage, urls.AccentGraphic, ...(urls.PartnerLogos || [])];
      allUrls.forEach(url => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [data?.Logo, data?.BackgroundImage, data?.SplitImage, data?.PartnerLogos, data?.AccentGraphic]);

  if (!data) {
    return (
      <div className="card">
        <div className="card-header"><h2 className="heading-5">Live Preview</h2></div>
        <div className="card-content">
          <div className="bg-brand-q rounded-lg p-8 text-center">
            <p className="text-body text-brand-f">Configure banner settings to see preview</p>
          </div>
        </div>
      </div>
    );
  }

  const getPreviewContainerClass = () => previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full';

  const getLayoutClass = () => {
    if (previewMode === 'mobile') return 'space-y-6';
    switch (data.LayoutStyle) {
      case 'split': return 'grid md:grid-cols-2 gap-8 items-center';
      case 'card': return 'rounded-lg shadow-lg backdrop-blur-sm max-w-4xl mx-auto';
      default: return 'text-center';
    }
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const { Background } = data;
    if (!Background) return {};
    
    let style: React.CSSProperties = {};
    switch (Background.Type) {
      case 'solid':
        style.backgroundColor = Background.Value;
        break;
      case 'gradient':
        style.background = Background.Value;
        break;
      case 'image':
        if (previewImageUrls.BackgroundImage) {
          style.backgroundImage = `url(${previewImageUrls.BackgroundImage})`;
          style.backgroundSize = 'cover';
          style.backgroundPosition = 'center';
          style.backgroundRepeat = 'no-repeat';
        }
        break;
    }
    return style;
  };

  const getTextColorClass = () => data.TextColour === 'white' ? 'text-white' : 'text-gray-900';

  const getAccentGraphicStyle = (): React.CSSProperties => {
    if (!previewImageUrls.AccentGraphic || !data.AccentGraphic) return {};

    const positionStyles: Record<string, React.CSSProperties> = {
      'top-left': { top: '1rem', left: '1rem' },
      'top-right': { top: '1rem', right: '1rem' },
      'bottom-left': { bottom: '1rem', left: '1rem' },
      'bottom-right': { bottom: '1rem', right: '1rem' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    };

    const position = (data.AccentGraphic && !(data.AccentGraphic instanceof File)) ? data.AccentGraphic.Position : 'top-left';
    const opacity = (data.AccentGraphic && !(data.AccentGraphic instanceof File)) ? data.AccentGraphic.Opacity : 0.6;

    return {
      position: 'absolute',
      opacity,
      maxWidth: '25%',
      maxHeight: '25%',
      ...positionStyles[position || 'top-left'],
    };
  };

  const getUrgencyBadgeColor = () => {
    switch (data.GivingCampaign?.UrgencyLevel) {
      case 'low': return 'service-tag open';
      case 'medium': return 'service-tag limited';
      case 'high': return 'service-tag emergency';
      case 'critical': return 'service-tag emergency';
      default: return 'service-tag closed';
    }
  };

  const calculateProgress = () => {
    if (!data.GivingCampaign?.DonationGoal || !data.GivingCampaign.DonationGoal.Target) return 0;
    return Math.min(Math.round((data.GivingCampaign.DonationGoal.Current / data.GivingCampaign.DonationGoal.Target) * 100), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: data.GivingCampaign?.DonationGoal?.Currency || 'GBP'
    }).format(amount);
  };

  const renderTemplateContent = () => {
    switch (data.TemplateType) {
      case 'partnership-charter':
        return (
          <>
            {data.PartnershipCharter?.CharterType && (
              <div className="flex items-center gap-3 mb-4">
                <Badge className="service-tag verified">
                  {data.PartnershipCharter.CharterType.split('-').map((w:any) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Badge>
              </div>
            )}
            {data.PartnershipCharter?.SignatoriesCount > 0 && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg text-center">
                <div className="text-3xl font-bold mb-1">{data.PartnershipCharter.SignatoriesCount}</div>
                <div className="text-sm opacity-80">Organizations Signed</div>
              </div>
            )}
          </>
        );
      case 'resource-project':
        return (
          <>
            {data.ResourceProject?.ResourceFile?.ResourceType && (
              <div className="flex items-center gap-3 mb-4">
                <Badge className="service-tag limited">📄 {data.ResourceProject.ResourceFile.ResourceType}</Badge>
                {data.ResourceProject.ResourceFile.FileType && <Badge className="service-tag closed">{data.ResourceProject.ResourceFile.FileType.toUpperCase()}</Badge>}
              </div>
            )}
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg grid grid-cols-2 gap-4 text-sm">
              {data.ResourceProject?.ResourceFile?.DownloadCount > 0 && (
                <div>
                  <div className="font-semibold">{data.ResourceProject.ResourceFile.DownloadCount.toLocaleString()}</div>
                  <div className="opacity-80">Downloads</div>
                </div>
              )}
              {data.ResourceProject?.ResourceFile?.FileSize && (
                <div>
                  <div className="font-semibold">{data.ResourceProject.ResourceFile.FileSize}</div>
                  <div className="opacity-80">File Size</div>
                </div>
              )}
            </div>
          </>
        );
      default: return null;
    }
  };

  const renderGivingCampaign = () => (
    <>
      <div className="space-y-6">
        {data.GivingCampaign?.UrgencyLevel && (
          <div className="flex items-center gap-3">
            <Badge className={getUrgencyBadgeColor()}>
              {data.GivingCampaign.UrgencyLevel === 'critical' && '🚨 '}
              {data.GivingCampaign.UrgencyLevel === 'high' && '⚡ '}
              {data.GivingCampaign.UrgencyLevel.charAt(0).toUpperCase() + data.GivingCampaign.UrgencyLevel.slice(1)} Appeal
            </Badge>
            {data.BadgeText && <Badge className="service-tag urgent">{data.BadgeText}</Badge>}
          </div>
        )}
        {previewImageUrls.Logo && <div className="flex justify-start"><img src={previewImageUrls.Logo} alt="Logo" className="max-h-20 object-contain" /></div>}
        <div className="space-y-3">
          <h1 className={`${previewMode === 'mobile' ? 'text-2xl' : 'text-3xl'} font-bold leading-tight`}>{data.Title || 'Banner Title'}</h1>
          {data.Subtitle && <h2 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-xl'} font-semibold opacity-90`}>{data.Subtitle}</h2>}
          {data.Description && <p className={`${previewMode === 'mobile' ? 'text-base' : 'text-lg'} opacity-80 leading-relaxed max-w-2xl`}>{data.Description}</p>}
        </div>
        {data.GivingCampaign?.DonationGoal && (
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg">{formatCurrency(data.GivingCampaign.DonationGoal.Current)} raised</span>
              <span className="opacity-80">of {formatCurrency(data.GivingCampaign.DonationGoal.Target)} goal</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div className="bg-white h-3 rounded-full" style={{ width: `${calculateProgress()}%` }} />
            </div>
            <p className="text-sm opacity-70">{calculateProgress()}% funded</p>
          </div>
        )}
        {data.GivingCampaign?.CampaignEndDate && (
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-sm opacity-80 mb-1">Campaign ends:</div>
            <div className="font-semibold">{new Date(data.GivingCampaign.CampaignEndDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        )}
        {renderCtaButtons()}
      </div>
      {data.LayoutStyle === 'split' && (
        <div className={`flex justify-center items-center ${previewMode === 'mobile' ? 'mt-6' : ''}`}>
          {previewImageUrls.SplitImage ? (
            <img src={previewImageUrls.SplitImage} alt="Campaign" className="rounded-lg max-h-64 object-contain" />
          ) : (
            <div className="w-48 h-32 bg-white/20 rounded-lg flex items-center justify-center text-white/50">
              Image
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderDefaultTemplate = () => (
    <>
      <div className="space-y-4">
        {previewImageUrls.Logo && <div className="flex justify-start mb-4"><img src={previewImageUrls.Logo} alt="Logo" className="max-h-20 object-contain" /></div>}
        {data.BadgeText && <Badge className="bg-white/20 text-white">{data.BadgeText}</Badge>}
        {renderTemplateContent()}
        <h1 className="text-3xl font-bold leading-tight">{data.Title || 'Banner Title'}</h1>
        {data.Subtitle && <h2 className="text-xl font-semibold opacity-90">{data.Subtitle}</h2>}
        {data.Description && <p className="text-lg opacity-80 max-w-2xl">{data.Description}</p>}
        {renderCtaButtons()}
      </div>
      {data.LayoutStyle === 'split' && (
        <div className="flex justify-center items-center">
          {previewImageUrls.BackgroundImage ? <img src={previewImageUrls.BackgroundImage} alt="Banner media" className="rounded-lg max-h-64 object-contain" /> : <div className="w-48 h-32 bg-white/20 rounded-lg" />}
        </div>
      )}
      {data.TemplateType === 'partnership-charter' && previewImageUrls.PartnerLogos && previewImageUrls.PartnerLogos.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
          {previewImageUrls.PartnerLogos.map((logoUrl: string, index: number) => <img key={index} src={logoUrl} alt={`Partner ${index + 1}`} className="max-h-12 object-contain bg-white p-1 rounded" />)}
        </div>
      )}
    </>
  );

  const renderCtaButtons = () => (
    <div className={`flex ${previewMode === 'mobile' ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 pt-4`}>
      {data.CtaButtons?.map((button: any, index: number) => {
        let btnClass = `inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all ${previewMode === 'mobile' ? 'w-full' : ''}`;
        const isWhiteText = data.TextColour === 'white';
        switch (button.Variant) {
          case 'primary': btnClass += isWhiteText ? " bg-white text-gray-900 hover:bg-gray-100" : " bg-gray-900 text-white hover:bg-gray-800"; break;
          case 'secondary': btnClass += isWhiteText ? " bg-white/20 text-white border border-white/40 hover:bg-white/30" : " bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200"; break;
          case 'outline': btnClass += isWhiteText ? " bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900" : " bg-transparent text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white"; break;
        }
        return <button key={index} className={btnClass} disabled>{button.Label}{button.External && <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>}</button>;
      })}
    </div>
  );

  return (
    <div className="card">
      <div className="card-header"><h2 className="heading-5">Live Preview</h2></div>
      <div className="card-content">
        <div className="mb-6 p-4 bg-brand-q rounded-lg hidden lg:block">
          <h3 className="text-small font-medium text-brand-k mb-3">Preview Options</h3>
          <div className="flex gap-2">
            {(['desktop', 'mobile'] as const).map(mode => <button key={mode} onClick={() => setPreviewMode(mode)} className={`btn-base btn-sm ${previewMode === mode ? 'btn-primary' : 'btn-secondary'}`}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>)}
          </div>
        </div>
        <div className={`w-full lg:${getPreviewContainerClass()}`}>
          <div className={`relative overflow-hidden py-12 px-6 rounded-lg ${getTextColorClass()}`} style={getBackgroundStyle()}>
            {data.Background?.Overlay && <div className="absolute inset-0" style={{ backgroundColor: data.Background.Overlay.Colour, opacity: data.Background.Overlay.Opacity }} />}
            {previewImageUrls.AccentGraphic && (
              <img
                src={previewImageUrls.AccentGraphic}
                alt="Accent Graphic"
                style={getAccentGraphicStyle()}
              />
            )}
            <div className={`relative z-10 ${getLayoutClass()}`}>
              {data.TemplateType === 'giving-campaign' ? renderGivingCampaign() : renderDefaultTemplate()}
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-brand-q rounded-lg">
          <h3 className="text-small font-medium text-brand-k mb-2">Banner Information</h3>
          <div className="grid grid-cols-2 gap-4 text-small text-brand-l">
            <div><span className="font-medium text-brand-k">Template:</span> {data.TemplateType}</div>
            <div><span className="font-medium text-brand-k">Layout:</span> {data.LayoutStyle}</div>
            <div><span className="font-medium text-brand-k">Text Color:</span> {data.TextColour}</div>
            <div><span className="font-medium text-brand-k">Priority:</span> {data.Priority}</div>
            <div><span className="font-medium text-brand-k">Location:</span> {data.LocationSlug || 'All Locations'}</div>
            <div><span className="font-medium text-brand-k">Status:</span> {data.IsActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}