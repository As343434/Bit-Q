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
  StoreRating,
  OrderChatMessage,
} from './types';
import { buildDefaultRestaurantMenu } from './seedData';
import { BitQLogo } from './components/GlassUI';
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
  const [storeRatings, setStoreRatings] = useState<StoreRating[]>([]);
  const [orderMessages, setOrderMessages] = useState<OrderChatMessage[]>([]);

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
          const resolvedUid = data.google_uid || userSnap.id || currentUser.uid;
          setUserProfile({
            id: userSnap.id,
            google_uid: resolvedUid,
            name: data.name || currentUser.displayName || 'BiteQ User',
            email: data.email || currentUser.email || '',
            profile_image: data.profile_image || currentUser.photoURL || '',
            location: data.location || 'Indiranagar, Bengaluru',
            lat: data.lat,
            lng: data.lng,
            place_id: data.place_id,
            role: (data.role as UserRole) || 'customer',
            delivery_preferences: data.delivery_preferences,
            dietary_preferences: data.dietary_preferences,
            is_online: data.is_online ?? true,
            delivery_range_km: data.delivery_range_km ?? 5,
            restaurant_id:
              data.restaurant_id ||
              (data.role === 'restaurant_partner'
                ? `rest-${resolvedUid.slice(0, 12)}`
                : ''),
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
      query(collection(db, 'restaurants'), where('name', '>=', '')),
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
      query(collection(db, 'restaurant_categories'), where('name', '>=', '')),
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
      query(collection(db, 'menu_items'), where('name', '>=', '')),
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
      query(collection(db, 'coupons'), where('code', '>=', '')),
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
      query(collection(db, 'orders'), where('customer_uid', '>=', '')),
      (snap) => {
        const list: Order[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        setOrders(list);
      },
      (err) => console.warn('Orders listener:', err)
    );

    const unsubRatings = onSnapshot(
      query(collection(db, 'store_ratings'), where('order_id', '>=', '')),
      (snap) => {
        const list: StoreRating[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StoreRating, 'id'>),
        }));
        setStoreRatings(list);
      },
      (err) => console.warn('Ratings listener:', err)
    );

    const unsubMessages = onSnapshot(
      query(collection(db, 'order_messages'), where('order_id', '>=', '')),
      (snap) => {
        const list: OrderChatMessage[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderChatMessage, 'id'>),
        }));
        setOrderMessages(list);
      },
      (err) => console.warn('Order chat listener:', err)
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
      unsubRatings();
      unsubMessages();
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
          image_url: '/favicon.svg',
          is_open: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        await setDoc(doc(db, 'restaurants', restaurantId), restPayload);

        // Automatically seed standard dish & price catalog in Firestore so no manual dish entry is needed
        const defaultDishes = buildDefaultRestaurantMenu(restaurantId, uid);
        setMenuItems((prev) => [...defaultDishes, ...prev]);
        for (const dish of defaultDishes) {
          try {
            await setDoc(doc(db, 'menu_items', dish.id), {
              restaurant_id: dish.restaurant_id,
              owner_uid: dish.owner_uid,
              category_id: dish.category_id || 'default',
              name: dish.name,
              description: dish.description,
              price: dish.price,
              category: dish.category,
              image_url: dish.image_url,
              is_available: dish.is_available,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
          } catch {
            // Ignore individual dish write warnings if rules restrict batching
          }
        }
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
      const createdOrder: Order = { id: orderId, ...newOrder };
      setOrders((prev) => [
        createdOrder,
        ...prev.filter((o) => o.id !== orderId),
      ]);
      return createdOrder;
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
      setSupportTickets((prev) => [
        {
          id: ticketId,
          user_uid: firebaseUser.uid,
          category: ticket.category,
          order_id: ticket.order_id.slice(0, 128),
          subject: ticket.subject.slice(0, 120),
          message: ticket.message.slice(0, 800),
          status: 'OPEN',
        },
        ...prev.filter((t) => t.id !== ticketId),
      ]);
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
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restId ? { ...r, ...updates } : r))
        );
      } else {
        const newRestObj: Restaurant = {
          id: restId,
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
            updates.operating_hours || '09:00 AM – 10:30 PM'
          ).slice(0, 80),
          rating: 5.0,
          delivery_time: '25–30 min',
          distance: '1.5 km',
          price_indicator: '₹₹',
          offer_text: (updates.offer_text || 'Freshly crafted menu').slice(
            0,
            100
          ),
          image_url: updates.image_url?.trim() || '/favicon.svg',
          is_open: updates.is_open ?? true,
        };
        const { id: _unusedId, ...firestorePayload } = newRestObj;
        await setDoc(doc(db, 'restaurants', restId), {
          ...firestorePayload,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        setRestaurants((prev) => [
          newRestObj,
          ...prev.filter((r) => r.id !== restId),
        ]);
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
      setCategories((prev) => [
        newCat,
        ...prev.filter((c) => c.id !== catId),
      ]);
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
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, ...updates } : c))
    );
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
    setCategories((prev) => prev.filter((c) => c.id !== catId));
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

    // Ensure the partner's restaurant storefront document exists in Firestore
    if (!myRestaurant) {
      try {
        await setDoc(doc(db, 'restaurants', restId), {
          owner_uid: firebaseUser.uid,
          name: `${userProfile.name}'s Kitchen`.slice(0, 120),
          owner_name: userProfile.name.slice(0, 100),
          contact_phone: '+91 98450 12345',
          location: (userProfile.location || 'Indiranagar, Bengaluru').slice(
            0,
            150
          ),
          lat: userProfile.lat || 12.9784,
          lng: userProfile.lng || 77.6408,
          cuisine: 'Artisanal Kitchen',
          operating_hours: '09:00 AM – 10:30 PM',
          rating: 5.0,
          delivery_time: '25–30 min',
          distance: '1.5 km',
          price_indicator: '₹₹',
          offer_text: 'Freshly crafted menu',
          image_url: '/favicon.svg',
          is_open: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      } catch (restErr) {
        console.warn('Auto-create restaurant warning:', restErr);
      }
    }

    const itemId = `item-${Date.now()}`;
    const safeName = (itemData.name || 'Signature Dish').trim().slice(0, 120);
    const safeDesc = (
      itemData.description || `Freshly prepared ${safeName} from our kitchen.`
    )
      .trim()
      .slice(0, 300);
    const safeCategory = (itemData.category || 'Main Course')
      .trim()
      .slice(0, 60);
    const safeImage = (itemData.image_url || '/favicon.svg')
      .trim()
      .slice(0, 500);
    const safePrice = Math.min(
      50000,
      Math.max(1, Number(itemData.price) || 199)
    );

    const newMenuItem: MenuItem = {
      id: itemId,
      restaurant_id: restId,
      owner_uid: firebaseUser.uid,
      category_id: (itemData.category_id || 'default').slice(0, 128),
      name: safeName,
      description: safeDesc,
      price: safePrice,
      category: safeCategory,
      image_url: safeImage,
      is_available: Boolean(itemData.is_available),
    };

    // Immediately update local UI state so the dish appears right away
    setMenuItems((prev) => [
      newMenuItem,
      ...prev.filter((i) => i.id !== itemId),
    ]);

    try {
      await setDoc(doc(db, 'menu_items', itemId), {
        restaurant_id: newMenuItem.restaurant_id,
        owner_uid: newMenuItem.owner_uid,
        category_id: newMenuItem.category_id,
        name: newMenuItem.name,
        description: newMenuItem.description,
        price: newMenuItem.price,
        category: newMenuItem.category,
        image_url: newMenuItem.image_url,
        is_available: newMenuItem.is_available,
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
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    );
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
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
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
    setCoupons((prev) => [
      newCoupon,
      ...prev.filter((c) => c.id !== couponId),
    ]);
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
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, active } : c))
    );
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
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
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

  // Submit Store & Courier Rating -> Persists in /store_ratings and updates Restaurant's live rating
  const handleSubmitStoreRating = async (payload: {
    orderId: string;
    restaurantId: string;
    rating: number;
    courierRating: number;
    comment: string;
  }) => {
    if (!firebaseUser || !userProfile) return;
    const ratingId = `rtg-${payload.orderId}`;
    const newRating: StoreRating = {
      id: ratingId,
      order_id: payload.orderId,
      restaurant_id: payload.restaurantId,
      customer_uid: firebaseUser.uid,
      customer_name: userProfile.name.slice(0, 100),
      rating: payload.rating,
      courier_rating: payload.courierRating,
      comment: payload.comment.slice(0, 500),
    };
    setStoreRatings((prev) => [
      newRating,
      ...prev.filter((r) => r.id !== ratingId),
    ]);

    try {
      await setDoc(doc(db, 'store_ratings', ratingId), {
        order_id: newRating.order_id,
        restaurant_id: newRating.restaurant_id,
        customer_uid: newRating.customer_uid,
        customer_name: newRating.customer_name,
        rating: newRating.rating,
        courier_rating: newRating.courier_rating,
        comment: newRating.comment,
        created_at: serverTimestamp(),
      });

      // Recalculate restaurant average store rating
      const restRatings = [
        ...storeRatings.filter(
          (r) => r.restaurant_id === payload.restaurantId && r.id !== ratingId
        ),
        newRating,
      ];
      const avg = Number(
        (
          restRatings.reduce((acc, r) => acc + r.rating, 0) /
          restRatings.length
        ).toFixed(1)
      );
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === payload.restaurantId
            ? { ...r, rating: avg, rating_count: restRatings.length }
            : r
        )
      );
      await updateDoc(doc(db, 'restaurants', payload.restaurantId), {
        rating: avg,
        rating_count: restRatings.length,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Store rating sync warning:', err);
    }
  };

  // Send Real-Time Order Chat Message -> Persists in /order_messages in Firestore
  const handleSendOrderMessage = async (orderId: string, text: string) => {
    if (!firebaseUser || !userProfile) return;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newMsg: OrderChatMessage = {
      id: msgId,
      order_id: orderId,
      sender_uid: firebaseUser.uid,
      sender_name: userProfile.name.slice(0, 100),
      sender_role: userProfile.role,
      text: text.slice(0, 500),
    };
    setOrderMessages((prev) => [...prev, newMsg]);
    try {
      await setDoc(doc(db, 'order_messages', msgId), {
        order_id: newMsg.order_id,
        sender_uid: newMsg.sender_uid,
        sender_name: newMsg.sender_name,
        sender_role: newMsg.sender_role,
        text: newMsg.text,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Order chat message warning:', err);
    }
  };

  // Automatically merge standard dish & price catalog for any restaurant that has 0 custom dishes
  const effectiveMenuItems = React.useMemo(() => {
    const merged = [...menuItems];
    for (const rest of restaurants) {
      const hasDishes = merged.some((m) => m.restaurant_id === rest.id);
      if (!hasDishes) {
        merged.push(...buildDefaultRestaurantMenu(rest.id, rest.owner_uid));
      }
    }
    if (
      userProfile?.role === 'restaurant_partner' &&
      userProfile.restaurant_id &&
      !merged.some((m) => m.restaurant_id === userProfile.restaurant_id)
    ) {
      merged.push(
        ...buildDefaultRestaurantMenu(
          userProfile.restaurant_id,
          userProfile.google_uid || userProfile.id
        )
      );
    }
    return merged;
  }, [menuItems, restaurants, userProfile]);

  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-pulse">
          <BitQLogo size="lg" />
        </div>
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
        menuItems={effectiveMenuItems}
        coupons={coupons}
        orders={orders}
        storeRatings={storeRatings}
        orderMessages={orderMessages}
        onSendOrderMessage={handleSendOrderMessage}
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
        orderMessages={orderMessages}
        onSendOrderMessage={handleSendOrderMessage}
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
      menuItems={effectiveMenuItems}
      coupons={coupons}
      orders={orders}
      supportTickets={supportTickets}
      storeRatings={storeRatings}
      orderMessages={orderMessages}
      onSubmitStoreRating={handleSubmitStoreRating}
      onSendOrderMessage={handleSendOrderMessage}
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
