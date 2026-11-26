'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useDismiss } from './useDismiss';

export interface SelectOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  /** Plain text used for type-ahead and the trigger's accessible name. */
  text?: string;
  hint?: React.ReactNode;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  ariaLabel?: string;
  /** Rendered before the selected label inside the trigger. */
  icon?: React.ReactNode;
  /** Custom content for the trigger (defaults to the selected option's label). */
  renderValue?: (option: SelectOption<T> | undefined) => React.ReactNode;
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  id,
  ariaLabel,
  icon,
  renderValue,
  size = 'md',
  align = 'start',
  className = '',
  menuClassName = '',
  placeholder = '—',
  disabled,
}: SelectProps<T>) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef<{ buffer: string; timer?: ReturnType<typeof setTimeout> }>({ buffer: '' });

  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));
  const selected = options[selectedIndex];

  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  useEffect(() => {
    if (open) {
      setActiveIndex(Math.max(selectedIndex, 0));
      requestAnimationFrame(() => listRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const commit = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const textOf = (o: SelectOption<T>) =>
    (o.text ?? (typeof o.label === 'string' ? o.label : String(o.value))).toLowerCase();

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Tab':
        setOpen(false);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          const ta = typeahead.current;
          ta.buffer += e.key.toLowerCase();
          clearTimeout(ta.timer);
          ta.timer = setTimeout(() => (ta.buffer = ''), 500);
          const match = options.findIndex((o) => textOf(o).startsWith(ta.buffer));
          if (match >= 0) setActiveIndex(match);
        }
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const heights = size === 'sm' ? 'h-8 text-xs' : 'h-9 text-[13px]';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center gap-2 rounded-[var(--r-md)] border bg-[var(--bg-surface)] px-3 text-left font-medium text-[var(--ink-primary)] transition-[border-color,box-shadow] duration-150 disabled:opacity-50 ${heights} ${
          open
            ? 'border-[var(--brand)] ring-3 ring-[var(--brand)]/15'
            : 'border-[var(--border-strong)] hover:border-[#bdb9b0]'
        }`}
      >
        {icon && <span className="shrink-0 text-[var(--ink-muted)]">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">
          {renderValue ? renderValue(selected) : selected?.label ?? (
            <span className="text-[var(--ink-muted)]">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${listId}-${activeIndex}`}
            onKeyDown={onListKeyDown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute top-full z-50 mt-1 max-h-72 min-w-full overflow-auto rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-pop)] focus:outline-none ${
              align === 'end' ? 'right-0' : 'left-0'
            } ${menuClassName}`}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={String(opt.value)}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActiveIndex(i)}
                  onClick={() => commit(i)}
                  className={`flex cursor-pointer select-none items-center gap-2.5 whitespace-nowrap rounded-[var(--r-sm)] px-2.5 py-1.5 text-[13px] ${
                    isActive ? 'bg-[var(--bg-hover)]' : ''
                  } ${isSelected ? 'font-medium text-[var(--ink-primary)]' : 'text-[var(--ink-secondary)]'}`}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.hint && (
                    <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">{opt.hint}</span>
                  )}
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 text-[var(--brand)] ${isSelected ? '' : 'invisible'}`}
                  />
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
