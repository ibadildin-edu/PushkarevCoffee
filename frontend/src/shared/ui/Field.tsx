import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

const controlClasses =
  'h-11 w-full rounded-2xl border bg-surface px-4 text-sm text-ink placeholder:text-muted transition-colors hover:border-heat-1 disabled:opacity-60 aria-[invalid=true]:border-danger';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClasses, 'border-line', className)} {...props} />;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + validation message. Pass `aria-describedby={`${htmlFor}-error`}` to the control. */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
