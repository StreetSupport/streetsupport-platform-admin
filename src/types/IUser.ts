export interface IUser {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  UserName: string;
  AuthClaims: string[];
  Email: {
    type: string;
    data: Buffer;
  } | string; // Allow string for backward compatibility
  AssociatedAreaId: string;
  Auth0Id: string;
  AssociatedProviderLocationIds: string[];
  role?: 'admin' | 'moderator' | 'user';
  name?: string;
  email?: string;
  image?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface IApiListResponse<T> extends IApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
