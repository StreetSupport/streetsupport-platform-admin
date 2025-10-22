import { IServiceSubCategory } from "./IServiceSubCategory";

export interface IServiceCategory {
  _id: string;
  Name: string;
  Synopsis: string;
  SubCategories: IServiceSubCategory[];
}