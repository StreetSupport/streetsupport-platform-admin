import { IEmergencyContact } from "./IEmergencyContact";

export interface ISwepBanner {
  // System fields
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;

  // Core fields
  LocationSlug: string;
  LocationName: string;
  Title: string;
  Body: string; // HTML content
  Image?: string; // Blob storage URL - required in database
  ShortMessage: string;
  
  // Date fields
  SwepActiveFrom?: Date;
  SwepActiveUntil?: Date;
  IsActive: boolean;
  
  // Emergency contact
  EmergencyContact: IEmergencyContact;
}

export interface ISwepBannerFormData {
  LocationSlug: string;
  LocationName?: string; // Optional since it's not editable
  Title: string;
  Body: string;
  Image: string | File; // Optional - not needed when editing text only
  ShortMessage: string;
  SwepActiveFrom?: Date | string;
  SwepActiveUntil?: Date | string;
  IsActive: boolean;
  EmergencyContact?: IEmergencyContact;
}
