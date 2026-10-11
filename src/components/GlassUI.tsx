import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Star,
  Clock,
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  Utensils,
  ShoppingBag,
  Compass,
  Receipt,
  User as UserIcon,
  Tag,
  Crosshair,
} from 'lucide-react';
import {
  Restaurant,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
  UserRole,
  GeoLocationData,
  OrderChatMessage,
  StoreRating,
} from '../types';
import { POPULAR_LOCATIONS_DATA } from '../seedData';

/* 0. BitQIcon & BitQLogo (Exact Vector Reproduction of Uploaded BITᵉ Speech-Bubble Utensil Q Mark) */
export const BitQIcon: React.FC<{
  className?: string;
  monochrome?: boolean;
}> = ({ className = 'w-9 h-9', monochrome = false }) => {
  const gradId = React.useId();
  const qArcColor = monochrome ? 'currentColor' : `url(#${gradId})`;
  const utensilColor = monochrome ? 'currentColor' : '#111111';
  return (
    <svg
      viewBox="480 235 435 530"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {!monochrome && (
        <defs>
          <linearGradient
            id={gradId}
            x1="490"
            y1="250"
            x2="895"
            y2="745"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      )}
      {/* Speech Bubble Q Outer Arc (Top-Left Segment) */}
      <path
        d="M 592 633 A 174 174 0 0 1 756 330"
        stroke={qArcColor}
        strokeWidth="24"
        strokeLinecap="round"
      />
      {/* Speech Bubble Q Outer Arc + Pointer Tail (Bottom-Right Segment) */}
      <path
        d="M 803 351 A 174 174 0 0 1 857 581 L 873 706 L 765 656 A 174 174 0 0 1 634 656"
        stroke={qArcColor}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Diagonal Spoon (Top-Right Handle to Solid Bowl) — Black */}
      <line
        x1="806"
        y1="268"
        x2="676"
        y2="438"
        stroke={utensilColor}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <g transform="translate(657 464) rotate(37)">
        <rect
          x="-42"
          y="-56"
          width="84"
          height="112"
          rx="42"
          fill={utensilColor}
        />
      </g>
      {/* Diagonal Fork (Bottom-Left Handle + Hollow Ring Head + 3 Tines) — Black */}
      <line
        x1="581"
        y1="732"
        x2="686"
        y2="592"
        stroke={utensilColor}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <g transform="translate(706 565) rotate(37)">
        <path
          d="M -30 0 A 30 30 0 0 0 30 0 L 30 -72 M 0 -30 L 0 -72 M -30 0 L -30 -72"
          stroke={utensilColor}
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="0"
          cy="0"
          r="29"
          stroke={utensilColor}
          strokeWidth="20"
          fill="none"
        />
      </g>
    </svg>
  );
};

export const BitQLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const boxDimensions =
    size === 'lg'
      ? 'w-16 h-16 rounded-3xl'
      : size === 'sm'
      ? 'w-10 h-10 rounded-2xl'
      : 'w-12 h-12 rounded-2xl';
  const iconDimensions =
    size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

  return (
    <motion.span
      whileHover={{ scale: 1.05, rotate: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`inline-flex items-center justify-center glass-elevated shadow-sm shadow-rose-600/10 select-none ${boxDimensions} ${className}`}
    >
      <BitQIcon className={`${iconDimensions} shrink-0`} />
    </motion.span>
  );
};

