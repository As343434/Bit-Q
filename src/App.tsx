/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  UserProfile,
  UserRole,
  Restaurant,
  RestaurantCategory,
  MenuItem,
  Coupon,
  CartItem,
  Order,
  OrderStatus,
  SupportTicket,
  SupportCategory,
  GeoLocationData,
} from './types';
import { BitQIcon, BitQLogo } from './components/GlassUI';
import { LoginScreen, OnboardingScreen } from './components/AuthViews';
import { CustomerExperience } from './components/CustomerViews';
import {
  RestaurantPartnerExperience,
  DeliveryPartnerExperience,
} from './components/PartnerViews';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [intendedRole, setIntendedRole] = useState<UserRole>('customer');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Live Firestore Collections State (Zero Mock Data)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // 1. Persistent Auth State Listener & Existing User Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      setProfileLoading(true);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserProfile({
            id: userSnap.id,
            google_uid: data.google_uid,
            name: data.name,
            email: data.email,
            profile_image: data.profile_image || '',
            location: data.location,
            lat: data.lat,
            lng: data.lng,
            place_id: data.place_id,
            role: data.role as UserRole,
            delivery_preferences: data.delivery_preferences,
            dietary_preferences: data.dietary_preferences,
            is_online: data.is_online,
            delivery_range_km: data.delivery_range_km,
            restaurant_id: data.restaurant_id,
            total_rides: data.total_rides ?? 0,
            orders_delivered: data.orders_delivered ?? 0,
            cancelled_deliveries: data.cancelled_deliveries ?? 0,
            points: data.points ?? 0,
            courier_rating: data.courier_rating ?? 5.0,
            acceptance_rate: data.acceptance_rate ?? 100,
            current_streak_days: data.current_streak_days ?? 0,
            total_earnings: data.total_earnings ?? 0,
          });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error checking user profile:', err);
        setAuthError(
          'Unable to verify your profile right now. Please try signing in again.'
        );
      } finally {
        setProfileLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listeners
  useEffect(() => {
    if (!authReady || !firebaseUser || !userProfile) return;

    const unsubRestaurants = onSnapshot(
      collection(db, 'restaurants'),
      (snap) => {
        const list: Restaurant[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Restaurant, 'id'>),
        }));
        setRestaurants(list);
      },
      (err) => console.warn('Restaurants listener:', err)
    );

    const unsubCategories = onSnapshot(
      collection(db, 'restaurant_categories'),
      (snap) => {
        const list: RestaurantCategory[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RestaurantCategory, 'id'>),
        }));
        setCategories(list);
      },
      (err) => console.warn('Categories listener:', err)
    );

    const unsubMenu = onSnapshot(
      collection(db, 'menu_items'),
      (snap) => {
        const list: MenuItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MenuItem, 'id'>),
        }));
        setMenuItems(list);
      },
      (err) => console.warn('Menu listener:', err)
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        const list: Coupon[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Coupon, 'id'>),
        }));
        setCoupons(list);
      },
      (err) => console.warn('Coupons listener:', err)
    );

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list: Order[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        setOrders(list);
      },
      (err) => console.warn('Orders listener:', err)
    );

    let unsubTickets = () => {};
    if (userProfile.role === 'customer') {
      const ticketsQuery = query(
        collection(db, 'support_tickets'),
        where('user_uid', '==', firebaseUser.uid)
      );
      unsubTickets = onSnapshot(
        ticketsQuery,
        (snap) => {
          const list: SupportTicket[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<SupportTicket, 'id'>),
          }));
          setSupportTickets(list);
        },
        (err) => console.warn('Tickets listener:', err)
      );
    }

    return () => {
      unsubRestaurants();
      unsubCategories();
      unsubMenu();
      unsubCoupons();
      unsubOrders();
      unsubTickets();
    };
  }, [authReady, firebaseUser, userProfile]);

  // Google Sign-In Handler
  const handleGoogleLogin = async (rolePath: UserRole) => {
    setAuthError(null);
    setIntendedRole(rolePath);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(
          'Google sign-in could not be completed. Please allow popups and try again.'
        );
      }
    }
  };

  // New User Onboarding Completion Handler (Launch-ready zero-state initialization)
  const handleCompleteOnboarding = async (formData: {
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
  }) => {
    if (!firebaseUser) return;
    setIsSubmittingOnboarding(true);
    setAuthError(null);

    const uid = firebaseUser.uid;
    const restaurantId =
      formData.role === 'restaurant_partner' ? `rest-${uid.slice(0, 12)}` : '';

    try {
      // Create the partner's restaurant storefront in Firestore (without fake dishes)
      if (formData.role === 'restaurant_partner' && restaurantId) {
        const restPayload = {
          owner_uid: uid,
          name: (
            formData.restaurantName || `${formData.name}'s Kitchen`
          ).slice(0, 120),
          owner_name: formData.name.slice(0, 100),
          contact_phone: (formData.contactPhone || '+91 98450 12345').slice(
            0,
            30
          ),
          location: formData.location.slice(0, 150),
          lat: formData.lat,
          lng: formData.lng,
          cuisine: (formData.cuisine || 'Artisanal Kitchen').slice(0, 80),
          operating_hours: (
            formData.operatingHours || '11:00 AM – 10:30 PM'
          ).slice(0, 80),
          rating: 5.0,
          delivery_time: '25–30 min',
          distance: '1.5 km',
          price_indicator: '₹₹',
          offer_text: 'Freshly crafted menu',
          image_url: '',
          is_open: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        await setDoc(doc(db, 'restaurants', restaurantId), restPayload);
      }

      const userDocPayload: Record<string, unknown> = {
        google_uid: uid,
        name: formData.name.slice(0, 100),
        email: (firebaseUser.email || 'verified@gmail.com').slice(0, 150),
        profile_image: (firebaseUser.photoURL || '').slice(0, 500),
        location: formData.location.slice(0, 150),
        lat: formData.lat,
        lng: formData.lng,
        place_id: formData.placeId || 'custom',
        role: formData.role,
        delivery_preferences: (formData.delivery_preferences || '').slice(
          0,
          200
        ),
        dietary_preferences: (formData.dietary_preferences || '').slice(0, 100),
        is_online: true,
        delivery_range_km: formData.deliveryRangeKm || 5,
        restaurant_id: restaurantId,
        total_rides: 0,
        orders_delivered: 0,
        cancelled_deliveries: 0,
        points: 0,
        courier_rating: 5.0,
        acceptance_rate: 100,
        current_streak_days: 0,
        total_earnings: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid), userDocPayload);

      setUserProfile({
        id: uid,
        google_uid: uid,
        name: formData.name.slice(0, 100),
        email: (firebaseUser.email || 'verified@gmail.com').slice(0, 150),
        profile_image: (firebaseUser.photoURL || '').slice(0, 500),
        location: formData.location.slice(0, 150),
        lat: formData.lat,
        lng: formData.lng,
        place_id: formData.placeId || 'custom',
        role: formData.role,
        delivery_preferences: formData.delivery_preferences || '',
        dietary_preferences: formData.dietary_preferences || '',
        is_online: true,
        delivery_range_km: formData.deliveryRangeKm || 5,
        restaurant_id: restaurantId,
        total_rides: 0,
        orders_delivered: 0,
        cancelled_deliveries: 0,
        points: 0,
        courier_rating: 5.0,
        acceptance_rate: 100,
        current_streak_days: 0,
        total_earnings: 0,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  // Profile & Location Updaters
  const handleUpdateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser || !userProfile) return;
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Profile update warning:', err);
    }
  };

  // Customer Place Order
  const handlePlaceOrder = async (orderData: {
    restaurant: Restaurant;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    couponCode?: string;
    taxes: number;
    total: number;
  }): Promise<Order | null> => {
    if (!firebaseUser || !userProfile) return null;
    const orderId = `ord-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const summary = orderData.items
      .map((i) => `${i.quantity}x ${i.menuItem.name}`)
      .join(', ')
      .slice(0, 500);
    const itemCount = orderData.items.reduce((s, i) => s + i.quantity, 0);

    // Calculate real straight-line distance between restaurant and customer
    const rLat = orderData.restaurant.lat || 12.9784;
    const rLng = orderData.restaurant.lng || 77.6408;
    const cLat = userProfile.lat || 12.961;
    const cLng = userProfile.lng || 77.638;
    const dLat = ((cLat - rLat) * Math.PI) / 180;
    const dLng = ((cLng - rLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((rLat * Math.PI) / 180) *
        Math.cos((cLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const distKm = Math.max(
      0.5,
      Math.min(
        99,
        Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1))
      )
    );

    const newOrder: Omit<Order, 'id'> = {
      customer_uid: firebaseUser.uid,
      customer_name: userProfile.name.slice(0, 100),
      delivery_address: userProfile.location.slice(0, 200),
      delivery_lat: cLat,
      delivery_lng: cLng,
      restaurant_id: orderData.restaurant.id,
      restaurant_owner_uid: orderData.restaurant.owner_uid,
      restaurant_name: orderData.restaurant.name.slice(0, 120),
      restaurant_location: orderData.restaurant.location.slice(0, 150),
      restaurant_lat: rLat,
      restaurant_lng: rLng,
      delivery_partner_uid: '',
      delivery_partner_name: '',
      delivery_partner_rating: 5.0,
      items_summary: summary,
      item_count: itemCount,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      discount: orderData.discount,
      coupon_code: orderData.couponCode || '',
      taxes: orderData.taxes,
      total: orderData.total,
      status: 'ORDER_PLACED',
      estimated_arrival: orderData.restaurant.delivery_time || '25–30 min',
      distance_km: distKm,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      return { id: orderId, ...newOrder };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  // Customer Support Ticket Submission
  const handleSubmitSupportTicket = async (ticket: {
    category: SupportCategory;
    order_id: string;
    subject: string;
    message: string;
  }) => {
    if (!firebaseUser) return;
    const ticketId = `tkt-${Date.now()}`;
    try {
      await setDoc(doc(db, 'support_tickets', ticketId), {
        user_uid: firebaseUser.uid,
        category: ticket.category,
        order_id: ticket.order_id.slice(0, 128),
        subject: ticket.subject.slice(0, 120),
        message: ticket.message.slice(0, 800),
        status: 'OPEN',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `support_tickets/${ticketId}`
      );
    }
  };

  // Restaurant Partner Storefront, Categories, Coupons & Menu Handlers
  const myRestaurant =
    restaurants.find(
      (r) =>
        r.id === userProfile?.restaurant_id ||
        r.owner_uid === userProfile?.google_uid
    ) || null;

  const handleCreateOrUpdateRestaurant = async (
    updates: Partial<Restaurant>
  ) => {
    if (!firebaseUser || !userProfile) return;
    const restId =
      myRestaurant?.id ||
      userProfile.restaurant_id ||
      `rest-${firebaseUser.uid.slice(0, 12)}`;
    try {
      if (myRestaurant) {
        await updateDoc(doc(db, 'restaurants', restId), {
          ...updates,
          updated_at: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'restaurants', restId), {
          owner_uid: firebaseUser.uid,
          name: (updates.name || `${userProfile.name}'s Kitchen`).slice(0, 120),
          owner_name: userProfile.name.slice(0, 100),
          contact_phone: (updates.contact_phone || '+91 98450 12345').slice(
            0,
            30
          ),
          location: userProfile.location.slice(0, 150),
          lat: userProfile.lat || 12.9784,
          lng: userProfile.lng || 77.6408,
          cuisine: (updates.cuisine || 'Artisanal Kitchen').slice(0, 80),
          operating_hours: (
            updates.operating_hours || '11:00 AM – 10:30 PM'
          ).slice(0, 80),
          rating: 5.0,
          delivery_time: '25–30 min',
          distance: '1.5 km',
          price_indicator: '₹₹',
          offer_text: (updates.offer_text || 'Freshly crafted menu').slice(
            0,
            100
          ),
          image_url: updates.image_url || '',
          is_open: updates.is_open ?? true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `restaurants/${restId}`);
    }
  };

  const handleCreateCategory = async (
    name: string
  ): Promise<RestaurantCategory | null> => {
    if (!firebaseUser || !userProfile) return null;
    const restId =
      myRestaurant?.id ||
      userProfile.restaurant_id ||
      `rest-${firebaseUser.uid.slice(0, 12)}`;
    const catId = `cat-${Date.now()}`;
    const newCat: RestaurantCategory = {
      id: catId,
      restaurant_id: restId,
      owner_uid: firebaseUser.uid,
      name: name.slice(0, 60),
      display_order: categories.length + 1,
      active: true,
    };
    try {
      await setDoc(doc(db, 'restaurant_categories', catId), {
        ...newCat,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return newCat;
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `restaurant_categories/${catId}`
      );
    }
  };

  const handleUpdateCategory = async (
    catId: string,
    updates: Partial<RestaurantCategory>
  ) => {
    try {
      await updateDoc(doc(db, 'restaurant_categories', catId), {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `restaurant_categories/${catId}`
      );
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteDoc(doc(db, 'restaurant_categories', catId));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `restaurant_categories/${catId}`
      );
    }
  };

  const handleAddMenuItem = async (itemData: {
    name: string;
    description: string;
    price: number;
    category: string;
    category_id?: string;
    image_url: string;
    is_available: boolean;
  }) => {
    if (!firebaseUser || !userProfile) return;
    const restId =
      myRestaurant?.id ||
      userProfile.restaurant_id ||
      `rest-${firebaseUser.uid.slice(0, 12)}`;
    const itemId = `item-${Date.now()}`;
    try {
      await setDoc(doc(db, 'menu_items', itemId), {
        restaurant_id: restId,
        owner_uid: firebaseUser.uid,
        category_id: itemData.category_id || '',
        name: itemData.name.slice(0, 120),
        description: itemData.description.slice(0, 300),
        price: itemData.price,
        category: itemData.category,
        image_url: itemData.image_url.slice(0, 500),
        is_available: itemData.is_available,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `menu_items/${itemId}`);
    }
  };

  const handleUpdateMenuItem = async (
    itemId: string,
    updates: Partial<MenuItem>
  ) => {
    try {
      await updateDoc(doc(db, 'menu_items', itemId), {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `menu_items/${itemId}`);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'menu_items', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `menu_items/${itemId}`);
    }
  };

  const handleCreateCoupon = async (couponData: {
    code: string;
    description: string;
    discount_type: 'PERCENTAGE' | 'FLAT';
    discount_value: number;
    maximum_discount: number;
    minimum_order_value: number;
    expiry_date: string;
  }) => {
    if (!firebaseUser || !userProfile) return;
    const restId =
      myRestaurant?.id ||
      userProfile.restaurant_id ||
      `rest-${firebaseUser.uid.slice(0, 12)}`;
    const couponId = `cpn-${Date.now()}`;
    const newCoupon: Coupon = {
      id: couponId,
      code: couponData.code.toUpperCase(),
      description: couponData.description,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      maximum_discount: couponData.maximum_discount,
      minimum_order_value: couponData.minimum_order_value,
      start_date: new Date().toISOString().slice(0, 10),
      expiry_date: couponData.expiry_date,
      usage_limit: 500,
      used_count: 0,
      per_user_limit: 3,
      active: true,
      restaurant_id: restId,
      owner_uid: firebaseUser.uid,
    };
    try {
      await setDoc(doc(db, 'coupons', couponId), {
        ...newCoupon,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupons/${couponId}`);
    }
  };

  const handleToggleCoupon = async (couponId: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        active,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupons/${couponId}`);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${couponId}`);
    }
  };

  // Order Status Updates (Restaurant or Courier)
  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: OrderStatus
  ) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        estimated_arrival:
          nextStatus === 'DELIVERED' ? 'Delivered' : '18–22 min',
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleCourierAdvanceOrder = async (
    order: Order,
    nextStatus: OrderStatus,
    courierCoords?: [number, number]
  ) => {
    if (!firebaseUser || !userProfile) return;
    const nowIso = new Date().toISOString();
    const stateTimestamps: Record<string, string> = {};
    if (nextStatus === 'COURIER_ACCEPTED') stateTimestamps.accepted_at = nowIso;
    if (nextStatus === 'ARRIVED_AT_RESTAURANT')
      stateTimestamps.arrived_at_restaurant_at = nowIso;
    if (nextStatus === 'OUT_FOR_DELIVERY')
      stateTimestamps.picked_up_at = nowIso;
    if (nextStatus === 'ARRIVED_AT_CUSTOMER')
      stateTimestamps.arrived_at_customer_at = nowIso;
    if (nextStatus === 'DELIVERED') stateTimestamps.delivered_at = nowIso;

    const etaByStage: Record<string, string> = {
      COURIER_ACCEPTED: '18 min',
      GOING_TO_RESTAURANT: '15 min',
      ARRIVED_AT_RESTAURANT: '12 min',
      OUT_FOR_DELIVERY: '9 min',
      ARRIVED_AT_CUSTOMER: 'Arriving now',
      DELIVERED: 'Delivered',
    };

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        delivery_partner_uid: firebaseUser.uid,
        delivery_partner_name: userProfile.name.slice(0, 100),
        delivery_partner_rating: userProfile.courier_rating || 5.0,
        ...(courierCoords
          ? { courier_lat: courierCoords[0], courier_lng: courierCoords[1] }
          : {}),
        ...stateTimestamps,
        estimated_arrival: etaByStage[nextStatus] || '14 min',
        updated_at: serverTimestamp(),
      });

      // Persist courier statistics increment in /users/{uid} upon delivery completion
      if (nextStatus === 'DELIVERED') {
        const payout = Math.max(40, order.delivery_fee);
        await handleUpdateUserProfile({
          total_rides: (userProfile.total_rides || 0) + 1,
          orders_delivered: (userProfile.orders_delivered || 0) + 1,
          points: (userProfile.points || 0) + 25,
          total_earnings: (userProfile.total_earnings || 0) + payout,
          current_streak_days: Math.max(1, userProfile.current_streak_days || 0),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-16 h-16 rounded-3xl glass-elevated flex items-center justify-center shadow-lg shadow-rose-600/15 animate-pulse">
          <BitQIcon className="w-11 h-11" />
        </div>
        <BitQLogo size="md" />
        <p className="text-xs font-medium text-slate-500">
          Preparing your BiteQ experience...
        </p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        isLoading={profileLoading}
        error={authError}
      />
    );
  }

  if (!userProfile) {
    return (
      <OnboardingScreen
        firebaseUser={firebaseUser}
        initialRole={intendedRole}
        onCompleteProfile={handleCompleteOnboarding}
        onCancel={handleLogout}
        isSubmitting={isSubmittingOnboarding}
        error={authError}
      />
    );
  }

  if (userProfile.role === 'restaurant_partner') {
    return (
      <RestaurantPartnerExperience
        user={userProfile}
        restaurant={myRestaurant}
        categories={categories}
        menuItems={menuItems}
        coupons={coupons}
        orders={orders}
        onCreateOrUpdateRestaurant={handleCreateOrUpdateRestaurant}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddMenuItem={handleAddMenuItem}
        onUpdateMenuItem={handleUpdateMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onCreateCoupon={handleCreateCoupon}
        onToggleCoupon={handleToggleCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onLogout={handleLogout}
      />
    );
  }

  if (userProfile.role === 'delivery_partner') {
    return (
      <DeliveryPartnerExperience
        user={userProfile}
        orders={orders}
        onToggleOnline={(next) => handleUpdateUserProfile({ is_online: next })}
        onUpdateRange={(km) =>
          handleUpdateUserProfile({ delivery_range_km: km })
        }
        onAdvanceDeliveryState={handleCourierAdvanceOrder}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CustomerExperience
      user={userProfile}
      restaurants={restaurants}
      categories={categories}
      menuItems={menuItems}
      coupons={coupons}
      orders={orders}
      supportTickets={supportTickets}
      onUpdateLocation={(loc, geo?: GeoLocationData) =>
        handleUpdateUserProfile({
          location: loc,
          ...(geo ? { lat: geo.lat, lng: geo.lng, place_id: geo.placeId } : {}),
        })
      }
      onUpdateProfile={handleUpdateUserProfile}
      onPlaceOrder={handlePlaceOrder}
      onSubmitSupportTicket={handleSubmitSupportTicket}
      onLogout={handleLogout}
    />
  );
}
