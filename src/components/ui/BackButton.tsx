'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  label = 'Back',
  onClick,
  className = '',
  showIcon = true
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (!href) {
      e.preventDefault();
      router.back();
    }
  };

  const buttonContent = (
    <>
      {showIcon && <ChevronLeft className="w-4 h-4 mr-1" />}
      {label}
    </>
  );

  const baseClasses = `
    inline-flex items-center text-brand-a hover:text-brand-b 
    transition-colors duration-200 font-medium text-sm
    focus:outline-none focus:ring-2 focus:ring-brand-a focus:ring-offset-2
    rounded-md px-2 py-1 -ml-2
    ${className}
  `.trim();

  if (href) {
    return (
      <Link href={href} className={baseClasses} onClick={handleClick}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button type="button" className={baseClasses} onClick={handleClick}>
      {buttonContent}
    </button>
  );
};

export default BackButton;
