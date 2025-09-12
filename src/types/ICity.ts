export interface ICity {
  _id: string;
  name: string;
  country: string;
  region?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICityInput {
  name: string;
  country: string;
  region?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive?: boolean;
}
