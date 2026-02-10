'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  parseColourInput,
  formatOutput,
  hslToHex,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  isValidHex,
  type RGBA,
  type HSL,
} from '@/lib/colour-utils';

const SSN_PRESETS = [
  { name: 'Primary Teal', value: '#38ae8e' },
  { name: 'Secondary Teal', value: '#0b9b75' },
  { name: 'Dark Teal', value: '#086049' },
  { name: 'Orange', value: '#ffa200' },
  { name: 'Soft Yellow', value: '#ffec83' },
  { name: 'Grey', value: '#8d8d8d' },
  { name: 'Mint', value: '#b0dccf' },
  { name: 'Purple', value: '#5a497f' },
];

const RECENT_COLOURS_KEY = 'ssn-admin-recent-colours';
const MAX_RECENT_COLOURS = 8;

type ColourFormat = 'hex' | 'rgb' | 'hsl';

interface ColourPickerProps {
  value: string;
  onChange: (value: string) => void;
  enableOpacity?: boolean;
  disabled?: boolean;
  className?: string;
}

function getRecentColours(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLOURS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentColour(colour: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentColours();
    const filtered = recent.filter(c => c.toLowerCase() !== colour.toLowerCase());
    const updated = [colour, ...filtered].slice(0, MAX_RECENT_COLOURS);
    localStorage.setItem(RECENT_COLOURS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function parseValueToRgba(value: string): RGBA {
  const parsed = parseColourInput(value);
  if (parsed) return parsed;
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function ColourPicker({
  value,
  onChange,
  enableOpacity = false,
  disabled = false,
  className = '',
}: ColourPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [format, setFormat] = useState<ColourFormat>('hex');
  const [recentColours, setRecentColours] = useState<string[]>([]);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const satBoxRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);

  const [internalRgba, setInternalRgba] = useState<RGBA>(() => parseValueToRgba(value));
  const [hexInput, setHexInput] = useState('');
  const [rgbInputs, setRgbInputs] = useState({ r: '', g: '', b: '' });
  const [hslInputs, setHslInputs] = useState({ h: '', s: '', l: '' });
  const [opacityInput, setOpacityInput] = useState('100');

  const initialValueRef = useRef(value);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const rgba = parseValueToRgba(value);
    setInternalRgba(rgba);
    setHexInput(rgbToHex({ r: rgba.r, g: rgba.g, b: rgba.b }));
    setRgbInputs({
      r: Math.round(rgba.r).toString(),
      g: Math.round(rgba.g).toString(),
      b: Math.round(rgba.b).toString(),
    });
    const hsl = rgbToHsl({ r: rgba.r, g: rgba.g, b: rgba.b });
    setHslInputs({
      h: Math.round(hsl.h).toString(),
      s: Math.round(hsl.s * 100).toString(),
      l: Math.round(hsl.l * 100).toString(),
    });
    setOpacityInput(Math.round(rgba.a * 100).toString());
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setRecentColours(getRecentColours());
      initialValueRef.current = value;
    }
  }, [isOpen, value]);

  const updateColour = useCallback((rgba: RGBA) => {
    setInternalRgba(rgba);
    setHexInput(rgbToHex({ r: rgba.r, g: rgba.g, b: rgba.b }));
    setRgbInputs({
      r: Math.round(rgba.r).toString(),
      g: Math.round(rgba.g).toString(),
      b: Math.round(rgba.b).toString(),
    });
    const hsl = rgbToHsl({ r: rgba.r, g: rgba.g, b: rgba.b });
    setHslInputs({
      h: Math.round(hsl.h).toString(),
      s: Math.round(hsl.s * 100).toString(),
      l: Math.round(hsl.l * 100).toString(),
    });
    setOpacityInput(Math.round(rgba.a * 100).toString());
    onChange(formatOutput(rgba));
  }, [onChange]);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 420;
    const gap = 8;

    let top = rect.bottom + gap;
    let left = rect.left;

    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) left = 10;

    if (top + popoverHeight > window.innerHeight - 10) {
      top = rect.top - popoverHeight - gap;
    }
    if (top < 10) top = 10;

    setPopoverStyle({ top, left });
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isOpen, calculatePosition]);

  const handleClose = useCallback(() => {
    if (value !== initialValueRef.current) {
      saveRecentColour(value);
    }
    setIsOpen(false);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  const handleSwatchClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleHexInputBlur = () => {
    let inputValue = hexInput.trim();
    if (!inputValue.startsWith('#')) {
      inputValue = '#' + inputValue;
    }
    if (isValidHex(inputValue)) {
      const rgb = hexToRgb(inputValue);
      if (rgb) {
        updateColour({ ...rgb, a: internalRgba.a });
      }
    } else {
      setHexInput(rgbToHex({ r: internalRgba.r, g: internalRgba.g, b: internalRgba.b }));
    }
  };

  const handleHexInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHexInputBlur();
    }
  };

  const hsl = rgbToHsl({ r: internalRgba.r, g: internalRgba.g, b: internalRgba.b });

  const handleSatBoxInteraction = useCallback((clientX: number, clientY: number) => {
    if (!satBoxRef.current) return;

    const rect = satBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const s = x;
    const l = 1 - y;
    const lightness = l * (1 - s / 2);
    const saturation = lightness === 0 || lightness === 1 ? 0 : (l - lightness) / Math.min(lightness, 1 - lightness);

    const newHsl: HSL = { h: hsl.h, s: saturation, l: lightness };
    const rgb = hslToRgb(newHsl);
    updateColour({ ...rgb, a: internalRgba.a });
  }, [hsl.h, internalRgba.a, updateColour]);

  const handleHueInteraction = useCallback((clientX: number) => {
    if (!hueSliderRef.current) return;

    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newHue = x * 360;

    const rgb = hslToRgb({ h: newHue, s: hsl.s, l: hsl.l });
    updateColour({ ...rgb, a: internalRgba.a });
  }, [hsl.s, hsl.l, internalRgba.a, updateColour]);

  const handleOpacityInteraction = useCallback((clientX: number) => {
    if (!opacitySliderRef.current) return;

    const rect = opacitySliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    updateColour({ ...internalRgba, a: x });
  }, [internalRgba, updateColour]);

  const createDragHandler = (
    handler: (clientX: number, clientY: number) => void
  ) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      handler(e.clientX, e.clientY);

      const handleMove = (moveEvent: MouseEvent) => {
        handler(moveEvent.clientX, moveEvent.clientY);
      };

      const handleUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    };
  };

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', val: string) => {
    setRgbInputs(prev => ({ ...prev, [channel]: val }));
  };

  const handleRgbInputBlur = (channel: 'r' | 'g' | 'b') => {
    const parsed = parseInt(rgbInputs[channel], 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(255, parsed));
      const newRgba = { ...internalRgba, [channel]: clamped };
      updateColour(newRgba);
    } else {
      setRgbInputs(prev => ({
        ...prev,
        [channel]: Math.round(internalRgba[channel]).toString(),
      }));
    }
  };

  const handleHslInputChange = (channel: 'h' | 's' | 'l', val: string) => {
    setHslInputs(prev => ({ ...prev, [channel]: val }));
  };

  const handleHslInputBlur = (channel: 'h' | 's' | 'l') => {
    const parsed = parseInt(hslInputs[channel], 10);
    if (!isNaN(parsed)) {
      let newHsl: HSL;
      if (channel === 'h') {
        const clamped = Math.max(0, Math.min(360, parsed));
        newHsl = { h: clamped, s: hsl.s, l: hsl.l };
      } else {
        const clamped = Math.max(0, Math.min(100, parsed)) / 100;
        newHsl = { ...hsl, [channel]: clamped };
      }
      const rgb = hslToRgb(newHsl);
      updateColour({ ...rgb, a: internalRgba.a });
    } else {
      setHslInputs({
        h: Math.round(hsl.h).toString(),
        s: Math.round(hsl.s * 100).toString(),
        l: Math.round(hsl.l * 100).toString(),
      });
    }
  };

  const handleOpacityInputChange = (val: string) => {
    setOpacityInput(val);
  };

  const handleOpacityInputBlur = () => {
    const parsed = parseInt(opacityInput, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(100, parsed));
      updateColour({ ...internalRgba, a: clamped / 100 });
    } else {
      setOpacityInput(Math.round(internalRgba.a * 100).toString());
    }
  };

  const handlePresetClick = (presetValue: string) => {
    const rgb = hexToRgb(presetValue);
    if (rgb) {
      updateColour({ ...rgb, a: internalRgba.a });
    }
  };

  const handleRecentClick = (recentValue: string) => {
    const parsed = parseColourInput(recentValue);
    if (parsed) {
      updateColour(enableOpacity ? parsed : { ...parsed, a: 1 });
    }
  };

  const satBoxX = hsl.l === 0 || hsl.l === 1 ? 0 : hsl.s;
  const satBoxY = 1 - (hsl.l / (1 - hsl.s / 2) || 0);
  const hueBaseColour = hslToHex({ h: hsl.h, s: 1, l: 0.5 });
  const displayHex = rgbToHex({ r: internalRgba.r, g: internalRgba.g, b: internalRgba.b });

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} ref={triggerRef}>
      <button
        type="button"
        onClick={handleSwatchClick}
        disabled={disabled}
        className={`w-10 h-10 rounded-md border border-gray-300 shadow-sm overflow-hidden ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-brand-d'
        }`}
        style={{
          background: internalRgba.a < 1
            ? `linear-gradient(45deg, #ccc 25%, transparent 25%),
               linear-gradient(-45deg, #ccc 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #ccc 75%),
               linear-gradient(-45deg, transparent 75%, #ccc 75%)`
            : undefined,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        }}
        aria-label="Open colour picker"
      >
        <div
          className="w-full h-full"
          style={{ backgroundColor: formatOutput(internalRgba) }}
        />
      </button>

      <input
        type="text"
        value={hexInput}
        onChange={(e) => setHexInput(e.target.value)}
        onBlur={handleHexInputBlur}
        onKeyDown={handleHexInputKeyDown}
        disabled={disabled}
        className={`w-24 px-2 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent ${
          disabled ? 'bg-brand-q cursor-not-allowed opacity-60' : 'bg-white'
        }`}
        placeholder="#000000"
      />

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 p-4"
          style={{ ...popoverStyle, width: 280 }}
        >
          <div
            ref={satBoxRef}
            className="relative w-full h-40 rounded-md cursor-crosshair mb-3"
            style={{
              background: `
                linear-gradient(to top, #000, transparent),
                linear-gradient(to right, #fff, ${hueBaseColour})
              `,
            }}
            onMouseDown={createDragHandler((x, y) => handleSatBoxInteraction(x, y))}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `calc(${satBoxX * 100}% - 8px)`,
                top: `calc(${Math.max(0, Math.min(1, satBoxY)) * 100}% - 8px)`,
                backgroundColor: displayHex,
              }}
            />
          </div>

          <div
            ref={hueSliderRef}
            className="relative w-full h-4 rounded-md cursor-pointer mb-3"
            style={{
              background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
            onMouseDown={createDragHandler((x) => handleHueInteraction(x))}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -top-0"
              style={{
                left: `calc(${(hsl.h / 360) * 100}% - 8px)`,
                backgroundColor: hslToHex({ h: hsl.h, s: 1, l: 0.5 }),
              }}
            />
          </div>

          {enableOpacity && (
            <div
              ref={opacitySliderRef}
              className="relative w-full h-4 rounded-md cursor-pointer mb-3"
              style={{
                background: `
                  linear-gradient(to right, transparent, ${displayHex}),
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px',
                backgroundPosition: '0 0, 0 0, 0 4px, 4px -4px, -4px 0px',
              }}
              onMouseDown={createDragHandler((x) => handleOpacityInteraction(x))}
            >
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -top-0"
                style={{
                  left: `calc(${internalRgba.a * 100}% - 8px)`,
                  backgroundColor: formatOutput(internalRgba),
                }}
              />
            </div>
          )}

          <div className="flex gap-1 mb-3 border-b border-gray-200">
            {(['hex', 'rgb', 'hsl'] as ColourFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-xs font-medium uppercase ${
                  format === f
                    ? 'text-brand-a border-b-2 border-brand-a'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="mb-3">
            {format === 'hex' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hex</label>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    onBlur={handleHexInputBlur}
                    onKeyDown={handleHexInputKeyDown}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                  />
                </div>
                {enableOpacity && (
                  <div className="w-16">
                    <label className="block text-xs text-gray-500 mb-1">A %</label>
                    <input
                      type="text"
                      value={opacityInput}
                      onChange={(e) => handleOpacityInputChange(e.target.value)}
                      onBlur={handleOpacityInputBlur}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                    />
                  </div>
                )}
              </div>
            )}

            {format === 'rgb' && (
              <div className="flex gap-2">
                {(['r', 'g', 'b'] as const).map((channel) => (
                  <div key={channel} className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1 uppercase">{channel}</label>
                    <input
                      type="text"
                      value={rgbInputs[channel]}
                      onChange={(e) => handleRgbInputChange(channel, e.target.value)}
                      onBlur={() => handleRgbInputBlur(channel)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                    />
                  </div>
                ))}
                {enableOpacity && (
                  <div className="w-14">
                    <label className="block text-xs text-gray-500 mb-1">A %</label>
                    <input
                      type="text"
                      value={opacityInput}
                      onChange={(e) => handleOpacityInputChange(e.target.value)}
                      onBlur={handleOpacityInputBlur}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                    />
                  </div>
                )}
              </div>
            )}

            {format === 'hsl' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">H</label>
                  <input
                    type="text"
                    value={hslInputs.h}
                    onChange={(e) => handleHslInputChange('h', e.target.value)}
                    onBlur={() => handleHslInputBlur('h')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">S %</label>
                  <input
                    type="text"
                    value={hslInputs.s}
                    onChange={(e) => handleHslInputChange('s', e.target.value)}
                    onBlur={() => handleHslInputBlur('s')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">L %</label>
                  <input
                    type="text"
                    value={hslInputs.l}
                    onChange={(e) => handleHslInputChange('l', e.target.value)}
                    onBlur={() => handleHslInputBlur('l')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                  />
                </div>
                {enableOpacity && (
                  <div className="w-14">
                    <label className="block text-xs text-gray-500 mb-1">A %</label>
                    <input
                      type="text"
                      value={opacityInput}
                      onChange={(e) => handleOpacityInputChange(e.target.value)}
                      onBlur={handleOpacityInputBlur}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-a"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-2">Brand Colours</label>
            <div className="grid grid-cols-8 gap-1">
              {SSN_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className="w-6 h-6 rounded border border-gray-300 hover:border-brand-d transition-colors"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {recentColours.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-2">Recent</label>
              <div className="grid grid-cols-8 gap-1">
                {recentColours.map((colour, index) => (
                  <button
                    key={`${colour}-${index}`}
                    type="button"
                    onClick={() => handleRecentClick(colour)}
                    className="w-6 h-6 rounded border border-gray-300 hover:border-brand-d transition-colors"
                    style={{ backgroundColor: colour }}
                    title={colour}
                  />
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
