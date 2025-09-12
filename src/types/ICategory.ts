export interface ICategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryInput {
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}