/* 1. ResilientImage (Zero-Broken-Image Policy + Professional Brand Fallback) */
export const ResilientImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src || !src.trim() || src.trim() === '/favicon.svg') {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-rose-500/12 via-white/80 to-blue-600/12 p-6 ${className}`}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-14 h-14 rounded-2xl glass-elevated flex items-center justify-center shadow-sm"
        >
          <BitQIcon className="w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
};

/* 2. GlassCard */
export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', elevated = false, onClick }) => {
  const baseClass = elevated ? 'glass-elevated' : 'glass-surface';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -3, scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`${baseClass} rounded-3xl ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

/* 3. GlassButton */
export const GlassButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'subtle' | 'danger';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = false,
}) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-rose-600 to-blue-600 text-white hover:from-rose-500 hover:to-blue-500 shadow-md shadow-rose-600/20 border border-rose-500/30',
    secondary:
      'glass-surface text-slate-900 hover:bg-white/95 border border-slate-200/80',
    subtle:
      'bg-slate-200/60 text-slate-700 hover:bg-slate-200 border border-transparent',
    danger:
      'bg-rose-50/90 text-rose-800 hover:bg-rose-100 border border-rose-200/80',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1.5, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={`min-h-[48px] px-5 py-2.5 rounded-2xl font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50 disabled:pointer-events-none ${
        variantStyles[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
};

/* 4. GlassInput */
export const GlassInput: React.FC<{
  label: string;
  value: string | number;
  onChange?: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  verifiedBadge?: boolean;
  type?: string;
  maxLength?: number;
  required?: boolean;
  helperText?: string;
}> = ({
  label,
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  verifiedBadge = false,
  type = 'text',
  maxLength,
  required = false,
  helperText,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {verifiedBadge && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
            <Check className="w-3.5 h-3.5 text-rose-600" /> Verified via Google
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl text-sm transition-colors duration-150 focus:outline-none ${
            readOnly
              ? 'bg-slate-200/50 text-slate-600 border border-slate-200/70 cursor-not-allowed'
              : 'bg-white/85 text-slate-900 border border-slate-200/90 focus:border-rose-600 focus:bg-white'
          }`}
        />
      </div>
      {helperText && <p className="text-xs text-stone-500">{helperText}</p>}
    </div>
  );
};

