'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewportHeight - 10) {
        newPosition = 'top';
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right';
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewportWidth - 10) {
        newPosition = 'left';
      }

      if (newPosition !== adjustedPosition) {
        setAdjustedPosition(newPosition);
      }
    }
  }, [isVisible, position, adjustedPosition]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-brand-k border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-brand-k border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-brand-k border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-brand-k border-y-transparent border-l-transparent',
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

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[adjustedPosition]}`}
        >
          <div className="bg-brand-k text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs whitespace-normal">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[adjustedPosition]}`}
          />
        </div>
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
