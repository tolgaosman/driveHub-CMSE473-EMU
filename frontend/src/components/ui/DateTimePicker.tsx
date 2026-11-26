'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lang, localeOf, t } from '@/lib/i18n';
import { useDismiss } from './useDismiss';

interface DateTimePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  lang: Lang;
  /** Earliest selectable moment. Days before it are disabled, as are earlier time slots on that day. */
  min?: Date;
  /** Minutes between time slots. */
  step?: number;
  id?: string;
  className?: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday-first 6x7 grid covering the month of `cursor`. */
function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  lang,
  min,
  step = 15,
  id,
  className = '',
}) => {
  const locale = localeOf(lang);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [focusDay, setFocusDay] = useState(() => startOfDay(value));

  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const minDay = min ? startOfDay(min) : null;
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!open) return;
    setCursor(new Date(value.getFullYear(), value.getMonth(), 1));
    setFocusDay(startOfDay(value));
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus();
      timeRef.current
        ?.querySelector<HTMLElement>('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'center' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), [locale]);
  const fmtTrigger = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  );
  const fmtDayLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  );
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2024-01-01 is a Monday
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const days = monthGrid(cursor);
  const isDisabledDay = (d: Date) => (minDay ? d < minDay : false);

  const slots = useMemo(() => {
    const out: { h: number; m: number }[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) out.push({ h: Math.floor(mins / 60), m: mins % 60 });
    return out;
  }, [step]);

  const isDisabledSlot = (day: Date, h: number, m: number) => {
    if (!min) return false;
    const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    return candidate < min;
  };

  /** Keep the time; move to day `d`. If the time is now in the past, jump to the first valid slot. */
  const selectDay = (d: Date) => {
    if (isDisabledDay(d)) return;
    let next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), value.getHours(), value.getMinutes());
    if (min && next < min) {
      const firstValid = slots.find((s) => !isDisabledSlot(d, s.h, s.m));
      if (firstValid) next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), firstValid.h, firstValid.m);
    }
    setFocusDay(startOfDay(d));
    onChange(next);
  };

  const selectTime = (h: number, m: number) => {
    const day = startOfDay(value);
    if (isDisabledSlot(day, h, m)) return;
    onChange(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (delta: number) => {
    const next = addDays(focusDay, delta);
    if (isDisabledDay(next)) return;
    setFocusDay(next);
    if (next.getMonth() !== cursor.getMonth() || next.getFullYear() !== cursor.getFullYear()) {
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus()
    );
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectDay(focusDay);
    }
  };

  const canGoPrev =
    !minDay ||
    new Date(cursor.getFullYear(), cursor.getMonth(), 1) >
      new Date(minDay.getFullYear(), minDay.getMonth(), 1);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center gap-2 rounded-[var(--r-md)] border bg-[var(--bg-surface)] px-3 text-left text-[13px] font-medium text-[var(--ink-primary)] transition-[border-color,box-shadow] duration-150 ${
          open
            ? 'border-[var(--brand)] ring-3 ring-[var(--brand)]/15'
            : 'border-[var(--border-strong)] hover:border-[#bdb9b0]'
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
        <span className="min-w-0 flex-1 truncate font-mono-num">{fmtTrigger.format(value)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t(lang, 'pickDate')}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 top-full z-50 mt-1 flex rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)]"
          >
            {/* Calendar */}
            <div className="w-[264px] p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
                  aria-label={t(lang, 'prevMonth')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-[13px] font-semibold capitalize text-[var(--ink-primary)]" aria-live="polite">
                  {fmtMonth.format(cursor)}
                </div>
                <button
                  type="button"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label={t(lang, 'nextMonth')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center">
                {weekdays.map((w) => (
                  <div key={w} className="pb-1 text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                    {w.slice(0, 2)}
                  </div>
                ))}
              </div>

              <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-0.5">
                {days.map((d) => {
                  const outside = d.getMonth() !== cursor.getMonth();
                  const disabled = isDisabledDay(d);
                  const selected = sameDay(d, value);
                  const isToday = sameDay(d, today);
                  const focused = sameDay(d, focusDay);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      role="gridcell"
                      tabIndex={focused ? 0 : -1}
                      data-focus={focused}
                      disabled={disabled}
                      aria-selected={selected}
                      aria-label={fmtDayLabel.format(d)}
                      onClick={() => selectDay(d)}
                      className={`relative h-8 rounded-[var(--r-sm)] font-mono-num text-xs transition-colors duration-100 disabled:cursor-not-allowed disabled:text-[#cfccc4] ${
                        selected
                          ? 'bg-[var(--brand)] font-semibold text-white'
                          : outside
                          ? 'text-[var(--ink-muted)] hover:bg-[var(--bg-hover)]'
                          : 'text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
                      } ${isToday && !selected ? 'ring-1 ring-inset ring-[var(--border-strong)]' : ''}`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between border-t border-[var(--border-subtle)] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                    selectDay(today);
                  }}
                  className="rounded-[var(--r-sm)] px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand-subtle)]"
                >
                  {t(lang, 'today')}
                </button>
              </div>
            </div>

            {/* Time column */}
            <div className="flex w-[84px] flex-col border-l border-[var(--border-subtle)]">
              <div className="eyebrow border-b border-[var(--border-subtle)] px-3 py-3 text-center">
                {t(lang, 'time')}
              </div>
              <div ref={timeRef} role="listbox" aria-label={t(lang, 'time')} className="h-[264px] overflow-y-auto p-1">
                {slots.map(({ h, m }) => {
                  const disabled = isDisabledSlot(startOfDay(value), h, m);
                  const selected = value.getHours() === h && value.getMinutes() === m;
                  return (
                    <button
                      key={`${h}-${m}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled}
                      onClick={() => selectTime(h, m)}
                      className={`block w-full rounded-[var(--r-sm)] py-1.5 text-center font-mono-num text-xs transition-colors duration-100 disabled:cursor-not-allowed disabled:text-[#c9c6be] ${
                        selected
                          ? 'bg-[var(--brand)] font-semibold text-white'
                          : 'text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {pad(h)}:{pad(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