/* 4B. TimeSlotDialPicker — Interactive Circular Clock Dial for Time Slot Selection */
interface ParsedTimeEndpoint {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

function parseSlotString(raw: string): {
  start: ParsedTimeEndpoint;
  end: ParsedTimeEndpoint;
} {
  const fallback = {
    start: { hour: 9, minute: 0, period: 'AM' as const },
    end: { hour: 10, minute: 30, period: 'PM' as const },
  };
  if (!raw || !raw.trim()) return fallback;
  const parts = raw.split(/[–-]/).map((s) => s.trim());
  if (parts.length < 2) return fallback;

  const parseOne = (
    str: string,
    def: ParsedTimeEndpoint
  ): ParsedTimeEndpoint => {
    const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return def;
    const h = Math.max(1, Math.min(12, parseInt(m[1], 10) || def.hour));
    const min = Math.max(0, Math.min(55, parseInt(m[2], 10) || 0));
    const per = m[3].toUpperCase() === 'PM' ? 'PM' : 'AM';
    return { hour: h, minute: min, period: per };
  };

  return {
    start: parseOne(parts[0], fallback.start),
    end: parseOne(parts[1], fallback.end),
  };
}

function formatEndpoint(t: ParsedTimeEndpoint): string {
  const hh = String(t.hour).padStart(2, '0');
  const mm = String(t.minute).padStart(2, '0');
  return `${hh}:${mm} ${t.period}`;
}

export const TimeSlotDialPicker: React.FC<{
  label?: string;
  value: string;
  onChange: (formattedSlot: string) => void;
  startLabel?: string;
  endLabel?: string;
}> = ({
  label = 'Operating Time Slot',
  value,
  onChange,
  startLabel = 'Opens At',
  endLabel = 'Closes At',
}) => {
  const parsed = parseSlotString(value);
  const [start, setStart] = useState<ParsedTimeEndpoint>(parsed.start);
  const [end, setEnd] = useState<ParsedTimeEndpoint>(parsed.end);
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');
  const [dialMode, setDialMode] = useState<'hour' | 'minute'>('hour');
  const [isDialExpanded, setIsDialExpanded] = useState(false);

  // Ensure parent has a valid formatted time slot string on initial mount if empty
  useEffect(() => {
    if (!value || !value.trim()) {
      onChange(`${formatEndpoint(start)} – ${formatEndpoint(end)}`);
    }
  }, []);

  // Sync internal state if external value changes
  useEffect(() => {
    if (value && value.trim()) {
      const next = parseSlotString(value);
      setStart(next.start);
      setEnd(next.end);
    }
  }, [value]);

  const currentEndpoint = activeTarget === 'start' ? start : end;

  const commitSlot = (
    nextStart: ParsedTimeEndpoint,
    nextEnd: ParsedTimeEndpoint
  ) => {
    setStart(nextStart);
    setEnd(nextEnd);
    onChange(`${formatEndpoint(nextStart)} – ${formatEndpoint(nextEnd)}`);
  };

  const updateCurrentEndpoint = (patch: Partial<ParsedTimeEndpoint>) => {
    if (activeTarget === 'start') {
      const updated = { ...start, ...patch };
      commitSlot(updated, end);
    } else {
      const updated = { ...end, ...patch };
      commitSlot(start, updated);
    }
  };

  // 12 radial positions around the clock face (index 0 = 12 o'clock top)
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const activeIndex =
    dialMode === 'hour'
      ? currentEndpoint.hour % 12
      : Math.round(currentEndpoint.minute / 5) % 12;

  const activeAngleDeg = activeIndex * 30; // 0 deg at 12 o'clock
  const activeAngleRad = ((activeAngleDeg - 90) * Math.PI) / 180;
  const radius = 78;
  const center = 108;
  const handX = center + radius * Math.cos(activeAngleRad);
  const handY = center + radius * Math.sin(activeAngleRad);

  const handleClockSurfacePointer = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    const sector = Math.round(deg / 30) % 12;

    if (dialMode === 'hour') {
      const pickedHour = sector === 0 ? 12 : sector;
      updateCurrentEndpoint({ hour: pickedHour });
      setDialMode('minute');
    } else {
      const pickedMinute = sector * 5;
      updateCurrentEndpoint({ minute: pickedMinute });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <button
          type="button"
          onClick={() => setIsDialExpanded(!isDialExpanded)}
          className="text-xs font-semibold text-rose-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isDialExpanded ? 'Hide Clock Dial' : 'Open Clock Dial'}</span>
        </button>
      </div>

      {/* Summary Slot Trigger Bar */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setActiveTarget('start');
            setDialMode('hour');
            setIsDialExpanded(true);
          }}
          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            isDialExpanded && activeTarget === 'start'
              ? 'bg-white border-rose-600 ring-2 ring-rose-500/15 shadow-sm'
              : 'bg-white/85 border-slate-200/90 hover:bg-white'
          }`}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {startLabel}
            </p>
            <p className="text-sm font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
              {formatEndpoint(start)}
            </p>
          </div>
          <Clock className="w-4 h-4 text-rose-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTarget('end');
            setDialMode('hour');
            setIsDialExpanded(true);
          }}
          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            isDialExpanded && activeTarget === 'end'
              ? 'bg-white border-blue-600 ring-2 ring-blue-500/15 shadow-sm'
              : 'bg-white/85 border-slate-200/90 hover:bg-white'
          }`}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {endLabel}
            </p>
            <p className="text-sm font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
              {formatEndpoint(end)}
            </p>
          </div>
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
        </button>
      </div>

      {/* Interactive Circular Clock Dial Panel */}
      {isDialExpanded && (
        <div className="p-4 rounded-3xl glass-surface border border-slate-200/80 space-y-4 animate-fadeIn">
          {/* Dial Controls Header: Hour : Minute + AM/PM Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                {activeTarget === 'start' ? startLabel : endLabel}:
              </span>
              <button
                type="button"
                onClick={() => setDialMode('hour')}
                className={`px-2.5 py-1 rounded-xl font-mono text-sm font-bold transition-colors ${
                  dialMode === 'hour'
                    ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white'
                    : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {String(currentEndpoint.hour).padStart(2, '0')}
              </button>
              <span className="font-mono font-bold text-slate-400">:</span>
              <button
                type="button"
                onClick={() => setDialMode('minute')}
                className={`px-2.5 py-1 rounded-xl font-mono text-sm font-bold transition-colors ${
                  dialMode === 'minute'
                    ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white'
                    : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {String(currentEndpoint.minute).padStart(2, '0')}
              </button>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 gap-1">
              {(['AM', 'PM'] as const).map((per) => (
                <button
                  key={per}
                  type="button"
                  onClick={() => updateCurrentEndpoint({ period: per })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    currentEndpoint.period === per
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {per}
                </button>
              ))}
            </div>
          </div>

          {/* 360-Degree Circular Clock Face */}
          <div className="flex flex-col items-center justify-center py-1">
            <div
              onClick={handleClockSurfacePointer}
              className="relative w-[216px] h-[216px] rounded-full bg-gradient-to-br from-rose-500/5 via-white to-blue-600/5 border border-slate-200/90 shadow-inner cursor-pointer select-none"
            >
              {/* SVG Rotating Clock Hand & Center Hub */}
              <svg
                viewBox="0 0 216 216"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <linearGradient
                    id="clockDialGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#E11D48" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <line
                  x1={center}
                  y1={center}
                  x2={handX}
                  y2={handY}
                  stroke="url(#clockDialGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx={center}
                  cy={center}
                  r="5"
                  fill="url(#clockDialGrad)"
                />
                <circle
                  cx={handX}
                  cy={handY}
                  r="16"
                  fill="url(#clockDialGrad)"
                  fillOpacity="0.15"
                />
              </svg>

              {/* 12 Radial Hour / Minute Numbers */}
              {(dialMode === 'hour' ? hourNumbers : minuteNumbers).map(
                (num, idx) => {
                  const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
                  const nx = center + radius * Math.cos(angleRad);
                  const ny = center + radius * Math.sin(angleRad);
                  const isSelected = idx === activeIndex;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dialMode === 'hour') {
                          updateCurrentEndpoint({ hour: num });
                          setDialMode('minute');
                        } else {
                          updateCurrentEndpoint({ minute: num });
                        }
                      }}
                      style={{
                        left: `${nx - 18}px`,
                        top: `${ny - 18}px`,
                      }}
                      className={`absolute w-9 h-9 rounded-full font-mono text-xs font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-md scale-105'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      {dialMode === 'minute'
                        ? String(num).padStart(2, '0')
                        : num}
                    </button>
                  );
                }
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Tap {dialMode === 'hour' ? 'an hour' : 'minutes'} on the dial to
              set {activeTarget === 'start' ? startLabel.toLowerCase() : endLabel.toLowerCase()}
            </p>
          </div>

          {/* Done Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-xs font-mono font-semibold text-slate-700">
              Slot: {formatEndpoint(start)} – {formatEndpoint(end)}
            </span>
            <button
              type="button"
              onClick={() => setIsDialExpanded(false)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-blue-600 text-white text-xs font-semibold shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* 5. GlassModal */
export const GlassModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="glass-elevated rounded-3xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200/60">
          <h3 className="text-xl font-semibold text-stone-900 font-display">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

/* 6. GlassBottomSheet */
export const GlassBottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="glass-elevated rounded-t-3xl w-full max-w-2xl mx-auto p-6 pb-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60">
          <h3 className="text-lg font-semibold text-stone-900 font-display">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close sheet"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

/* 7. LocationSelector with Live Nominatim Geocoding Autocomplete + Coordinates */
export const LocationSelector: React.FC<{
  currentLocation: string;
  onSelectLocation: (loc: string, geo?: GeoLocationData) => void;
  compact?: boolean;
}> = ({ currentLocation, onSelectLocation, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState<GeoLocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live address autocomplete using OpenStreetMap Nominatim
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setLiveSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&limit=5`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: GeoLocationData[] = data.map(
            (item: {
              display_name: string;
              lat: string;
              lon: string;
              place_id?: number | string;
            }) => ({
              formattedAddress: item.display_name
                .split(',')
                .slice(0, 3)
                .join(',')
                .trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              placeId: String(item.place_id || ''),
            })
          );
          setLiveSuggestions(mapped);
        }
      } catch {
        setLiveSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPopular = POPULAR_LOCATIONS_DATA.filter((loc) =>
    loc.formattedAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const combinedSuggestions =
    liveSuggestions.length > 0 ? liveSuggestions : filteredPopular;

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data?.display_name
            ? data.display_name.split(',').slice(0, 3).join(',').trim()
            : `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
          onSelectLocation(addr, {
            formattedAddress: addr,
            lat: latitude,
            lng: longitude,
            placeId: String(data?.place_id || 'gps-current'),
          });
          setIsOpen(false);
        } catch {
          const addr = `Current Location (${latitude.toFixed(
            3
          )}, ${longitude.toFixed(3)})`;
          onSelectLocation(addr, {
            formattedAddress: addr,
            lat: latitude,
            lng: longitude,
            placeId: 'gps-current',
          });
          setIsOpen(false);
        }
      },
      () => {
        // Fallback if permission denied
      }
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group text-left flex items-center gap-2.5 rounded-2xl transition-colors ${
          compact
            ? 'px-3 py-2 hover:bg-white/70 min-h-[44px]'
            : 'w-full px-4 py-3 bg-white/85 border border-slate-200/90 hover:border-rose-600 min-h-[48px]'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600/15 to-blue-600/15 text-rose-600 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 leading-tight">
            Where should we deliver?
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {currentLocation || 'Search your location'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>

      <GlassBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Where should we deliver?"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your location (e.g., Sector 49, Indiranagar)..."
              className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-rose-600"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentGps}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600/10 to-blue-600/10 hover:from-rose-600/15 hover:to-blue-600/15 text-slate-900 text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-rose-600" />
              <span>Use current GPS coordinates</span>
            </span>
            <span className="text-blue-600 font-bold">Auto-detect</span>
          </button>

          {isSearching && (
            <p className="text-xs text-stone-500 px-2">
              Searching live address coordinates...
            </p>
          )}

          <div className="divide-y divide-stone-200/60">
            {combinedSuggestions.map((loc, idx) => {
              const isSelected = loc.formattedAddress === currentLocation;
              return (
                <button
                  key={`${loc.formattedAddress}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelectLocation(loc.formattedAddress, loc);
                    setIsOpen(false);
                  }}
                  className="w-full min-h-[54px] py-3 px-2 flex items-center justify-between text-left hover:bg-stone-100/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isSelected
                            ? 'font-semibold text-rose-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {loc.formattedAddress}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GlassBottomSheet>
    </>
  );
};

