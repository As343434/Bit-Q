import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Store, Bike, AlertCircle } from 'lucide-react';
import { UserRole, GeoLocationData } from '../types';
import { IMAGES, POPULAR_LOCATIONS_DATA } from '../seedData';
import {
  GlassButton,
  GlassInput,
  LocationSelector,
  ResilientImage,
} from './GlassUI';

/* 1. Main Login / Welcome Screen — Unified Centered Auth Card */
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
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-[#F7F6F2] px-4 py-8 md:py-12">
      {/* Subtle Ambient Background Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-900/5 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl" />
      </div>

      {/* Top Brand Header */}
      <div className="relative z-10 max-w-md mx-auto w-full text-center space-y-1">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-emerald-900 text-white font-display text-2xl font-bold shadow-lg shadow-emerald-950/15 mb-2">
          e=&apos;
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-display">
          Bit&apos;Q (e=&apos;)
        </h1>
        <p className="text-xs font-medium text-stone-500 tracking-wide">
          Artisanal Neighborhood Dining
        </p>
      </div>

      {/* Unified Centered Authentication Card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-6">
        <div className="glass-elevated rounded-3xl p-6 sm:p-8 flex flex-col gap-6 text-center">
          {/* Hero Visual */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-100">
            <ResilientImage
              src={IMAGES.pizza}
              alt="Wood-fired sourdough pizza and artisanal dining"
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent flex items-end p-4 text-left">
              <p className="text-xs font-medium text-white/95 tracking-wide">
                Curated local kitchens · Insulated glass-layer delivery
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display leading-tight">
              Good food, closer to you.
            </h2>
            <p className="text-sm text-stone-600">Discover · Order · Enjoy</p>
          </div>

          {/* Unified Sign In / Sign Up & Continue with Google Control Block */}
          <div className="w-full flex flex-col gap-3">
            {/* Symmetrical 2-Column Sign In / Sign Up Switcher */}
            <div className="w-full grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-stone-200/70">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center transition-all ${
                  authMode === 'signin'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="w-full p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-left flex items-start gap-2.5 text-xs text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Google Authentication CTA — Identical Width, Padding, Radius & Height */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleLoginClick('customer')}
              className="w-full h-12 px-5 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all duration-150 shadow-md shadow-stone-900/10 flex items-center justify-center gap-3 font-semibold text-sm disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>
                {isLoading && selectedRolePath === 'customer'
                  ? 'Connecting with Google...'
                  : 'Continue with Google'}
              </span>
            </button>
          </div>

          {/* Subtle Secondary Partner Pathways — Aligned on Identical Grid Container */}
          <div className="w-full pt-5 border-t border-stone-200/70 flex flex-col gap-3">
            <p className="text-xs font-medium text-stone-500">
              Own a business or deliver with us?
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleLoginClick('restaurant_partner')}
                className="w-full h-12 px-4 rounded-2xl glass-surface hover:bg-white/95 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Store className="w-4 h-4 text-emerald-900 shrink-0" />
                <span>Own a Restaurant</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleLoginClick('delivery_partner')}
                className="w-full h-12 px-4 rounded-2xl glass-surface hover:bg-white/95 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Bike className="w-4 h-4 text-emerald-900 shrink-0" />
                <span>Become a Partner</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-stone-400">
        Bit&apos;Q (e=&apos;) · Verified Google Authentication Only
      </footer>
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
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState(
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ''
  );
  const [selectedGeo, setSelectedGeo] = useState<GeoLocationData>(
    POPULAR_LOCATIONS_DATA[0]
  );
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [deliveryPreferences, setDeliveryPreferences] = useState(
    'Leave at door glass concierge table'
  );

  // Restaurant Partner onboarding fields
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('Pizza · Artisanal Kitchen');
  const [contactPhone, setContactPhone] = useState('+91 98450 12345');
  const [operatingHours, setOperatingHours] = useState('11:00 AM – 10:30 PM');

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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] px-4 py-10">
      <div className="glass-elevated rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-900">
              Almost there · Let&apos;s personalize your experience
            </p>
            <h1 className="text-2xl font-bold text-stone-900 font-display mt-1">
              Create your account
            </h1>
          </div>
          {firebaseUser.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-white shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-white flex items-center justify-center text-lg font-bold font-display">
              {(name || 'B').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Account Role Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-600">
            Account Experience
          </label>
          <div className="w-full grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-stone-200/70">
            {(
              [
                { id: 'customer', label: 'Customer' },
                { id: 'restaurant_partner', label: 'Restaurant' },
                { id: 'delivery_partner', label: 'Courier' },
              ] as { id: UserRole; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRole(tab.id)}
                className={`w-full h-11 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  role === tab.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            <div className="pt-2 space-y-4 border-t border-stone-200/60">
              <GlassInput
                label="Dietary Preferences (Optional)"
                value={dietaryPreferences}
                onChange={setDietaryPreferences}
                placeholder="e.g., Vegetarian, Nut-free, High-protein"
                maxLength={100}
              />
            </div>
          )}

          {role === 'restaurant_partner' && (
            <div className="pt-3 space-y-4 border-t border-stone-200/60">
              <p className="text-xs font-semibold text-emerald-950">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Business Contact"
                  value={contactPhone}
                  onChange={setContactPhone}
                  placeholder="+91 98450 00000"
                  maxLength={30}
                  required
                />
                <GlassInput
                  label="Operating Hours"
                  value={operatingHours}
                  onChange={setOperatingHours}
                  placeholder="11:00 AM – 11:00 PM"
                  maxLength={80}
                  required
                />
              </div>
            </div>
          )}

          {role === 'delivery_partner' && (
            <div className="pt-3 space-y-3 border-t border-stone-200/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-600">
                  Preferred Delivery Service Range
                </label>
                <span className="text-sm font-mono font-semibold text-emerald-900 tabular-nums">
                  {deliveryRangeKm} km
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={deliveryRangeKm}
                onChange={(e) => setDeliveryRangeKm(Number(e.target.value))}
                className="w-full accent-emerald-900"
              />
              <p className="text-xs text-stone-500">
                You can adjust your active range and Online/Offline availability
                anytime from your courier console.
              </p>
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
      </div>
    </div>
  );
};
