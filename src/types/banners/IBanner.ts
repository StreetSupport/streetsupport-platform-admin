import { IMediaAsset } from './IMediaAsset';
import { IBannerBackground, ICTAButton, IDonationGoal } from '@/types/index';
import { IResourceFile } from './IResourceFile';

// Template-specific interfaces
export interface IGivingCampaign {
  UrgencyLevel: UrgencyLevel;
  CampaignEndDate?: Date;
  DonationGoal?: IDonationGoal;
}

export interface IPartnershipCharter {
  PartnerLogos?: IMediaAsset[];
  CharterType?: CharterType;
  SignatoriesCount?: number;
}

export interface IResourceProject {
  ResourceFile?: IResourceFile;
}

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
  MainImage?: IMediaAsset; // Separate image for split layout (not background)
  
  // Actions
  CtaButtons?: ICTAButton[];
  
  // Styling
  Background: IBannerBackground;
  TextColour: TextColour;
  LayoutStyle: LayoutStyle;

  // Scheduling
  ShowDates?: boolean;
  StartDate?: Date;
  EndDate?: Date;
  BadgeText?: string;
  
  // Template-specific fields - using intersection types for better type safety
  GivingCampaign?: IGivingCampaign;
  PartnershipCharter?: IPartnershipCharter;
  ResourceProject?: IResourceProject;
  
  // CMS metadata
  IsActive: boolean;
  LocationSlug: string;
  LocationName?: string;
  Priority: number;
  TrackingContext?: string;
}

// Union type for handling both existing assets and new file uploads
export interface IMediaAssetFileMeta {
  File: File;
  Width?: number;
  Height?: number;
}

export type MediaField = IMediaAsset | File | IMediaAssetFileMeta | null;
export type MediaArrayField = (IMediaAsset | File)[];
export type ResourceFileField = IResourceFile | File | null;

// Form data interface that can handle both create and edit scenarios
export interface IBannerFormData extends Omit<IBanner, 'Logo' | 'BackgroundImage' | 'MainImage' | 'GivingCampaign' | 'PartnershipCharter' | 'ResourceProject' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy'> {
  // Media fields that can be either existing assets or new files
  Logo?: MediaField;
  BackgroundImage?: MediaField;
  MainImage?: MediaField;
  
  // Template-specific fields with File support
  GivingCampaign?: IGivingCampaign;
  PartnershipCharter?: Omit<IPartnershipCharter, 'PartnerLogos'> & {
    PartnerLogos?: MediaArrayField;
  };
  ResourceProject?: Omit<IResourceProject, 'ResourceFile'> & {
    ResourceFile?: ResourceFileField;
  };
}

// Helper type for edit mode - when we receive data from API
// export interface IBannerEditData extends IBanner {
//   // In edit mode, we receive IMediaAsset[] from API but need to convert for form
// }

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