/* 8. SearchBar */
export const SearchBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'What are you craving today?' }) => {
  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] pl-11 pr-10 py-3 rounded-2xl glass-surface text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="min-w-[40px] min-h-[40px] absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 hover:text-stone-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/* 9. CategoryCard */
export const CategoryCard: React.FC<{
  label: string;
  subtitle?: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, subtitle, active, onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-left transition-colors duration-150 shrink-0 whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-md shadow-rose-600/20'
          : 'glass-surface text-slate-800 hover:bg-white/95'
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      {subtitle && (
        <p
          className={`text-[11px] mt-0.5 ${
            active ? 'text-rose-100' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.button>
  );
};

/* 10. OfferCard (Coupon Card) */
export const OfferCard: React.FC<{
  code: string;
  title: string;
  subtitle: string;
  activeCode?: string;
  onApply: (code: string) => void;
}> = ({ code, title, subtitle, activeCode, onApply }) => {
  const isApplied = activeCode?.toUpperCase() === code.toUpperCase();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22 }}
      className="glass-surface rounded-3xl p-5 min-w-[280px] md:min-w-[320px] flex flex-col justify-between gap-4"
    >
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <span className="font-mono font-semibold text-rose-600">
            Code: {code}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-blue-600 font-medium">Verified Offer</span>
        </div>
        <h4 className="text-base font-semibold text-slate-900 font-display leading-snug">
          {title}
        </h4>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{subtitle}</p>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <span className="text-xs font-mono text-slate-500">{code}</span>
        <button
          type="button"
          onClick={() => onApply(isApplied ? '' : code)}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isApplied
              ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isApplied ? 'APPLIED ✓' : 'APPLY'}
        </button>
      </div>
    </motion.div>
  );
};

/* 11. RestaurantCard */
export const RestaurantCard: React.FC<{
  restaurant: Restaurant;
  onClick: () => void;
}> = ({ restaurant, onClick }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.22 }}
      onClick={onClick}
      className={`glass-surface rounded-3xl overflow-hidden cursor-pointer group flex flex-col ${
        !restaurant.is_open ? 'opacity-65' : ''
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <ResilientImage
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10 flex items-end justify-between text-white">
          <span className="text-xs font-medium tracking-wide">
            {restaurant.is_open
              ? restaurant.offer_text
              : '🔴 Kitchen Currently Closed'}
          </span>
          <span className="text-xs font-mono tabular-nums">
            {restaurant.delivery_time}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-stone-900 truncate">
              {restaurant.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 shrink-0 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              {restaurant.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 truncate">
            <span className="truncate">{restaurant.cuisine}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums shrink-0">
              {restaurant.price_indicator}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs text-stone-500">
          <span className="truncate">{restaurant.location}</span>
          <span className="tabular-nums shrink-0">{restaurant.distance}</span>
        </div>
      </div>
    </motion.article>
  );
};

/* 12. QuantitySelector */
export const QuantitySelector: React.FC<{
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}> = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <div className="inline-flex items-center bg-gradient-to-r from-rose-600 to-blue-600 text-white rounded-2xl p-1 shadow-sm">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        aria-label="Decrease quantity"
        className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="px-3 text-xs font-mono font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        aria-label="Increase quantity"
        className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/* 13. FoodCard */
export const FoodCard: React.FC<{
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}> = ({ item, quantity, onAdd, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-surface rounded-3xl p-4 flex gap-4 items-center justify-between"
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
          <span>{item.category}</span>
          {!item.is_available && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-700 font-medium">
                Currently Sold Out
              </span>
            </>
          )}
        </div>
        <h4 className="text-base font-semibold text-stone-900 leading-snug">
          {item.name}
        </h4>
        <p className="text-sm font-mono font-medium text-stone-900 mt-1 tabular-nums">
          ₹{item.price.toFixed(0)}
        </p>
        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100">
          <ResilientImage
            src={item.image_url}
            alt={item.name}
            className="w-full h-full"
          />
        </div>
        {item.is_available ? (
          quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={onAdd}
              onDecrement={onRemove}
            />
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-gradient-to-r hover:from-rose-600 hover:to-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm"
            >
              Add +
            </button>
          )
        ) : (
          <span className="text-xs text-stone-400 font-medium py-1">
            Unavailable
          </span>
        )}
      </div>
    </motion.div>
  );
};

/* 14. StatusTimeline (Supports full Customer + Courier Lifecycle) */
const ORDER_STEPS: {
  statuses: OrderStatus[];
  label: string;
  detail: string;
}[] = [
  {
    statuses: ['ORDER_PLACED'],
    label: 'Order Placed',
    detail: 'Received by restaurant kitchen',
  },
  {
    statuses: ['RESTAURANT_ACCEPTED'],
    label: 'Order Accepted',
    detail: 'Chef confirmed your table ticket',
  },
  {
    statuses: ['FOOD_PREPARING', 'READY_FOR_PICKUP'],
    label: 'Food Prepared',
    detail: 'Packed in insulated glass-layer pouch',
  },
  {
    statuses: [
      'COURIER_ACCEPTED',
      'GOING_TO_RESTAURANT',
      'ARRIVED_AT_RESTAURANT',
    ],
    label: 'Courier Assigned & At Pickup',
    detail: 'Delivery partner collecting your order',
  },
  {
    statuses: ['OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER'],
    label: 'On the Way',
    detail: 'Courier en route to your destination',
  },
  {
    statuses: ['DELIVERED'],
    label: 'Delivered',
    detail: 'Enjoy your meal',
  },
];

export const StatusTimeline: React.FC<{ currentStatus: OrderStatus }> = ({
  currentStatus,
}) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-sm">
        This order was cancelled. Any charges are automatically refunded.
      </div>
    );
  }

  const currentIndex = Math.max(
    0,
    ORDER_STEPS.findIndex((s) => s.statuses.includes(currentStatus))
  );

  return (
    <div className="space-y-3">
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="flex items-start gap-3.5"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                  isCompleted
                    ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                } ${isCurrent ? 'ring-4 ring-rose-500/20 animate-pulse' : ''}`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </div>
              {index < ORDER_STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-6 my-1 ${
                    index < currentIndex
                      ? 'bg-gradient-to-b from-rose-600 to-blue-600'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
            <div className="pt-0.5">
              <p
                className={`text-sm ${
                  isCurrent
                    ? 'font-semibold text-rose-700'
                    : isCompleted
                    ? 'font-medium text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-slate-500">{step.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* 15. OrderCard */
export const OrderCard: React.FC<{
  order: Order;
  onTrack?: () => void;
  actionSlot?: React.ReactNode;
}> = ({ order, onTrack, actionSlot }) => {
  const statusFormatted = order.status.replace(/_/g, ' ');
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="glass-surface rounded-3xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-mono tabular-nums">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <span aria-hidden="true">·</span>
            <span>{statusFormatted}</span>
          </div>
          <h4 className="text-base font-semibold text-stone-900 mt-1">
            {order.restaurant_name}
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            {order.restaurant_location}
          </p>
        </div>
        <span className="text-base font-mono font-semibold text-stone-900 tabular-nums">
          ₹{order.total.toFixed(0)}
        </span>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed border-y border-stone-200/50 py-3">
        {order.items_summary}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>Est. {order.estimated_arrival}</span>
          {order.delivery_partner_name && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Courier: {order.delivery_partner_name} (
                {(order.delivery_partner_rating || 5.0).toFixed(1)} ★)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onTrack &&
            order.status !== 'DELIVERED' &&
            order.status !== 'CANCELLED' && (
              <GlassButton variant="secondary" onClick={onTrack}>
                Live Track
              </GlassButton>
            )}
          {actionSlot}
        </div>
      </div>
    </motion.div>
  );
};

/* 16. StatusToggle (Distinct Kitchen OPEN/CLOSED vs Courier ONLINE/OFFLINE) */
export const StatusToggle: React.FC<{
  isOnline: boolean;
  onToggle: (next: boolean) => void;
  onlineLabel?: string;
  offlineLabel?: string;
  mode?: 'courier' | 'kitchen';
}> = ({
  isOnline,
  onToggle,
  onlineLabel = '● ONLINE',
  offlineLabel = '● OFFLINE',
  mode = 'courier',
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onToggle(!isOnline)}
      className={`min-h-[44px] px-4 py-2 rounded-2xl flex items-center gap-2.5 transition-colors duration-150 ${
        isOnline
          ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-md shadow-rose-600/20'
          : mode === 'kitchen'
          ? 'bg-slate-800 text-white'
          : 'glass-surface text-slate-700'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline
            ? 'bg-white animate-pulse'
            : mode === 'kitchen'
            ? 'bg-rose-400'
            : 'bg-slate-400'
        }`}
      />
      <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
        {isOnline ? onlineLabel : offlineLabel}
      </span>
    </motion.button>
  );
};

