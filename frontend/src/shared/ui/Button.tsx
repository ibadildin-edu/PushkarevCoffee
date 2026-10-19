import type { ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router';

import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 h-11 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-espresso text-on-dark hover:bg-ink-soft',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-soft hover:bg-surface-muted hover:text-ink',
};

function buttonClasses(variant: Variant = 'primary', className?: string): string {
  return cn(base, variants[variant], className);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant };

export function Button({ variant, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

type ButtonLinkProps = LinkProps & { variant?: Variant };

export function ButtonLink({ variant, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
