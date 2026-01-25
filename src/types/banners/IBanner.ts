import { IMediaAsset } from './IMediaAsset';
import { IBannerBackground, ICTAButton } from '@/types/index';

export enum MediaType {
  IMAGE = 'image',
  YOUTUBE = 'youtube'
}

export interface IUploadedFile {
  FileUrl: string;
  FileName: string;
  FileSize?: string;
  FileType?: string;
}

export interface IBanner {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;

  Title: string;
  Description?: string;
  Subtitle?: string;

  MediaType: MediaType;
  YouTubeUrl?: string;
  Logo?: IMediaAsset;
  BackgroundImage?: IMediaAsset;
  MainImage?: IMediaAsset;
  UploadedFile?: IUploadedFile;

  CtaButtons?: ICTAButton[];

  Background: IBannerBackground;
  TextColour: TextColour;
  LayoutStyle: LayoutStyle;

  StartDate?: Date;
  EndDate?: Date;

  IsActive: boolean;
  LocationSlug: string;
  LocationName?: string;
  Priority: number;
  TrackingContext?: string;
}

export interface IMediaAssetFileMeta {
  File: File;
  Width?: number;
  Height?: number;
}

export type MediaField = IMediaAsset | File | IMediaAssetFileMeta | null;

export interface IBannerFormData extends Omit<IBanner, 'Logo' | 'BackgroundImage' | 'MainImage' | 'UploadedFile' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy'> {
  Logo?: MediaField;
  BackgroundImage?: MediaField;
  MainImage?: MediaField;
  UploadedFile?: IUploadedFile | File | null;
}

export enum TextColour {
  BLACK = 'black',
  WHITE = 'white'
}

export enum LayoutStyle {
  SPLIT = 'split',
  FULL_WIDTH = 'full-width'
}
