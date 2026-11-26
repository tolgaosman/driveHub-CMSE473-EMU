'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ScanLine, ShieldCheck } from 'lucide-react';
import { DamageDetection, MANDATORY_ANGLES, PhotoAngle } from '@shared/contracts';

interface VehicleStageProps {
  make: string;
  model: string;
  year: number;
  bodyType?: string;
  accentColor?: string;
  damages?: DamageDetection[];
  scanning?: boolean;
  plateBlur?: boolean;
  modelVersion?: string;
  compact?: boolean;
  activeDamageId?: string | null;
  onSelectDamage?: (id: string) => void;
}

export const VehicleStage: React.FC<VehicleStageProps> = ({
  make,
  model,
  year,
  bodyType = 'Saloon',
  accentColor = '#334155',
  damages = [],
  scanning = false,
  plateBlur = true,
  modelVersion = 'yolov8s-drivehub-v1.4',
  compact = false,
  activeDamageId = null,
  onSelectDamage,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>('right');

  const isSuv = bodyType.toLowerCase().includes('suv') || bodyType.toLowerCase().includes('cross');
  const isHatch = bodyType.toLowerCase().includes('hatch');

  // Show damages matching angle or all confirmed/pending on primary profile view
  const visibleDamages = damages.filter((d) => d.confirmedByInspector !== false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[#0b1322] text-white shadow-[var(--shadow-sm)]">
      {/* Studio subtle grid + radial spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 52% 28%, rgba(234,106,18,0.22), transparent 55%), linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 28px 28px, 28px 28px',
        }}
      />

      {/* Top HUD bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-mono-num text-[11px] text-slate-200">
            <ScanLine className="h-3.5 w-3.5 text-[#f28c28]" />
            {modelVersion}
          </span>
          {plateBlur && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              Plate Blur ON
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowBoxes((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/12"
        >
          {showBoxes ? <Eye className="h-3.5 w-3.5 text-[#f28c28]" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showBoxes ? 'AI Boxes Visible' : 'AI Boxes Hidden'}
        </button>
      </div>

      {/* Main SVG Automotive Stage */}
      <div className={`relative w-full ${compact ? 'h-48' : 'h-64 sm:h-72'} select-none`}>
        {scanning && (
          <div className="animate-scan-beam pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-transparent via-[#f28c28]/35 to-transparent" />
        )}

        <svg
          viewBox="0 0 640 280"
          className="h-full w-full"
          role="img"
          aria-label={`${year} ${make} ${model} inspection viewport`}
        >
          <defs>
            <linearGradient id="carBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.95" />
              <stop offset="48%" stopColor={accentColor} stopOpacity="1" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Studio floor & reflection */}
          <ellipse cx="320" cy="224" rx="245" ry="20" fill="url(#floorShadow)" />
          <line x1="36" y1="226" x2="604" y2="226" stroke="rgba(148,163,184,0.16)" strokeWidth="1" />

          {/* Precision vehicle silhouette adapted to bodyType */}
          {isSuv ? (
            <g>
              <path
                d="M78 198 L82 146 Q90 128 122 122 L176 116 L228 74 Q246 62 282 62 L442 62 Q472 64 494 94 L520 120 L554 128 Q572 134 574 156 L574 198 Z"
                fill="url(#carBodyGrad)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.6"
              />
              <path
                d="M196 116 L242 78 Q254 71 278 71 L344 71 L344 116 Z"
                fill="url(#glassGrad)"
              />
              <path
                d="M356 71 L436 71 Q458 72 478 96 L496 116 L356 116 Z"
                fill="url(#glassGrad)"
              />
            </g>
          ) : isHatch ? (
            <g>
              <path
                d="M94 200 L98 154 Q108 134 146 126 L204 120 L256 80 Q276 68 312 68 L442 68 Q478 70 502 104 L526 132 L548 140 Q562 148 562 172 L562 200 Z"
                fill="url(#carBodyGrad)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.6"
              />
              <path
                d="M222 120 L268 84 Q282 77 308 77 L358 77 L358 120 Z"
                fill="url(#glassGrad)"
              />
              <path
                d="M370 77 L438 77 Q464 78 484 104 L498 120 L370 120 Z"
                fill="url(#glassGrad)"
              />
            </g>
          ) : (
            <g>
              <path
                d="M68 200 L74 156 Q86 134 134 126 L206 118 L266 78 Q288 66 326 66 L432 66 Q468 68 504 106 L536 122 L566 132 Q582 140 582 168 L582 200 Z"
                fill="url(#carBodyGrad)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.6"
              />
              <path
                d="M224 118 L276 82 Q292 74 322 74 L366 74 L366 118 Z"
                fill="url(#glassGrad)"
              />
              <path
                d="M378 74 L430 74 Q456 75 484 104 L498 118 L378 118 Z"
                fill="url(#glassGrad)"
              />
            </g>
          )}

          {/* Beltline highlight & door seam */}
          <path
            d="M112 146 Q320 138 544 146"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
            fill="none"
          />
          <line x1="364" y1="118" x2="364" y2="196" stroke="rgba(15,23,42,0.55)" strokeWidth="1.4" />
          {/* Headlight & taillight accents */}
          <path d="M542 140 L574 144 L570 156 L538 152 Z" fill="#fef3c7" opacity="0.9" />
          <path d="M76 144 L104 140 L108 152 L74 154 Z" fill="#ef4444" opacity="0.85" />

          {/* Wheels with alloy spokes */}
          {[184, 466].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="202" r="36" fill="#090d16" stroke="#334155" strokeWidth="3" />
              <circle cx={cx} cy="202" r="24" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
              <circle cx={cx} cy="202" r="7" fill="#cbd5e1" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1={cx}
                  y1={202}
                  x2={cx + Math.cos((deg * Math.PI) / 180) * 22}
                  y2={202 + Math.sin((deg * Math.PI) / 180) * 22}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  opacity="0.7"
                />
              ))}
            </g>
          ))}
        </svg>

        {/* Responsive YOLOv8 Bounding Box Overlay */}
        {showBoxes &&
          visibleDamages.map((dmg) => {
            const isDent = dmg.type === 'DENT';
            const isSelected = activeDamageId === dmg.id;
            const color = isDent ? '#ef4444' : '#f59e0b';
            return (
              <motion.button
                key={dmg.id}
                type="button"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => onSelectDamage?.(dmg.id)}
                style={{
                  left: `${dmg.bbox.x}%`,
                  top: `${dmg.bbox.y}%`,
                  width: `${dmg.bbox.width}%`,
                  height: `${dmg.bbox.height}%`,
                  borderColor: color,
                  backgroundColor: isSelected ? `${color}30` : `${color}14`,
                }}
                className="group absolute z-10 rounded-md border-2 transition-colors hover:bg-white/10"
              >
                <span
                  style={{ backgroundColor: color }}
                  className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono-num text-[10px] font-bold uppercase tracking-wide text-white shadow"
                >
                  {dmg.type} {(dmg.confidence * 100).toFixed(0)}%
                </span>
              </motion.button>
            );
          })}

        {/* Bottom-left Vehicle Watermark */}
        <div className="pointer-events-none absolute bottom-2.5 left-4 flex items-center gap-2 text-xs text-slate-300">
          <span className="font-display font-semibold text-white">
            {year} {make} {model}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-num text-[11px] uppercase text-slate-400">
            Angle: {selectedAngle}
          </span>
        </div>
      </div>

      {/* 8-Angle Selector Strip */}
      {!compact && (
        <div className="relative z-10 flex items-center gap-1 overflow-x-auto border-t border-white/10 bg-black/25 px-3 py-2">
          {MANDATORY_ANGLES.map((ang) => {
            const hasDamageOnAngle = visibleDamages.some((d) => d.angle === ang.id);
            const active = selectedAngle === ang.id;
            return (
              <button
                key={ang.id}
                type="button"
                onClick={() => setSelectedAngle(ang.id)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-[#ea6a12] text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {ang.labelEn}
                {hasDamageOnAngle && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? 'bg-white' : 'bg-red-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

