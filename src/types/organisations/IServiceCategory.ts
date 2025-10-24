// Subcategory as returned from category API (uses Key instead of _id)
export interface ICategorySubCategory {
  Key: string;
  Name: string;
  Synopsis?: string;
}

export interface IServiceCategory {
  _id: string;
  Name: string;
  Synopsis: string;
  SubCategories: ICategorySubCategory[];
}