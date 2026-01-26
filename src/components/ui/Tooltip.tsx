'use client';

import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    let finalPosition = position;
    let top = 0;
    let left = 0;

    // Check if preferred position fits, otherwise flip
    if (position === 'top' && triggerRect.top - tooltipRect.height - gap < 10) {
      finalPosition = 'bottom';
    } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + gap > viewportHeight - 10) {
      finalPosition = 'top';
    } else if (position === 'left' && triggerRect.left - tooltipRect.width - gap < 10) {
      finalPosition = 'right';
    } else if (position === 'right' && triggerRect.right + tooltipRect.width + gap > viewportWidth - 10) {
      finalPosition = 'left';
    }

    // Calculate position based on final position
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep tooltip within viewport bounds
    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewportWidth - 10) left = viewportWidth - tooltipRect.width - 10;
    if (top < 10) top = 10;
    if (top + tooltipRect.height > viewportHeight - 10) top = viewportHeight - tooltipRect.height - 10;

    setActualPosition(finalPosition);
    setTooltipStyle({ top, left });

    // Calculate arrow position
    const arrowTop = finalPosition === 'top' ? tooltipRect.height : finalPosition === 'bottom' ? -8 : triggerRect.top + triggerRect.height / 2 - top - 4;
    const arrowLeft = finalPosition === 'left' ? tooltipRect.width : finalPosition === 'right' ? -8 : triggerRect.left + triggerRect.width / 2 - left - 4;

    setArrowStyle({
      top: finalPosition === 'top' || finalPosition === 'bottom' ? undefined : arrowTop,
      bottom: finalPosition === 'top' ? -8 : undefined,
      left: finalPosition === 'left' || finalPosition === 'right' ? undefined : arrowLeft,
      right: finalPosition === 'left' ? -8 : undefined,
    });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure tooltip is rendered before calculating position
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, calculatePosition]);

  const arrowClasses = {
    top: 'border-t-brand-k border-x-transparent border-b-transparent',
    bottom: 'border-b-brand-k border-x-transparent border-t-transparent',
    left: 'border-l-brand-k border-y-transparent border-r-transparent',
    right: 'border-r-brand-k border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          className="text-brand-f hover:text-brand-d transition-colors focus:outline-none focus:ring-2 focus:ring-brand-d focus:ring-offset-1 rounded-full"
          aria-label="More information"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999]"
          style={tooltipStyle}
        >
          <div
            className="bg-brand-k text-white text-xs px-3 py-2 rounded-md shadow-lg whitespace-normal"
            style={{ width: 'max-content', maxWidth: '400px' }}
          >
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
            style={arrowStyle}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

interface InfoTooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function InfoTooltip({ content, position = 'top', className = '' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position} className={`ml-1.5 ${className}`} />
  );
}
