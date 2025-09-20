export interface ICTAButton {
  Label: string;
  Url: string;
  Variant?: CTAVariant;
  External?: boolean;
  TrackingContext?: string;
}

export enum CTAVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}
