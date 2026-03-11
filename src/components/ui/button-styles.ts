// Canonical source: streetsupport-platform-web/src/components/ui/button-styles.ts
// Keep in sync with the public website version

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'find-help'
  | 'login'
  | 'danger'
  | 'success'
  | 'warning'
  | 'neutral'
  | 'tertiary';

export type ButtonSize = 'lg' | 'md' | 'sm' | 'icon';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onDark?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';

const VARIANT_CLASSES: Record<ButtonVariant, { light: string; dark: string }> = {
  primary: {
    light: 'bg-brand-a text-white hover:bg-brand-b active:bg-brand-c focus:ring-brand-a',
    dark: 'bg-white text-gray-900 hover:bg-gray-100 focus:ring-white',
  },
  secondary: {
    light: 'bg-transparent text-brand-a border-2 border-brand-a hover:bg-brand-a/10 focus:ring-brand-a',
    dark: 'bg-white/10 text-white border-2 border-white hover:bg-white/20 focus:ring-white',
  },
  outline: {
    light: 'bg-transparent text-brand-a border border-brand-a/50 hover:bg-brand-a/10 focus:ring-brand-a',
    dark: 'bg-transparent text-white border border-white/50 hover:bg-white/10 focus:ring-white',
  },
  'find-help': {
    light: 'bg-brand-d text-white hover:bg-brand-s hover:scale-105 shadow-lg hover:shadow-xl focus:ring-brand-d font-semibold',
    dark: 'bg-brand-d text-white hover:bg-brand-s hover:scale-105 shadow-lg hover:shadow-xl focus:ring-brand-d font-semibold',
  },
  login: {
    light: 'bg-brand-h text-white hover:bg-brand-n focus:ring-brand-h',
    dark: 'bg-brand-h text-white hover:bg-brand-n focus:ring-brand-h',
  },
  danger: {
    light: 'bg-brand-g text-white hover:bg-red-700 active:bg-red-800 focus:ring-brand-g',
    dark: 'bg-white text-brand-g hover:bg-red-50 active:bg-red-100 focus:ring-white focus:ring-offset-brand-g',
  },
  success: {
    light: 'bg-brand-b text-white hover:bg-brand-c active:bg-brand-p focus:ring-brand-b',
    dark: 'bg-brand-b text-white hover:bg-brand-c active:bg-brand-p focus:ring-brand-b',
  },
  warning: {
    light: 'bg-brand-j text-white hover:bg-brand-s active:bg-brand-s focus:ring-brand-j',
    dark: 'bg-brand-j text-white hover:bg-brand-s active:bg-brand-s focus:ring-brand-j',
  },
  neutral: {
    light: 'bg-brand-f text-white hover:bg-brand-k active:bg-brand-l focus:ring-brand-f',
    dark: 'bg-brand-f text-white hover:bg-brand-k active:bg-brand-l focus:ring-brand-f',
  },
  tertiary: {
    light: 'bg-transparent text-brand-k border border-brand-k hover:bg-brand-q active:bg-brand-i focus:ring-brand-k',
    dark: 'bg-transparent text-white border border-white/50 hover:bg-white/10 focus:ring-white',
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  lg: 'px-6 py-3 text-base',
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  icon: 'p-2',
};

export function getButtonClasses(options: ButtonStyleOptions = {}): string {
  const {
    variant = 'primary',
    size = 'md',
    onDark = false,
    fullWidth = false,
    loading = false,
    disabled = false,
    className,
  } = options;

  const classes = [BASE_CLASSES];

  const variantConfig = VARIANT_CLASSES[variant];
  classes.push(onDark ? variantConfig.dark : variantConfig.light);

  classes.push(SIZE_CLASSES[size]);

  if (fullWidth) classes.push('w-full');
  if (loading) classes.push('relative');
  if (disabled) classes.push('disabled:opacity-60 disabled:cursor-not-allowed');
  if (className) classes.push(className);

  return classes.join(' ');
}
