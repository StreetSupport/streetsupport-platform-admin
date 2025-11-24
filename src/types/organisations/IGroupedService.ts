import { ILocation } from "./ILocation";
import { IOpeningTime } from "./IOpeningTime";
import { IServiceSubCategory } from "./IServiceSubCategory";

export interface IGroupedService {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  IsPublished: boolean;
  IsVerified: boolean;
  ProviderId: string;
  ProviderName?: string;
  CategoryId: string;
  CategoryName?: string;
  CategorySynopsis?: string;
  Info?: string;
  Tags?: string[];
  Location: ILocation;
  IsOpen247: boolean;
  OpeningTimes?: IOpeningTime[];
  SubCategories: IServiceSubCategory[];
  IsTelephoneService?: boolean;
  IsAppointmentOnly?: boolean;
  Telephone?: string;
}
