import { IAddress } from "./IAddress";
import { IOpeningTime } from "./IOpeningTime";

export interface IProvidedService {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  ParentId: string;
  IsPublished: boolean;
  ServiceProviderKey: string;
  ServiceProviderName: string;
  ParentCategoryKey: string;
  SubCategoryKey: string;
  SubCategoryName: string;
  Info?: string;
  Tags?: string[];
  OpeningTimes: IOpeningTime[];
  Address: IAddress;
  LocationDescription?: string;
}