import { IAddress } from "./IAddress";
import { IAdministrator } from "./IAdministrator";
import { INote } from "./INote";
import { IOpeningTime } from "./IOpeningTime";

export interface IOrganisation {
    _id: string;
    DocumentCreationDate: Date;
    DocumentModifiedDate: Date;
    CreatedBy: string;
    Key: string;
    AssociatedLocationIds: string[];
    Name: string;
    ShortDescription: string;
    Description: string;
    IsVerified: boolean;
    IsPublished: boolean;
    Tags?: string;
    Email?: string;
    Telephone?: string;
    Website?: string;
    Facebook?: string;
    Twitter?: string;
    Addresses: IAddress[];
    Notes: INote[];
    //Administrators: IAdministrator[];
}

// Form-specific version of IOrganisation with required fields and form-friendly types
export interface IOrganisationFormData extends Omit<IOrganisation, '_id' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy' | 'Tags' | 'Addresses' | 'Notes'> {
  // Override Tags to be array instead of string for easier form handling
  Tags: string[];
  
  // Override Addresses to use form-friendly version
  Addresses: IAddressFormData[];
}

// Form-specific version of IAddress with form-friendly opening times
export interface IAddressFormData extends Omit<IAddress, 'OpeningTimes'> {
  OpeningTimes: IOpeningTimeFormData[];
}

// Form-specific version of IOpeningTime with string times for easier input handling
export interface IOpeningTimeFormData extends Omit<IOpeningTime, 'StartTime' | 'EndTime'> {
  StartTime: string; // Format: "HH:MM" for time inputs
  EndTime: string;   // Format: "HH:MM" for time inputs
}

export const ORGANISATION_TAGS = [
  { value: 'charity', label: 'Registered Charity' },
  { value: 'no-wrong-door', label: 'No Wrong Door' },
  { value: 'coalition-of-relief', label: 'Coalition of Relief (mcr only)' },
  { value: 'big-change', label: 'Big Change (mcr only)' }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];
