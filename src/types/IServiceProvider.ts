export interface IServiceProvider {
  _id: string;
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  contactInfo: {
    email: string;
    phone?: string;
    address: IAddress;
  };
  services: string[]; // Array of service IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceProviderInput {
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  contactInfo: {
    email: string;
    phone?: string;
    address: IAddress;
  };
  services?: string[];
}

interface IAddress {
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
