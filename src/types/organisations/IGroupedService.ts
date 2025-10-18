import { ILocation } from "./ILocation";
import { IOpeningTime } from "./IOpeningTime";
import { ISubCategory } from "./ISubCategory";

export interface IGroupedService extends Document {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  ProviderId: string;
  ProviderName?: string;
  ProviderAssociatedLocationIds?: string[];
  CategoryId: string;
  CategoryName?: string;
  CategorySynopsis?: string;
  Info?: string;
  Tags?: string[];
  Location: ILocation;
  IsOpen247: boolean;
  OpeningTimes?: IOpeningTime[];
  SubCategories: ISubCategory[];
  SubCategoriesIds?: string[];
  IsTelephoneService?: boolean;
  IsAppointmentOnly?: boolean;
}