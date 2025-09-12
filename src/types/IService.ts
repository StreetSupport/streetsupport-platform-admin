export interface IService {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  providerId: string;
  locationId: string;
  isActive: boolean;
  openingHours: IOpeningTime[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  address: IAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOpeningTime {
  day: number; // 0-6 (Sunday-Saturday)
  open: string; // HH:MM format
  close: string; // HH:MM format
  isClosed: boolean;
}

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IServiceInput {
  name: string;
  description: string;
  categoryId: string;
  providerId: string;
  locationId: string;
  isActive?: boolean;
  openingHours: IOpeningTime[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  address: IAddress;
}