/* 17. ProfileCard */
export const ProfileCard: React.FC<{
  user: UserProfile;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const roleLabel =
    user.role === 'restaurant_partner'
      ? 'Restaurant Partner'
      : user.role === 'delivery_partner'
      ? 'Delivery Partner'
      : 'Customer Member';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass-elevated rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
    >
      <div className="flex items-center gap-4">
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-white shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-blue-600 text-white flex items-center justify-center text-xl font-semibold font-display shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>{roleLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{user.location}</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 font-display mt-0.5">
            {user.name}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">{user.email}</p>
        </div>
      </div>
      <GlassButton variant="secondary" onClick={onLogout}>
        Sign Out
      </GlassButton>
    </motion.div>
  );
};

/* 18. NavigationBar (Strict 3-Zone Top Bar Contract) */
export type CustomerTab =
  | 'home'
  | 'offers'
  | 'orders'
  | 'cart'
  | 'profile'
  | 'help';

export const NavigationBar: React.FC<{
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  cartCount: number;
  currentLocation: string;
  onSelectLocation: (loc: string, geo?: GeoLocationData) => void;
}> = ({ activeTab, onSelectTab, cartCount }) => {
  const navItems: { id: CustomerTab; label: string; icon: React.ReactNode }[] =
    [
      { id: 'home', label: 'Discover', icon: <Compass className="w-5 h-5" /> },
      { id: 'offers', label: 'Offers', icon: <Tag className="w-5 h-5" /> },
      { id: 'orders', label: 'Orders', icon: <Receipt className="w-5 h-5" /> },
      {
        id: 'cart',
        label: cartCount > 0 ? `Cart (${cartCount})` : 'Cart',
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    ];

  return (
    <>
      <header className="sticky top-0 z-30 glass-surface border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Zone 1: Uploaded Bit'Q Brand Logo Lockup */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <BitQLogo size="sm" />
          </button>

          {/* Zone 2: 5 Clean Text Navigation Links with Animated Active Indicator */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {(
              [
                { id: 'home', label: 'Discover' },
                { id: 'offers', label: 'Offers' },
                { id: 'orders', label: 'Orders' },
                { id: 'help', label: 'Help Desk' },
                { id: 'profile', label: 'Profile' },
              ] as { id: CustomerTab; label: string }[]
            ).map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => onSelectTab(nav.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-slate-900 font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <span>{nav.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="customerTopNavUnderline"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 30,
                      }}
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-rose-600 to-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action (Cart Trigger) */}
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab('cart')}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-blue-600 text-white text-xs font-semibold hover:from-rose-500 hover:to-blue-500 shadow-sm shadow-rose-600/20 transition-all whitespace-nowrap tabular-nums"
            >
              Bag · {cartCount}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-slate-200/80 grid grid-cols-5 items-center h-16 px-2"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                isActive ? 'text-rose-600 font-semibold' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

/* 19. OrderChatPanel — Real-Time Firestore Order Chat with 1-Tap Quick Messages */
export const OrderChatPanel: React.FC<{
  orderId: string;
  currentUserRole: UserRole;
  messages: OrderChatMessage[];
  onSendMessage: (orderId: string, text: string) => Promise<void>;
}> = ({ orderId, currentUserRole, messages, onSendMessage }) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const quickReplies =
    currentUserRole === 'customer'
      ? [
          'Please pack extra cutlery & napkins',
          'Call me when arriving at the gate',
          'How is my order preparation going?',
        ]
      : currentUserRole === 'restaurant_partner'
      ? [
          'Your dish is being freshly prepared now',
          'Order is packed & ready for courier pickup',
          'Added complimentary chef garnish!',
        ]
      : [
          'Picked up your order, heading your way!',
          'Arriving at your location in 2 minutes',
          'Reached the main entrance gate',
        ];

  const orderMessages = messages.filter((m) => m.order_id === orderId);

  const handleSend = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      await onSendMessage(orderId, clean);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-surface rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 font-display">
            Live Order Chat
          </h4>
          <p className="text-[11px] text-slate-500">
            Synced in real time across Customer, Kitchen & Courier
          </p>
        </div>
        <span className="text-[11px] font-mono text-rose-600 font-semibold">
          ● Live
        </span>
      </div>

      {/* 1-Tap Quick Replies (No manual typing needed) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {quickReplies.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={sending}
            onClick={() => handleSend(preset)}
            className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 text-[11px] font-medium text-slate-700 hover:text-rose-600 transition-colors whitespace-nowrap shrink-0"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
        {orderMessages.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Tap any quick message above or type a note to start live order chat.
          </p>
        ) : (
          orderMessages.map((msg) => {
            const isMine = msg.sender_role === currentUserRole;
            const roleBadge =
              msg.sender_role === 'restaurant_partner'
                ? 'Kitchen'
                : msg.sender_role === 'delivery_partner'
                ? 'Courier'
                : 'Guest';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMine ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                  {msg.sender_name} · {roleBadge}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] ${
                    isMine
                      ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white'
                      : 'bg-white border border-slate-200/80 text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(draft);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message kitchen or courier..."
          maxLength={300}
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-rose-600"
        />
        <GlassButton
          type="submit"
          variant="primary"
          disabled={sending || !draft.trim()}
          className="min-h-[42px] px-4 py-1.5 text-xs"
        >
          Send
        </GlassButton>
      </form>
    </div>
  );
};

/* 20. StoreRatingBox — 1-Tap Store & Courier Rating Component */
export const StoreRatingBox: React.FC<{
  order: Order;
  existingRating?: StoreRating;
  onSubmitRating: (payload: {
    orderId: string;
    restaurantId: string;
    rating: number;
    courierRating: number;
    comment: string;
  }) => Promise<void>;
}> = ({ order, existingRating, onSubmitRating }) => {
  const [stars, setStars] = useState(existingRating?.rating || 5);
  const [courierStars, setCourierStars] = useState(
    existingRating?.courier_rating || 5
  );
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  if (existingRating) {
    return (
      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">
          Your Store Rating:{' '}
          <strong className="text-rose-600">{existingRating.rating} ★</strong>
          {existingRating.comment ? ` · "${existingRating.comment}"` : ''}
        </span>
        <span className="text-emerald-800 font-semibold">✓ Saved</span>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-slate-200/60 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-800">
          Rate {order.restaurant_name}
        </span>
        <div className="inline-flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className="p-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  n <= stars
                    ? 'fill-rose-600 text-rose-600'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {order.delivery_partner_name && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-600">
            Rate Courier ({order.delivery_partner_name})
          </span>
          <div className="inline-flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCourierStars(n)}
                className="p-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    n <= courierStars
                      ? 'fill-blue-600 text-blue-600'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional review note (e.g. Fresh & hot!)"
          maxLength={200}
          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-rose-600"
        />
        <button
          type="button"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await onSubmitRating({
                orderId: order.id,
                restaurantId: order.restaurant_id,
                rating: stars,
                courierRating: courierStars,
                comment: comment.trim() || 'Great food & service!',
              });
            } finally {
              setSubmitting(false);
            }
          }}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-blue-600 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Submit ★'}
        </button>
      </div>
    </div>
  );
};

