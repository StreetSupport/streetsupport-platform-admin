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
  Auth0Id: string;
  AssociatedProviderLocationIds: string[];
  IsActive: boolean;
}
