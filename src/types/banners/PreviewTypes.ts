// Shared preview types used by banner preview components

export type PublicBackground = {
  type: string;
  value: string;
  overlay?: { colour: string; opacity: number };
};

export type PublicCTAButton = {
  label: string;
  url: string;
  variant: string;
  external: boolean;
};

export type PublicMedia = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};
