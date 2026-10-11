import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { Store, Bike, AlertCircle } from 'lucide-react';
import { UserRole, GeoLocationData } from '../types';
import { POPULAR_LOCATIONS_DATA } from '../seedData';
import {
  GlassButton,
  GlassInput,
  LocationSelector,
  TimeSlotDialPicker,
  BitQIcon,
} from './GlassUI';

/* 1. Main Login / Welcome Screen — Unified Centered Animated Auth Card (Logo Only) */
export const LoginScreen: React.FC<{
  onGoogleLogin: (intendedRole: UserRole) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}> = ({ onGoogleLogin, isLoading, error }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRolePath, setSelectedRolePath] = useState<UserRole>('customer');

  const handleLoginClick = async (role: UserRole) => {
    setSelectedRolePath(role);
    await onGoogleLogin(role);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-10">
      {/* Animated Floating Cherry Red & Royal Blue Ambient Background Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full bg-rose-600/15 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-28 w-[420px] h-[420px] rounded-full bg-blue-600/15 blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-28 left-1/4 w-[380px] h-[380px] rounded-full bg-rose-500/12 blur-3xl animate-float" />
      </div>

      {/* Unified Centered Authentication Card — Single Logo Only, No Clutter */}
      <motion.main
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md mx-auto w-full"
      >
        <div className="glass-elevated rounded-[32px] p-7 sm:p-9 flex flex-col items-center gap-6 text-center">
          {/* Single Iconic Logo Emblem */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.06, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="w-20 h-20 rounded-3xl glass-surface shadow-lg shadow-rose-600/15 border border-white flex items-center justify-center"
          >
            <BitQIcon className="w-12 h-12" />
          </motion.div>

          {/* Editorial Headline & Tagline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display leading-tight">
              Good food, closer to you.
            </h1>
            <p className="text-sm text-slate-500">
              Discover · Order · Enjoy
            </p>
          </div>

          {/* Unified Sign In / Sign Up & Continue with Google Control Block */}
          <div className="w-full flex flex-col gap-3.5">
            {/* Symmetrical 2-Column Animated Sign In / Sign Up Switcher */}
            <div className="w-full grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 relative">
              {(['signin', 'signup'] as const).map((mode) => {
                const isActive = authMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                    className={`relative z-10 w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors ${
                      isActive
                        ? 'text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="authModeActivePill"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 30,
                        }}
                        className="absolute inset-0 rounded-xl bg-white shadow-sm -z-10"
                      />
                    )}
                    <span>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-left flex items-start gap-2.5 text-xs text-rose-900"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Google Authentication CTA — Cherry Red & Blue Gradient */}
            <motion.button
              type="button"
              disabled={isLoading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLoginClick('customer')}
              className="w-full h-12 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-blue-600 hover:from-rose-500 hover:to-blue-500 text-white transition-all duration-150 shadow-lg shadow-rose-600/20 flex items-center justify-center gap-3 font-semibold text-sm disabled:opacity-60"
            >
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                  />
                </svg>
              </span>
              <span>
                {isLoading && selectedRolePath === 'customer'
                  ? 'Connecting with Google...'
                  : 'Continue with Google'}
              </span>
            </motion.button>
          </div>

          {/* Subtle Secondary Partner Pathways — Aligned on Identical Grid Container */}
          <div className="w-full pt-5 border-t border-slate-200/70 flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-500">
              Own a business or deliver with us?
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                type="button"
                disabled={isLoading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLoginClick('restaurant_partner')}
                className="w-full h-12 px-4 rounded-2xl glass-surface hover:bg-white/95 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Store className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Own a Restaurant</span>
              </motion.button>
              <motion.button
                type="button"
                disabled={isLoading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLoginClick('delivery_partner')}
                className="w-full h-12 px-4 rounded-2xl glass-surface hover:bg-white/95 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Bike className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Become a Partner</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

/* 2. New User Create Account / Role-Specific Onboarding Screen */
export const OnboardingScreen: React.FC<{
  firebaseUser: User;
  initialRole: UserRole;
  onCompleteProfile: (data: {
    name: string;
    location: string;
    lat: number;
    lng: number;
    placeId?: string;
    role: UserRole;
    delivery_preferences?: string;
    dietary_preferences?: string;
    restaurantName?: string;
    cuisine?: string;
    contactPhone?: string;
    operatingHours?: string;
    deliveryRangeKm?: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}> = ({
  firebaseUser,
  initialRole,
  onCompleteProfile,
  onCancel,
  isSubmitting,
  error,
}) => {
  const role: UserRole = initialRole;
  const [name, setName] = useState(
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ''
  );
  const [selectedGeo, setSelectedGeo] = useState<GeoLocationData>(
    POPULAR_LOCATIONS_DATA[0]
  );
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [deliveryPreferences, setDeliveryPreferences] = useState(
    '09:00 AM – 10:30 PM'
  );

  // Restaurant Partner onboarding fields
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [operatingHours, setOperatingHours] = useState('09:00 AM – 10:30 PM');

  // Delivery Partner onboarding fields
  const [deliveryRangeKm, setDeliveryRangeKm] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGeo.formattedAddress.trim()) return;
    await onCompleteProfile({
      name: name.trim(),
      location: selectedGeo.formattedAddress.trim(),
      lat: selectedGeo.lat,
      lng: selectedGeo.lng,
      placeId: selectedGeo.placeId || 'custom-place',
      role,
      delivery_preferences: deliveryPreferences.trim(),
      dietary_preferences: dietaryPreferences.trim(),
      restaurantName: restaurantName.trim(),
      cuisine: cuisine.trim(),
      contactPhone: contactPhone.trim(),
      operatingHours: operatingHours.trim(),
      deliveryRangeKm,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass-elevated rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600">
              {role === 'restaurant_partner'
                ? 'Restaurant Partner Onboarding'
                : role === 'delivery_partner'
                ? 'Delivery Partner Onboarding'
                : 'Almost there · Personalize your account'}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 font-display mt-1">
              {role === 'restaurant_partner'
                ? 'Register your restaurant'
                : role === 'delivery_partner'
                ? 'Create courier profile'
                : 'Create your account'}
            </h1>
          </div>
          <div className="w-14 h-14 rounded-2xl glass-surface border border-white flex items-center justify-center shadow-sm">
            <BitQIcon className="w-9 h-9" />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Your full name"
            maxLength={100}
            required
          />

          <GlassInput
            label="Gmail"
            value={firebaseUser.email || ''}
            readOnly
            verifiedBadge
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">
              Location (Address Autocomplete & Coordinates)
            </label>
            <LocationSelector
              currentLocation={selectedGeo.formattedAddress}
              onSelectLocation={(addr, geo) =>
                setSelectedGeo(
                  geo || {
                    formattedAddress: addr,
                    lat: 12.9784,
                    lng: 77.6408,
                    placeId: 'manual',
                  }
                )
              }
            />
            <p className="text-[11px] font-mono text-stone-500">
              Coordinates: {selectedGeo.lat.toFixed(4)}° N,{' '}
              {selectedGeo.lng.toFixed(4)}° E
            </p>
          </div>

          {role === 'customer' && (
            <div className="pt-2 space-y-4 border-t border-slate-200/60">
              <GlassInput
                label="Dietary Preferences (Optional)"
                value={dietaryPreferences}
                onChange={setDietaryPreferences}
                placeholder="e.g., Vegetarian, Nut-free, High-protein"
                maxLength={100}
              />
              <TimeSlotDialPicker
                label="Preferred Delivery Time Slot (Clock Dial)"
                value={deliveryPreferences}
                onChange={setDeliveryPreferences}
                startLabel="From Time"
                endLabel="To Time"
              />
            </div>
          )}

          {role === 'restaurant_partner' && (
            <div className="pt-3 space-y-4 border-t border-slate-200/60">
              <p className="text-xs font-semibold text-slate-900">
                Restaurant Partner Details
              </p>
              <GlassInput
                label="Restaurant Name"
                value={restaurantName}
                onChange={setRestaurantName}
                placeholder="e.g., Hearth & Olive Kitchen"
                maxLength={120}
                required
              />
              <GlassInput
                label="Cuisine / Specialty"
                value={cuisine}
                onChange={setCuisine}
                placeholder="e.g., Wood-fired Pizza · Italian"
                maxLength={80}
                required
              />
              <GlassInput
                label="Business Contact"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="+91 98450 00000"
                maxLength={30}
                required
              />
              <TimeSlotDialPicker
                label="Operating Time Slot (Clock Dial)"
                value={operatingHours}
                onChange={setOperatingHours}
                startLabel="Opens At"
                endLabel="Closes At"
              />
            </div>
          )}

          {role === 'delivery_partner' && (
            <div className="pt-3 space-y-4 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  Preferred Delivery Service Range
                </label>
                <span className="text-sm font-mono font-semibold text-rose-600 tabular-nums">
                  {deliveryRangeKm} km
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={deliveryRangeKm}
                onChange={(e) => setDeliveryRangeKm(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
              <TimeSlotDialPicker
                label="Preferred Shift Time Slot (Clock Dial)"
                value={deliveryPreferences}
                onChange={setDeliveryPreferences}
                startLabel="Shift Starts"
                endLabel="Shift Ends"
              />
            </div>
          )}

          {/* Symmetrical 2-Column Back / Continue Actions */}
          <div className="pt-4 grid grid-cols-3 gap-3">
            <GlassButton
              type="button"
              variant="subtle"
              onClick={onCancel}
              disabled={isSubmitting}
              className="col-span-1 w-full h-12"
            >
              Back
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting || !name.trim()}
              className="col-span-2 w-full h-12"
            >
              {isSubmitting ? 'Saving profile...' : 'Continue'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
