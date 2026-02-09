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
    Bluesky?: string;
    Instagram?: string;
    Addresses: IAddress[];
    Notes: INote[];
    Administrators: IAdministrator[];
}

// Form-specific version of IOrganisation with required fields and form-friendly types
export interface IOrganisationFormData extends Omit<IOrganisation, '_id' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy' | 'Tags' | 'Addresses' | 'Notes'> {
  // Override Tags to be array instead of string for easier form handling
  Tags: OrganisationTag[];
  
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

// Organisation Tag Enum
export enum OrganisationTag {
  CHARITY = 'charity',
  NO_WRONG_DOOR = 'no-wrong-door',
  COALITION_OF_RELIEF = 'coalition-of-relief',
  BIG_CHANGE = 'big-change'
}

export const ORGANISATION_TAGS = [
  { value: OrganisationTag.CHARITY, label: 'Registered Charity' },
  { value: OrganisationTag.NO_WRONG_DOOR, label: 'No Wrong Door' },
  { value: OrganisationTag.COALITION_OF_RELIEF, label: 'Coalition of Relief (mcr only)' },
  { value: OrganisationTag.BIG_CHANGE, label: 'Big Change (mcr only)' }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' }
];
