// Define the valid positions as a const array to use in both type and schema
export const ACCENT_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as const;
export type AccentPosition = typeof ACCENT_POSITIONS[number];

export interface IAccentGraphic {
  Url: string;
  Alt: string;
  Position?: AccentPosition;
  Opacity?: number;
}
