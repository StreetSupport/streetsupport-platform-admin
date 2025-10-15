import { ILocation } from "./ILocation";
import { IOpeningTime } from "./IOpeningTime";

export interface IAddress {
  Primary: boolean;
  Key: string;
  Street: string;
  Street1?: string;
  Street2?: string;
  Street3?: string;
  City?: string;
  Postcode: string;
  Telephone?: string;
  IsOpen247?: boolean;
  IsAppointmentOnly?: boolean;
  Location?: ILocation;
  OpeningTimes: IOpeningTime[];
}