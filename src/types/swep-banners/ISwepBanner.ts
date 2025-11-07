import { IEmergencyContact } from "./IEmergencyContact";

export interface ISwepBanner {
  // System fields
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;

  // Core fields
  locationSlug: string;
  locationName: string;
  title: string;
  body: string; // HTML content
  image: string; // Blob storage URL - required in database
  shortMessage: string;
  
  // Date fields
  swepActiveFrom?: Date;
  swepActiveUntil?: Date;
  isActive: boolean;
  
  // Emergency contact
  emergencyContact: IEmergencyContact;
}

export interface ISwepBannerFormData {
  locationSlug: string;
  locationName?: string; // Optional since it's not editable
  title: string;
  body: string;
  image?: string | File; // Optional - not needed when editing text only
  shortMessage: string;
  swepActiveFrom?: Date | string;
  swepActiveUntil?: Date | string;
  isActive: boolean;
  emergencyContact?: IEmergencyContact;
}