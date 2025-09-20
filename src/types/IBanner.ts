import { IMediaAsset } from './IMediaAsset';
import { IAccentGraphic, IBannerBackground, ICTAButton, IDonationGoal } from '@/types/index';
import { IResourceFile } from './IResourceFile';

export interface IBanner {
  // Audit fields
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;

  // Core content
  Title: string;
  Description?: string;
  Subtitle?: string;
  TemplateType: BannerTemplateType;
  
  // Media
  Logo?: IMediaAsset;
  BackgroundImage?: IMediaAsset;
  SplitImage?: IMediaAsset; // Separate image for split layout (not background)
  
  // Actions
  CtaButtons: ICTAButton[];
  
  // Styling
  Background: IBannerBackground;
  TextColour: TextColour;
  LayoutStyle: LayoutStyle;
  AccentGraphic?: IAccentGraphic;
  
  // Scheduling
  ShowDates?: boolean;
  StartDate?: Date;
  EndDate?: Date;
  BadgeText?: string;
  
  // Template-specific fields
  // Giving Campaign
  UrgencyLevel?: UrgencyLevel;
  CampaignEndDate?: Date;
  DonationGoal?: IDonationGoal;
  
  // Partnership Charter
  PartnerLogos?: IMediaAsset[];
  CharterType?: CharterType;
  SignatoriesCount?: number;
  
  // Resource Project
  ResourceFile?: IResourceFile;
  
  // CMS metadata
  IsActive: boolean;
  LocationSlug?: string;
  Priority: number;
  
  // Analytics
  TrackingContext?: string;
  AnalyticsId?: string;
}

// Union type for handling both existing assets and new file uploads
export type MediaField = IMediaAsset | File | null;
export type MediaArrayField = (IMediaAsset | File)[];
export type ResourceFileField = IResourceFile | File | null;

// Form data interface that can handle both create and edit scenarios
export interface IBannerFormData extends Omit<IBanner, 'Logo' | 'BackgroundImage' | 'SplitImage' | 'PartnerLogos' | 'ResourceFile'> {
  // Media fields that can be either existing assets or new files
  PartnerLogos?: MediaArrayField;
  Logo?: MediaField;
  BackgroundImage?: MediaField;
  SplitImage?: MediaField;
  ResourceFile?: ResourceFileField;
}

// Helper type for edit mode - when we receive data from API
export interface IBannerEditData extends IBanner {
  // In edit mode, we receive IMediaAsset[] from API but need to convert for form
}

// Enums for type safety
export enum BannerTemplateType {
  GIVING_CAMPAIGN = 'giving-campaign',
  PARTNERSHIP_CHARTER = 'partnership-charter',
  RESOURCE_PROJECT = 'resource-project'
}

export enum TextColour {
  BLACK = 'black',
  WHITE = 'white'
}

export enum LayoutStyle {
  SPLIT = 'split',
  FULL_WIDTH = 'full-width',
  CARD = 'card'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum CharterType {
  HOMELESS_CHARTER = 'homeless-charter',
  REAL_CHANGE = 'real-change',
  ALTERNATIVE_GIVING = 'alternative-giving',
  PARTNERSHIP = 'partnership'
}

export enum ResourceType {
  GUIDE = 'guide',
  TOOLKIT = 'toolkit',
  RESEARCH = 'research',
  TRAINING = 'training',
  EVENT = 'event'
}
