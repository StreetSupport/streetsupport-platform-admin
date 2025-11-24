import { ILocationCoordinates } from "./ILocationCoordinates";
import { IOpeningTime } from "./IOpeningTime";

export interface IAddress {
  Street: string;
  Street1?: string;
  Street2?: string;
  Street3?: string;
  City?: string;
  Postcode: string;
  Telephone?: string;
  IsOpen247?: boolean;
  IsAppointmentOnly?: boolean;
  Location?: ILocationCoordinates;
  OpeningTimes: IOpeningTime[];
}
