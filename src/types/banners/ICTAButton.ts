export interface ICTAButton {
  Label: string;
  Url: string;
  Variant?: CTAVariant;
}

export enum CTAVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}
