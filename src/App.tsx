/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
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
import {
  SEED_RESTAURANTS,
  SEED_MENU_ITEMS,
  SEED_COUPONS,
  SEED_RESTAURANT_CATEGORIES,
  IMAGES,
} from './seedData';
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

  // Firestore Collections State
  const [partnerRestaurants, setPartnerRestaurants] = useState<Restaurant[]>(
    []
  );
  const [partnerCategories, setPartnerCategories] = useState<
    RestaurantCategory[]
  >([]);
  const [partnerMenuItems, setPartnerMenuItems] = useState<MenuItem[]>([]);
  const [partnerCoupons, setPartnerCoupons] = useState<Coupon[]>([]);
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
            total_rides: data.total_rides ?? 128,
            orders_delivered: data.orders_delivered ?? 116,
            cancelled_deliveries: data.cancelled_deliveries ?? 4,
            points: data.points ?? 2450,
            courier_rating: data.courier_rating ?? 4.8,
            acceptance_rate: data.acceptance_rate ?? 92,
            current_streak_days: data.current_streak_days ?? 7,
            total_earnings: data.total_earnings ?? 18450,
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
        setPartnerRestaurants(list);
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
        setPartnerCategories(list);
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
        setPartnerMenuItems(list);
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
        setPartnerCoupons(list);
      },
      (err) => console.warn('Coupons listener:', err)
    );

    // Subscribe to orders so Customer, Restaurant, and Courier stay in real-time sync
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

  // Combine seeded catalog with live Firestore partner data
  const allRestaurants = useMemo(() => {
    const map = new Map<string, Restaurant>();
    SEED_RESTAURANTS.forEach((r) => map.set(r.id, r));
    partnerRestaurants.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  }, [partnerRestaurants]);

  const allCategories = useMemo(() => {
    const map = new Map<string, RestaurantCategory>();
    SEED_RESTAURANT_CATEGORIES.forEach((c) => map.set(c.id, c));
    partnerCategories.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [partnerCategories]);

  const allMenuItems = useMemo(() => {
    const map = new Map<string, MenuItem>();
    SEED_MENU_ITEMS.forEach((m) => map.set(m.id, m));
    partnerMenuItems.forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [partnerMenuItems]);

  const allCoupons = useMemo(() => {
    const map = new Map<string, Coupon>();
    SEED_COUPONS.forEach((c) => map.set(c.id, c));
    partnerCoupons.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [partnerCoupons]);

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

  // New User Onboarding Completion Handler
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
          rating: 4.9,
          delivery_time: '25–30 min',
          distance: '1.9 km',
          price_indicator: '₹₹',
          offer_text: '20% OFF welcome privilege · SAVE20',
          image_url: IMAGES.pizza,
          is_open: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        await setDoc(doc(db, 'restaurants', restaurantId), restPayload);

        const defaultCatId = `cat-${uid.slice(0, 8)}-1`;
        await setDoc(doc(db, 'restaurant_categories', defaultCatId), {
          restaurant_id: restaurantId,
          owner_uid: uid,
          name: 'Chef Specials',
          display_order: 1,
          active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        const starterDishId = `item-${uid.slice(0, 10)}-1`;
        await setDoc(doc(db, 'menu_items', starterDishId), {
          restaurant_id: restaurantId,
          owner_uid: uid,
          category_id: defaultCatId,
          name: 'Chef Signature Hearth Flatbread',
          description:
            'Prepared fresh daily with organic cold-pressed olive oil, sea salt, and seasonal herbs.',
          price: 460,
          category: 'Chef Specials',
          image_url: IMAGES.pizza,
          is_available: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
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
        total_rides: 128,
        orders_delivered: 116,
        cancelled_deliveries: 4,
        points: 2450,
        courier_rating: 4.8,
        acceptance_rate: 92,
        current_streak_days: 7,
        total_earnings: 18450,
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
        total_rides: 128,
        orders_delivered: 116,
        cancelled_deliveries: 4,
        points: 2450,
        courier_rating: 4.8,
        acceptance_rate: 92,
        current_streak_days: 7,
        total_earnings: 18450,
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

    const newOrder: Omit<Order, 'id'> = {
      customer_uid: firebaseUser.uid,
      customer_name: userProfile.name.slice(0, 100),
      delivery_address: userProfile.location.slice(0, 200),
      delivery_lat: userProfile.lat || 12.961,
      delivery_lng: userProfile.lng || 77.638,
      restaurant_id: orderData.restaurant.id,
      restaurant_owner_uid:
        orderData.restaurant.owner_uid || 'system_curated',
      restaurant_name: orderData.restaurant.name.slice(0, 120),
      restaurant_location: orderData.restaurant.location.slice(0, 150),
      restaurant_lat: orderData.restaurant.lat || 12.9784,
      restaurant_lng: orderData.restaurant.lng || 77.6408,
      delivery_partner_uid: '',
      delivery_partner_name: '',
      delivery_partner_rating: 4.8,
      items_summary: summary,
      item_count: itemCount,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      discount: orderData.discount,
      coupon_code: orderData.couponCode || '',
      taxes: orderData.taxes,
      total: orderData.total,
      status: 'ORDER_PLACED',
      estimated_arrival: orderData.restaurant.delivery_time || '24–30 min',
      distance_km: 3.2,
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
  const myRestaurant = useMemo(() => {
    if (!userProfile) return null;
    return (
      allRestaurants.find(
        (r) =>
          r.id === userProfile.restaurant_id ||
          r.owner_uid === userProfile.google_uid
      ) || null
    );
  }, [allRestaurants, userProfile]);

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
          rating: 4.9,
          delivery_time: '25–30 min',
          distance: '2.0 km',
          price_indicator: '₹₹',
          offer_text: (updates.offer_text || '20% OFF above ₹499').slice(
            0,
            100
          ),
          image_url: IMAGES.pizza,
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
      display_order: allCategories.length + 1,
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
      console.warn('Category creation error:', err);
      setPartnerCategories((prev) => [...prev, newCat]);
      return newCat;
    }
  };

  const handleUpdateCategory = async (
    catId: string,
    updates: Partial<RestaurantCategory>
  ) => {
    setPartnerCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, ...updates } : c))
    );
    try {
      await updateDoc(doc(db, 'restaurant_categories', catId), {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Category update warning:', err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setPartnerCategories((prev) => prev.filter((c) => c.id !== catId));
    try {
      await deleteDoc(doc(db, 'restaurant_categories', catId));
    } catch (err) {
      console.warn('Category delete warning:', err);
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
    setPartnerCoupons((prev) => [newCoupon, ...prev]);
    try {
      await setDoc(doc(db, 'coupons', couponId), {
        ...newCoupon,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Coupon create warning:', err);
    }
  };

  const handleToggleCoupon = async (couponId: string, active: boolean) => {
    setPartnerCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, active } : c))
    );
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        active,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Coupon toggle warning:', err);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    setPartnerCoupons((prev) => prev.filter((c) => c.id !== couponId));
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
    } catch (err) {
      console.warn('Coupon delete warning:', err);
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
        delivery_partner_rating: userProfile.courier_rating || 4.8,
        ...(courierCoords
          ? { courier_lat: courierCoords[0], courier_lng: courierCoords[1] }
          : {}),
        ...stateTimestamps,
        estimated_arrival: etaByStage[nextStatus] || '14 min',
        updated_at: serverTimestamp(),
      });
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F2] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-display text-lg font-bold animate-pulse mb-3">
          e=&apos;
        </div>
        <p className="text-xs font-medium text-stone-500">
          Preparing your Bit&apos;Q table...
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
        categories={allCategories}
        menuItems={allMenuItems}
        coupons={allCoupons}
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
      restaurants={allRestaurants}
      categories={allCategories}
      menuItems={allMenuItems}
      coupons={allCoupons}
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
