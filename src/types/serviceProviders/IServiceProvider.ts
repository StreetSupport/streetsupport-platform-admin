import { IAddress } from "./IAddress";
import { IAdministrator } from "./IAdministrator";
import { INote } from "./INote";

export interface IServiceProvider {
    _id: string;
    DocumentCreationDate: Date;
    DocumentModifiedDate: Date;
    CreatedBy?: string;
    Key: string;
    AssociatedLocationIds: string[];
    Name: string;
    ShortDescription?: string;
    IsVerified: boolean;
    IsPublished: boolean;
    RegisteredCharity?: number;
    Description?: string;
    AreaServiced?: string;
    Tags?: string;
    DonationUrl?: string;
    DonationDescription?: string;
    ItemsDonationUrl?: string;
    ItemsDonationDescription?: string;
    Email?: string;
    Telephone?: string;
    Website?: string;
    Facebook?: string;
    Twitter?: string;
    Addresses: IAddress[];
    Notes: INote[];
    // Administrators: IAdministrator[];
}
