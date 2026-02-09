export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

export function hexToRgb(hex: string): RGB | null {
  const sanitised = hex.replace(/^#/, '');

  if (sanitised.length === 3) {
    const r = parseInt(sanitised[0] + sanitised[0], 16);
    const g = parseInt(sanitised[1] + sanitised[1], 16);
    const b = parseInt(sanitised[2] + sanitised[2], 16);
    return { r, g, b };
  }

  if (sanitised.length === 6) {
    const r = parseInt(sanitised.slice(0, 2), 16);
    const g = parseInt(sanitised.slice(2, 4), 16);
    const b = parseInt(sanitised.slice(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNormalised = h / 360;

  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hNormalised + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNormalised) * 255),
    b: Math.round(hue2rgb(p, q, hNormalised - 1 / 3) * 255),
  };
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb);
}

export function isValidHex(hex: string): boolean {
  const pattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return pattern.test(hex);
}

export function parseColourInput(input: string): RGBA | null {
  const trimmed = input.trim().toLowerCase();

  if (isValidHex(trimmed)) {
    const rgb = hexToRgb(trimmed);
    if (rgb) return { ...rgb, a: 1 };
  }

  const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: 1,
    };
  }

  const rgbaMatch = trimmed.match(/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: parseFloat(rgbaMatch[4]),
    };
  }

  const hslMatch = trimmed.match(/^hsl\(\s*(\d{1,3})\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/);
  if (hslMatch) {
    const hsl: HSL = {
      h: parseInt(hslMatch[1], 10),
      s: parseFloat(hslMatch[2]) / 100,
      l: parseFloat(hslMatch[3]) / 100,
    };
    const rgb = hslToRgb(hsl);
    return { ...rgb, a: 1 };
  }

  const hslaMatch = trimmed.match(/^hsla\(\s*(\d{1,3})\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)\s*\)$/);
  if (hslaMatch) {
    const hsl: HSL = {
      h: parseInt(hslaMatch[1], 10),
      s: parseFloat(hslaMatch[2]) / 100,
      l: parseFloat(hslaMatch[3]) / 100,
    };
    const rgb = hslToRgb(hsl);
    return { ...rgb, a: parseFloat(hslaMatch[4]) };
  }

  return null;
}

export function formatOutput(rgba: RGBA): string {
  if (rgba.a < 1) {
    return `rgba(${Math.round(rgba.r)},${Math.round(rgba.g)},${Math.round(rgba.b)},${rgba.a})`;
  }
  return rgbToHex({ r: rgba.r, g: rgba.g, b: rgba.b });
}

export function rgbaToHsla(rgba: RGBA): HSLA {
  const hsl = rgbToHsl({ r: rgba.r, g: rgba.g, b: rgba.b });
  return { ...hsl, a: rgba.a };
}

export function hslaToRgba(hsla: HSLA): RGBA {
  const rgb = hslToRgb({ h: hsla.h, s: hsla.s, l: hsla.l });
  return { ...rgb, a: hsla.a };
}
