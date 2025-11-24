import { ILocationCoordinates } from "./ILocationCoordinates";

/**
 * ILocation interface for service locations
 * 
 * Validation rules:
 * - If IsOutreachLocation is true: Description is required, address fields are optional
 * - If IsOutreachLocation is false/undefined: StreetLine1 and Postcode are required
 */
export interface ILocation {
  IsOutreachLocation?: boolean;
  Description: string; // Required if IsOutreachLocation is true
  StreetLine1: string; // Required if IsOutreachLocation is false/undefined
  StreetLine2?: string;
  StreetLine3?: string;
  StreetLine4?: string;
  City?: string;
  Postcode: string; // Required if IsOutreachLocation is false/undefined
  Location?: ILocationCoordinates;
}
