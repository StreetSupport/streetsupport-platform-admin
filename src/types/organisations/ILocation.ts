import { ILocationCoordinates } from "./ILocationCoordinates";

export interface ILocation {
  Description: string;
  StreetLine1: string;
  StreetLine2?: string;
  StreetLine3?: string;
  StreetLine4?: string;
  City?: string;
  Postcode: string;
  Location?: ILocationCoordinates;
}