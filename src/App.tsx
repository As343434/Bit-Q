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
  MenuItem,
  MenuCategory,
  CartItem,
  Order,
  OrderStatus,
  SupportTicket,
  SupportCategory,
} from './types';
import { SEED_RESTAURANTS, SEED_MENU_ITEMS, IMAGES } from './seedData';
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
  const [partnerMenuItems, setPartnerMenuItems] = useState<MenuItem[]>([]);
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
            role: data.role as UserRole,
            delivery_preferences: data.delivery_preferences,
            dietary_preferences: data.dietary_preferences,
            is_online: data.is_online,
            delivery_range_km: data.delivery_range_km,
            restaurant_id: data.restaurant_id,
          });
        } else {
          // New Google User -> Will route to Create Account Onboarding
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

  // 2. Real-time Firestore Listeners (only when authenticated & profile exists)
  useEffect(() => {
    if (!authReady || !firebaseUser || !userProfile) return;

    // Listen to partner restaurants
    const unsubRestaurants = onSnapshot(
      collection(db, 'restaurants'),
      (snap) => {
        const list: Restaurant[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Restaurant, 'id'>),
        }));
        setPartnerRestaurants(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'restaurants')
    );

    // Listen to partner menu items
    const unsubMenu = onSnapshot(
      collection(db, 'menu_items'),
      (snap) => {
        const list: MenuItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MenuItem, 'id'>),
        }));
        setPartnerMenuItems(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'menu_items')
    );

    // Role-specific orders query to comply strictly with Zero-Trust Firestore rules
    const ordersQuery =
      userProfile.role === 'customer'
        ? query(
            collection(db, 'orders'),
            where('customer_uid', '==', firebaseUser.uid)
          )
        : userProfile.role === 'restaurant_partner'
        ? query(
            collection(db, 'orders'),
            where('restaurant_owner_uid', '==', firebaseUser.uid)
          )
        : query(
            collection(db, 'orders'),
            where('status', 'in', [
              'ORDER_PLACED',
              'RESTAURANT_ACCEPTED',
              'FOOD_PREPARING',
              'READY_FOR_PICKUP',
            ])
          );

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    // Support tickets for customer
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
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'support_tickets')
      );
    }

    return () => {
      unsubRestaurants();
      unsubMenu();
      unsubOrders();
      unsubTickets();
    };
  }, [authReady, firebaseUser, userProfile]);

  // Combine seeded discovery catalog with live partner restaurants & menu items
  const allRestaurants = useMemo(() => {
    const map = new Map<string, Restaurant>();
    SEED_RESTAURANTS.forEach((r) => map.set(r.id, r));
    partnerRestaurants.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  }, [partnerRestaurants]);

  const allMenuItems = useMemo(() => {
    const map = new Map<string, MenuItem>();
    SEED_MENU_ITEMS.forEach((m) => map.set(m.id, m));
    partnerMenuItems.forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [partnerMenuItems]);

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
      // 1. If Restaurant Partner, create their Restaurant storefront & starter dish
      if (formData.role === 'restaurant_partner' && restaurantId) {
        const restPayload = {
          owner_uid: uid,
          name: (
            formData.restaurantName || `${formData.name}'s Kitchen`
          ).slice(0, 120),
          owner_name: formData.name.slice(0, 100),
          contact_phone: (formData.contactPhone || '+1 (555) 234-5678').slice(
            0,
            30
          ),
          location: formData.location.slice(0, 150),
          cuisine: (formData.cuisine || 'Artisanal Kitchen').slice(0, 80),
          operating_hours: (
            formData.operatingHours || '11:00 AM – 10:30 PM'
          ).slice(0, 80),
          rating: 4.9,
          delivery_time: '25–30 min',
          distance: '1.9 km',
          price_indicator: '$$',
          offer_text: '20% off welcome privilege',
          image_url: IMAGES.pizza,
          is_open: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        await setDoc(doc(db, 'restaurants', restaurantId), restPayload);

        const starterDishId = `item-${uid.slice(0, 10)}-1`;
        await setDoc(doc(db, 'menu_items', starterDishId), {
          restaurant_id: restaurantId,
          owner_uid: uid,
          name: 'Chef Signature Hearth Flatbread',
          description:
            'Prepared fresh daily with organic cold-pressed olive oil, sea salt, and seasonal herbs.',
          price: 16.5,
          category: 'Main Course',
          image_url: IMAGES.pizza,
          is_available: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      // 2. Save User Profile in /users/{uid}
      const userDocPayload: Record<string, unknown> = {
        google_uid: uid,
        name: formData.name.slice(0, 100),
        email: (firebaseUser.email || 'verified@gmail.com').slice(0, 150),
        profile_image: (firebaseUser.photoURL || '').slice(0, 500),
        location: formData.location.slice(0, 150),
        role: formData.role,
        delivery_preferences: (formData.delivery_preferences || '').slice(
          0,
          200
        ),
        dietary_preferences: (formData.dietary_preferences || '').slice(0, 100),
        is_online: true,
        delivery_range_km: formData.deliveryRangeKm || 5,
        restaurant_id: restaurantId,
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
        role: formData.role,
        delivery_preferences: formData.delivery_preferences || '',
        dietary_preferences: formData.dietary_preferences || '',
        is_online: true,
        delivery_range_km: formData.deliveryRangeKm || 5,
        restaurant_id: restaurantId,
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
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: serverTimestamp(),
      };
      await updateDoc(doc(db, 'users', firebaseUser.uid), payload);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `users/${firebaseUser.uid}`
      );
    }
  };

  // Customer Place Order
  const handlePlaceOrder = async (orderData: {
    restaurant: Restaurant;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
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
      restaurant_id: orderData.restaurant.id,
      restaurant_owner_uid:
        orderData.restaurant.owner_uid || 'system_curated',
      restaurant_name: orderData.restaurant.name.slice(0, 120),
      restaurant_location: orderData.restaurant.location.slice(0, 150),
      delivery_partner_uid: '',
      delivery_partner_name: '',
      items_summary: summary,
      item_count: itemCount,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      discount: orderData.discount,
      taxes: orderData.taxes,
      total: orderData.total,
      status: 'ORDER_PLACED',
      estimated_arrival: orderData.restaurant.delivery_time || '25–30 min',
      distance_km: 2.4,
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

  // Restaurant Partner Storefront & Menu Handlers
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
          contact_phone: (updates.contact_phone || '+1 (555) 234-5678').slice(
            0,
            30
          ),
          location: userProfile.location.slice(0, 150),
          cuisine: (updates.cuisine || 'Artisanal Kitchen').slice(0, 80),
          operating_hours: (
            updates.operating_hours || '11:00 AM – 10:30 PM'
          ).slice(0, 80),
          rating: 4.9,
          delivery_time: '25–30 min',
          distance: '2.0 km',
          price_indicator: '$$',
          offer_text: (updates.offer_text || '20% off above $20').slice(0, 100),
          image_url: IMAGES.pizza,
          is_open: updates.is_open ?? true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `restaurants/${restId}`
      );
    }
  };

  const handleAddMenuItem = async (itemData: {
    name: string;
    description: string;
    price: number;
    category: MenuCategory;
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

  // Order Status Updates (Restaurant or Courier)
  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: OrderStatus
  ) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        estimated_arrival:
          nextStatus === 'DELIVERED' ? 'Arrived' : '15–20 min',
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleCourierAdvanceOrder = async (
    orderId: string,
    nextStatus: OrderStatus
  ) => {
    if (!firebaseUser || !userProfile) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        delivery_partner_uid: firebaseUser.uid,
        delivery_partner_name: userProfile.name.slice(0, 100),
        estimated_arrival:
          nextStatus === 'DELIVERED' ? 'Delivered' : '12 min away',
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Loading State while verifying persistent authentication
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

  // 1. Not Authenticated -> Main Login Page
  if (!firebaseUser) {
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        isLoading={profileLoading}
        error={authError}
      />
    );
  }

  // 2. Authenticated New Google User (Profile does not exist yet) -> Create Account Page
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

  // 3. Authenticated Existing User -> Role-Based Routing
  if (userProfile.role === 'restaurant_partner') {
    return (
      <RestaurantPartnerExperience
        user={userProfile}
        restaurant={myRestaurant}
        menuItems={allMenuItems}
        orders={orders}
        onCreateOrUpdateRestaurant={handleCreateOrUpdateRestaurant}
        onAddMenuItem={handleAddMenuItem}
        onUpdateMenuItem={handleUpdateMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
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
        onToggleOnline={(next) =>
          handleUpdateUserProfile({ is_online: next })
        }
        onUpdateRange={(km) =>
          handleUpdateUserProfile({ delivery_range_km: km })
        }
        onAcceptOrAdvanceDelivery={handleCourierAdvanceOrder}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CustomerExperience
      user={userProfile}
      restaurants={allRestaurants}
      menuItems={allMenuItems}
      orders={orders}
      supportTickets={supportTickets}
      onUpdateLocation={(loc) => handleUpdateUserProfile({ location: loc })}
      onUpdateProfile={handleUpdateUserProfile}
      onPlaceOrder={handlePlaceOrder}
      onSubmitSupportTicket={handleSubmitSupportTicket}
      onLogout={handleLogout}
    />
  );
}

