import { IMediaAsset } from './IMediaAsset';
import { IBannerBackground, ICTAButton } from '@/types/index';
import { IUploadedFile } from './IUploadedFile';

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

  // Media - flexible: either image or YouTube
  MediaType: MediaType;
  Logo?: IMediaAsset;
  BackgroundImage?: IMediaAsset;
  MainImage?: IMediaAsset;
  YouTubeUrl?: string;

  // File upload for CTAs (PDFs, images, etc.)
  UploadedFile?: IUploadedFile;

  // Actions
  CtaButtons?: ICTAButton[];

  // Styling
  Background: IBannerBackground;
  TextColour: TextColour;
  LayoutStyle: LayoutStyle;

  // Scheduling
  StartDate?: Date;
  EndDate?: Date;

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
export type UploadedFileField = IUploadedFile | File | null;

// Form data interface that can handle both create and edit scenarios
export interface IBannerFormData extends Omit<IBanner, 'Logo' | 'BackgroundImage' | 'MainImage' | 'UploadedFile' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy'> {
  // Media fields that can be either existing assets or new files
  Logo?: MediaField;
  BackgroundImage?: MediaField;
  MainImage?: MediaField;

  // Uploaded file for CTA links
  UploadedFile?: UploadedFileField;
}

// Enums for type safety
export enum MediaType {
  IMAGE = 'image',
  YOUTUBE = 'youtube'
}

export enum TextColour {
  BLACK = 'black',
  WHITE = 'white'
}

export enum LayoutStyle {
  SPLIT = 'split',
  FULL_WIDTH = 'full-width'
}
