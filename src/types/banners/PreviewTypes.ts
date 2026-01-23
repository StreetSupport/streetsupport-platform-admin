// Shared preview types used by banner preview components

export type PublicBackground = {
  type: string;
  value: string;
  backgroundImage?: PublicMedia;
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

export type PublicUploadedFile = {
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
};
