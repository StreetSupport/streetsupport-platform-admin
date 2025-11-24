export interface IBannerBackground {
  Type: BackgroundType;
  Value: string;
  Overlay?: {
    Colour?: string;
    Opacity?: number;
  };
}

export enum BackgroundType {
  SOLID = 'solid',
  GRADIENT = 'gradient',
  IMAGE = 'image'
}
