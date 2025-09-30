export interface ICTAButton {
  Label: string;
  Url: string;
  Variant?: CTAVariant;
  External?: boolean;
  AutomaticallyPopulatedUrl?: boolean;
}

export enum CTAVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}
