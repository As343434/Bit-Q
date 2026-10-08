import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  Restaurant,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
} from '../types';
import { POPULAR_LOCATIONS } from '../seedData';

/* 1. ResilientImage (Zero-Broken-Image Policy) */
export const ResilientImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-emerald-50/60 text-stone-500 p-4 text-center ${className}`}
      >
        <Utensils className="w-6 h-6 mb-1.5 text-emerald-800/70" />
        <span className="text-xs font-medium text-stone-600 line-clamp-1">
          {alt}
        </span>
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
    <div
      onClick={onClick}
      className={`${baseClass} rounded-3xl transition-transform duration-150 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
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
      'bg-emerald-900 text-white hover:bg-emerald-800 shadow-md shadow-emerald-950/10 border border-emerald-800',
    secondary:
      'glass-surface text-stone-900 hover:bg-white/95 border border-stone-200/80',
    subtle:
      'bg-stone-200/60 text-stone-700 hover:bg-stone-200 border border-transparent',
    danger:
      'bg-rose-50/90 text-rose-800 hover:bg-rose-100 border border-rose-200/80',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] px-5 py-2.5 rounded-2xl font-medium text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:opacity-50 disabled:pointer-events-none ${
        variantStyles[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
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
        <label className="text-xs font-medium text-stone-600">{label}</label>
        {verifiedBadge && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
            <Check className="w-3.5 h-3.5" /> Verified via Google
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
          className={`w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-sm transition-colors duration-150 focus:outline-none ${
            readOnly
              ? 'bg-stone-200/50 text-stone-600 border border-stone-200/70 cursor-not-allowed'
              : 'bg-white/85 text-stone-900 border border-stone-200/90 focus:border-emerald-800 focus:bg-white'
          }`}
        />
      </div>
      {helperText && (
        <p className="text-xs text-stone-500">{helperText}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn">
      <div className="glass-elevated rounded-3xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto">
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
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/40 backdrop-blur-sm">
      <div className="glass-elevated rounded-t-3xl w-full max-w-2xl mx-auto p-6 pb-8 max-h-[85vh] overflow-y-auto">
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
      </div>
    </div>
  );
};

/* 7. LocationSelector */
export const LocationSelector: React.FC<{
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  compact?: boolean;
}> = ({ currentLocation, onSelectLocation, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group text-left flex items-center gap-2.5 rounded-2xl transition-colors ${
          compact
            ? 'px-3 py-2 hover:bg-white/70 min-h-[44px]'
            : 'w-full px-4 py-3 bg-white/85 border border-stone-200/90 hover:border-emerald-800 min-h-[48px]'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-900/10 text-emerald-900 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-stone-500 leading-tight">
            Delivering to
          </p>
          <p className="text-sm font-semibold text-stone-900 truncate">
            {currentLocation || 'Select your location'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>

      <GlassBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select your delivery area"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, neighborhood, or street..."
              className="w-full min-h-[46px] pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-none focus:border-emerald-800"
            />
          </div>

          {searchQuery.trim().length > 2 &&
            !filteredLocations.some(
              (l) => l.toLowerCase() === searchQuery.trim().toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => {
                  onSelectLocation(searchQuery.trim());
                  setIsOpen(false);
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-900/5 hover:bg-emerald-900/10 text-left flex items-center justify-between transition-colors"
              >
                <span className="text-sm font-medium text-emerald-950">
                  Use "{searchQuery.trim()}"
                </span>
                <span className="text-xs font-medium text-emerald-800">
                  Set custom area
                </span>
              </button>
            )}

          <div className="divide-y divide-stone-200/60">
            {filteredLocations.map((loc) => {
              const isSelected = loc === currentLocation;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    onSelectLocation(loc);
                    setIsOpen(false);
                  }}
                  className="w-full min-h-[52px] py-3 px-2 flex items-center justify-between text-left hover:bg-stone-100/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-emerald-800' : 'text-stone-400'
                      }`}
                    />
                    <span
                      className={`text-sm truncate ${
                        isSelected
                          ? 'font-semibold text-emerald-950'
                          : 'text-stone-700'
                      }`}
                    >
                      {loc}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-800 shrink-0" />
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
}> = ({
  value,
  onChange,
  placeholder = 'What are you craving today?',
}) => {
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

/* 9. CategoryCard (Interactive Filter Control) */
export const CategoryCard: React.FC<{
  label: string;
  subtitle?: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, subtitle, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-left transition-all duration-150 shrink-0 whitespace-nowrap ${
        active
          ? 'bg-emerald-900 text-white shadow-md shadow-emerald-950/10'
          : 'glass-surface text-stone-800 hover:bg-white/95'
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      {subtitle && (
        <p
          className={`text-[11px] mt-0.5 ${
            active ? 'text-emerald-100/90' : 'text-stone-500'
          }`}
        >
          {subtitle}
        </p>
      )}
    </button>
  );
};

/* 10. OfferCard */
export const OfferCard: React.FC<{
  code: string;
  title: string;
  subtitle: string;
  activeCode?: string;
  onApply: (code: string) => void;
}> = ({ code, title, subtitle, activeCode, onApply }) => {
  const isApplied = activeCode === code;
  return (
    <div className="glass-surface rounded-3xl p-5 min-w-[280px] md:min-w-[320px] flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
          <span className="font-mono font-medium text-emerald-900">{code}</span>
          <span aria-hidden="true">·</span>
          <span>Partner Privilege</span>
        </div>
        <h4 className="text-base font-semibold text-stone-900 font-display leading-snug">
          {title}
        </h4>
        <p className="text-xs text-stone-600 mt-1 leading-relaxed">{subtitle}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-stone-200/50">
        <span className="text-xs text-stone-500">Auto-applied at checkout</span>
        <button
          type="button"
          onClick={() => onApply(isApplied ? '' : code)}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isApplied
              ? 'bg-emerald-900 text-white'
              : 'bg-stone-900/5 text-stone-900 hover:bg-stone-900/10'
          }`}
        >
          {isApplied ? 'Applied ✓' : 'Use Offer'}
        </button>
      </div>
    </div>
  );
};

/* 11. RestaurantCard */
export const RestaurantCard: React.FC<{
  restaurant: Restaurant;
  onClick: () => void;
}> = ({ restaurant, onClick }) => {
  return (
    <article
      onClick={onClick}
      className="glass-surface rounded-3xl overflow-hidden cursor-pointer group transition-transform duration-150 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <ResilientImage
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10 flex items-end justify-between text-white">
          <span className="text-xs font-medium tracking-wide">
            {restaurant.offer_text}
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
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 shrink-0 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-emerald-800 text-emerald-800" />
              {restaurant.rating.toFixed(1)}
            </span>
          </div>
          {/* Zero-Pill Unboxed Metadata with middot separators */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 truncate">
            <span className="truncate">{restaurant.cuisine}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums shrink-0">{restaurant.price_indicator}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs text-stone-500">
          <span className="truncate">{restaurant.location}</span>
          <span className="tabular-nums shrink-0">{restaurant.distance}</span>
        </div>
      </div>
    </article>
  );
};

/* 12. QuantitySelector */
export const QuantitySelector: React.FC<{
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}> = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <div className="inline-flex items-center bg-emerald-900 text-white rounded-2xl p-1 shadow-sm">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        aria-label="Decrease quantity"
        className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center hover:bg-emerald-800 transition-colors"
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
        className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center hover:bg-emerald-800 transition-colors"
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
    <div className="glass-surface rounded-3xl p-4 flex gap-4 items-center justify-between">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
          <span>{item.category}</span>
          {!item.is_available && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-700 font-medium">Currently Sold Out</span>
            </>
          )}
        </div>
        <h4 className="text-base font-semibold text-stone-900 leading-snug">
          {item.name}
        </h4>
        <p className="text-sm font-mono font-medium text-stone-900 mt-1 tabular-nums">
          ${item.price.toFixed(2)}
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
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-white border border-stone-200/90 text-xs font-semibold text-emerald-900 hover:bg-emerald-900 hover:text-white transition-colors shadow-sm"
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
    </div>
  );
};

/* 14. StatusTimeline */
const ORDER_STEPS: { status: OrderStatus; label: string; detail: string }[] = [
  {
    status: 'ORDER_PLACED',
    label: 'Order Placed',
    detail: 'Received by kitchen console',
  },
  {
    status: 'RESTAURANT_ACCEPTED',
    label: 'Restaurant Accepted',
    detail: 'Chef confirmed your table ticket',
  },
  {
    status: 'FOOD_PREPARING',
    label: 'Food Preparing',
    detail: 'Crafted fresh on the hearth',
  },
  {
    status: 'READY_FOR_PICKUP',
    label: 'Ready for Pickup',
    detail: 'Packed in insulated glass-layer pouch',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    detail: 'Courier en route to your door',
  },
  {
    status: 'DELIVERED',
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

  const currentIndex = ORDER_STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="space-y-3">
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.status} className="flex items-start gap-3.5">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                  isCompleted
                    ? 'bg-emerald-900 text-white'
                    : 'bg-stone-200 text-stone-500'
                } ${isCurrent ? 'ring-4 ring-emerald-900/15' : ''}`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </div>
              {index < ORDER_STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-6 my-1 ${
                    index < currentIndex ? 'bg-emerald-800' : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
            <div className="pt-0.5">
              <p
                className={`text-sm ${
                  isCurrent
                    ? 'font-semibold text-emerald-950'
                    : isCompleted
                    ? 'font-medium text-stone-800'
                    : 'text-stone-400'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-stone-500">{step.detail}</p>
            </div>
          </div>
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
    <div className="glass-surface rounded-3xl p-5 space-y-4">
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
          ${order.total.toFixed(2)}
        </span>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed border-y border-stone-200/50 py-3">
        {order.items_summary}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-600">
          <Clock className="w-3.5 h-3.5 text-emerald-800" />
          <span>Est. {order.estimated_arrival}</span>
          {order.delivery_partner_name && (
            <>
              <span aria-hidden="true">·</span>
              <span>Courier: {order.delivery_partner_name}</span>
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
    </div>
  );
};

/* 16. StatusToggle (Online/Offline for Delivery Partner or Restaurant Open/Closed) */
export const StatusToggle: React.FC<{
  isOnline: boolean;
  onToggle: (next: boolean) => void;
  onlineLabel?: string;
  offlineLabel?: string;
}> = ({
  isOnline,
  onToggle,
  onlineLabel = 'ONLINE · Receiving Requests',
  offlineLabel = 'OFFLINE · Paused',
}) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(!isOnline)}
      className={`min-h-[48px] px-4 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-150 ${
        isOnline
          ? 'bg-emerald-900 text-white shadow-md shadow-emerald-950/15'
          : 'glass-surface text-stone-700'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline ? 'bg-emerald-300 animate-pulse' : 'bg-stone-400'
        }`}
      />
      <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
        {isOnline ? onlineLabel : offlineLabel}
      </span>
    </button>
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
    <div className="glass-surface rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-white"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-white flex items-center justify-center text-xl font-semibold font-display">
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
    </div>
  );
};

/* 18. NavigationBar (Follows 3-Zone Top Bar Contract on Desktop & <15% Sticky Cap on Mobile) */
export type CustomerTab =
  | 'home'
  | 'search'
  | 'orders'
  | 'cart'
  | 'profile'
  | 'help';

export const NavigationBar: React.FC<{
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  cartCount: number;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
}> = ({
  activeTab,
  onSelectTab,
  cartCount,
}) => {
  const navItems: { id: CustomerTab; label: string; icon: React.ReactNode }[] =
    [
      { id: 'home', label: 'Discover', icon: <Compass className="w-5 h-5" /> },
      { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
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
      {/* Desktop Top Navigation — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 glass-surface border-b border-stone-200/60 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="text-xl font-bold tracking-tight text-stone-900 font-display whitespace-nowrap"
          >
            Bit&apos;Q (e=&apos;)
          </button>

          {/* Zone 2: 5 Clean Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'home'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('search')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'search'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('help')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'help'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Help Desk
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Profile
            </button>
          </nav>

          {/* Zone 3: Primary Action (Cart Trigger) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('cart')}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors whitespace-nowrap tabular-nums"
            >
              Bag · {cartCount}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-stone-200/80 grid grid-cols-5 items-center h-16 px-2"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                isActive ? 'text-emerald-900 font-semibold' : 'text-stone-500'
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
