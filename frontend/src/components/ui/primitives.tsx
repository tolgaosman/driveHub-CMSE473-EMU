'use client';

import React from 'react';

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand)] text-white border border-[var(--brand)] hover:bg-[var(--brand-hover)] hover:border-[var(--brand-hover)]',
  secondary:
    'bg-[var(--bg-surface)] text-[var(--ink-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)]',
  ghost:
    'bg-transparent text-[var(--ink-secondary)] border border-transparent hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)]',
  danger:
    'bg-[var(--bg-surface)] text-[var(--danger)] border border-[var(--danger)]/35 hover:bg-[var(--danger-bg)]',
  dark: 'bg-[var(--ink-primary)] text-white border border-[var(--ink-primary)] hover:bg-[#333]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-[13px] gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function buttonClass(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  extra = ''
): string {
  return [
    'inline-flex items-center justify-center rounded-[var(--r-md)] font-medium whitespace-nowrap',
    'transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-45',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  ].join(' ');
}

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
> = ({ variant = 'secondary', size = 'md', className = '', type = 'button', ...rest }) => (
  <button type={type} className={buttonClass(variant, size, className)} {...rest} />
);

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export const Panel: React.FC<{
  title?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}> = ({ title, meta, actions, className = '', bodyClassName = 'p-5', children }) => (
  <section
    className={`rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] ${className}`}
  >
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3">
        <div className="min-w-0">
          {title && (
            <h2 className="truncate text-sm font-semibold text-[var(--ink-primary)]">{title}</h2>
          )}
          {meta && <div className="mt-0.5 text-xs text-[var(--ink-muted)]">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]',
  brand: 'bg-[var(--brand-subtle)] text-[var(--brand-hover)] border-[#f6d3bb]',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border-[#cfe5d6]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[#efdcb5]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[#f2cdc8]',
  info: 'bg-[var(--info-bg)] text-[var(--info)] border-[#cddbee]',
};

export const Badge: React.FC<{
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'neutral', dot, className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${TONES[tone]} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export const inputClass =
  'h-9 w-full rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-[border-color,box-shadow] duration-150 hover:border-[#bdb9b0] focus:border-[var(--brand)] focus:outline-none focus:ring-3 focus:ring-[var(--brand)]/15';

export const Field: React.FC<{
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, className = '', children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-[var(--ink-secondary)]">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-[var(--ink-muted)]">{hint}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Callout (inline notice)                                             */
/* ------------------------------------------------------------------ */

export const Callout: React.FC<{
  tone?: Exclude<Tone, 'neutral' | 'brand'>;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'warning', icon, className = '', children }) => {
  const map = {
    success: 'border-l-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]',
    warning: 'border-l-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]',
    danger: 'border-l-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]',
    info: 'border-l-[var(--info)] bg-[var(--info-bg)] text-[var(--info)]',
  } as const;
  return (
    <div
      className={`flex items-start gap-2 rounded-[var(--r-sm)] border-l-2 px-3 py-2.5 text-xs leading-relaxed ${map[tone]} ${className}`}
    >
      {icon && <span className="mt-px shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export const PageHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, description, eyebrow, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
    <div className="min-w-0">
      {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
      <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink-primary)]">{title}</h1>
      {description && (
        <p className="mt-1.5 max-w-[70ch] text-[13px] text-[var(--ink-secondary)]">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
