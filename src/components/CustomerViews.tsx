import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Star,
  Clock,
  ShoppingBag,
  Trash2,
  LifeBuoy,
  CheckCircle2,
  Compass,
  Tag,
  AlertCircle,
  Check,
  MapPin,
  Smartphone,
  CreditCard,
  Landmark,
  Wallet,
  Banknote,
  ShieldCheck,
  Search,
  X,
  ChevronRight,
  MessageSquareQuote,
} from 'lucide-react';
import {
  UserProfile,
  Restaurant,
  RestaurantCategory,
  MenuItem,
  CartItem,
  Order,
  Coupon,
  SupportTicket,
  SupportCategory,
  GeoLocationData,
  StoreRating,
  OrderChatMessage,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import { FOOD_CATEGORIES } from '../seedData';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  LocationSelector,
  TimeSlotDialPicker,
  SearchBar,
  CategoryCard,
  OfferCard,
  RestaurantCard,
  FoodCard,
  QuantitySelector,
  OrderCard,
  StatusTimeline,
  ProfileCard,
  NavigationBar,
  CustomerTab,
  ResilientImage,
  OrderChatPanel,
  StoreRatingBox,
} from './GlassUI';
import { InteractiveRouteMap } from './InteractiveMap';
import { createPrototypeDemoOrder } from '../services/locationApi';

export const CustomerExperience: React.FC<{
  user: UserProfile;
  restaurants: Restaurant[];
  categories: RestaurantCategory[];
  menuItems: MenuItem[];
  coupons: Coupon[];
  orders: Order[];
  supportTickets: SupportTicket[];
  storeRatings: StoreRating[];
  orderMessages: OrderChatMessage[];
  onSubmitStoreRating: (payload: {
    orderId: string;
    restaurantId: string;
    rating: number;
    courierRating: number;
    comment: string;
  }) => Promise<void>;
  onSendOrderMessage: (orderId: string, text: string) => Promise<void>;
  onUpdateLocation: (loc: string, geo?: GeoLocationData) => Promise<void>;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onPlaceOrder: (orderPayload: {
    restaurant: Restaurant;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    couponCode?: string;
    taxes: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentDetail: string;
  }) => Promise<Order | null>;
  onSubmitSupportTicket: (ticket: {
    category: SupportCategory;
    order_id: string;
    subject: string;
    message: string;
  }) => Promise<void>;
  onUpdateCourierLocation?: (
    orderId: string,
    coords: [number, number],
    etaText?: string
  ) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  restaurants,
  categories,
  menuItems,
  coupons,
  orders,
  supportTickets,
  storeRatings,
  orderMessages,
  onSubmitStoreRating,
  onSendOrderMessage,
  onUpdateLocation,
  onUpdateProfile,
  onPlaceOrder,
  onSubmitSupportTicket,
  onUpdateCourierLocation,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('home');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Discovery filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [kitchenQuickFilter, setKitchenQuickFilter] = useState<
    'all' | 'open' | 'top_rated'
  >('all');
  const [selectedMenuSection, setSelectedMenuSection] = useState<string>('All');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Cart, Coupon & Payment state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Payment Options state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiApp, setUpiApp] = useState<string>('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user.name);
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Support form state
  const [ticketCategory, setTicketCategory] =
    useState<SupportCategory>('Order issue');
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(user.name);
  const [editDietary, setEditDietary] = useState(
    user.dietary_preferences || ''
  );
  const [editDeliveryNote, setEditDeliveryNote] = useState(
    user.delivery_preferences || ''
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Filtered restaurants (Show open restaurants first, closed kitchens dimmed)
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        if (kitchenQuickFilter === 'open' && !r.is_open) return false;
        if (kitchenQuickFilter === 'top_rated' && r.rating < 4.5) return false;

        const matchesCategory =
          selectedCategory === 'All' ||
          r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          r.name.toLowerCase().includes(selectedCategory.toLowerCase());

        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchesCategory;

        const hasMatchingDish = menuItems.some(
          (m) =>
            m.restaurant_id === r.id &&
            (m.name.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q))
        );

        const matchesSearch =
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          hasMatchingDish;

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => Number(b.is_open) - Number(a.is_open));
  }, [
    restaurants,
    menuItems,
    selectedCategory,
    searchQuery,
    kitchenQuickFilter,
  ]);

  // Dynamic Restaurant Menu Sections (from custom RestaurantCategory + item categories)
  const restaurantMenuSections = useMemo(() => {
    if (!selectedRestaurant) return ['All'];
    const customCats = categories
      .filter((c) => c.restaurant_id === selectedRestaurant.id && c.active)
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => c.name);
    const dishCats = menuItems
      .filter((m) => m.restaurant_id === selectedRestaurant.id)
      .map((m) => m.category);
    const unique = Array.from(new Set(['All', ...customCats, ...dishCats]));
    return unique;
  }, [selectedRestaurant, categories, menuItems]);

  // Cart helpers
  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const getItemQuantity = (itemId: string) => {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    if (!restaurant.is_open) return;
    const isSwitching =
      cart.length > 0 && cart[0].restaurant.id !== restaurant.id;
    setCart((prev) => {
      const existingDiffRestaurant =
        prev.length > 0 && prev[0].restaurant.id !== restaurant.id;
      const baseCart = existingDiffRestaurant ? [] : prev;

      const existingIndex = baseCart.findIndex(
        (c) => c.menuItem.id === item.id
      );
      if (existingIndex > -1) {
        const updated = [...baseCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(updated[existingIndex].quantity + 1, 20),
        };
        return updated;
      }
      return [...baseCart, { menuItem: item, restaurant, quantity: 1 }];
    });
    if (isSwitching) {
      setAppliedCoupon(null);
      setCouponError(null);
      showToast(`Started fresh bag from ${restaurant.name}`);
    } else if (getItemQuantity(item.id) === 0) {
      showToast(`Added ${item.name} to bag`);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  // Cart Subtotal & Coupon Validation Math
  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      ),
    [cart]
  );

  const validateAndApplyCoupon = (codeRaw: string) => {
    setCouponError(null);
    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      return;
    }

    const found = coupons.find((c) => c.code.toUpperCase() === code);
    if (!found || !found.active) {
      setAppliedCoupon(null);
      setCouponError('Coupon code is invalid.');
      return;
    }

    // Check restaurant match if coupon is restaurant-specific
    if (
      found.restaurant_id !== 'GLOBAL' &&
      cart.length > 0 &&
      cart[0].restaurant.id !== found.restaurant_id
    ) {
      setAppliedCoupon(null);
      setCouponError('This coupon is only valid for a specific restaurant.');
      return;
    }

    // Check expiry date
    const now = new Date();
    const exp = new Date(found.expiry_date);
    if (exp.getTime() < now.getTime()) {
      setAppliedCoupon(null);
      setCouponError('This coupon has expired.');
      return;
    }

    // Check minimum order requirement
    if (cartSubtotal > 0 && cartSubtotal < found.minimum_order_value) {
      const diff = Math.ceil(found.minimum_order_value - cartSubtotal);
      setAppliedCoupon(null);
      setCouponError(`Add ₹${diff} more to use this coupon.`);
      return;
    }

    setAppliedCoupon(found);
    setCouponInput(found.code);
  };

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal < appliedCoupon.minimum_order_value) {
      return 0;
    }
    if (appliedCoupon.discount_type === 'FLAT') {
      return Math.min(appliedCoupon.discount_value, cartSubtotal);
    }
    const raw = (cartSubtotal * appliedCoupon.discount_value) / 100;
    return Math.min(
      Math.round(raw),
      appliedCoupon.maximum_discount || Math.round(raw)
    );
  }, [appliedCoupon, cartSubtotal]);

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    return 40;
  }, [cart.length]);

  const cartTaxes = useMemo(
    () => Math.round(Math.max(0, cartSubtotal - cartDiscount) * 0.05),
    [cartSubtotal, cartDiscount]
  );

  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        Math.round(cartSubtotal - cartDiscount + cartDeliveryFee + cartTaxes)
      ),
    [cartSubtotal, cartDiscount, cartDeliveryFee, cartTaxes]
  );

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setPaymentError(null);

    let paymentStatus: PaymentStatus = 'PAID';
    let paymentDetail = `${upiApp} · Instant UPI`;

    if (paymentMethod === 'UPI') {
      const trimmedUpi = upiId.trim();
      if (trimmedUpi && !trimmedUpi.includes('@')) {
        setPaymentError('Enter a valid UPI ID (e.g. name@okaxis) or leave blank to use quick app pay.');
        return;
      }
      paymentStatus = 'PAID';
      paymentDetail = trimmedUpi ? `UPI · ${trimmedUpi}` : `${upiApp} · Instant UPI`;
    } else if (paymentMethod === 'CARD') {
      if (useSavedCard) {
        paymentDetail = 'Visa •••• 4242';
      } else {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 12 || digits.length > 19) {
          setPaymentError('Please enter a valid 12–16 digit card number.');
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
          setPaymentError('Please enter card expiry in MM/YY format.');
          return;
        }
        if (cardCvv.replace(/\D/g, '').length < 3) {
          setPaymentError('Please enter a valid 3 or 4 digit CVV.');
          return;
        }
        paymentDetail = `Card •••• ${digits.slice(-4)}`;
      }
      paymentStatus = 'PAID';
    } else if (paymentMethod === 'NET_BANKING') {
      paymentStatus = 'PAID';
      paymentDetail = `${selectedBank} NetBanking`;
    } else if (paymentMethod === 'WALLET') {
      paymentStatus = 'PAID';
      paymentDetail = selectedWallet;
    } else if (paymentMethod === 'COD') {
      paymentStatus = 'PENDING_COD';
      paymentDetail = 'Cash / QR on Delivery';
    }

    setIsCheckingOut(true);
    try {
      const created = await onPlaceOrder({
        restaurant: cart[0].restaurant,
        items: cart,
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
        discount: cartDiscount,
        couponCode: appliedCoupon?.code,
        taxes: cartTaxes,
        total: cartTotal,
        paymentMethod,
        paymentStatus,
        paymentDetail,
      });
      if (created) {
        setCart([]);
        setAppliedCoupon(null);
        setCouponInput('');
        setSelectedRestaurant(null);
        setTrackingOrder(created);
        setActiveTab('orders');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLaunchDemoMap = () => {
    const existingActive = orders.find(
      (o) =>
        o.customer_uid === user.google_uid &&
        o.status !== 'DELIVERED' &&
        o.status !== 'CANCELLED'
    );
    if (existingActive) {
      setTrackingOrder(existingActive);
      setActiveTab('orders');
      return;
    }
    const demo = createPrototypeDemoOrder({
      customerName: user.name,
      customerUid: user.google_uid,
      customerLocation: user.location,
      customerLat: user.lat,
      customerLng: user.lng,
    });
    setTrackingOrder(demo);
    setActiveTab('orders');
  };

  const customerOrders = useMemo(
    () => orders.filter((o) => o.customer_uid === user.google_uid),
    [orders, user.google_uid]
  );

  const liveTrackedOrder = useMemo(() => {
    if (!trackingOrder) return null;
    if (trackingOrder.id === 'demo-biteq-2026') return trackingOrder;
    return (
      customerOrders.find((o) => o.id === trackingOrder.id) || trackingOrder
    );
  }, [customerOrders, trackingOrder]);

  const activeOrders = useMemo(
    () =>
      customerOrders.filter(
        (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
      ),
    [customerOrders]
  );

  const pastOrders = useMemo(
    () =>
      customerOrders.filter(
        (o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
      ),
    [customerOrders]
  );

  const activeValidCoupons = useMemo(
    () =>
      coupons.filter(
        (c) => c.active && new Date(c.expiry_date).getTime() > Date.now()
      ),
    [coupons]
  );

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setIsSubmittingTicket(true);
    try {
      await onSubmitSupportTicket({
        category: ticketCategory,
        order_id: ticketOrderId.trim(),
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
      });
      setTicketSubject('');
      setTicketMessage('');
      setTicketOrderId('');
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 4000);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        name: editName.trim(),
        dietary_preferences: editDietary.trim(),
        delivery_preferences: editDeliveryNote.trim(),
      });
      showToast('Delivery & profile preferences saved');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const selectedRestaurantReviews = useMemo(() => {
    if (!selectedRestaurant) return [];
    return storeRatings
      .filter((r) => r.restaurant_id === selectedRestaurant.id)
      .slice(0, 4);
  }, [selectedRestaurant, storeRatings]);

  const filteredMenuDishes = useMemo(() => {
    if (!selectedRestaurant) return [];
    const q = menuSearchQuery.trim().toLowerCase();
    return menuItems.filter((m) => {
      if (m.restaurant_id !== selectedRestaurant.id) return false;
      if (selectedMenuSection !== 'All' && m.category !== selectedMenuSection)
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    });
  }, [menuItems, selectedRestaurant, selectedMenuSection, menuSearchQuery]);

  return (
    <div className="min-h-screen pb-24 md:pb-16 relative">
      {/* Subtle Ambient Floating Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      >
        <div className="absolute -top-36 -left-36 w-[440px] h-[440px] rounded-full bg-rose-500/8 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-36 w-[440px] h-[440px] rounded-full bg-blue-600/8 blur-3xl animate-float-delayed" />
      </div>

      <NavigationBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedRestaurant(null);
          setMenuSearchQuery('');
          setTrackingOrder(null);
          setActiveTab(tab);
        }}
        cartCount={totalCartItems}
        currentLocation={user.location}
        onSelectLocation={onUpdateLocation}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl glass-elevated border border-rose-500/25 shadow-lg flex items-center gap-2 text-xs font-semibold text-slate-900 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        <AnimatePresence mode="wait">
        {/* LIVE ORDER TRACKING WITH INTERACTIVE LEAFLET ROUTE MAP */}
        {liveTrackedOrder ? (
          <motion.section
            key={`track-${liveTrackedOrder.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Orders</span>
              </button>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Order #{liveTrackedOrder.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <InteractiveRouteMap
                  restaurantName={liveTrackedOrder.restaurant_name}
                  restaurantCoords={[
                    liveTrackedOrder.restaurant_lat || 12.9784,
                    liveTrackedOrder.restaurant_lng || 77.6408,
                  ]}
                  customerName={liveTrackedOrder.customer_name}
                  customerAddress={liveTrackedOrder.delivery_address}
                  customerCoords={[
                    liveTrackedOrder.delivery_lat || user.lat || 12.961,
                    liveTrackedOrder.delivery_lng || user.lng || 77.638,
                  ]}
                  courierName={liveTrackedOrder.delivery_partner_name}
                  courierCoords={
                    liveTrackedOrder.courier_lat && liveTrackedOrder.courier_lng
                      ? [
                          liveTrackedOrder.courier_lat,
                          liveTrackedOrder.courier_lng,
                        ]
                      : liveTrackedOrder.delivery_partner_uid
                      ? [
                          ((liveTrackedOrder.restaurant_lat || 12.9784) +
                            (liveTrackedOrder.delivery_lat || 12.961)) /
                            2,
                          ((liveTrackedOrder.restaurant_lng || 77.6408) +
                            (liveTrackedOrder.delivery_lng || 77.638)) /
                            2,
                        ]
                      : undefined
                  }
                  etaText={liveTrackedOrder.estimated_arrival}
                  distanceKm={liveTrackedOrder.distance_km}
                  statusLabel={liveTrackedOrder.status.replace(/_/g, ' ')}
                />

                {/* Courier Details Card or Real-Time Matching Indicator */}
                {liveTrackedOrder.delivery_partner_name ? (
                  <GlassCard className="p-4 flex items-center justify-between border-blue-600/20 bg-gradient-to-r from-rose-600/5 to-blue-600/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-blue-600 text-white flex items-center justify-center text-lg shadow-sm">
                        🛵
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">
                          Live Assigned Delivery Partner
                        </p>
                        <h4 className="text-base font-bold text-slate-900 font-display">
                          {liveTrackedOrder.delivery_partner_name}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 font-mono tabular-nums">
                        <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                        {(
                          liveTrackedOrder.delivery_partner_rating || 5.0
                        ).toFixed(1)}
                      </span>
                      <p className="text-xs font-semibold text-blue-700 font-mono tabular-nums">
                        ETA {liveTrackedOrder.estimated_arrival}
                      </p>
                    </div>
                  </GlassCard>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <strong className="block font-semibold">
                          Finding nearest Delivery Partner
                        </strong>
                        <span className="text-[11px] text-amber-800">
                          Auto-assigning available courier the moment restaurant accepts your order.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Order Status Timeline & Summary */}
              <div className="lg:col-span-5 space-y-5">
                <GlassCard className="p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 font-display">
                      Your Order Status
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time updates synced between restaurant, courier, and
                      your table
                    </p>
                  </div>

                  <StatusTimeline currentStatus={liveTrackedOrder.status} />

                  {liveTrackedOrder.id === 'demo-biteq-2026' && (
                    <div className="pt-2">
                      <GlassButton
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                          const rLat = liveTrackedOrder.restaurant_lat || 12.9784;
                          const rLng = liveTrackedOrder.restaurant_lng || 77.6408;
                          const cLat = liveTrackedOrder.delivery_lat || 12.9352;
                          const cLng = liveTrackedOrder.delivery_lng || 77.6245;
                          setTrackingOrder((prev) => {
                            if (!prev) return prev;
                            if (prev.status === 'GOING_TO_RESTAURANT') {
                              return {
                                ...prev,
                                status: 'ARRIVED_AT_RESTAURANT',
                                courier_lat: rLat,
                                courier_lng: rLng,
                                estimated_arrival: '14 min',
                              };
                            }
                            if (prev.status === 'ARRIVED_AT_RESTAURANT') {
                              return {
                                ...prev,
                                status: 'OUT_FOR_DELIVERY',
                                courier_lat: (rLat + cLat) / 2,
                                courier_lng: (rLng + cLng) / 2,
                                estimated_arrival: '8 min',
                              };
                            }
                            if (prev.status === 'OUT_FOR_DELIVERY') {
                              return {
                                ...prev,
                                status: 'ARRIVED_AT_CUSTOMER',
                                courier_lat: cLat - 0.001,
                                courier_lng: cLng - 0.001,
                                estimated_arrival: 'Arriving now',
                              };
                            }
                            if (prev.status === 'ARRIVED_AT_CUSTOMER') {
                              return {
                                ...prev,
                                status: 'DELIVERED',
                                courier_lat: cLat,
                                courier_lng: cLng,
                                estimated_arrival: 'Delivered',
                              };
                            }
                            return {
                              ...prev,
                              status: 'GOING_TO_RESTAURANT',
                              courier_lat: rLat - 0.008,
                              courier_lng: rLng - 0.007,
                              estimated_arrival: '16 min',
                            };
                          });
                        }}
                      >
                        {liveTrackedOrder.status === 'DELIVERED'
                          ? 'Restart Demo Route'
                          : 'Next Demo Delivery Stage'}
                      </GlassButton>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200/70 space-y-2 text-xs">
                    <p className="font-semibold text-slate-800">
                      Order Items ({liveTrackedOrder.item_count})
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {liveTrackedOrder.items_summary}
                    </p>
                    {liveTrackedOrder.payment_method && (
                      <div className="flex items-center justify-between pt-2 text-slate-600">
                        <span>
                          {liveTrackedOrder.payment_detail ||
                            liveTrackedOrder.payment_method}
                        </span>
                        <span
                          className={`font-semibold ${
                            liveTrackedOrder.payment_status === 'PAID'
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {liveTrackedOrder.payment_status === 'PAID'
                            ? 'Paid ✓'
                            : 'Pay on Delivery'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      <span>
                        {liveTrackedOrder.payment_status === 'PENDING_COD'
                          ? 'Amount Due on Delivery'
                          : 'Total Paid'}
                      </span>
                      <span>₹{liveTrackedOrder.total.toFixed(0)}</span>
                    </div>
                  </div>

                  <StoreRatingBox
                    order={liveTrackedOrder}
                    existingRating={storeRatings.find(
                      (r) => r.order_id === liveTrackedOrder.id
                    )}
                    onSubmitRating={onSubmitStoreRating}
                  />
                </GlassCard>

                <OrderChatPanel
                  orderId={liveTrackedOrder.id}
                  currentUserRole="customer"
                  messages={orderMessages}
                  onSendMessage={onSendOrderMessage}
                />
              </div>
            </div>
          </motion.section>
        ) : selectedRestaurant ? (
          /* RESTAURANT DETAIL PAGE */
          <motion.section
            key={`rest-${selectedRestaurant.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedRestaurant(null);
                setSelectedMenuSection('All');
                setMenuSearchQuery('');
              }}
              className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discovery</span>
            </button>

            <div className="relative rounded-3xl overflow-hidden aspect-[16/9] max-h-[340px] w-full bg-slate-200 shadow-sm">
              <ResilientImage
                src={selectedRestaurant.image_url}
                alt={selectedRestaurant.name}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 mb-2">
                  <span>{selectedRestaurant.cuisine}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedRestaurant.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {selectedRestaurant.operating_hours}
                  </span>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold font-display text-balance">
                      {selectedRestaurant.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-rose-200 mt-1">
                      {selectedRestaurant.is_open
                        ? selectedRestaurant.offer_text
                        : 'Kitchen Closed — Currently Not Accepting New Orders'}
                    </p>
                  </div>
                  <div className="glass-elevated text-slate-900 px-4 py-2.5 rounded-2xl flex items-center gap-3.5 text-xs font-semibold tabular-nums">
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                      {selectedRestaurant.rating.toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedRestaurant.delivery_time}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedRestaurant.distance}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Restaurant Categories + Dish Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {restaurantMenuSections.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedMenuSection(cat)}
                    className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      selectedMenuSection === cat
                        ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
                        : 'glass-surface text-slate-700 hover:bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Search dishes in menu..."
                  className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-2xl glass-surface border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    aria-label="Clear menu search"
                    onClick={() => setMenuSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredMenuDishes.length === 0 ? (
              <GlassCard className="p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  {menuSearchQuery
                    ? `No dishes matching "${menuSearchQuery}"`
                    : 'No dishes available in this category yet'}
                </p>
                <p className="text-xs text-slate-500">
                  {menuSearchQuery
                    ? 'Try clearing your search or checking another section.'
                    : 'The restaurant partner is currently updating their menu.'}
                </p>
                {(menuSearchQuery || selectedMenuSection !== 'All') && (
                  <GlassButton
                    variant="secondary"
                    onClick={() => {
                      setMenuSearchQuery('');
                      setSelectedMenuSection('All');
                    }}
                  >
                    Show All Dishes
                  </GlassButton>
                )}
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuDishes.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => handleAddToCart(item, selectedRestaurant)}
                    onRemove={() => handleRemoveFromCart(item.id)}
                  />
                ))}
              </div>
            )}

            {/* Verified Guest Reviews for this Restaurant */}
            {selectedRestaurantReviews.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-rose-600" />
                    <span>Recent Diner Reviews</span>
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {selectedRestaurantReviews.length} verified ratings
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRestaurantReviews.map((rev) => (
                    <GlassCard key={rev.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {rev.customer_name}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                          {rev.rating.toFixed(1)}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {totalCartItems > 0 && (
              <div className="sticky bottom-20 md:bottom-6 z-30 max-w-xl mx-auto">
                <div className="glass-elevated rounded-3xl p-4 border border-rose-500/20 flex items-center justify-between gap-4 shadow-xl">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}{' '}
                      from {cart[0].restaurant.name}
                    </p>
                    <p className="text-base font-mono font-bold text-slate-900 tabular-nums">
                      ₹{cartSubtotal.toFixed(0)}{' '}
                      <span className="text-xs font-sans font-normal text-slate-500">
                        plus taxes
                      </span>
                    </p>
                  </div>
                  <GlassButton
                    variant="primary"
                    onClick={() => {
                      setSelectedRestaurant(null);
                      setMenuSearchQuery('');
                      setActiveTab('cart');
                    }}
                  >
                    <span>View Bag & Checkout</span>
                  </GlassButton>
                </div>
              </div>
            )}
          </motion.section>
        ) : (
          <motion.div
            key={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* HOME DISCOVERY VIEW */}
            {activeTab === 'home' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                {/* Live Active Order Quick-Track Banner */}
                {activeOrders.length > 0 && (
                  <GlassCard
                    elevated
                    className="p-4 sm:p-5 border-blue-600/20 bg-gradient-to-r from-rose-600/5 via-white/90 to-blue-600/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-rose-600">
                          Order in Progress · {activeOrders[0].status.replace(/_/g, ' ')}
                        </p>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display truncate">
                          {activeOrders[0].restaurant_name}
                        </h3>
                        <p className="text-xs text-slate-500 tabular-nums truncate">
                          ETA {activeOrders[0].estimated_arrival} ·{' '}
                          {activeOrders[0].delivery_partner_name
                            ? `Partner: ${activeOrders[0].delivery_partner_name}`
                            : 'Assigning nearby delivery partner'}
                        </p>
                      </div>
                    </div>
                    <GlassButton
                      variant="primary"
                      onClick={() => {
                        setTrackingOrder(activeOrders[0]);
                        setActiveTab('orders');
                      }}
                    >
                      <span>Track Live</span>
                      <ChevronRight className="w-4 h-4" />
                    </GlassButton>
                  </GlassCard>
                )}

                <section className="relative overflow-hidden glass-elevated rounded-[32px] p-6 sm:p-8 space-y-6">
                  {/* Subtle Ambient Cherry-Blue Glow */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-rose-500/15 to-blue-600/15 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-wide text-rose-600">
                        Curated Local Dining
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display leading-tight text-balance">
                        Good food, closer to you
                        {user.name ? `, ${user.name.split(' ')[0]}` : ''}.
                      </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <GlassButton
                        variant="secondary"
                        onClick={handleLaunchDemoMap}
                      >
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span>Preview Live Map</span>
                      </GlassButton>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                      <LocationSelector
                        currentLocation={user.location}
                        onSelectLocation={onUpdateLocation}
                      />
                    </div>
                    <div className="md:col-span-7">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="What are you craving today? Search dishes, kitchens, cuisines..."
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-2.5 overflow-x-auto pt-1 pb-1">
                    {FOOD_CATEGORIES.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        label={cat.label}
                        subtitle={cat.subtitle}
                        active={selectedCategory === cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Available Coupons Strip */}
                {!searchQuery && activeValidCoupons.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 font-display">
                          Available Offers & Coupons
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Apply any active coupon code directly in your cart
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('offers')}
                        className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap"
                      >
                        View all coupons →
                      </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {activeValidCoupons.map((cpn) => (
                        <OfferCard
                          key={cpn.id}
                          code={cpn.code}
                          title={
                            cpn.discount_type === 'PERCENTAGE'
                              ? `${cpn.discount_value}% OFF up to ₹${cpn.maximum_discount}`
                              : `₹${cpn.discount_value} OFF`
                          }
                          subtitle={`On orders above ₹${cpn.minimum_order_value} · ${cpn.description}`}
                          activeCode={appliedCoupon?.code}
                          onApply={(code) => {
                            setCouponInput(code);
                            validateAndApplyCoupon(code);
                            showToast(`Coupon ${code} ready for checkout`);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Nearby Restaurants Grid */}
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 font-display">
                        {selectedCategory === 'All'
                          ? 'Neighborhood Kitchens'
                          : `${selectedCategory} Kitchens`}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Showing {filteredRestaurants.length} curated partners
                        near {user.location}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { id: 'all', label: 'All Kitchens' },
                          { id: 'open', label: 'Open Now' },
                          { id: 'top_rated', label: 'Top Rated 4.5+' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setKitchenQuickFilter(opt.id)}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                            kitchenQuickFilter === opt.id
                              ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
                              : 'glass-surface text-slate-700 hover:bg-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}

                      {(searchQuery ||
                        selectedCategory !== 'All' ||
                        kitchenQuickFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                            setKitchenQuickFilter('all');
                          }}
                          className="text-xs font-semibold text-rose-600 hover:underline px-2 whitespace-nowrap"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredRestaurants.length === 0 ? (
                    <GlassCard className="p-12 text-center space-y-3">
                      <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                      <h3 className="text-lg font-semibold text-slate-900 font-display">
                        {restaurants.length === 0
                          ? 'No partner kitchens are live yet'
                          : 'No kitchens match your current filter'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {restaurants.length === 0
                          ? 'Partner kitchens and menus appear here in real time as restaurant partners onboard and open their kitchens.'
                          : 'Try clearing your search query or switching to a different filter.'}
                      </p>
                      {(searchQuery ||
                        selectedCategory !== 'All' ||
                        kitchenQuickFilter !== 'all') && (
                        <GlassButton
                          variant="secondary"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                            setKitchenQuickFilter('all');
                          }}
                        >
                          Explore All Kitchens
                        </GlassButton>
                      )}
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredRestaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          onClick={() => {
                            setMenuSearchQuery('');
                            setSelectedMenuSection('All');
                            setSelectedRestaurant(restaurant);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {/* DEDICATED OFFERS / COUPONS PAGE */}
            {activeTab === 'offers' && (
              <section className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 font-display">
                    Available Offers & Coupons
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap APPLY on any coupon to attach it to your dining bag
                  </p>
                </div>

                {coupons.filter((c) => c.active).length === 0 ? (
                  <GlassCard className="p-12 text-center space-y-3">
                    <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-slate-900 font-display">
                      No active coupons right now
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Promotional offers created by restaurant partners will
                      appear here automatically.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {coupons
                      .filter((c) => c.active)
                      .map((cpn) => {
                        const isExpired =
                          new Date(cpn.expiry_date).getTime() < Date.now();
                        const isApplied =
                          appliedCoupon?.code.toUpperCase() ===
                          cpn.code.toUpperCase();
                        return (
                          <GlassCard
                            key={cpn.id}
                            className="p-6 flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-mono font-bold text-rose-600 text-sm tracking-wide">
                                  {cpn.code}
                                </span>
                                <span className="tabular-nums">
                                  {isExpired
                                    ? 'Expired'
                                    : `Valid until ${cpn.expiry_date}`}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 font-display">
                                {cpn.discount_type === 'PERCENTAGE'
                                  ? `${cpn.discount_value}% OFF (Maximum discount ₹${cpn.maximum_discount})`
                                  : `₹${cpn.discount_value} OFF`}
                              </h3>
                              <p className="text-xs text-slate-600">
                                On orders above ₹{cpn.minimum_order_value} ·{' '}
                                {cpn.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                              <span className="text-xs text-slate-500 tabular-nums">
                                Min order ₹{cpn.minimum_order_value}
                              </span>
                              <GlassButton
                                variant={isApplied ? 'primary' : 'secondary'}
                                disabled={isExpired}
                                onClick={() => {
                                  setCouponInput(cpn.code);
                                  validateAndApplyCoupon(cpn.code);
                                  if (cart.length > 0) {
                                    setActiveTab('cart');
                                  } else {
                                    showToast(
                                      `${cpn.code} saved — pick dishes to redeem`
                                    );
                                    setActiveTab('home');
                                  }
                                }}
                              >
                                {isApplied
                                  ? '✓ Applied'
                                  : isExpired
                                  ? 'Expired'
                                  : cart.length > 0
                                  ? 'Apply to Bag'
                                  : 'Apply & Browse'}
                              </GlassButton>
                            </div>
                          </GlassCard>
                        );
                      })}
                  </div>
                )}
              </section>
            )}

            {/* CART VIEW WITH FULL COUPON VALIDATION & BILL BREAKDOWN */}
            {activeTab === 'cart' && (
              <section className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">
                      Your Dining Bag
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Delivering to {user.location}
                    </p>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(cart[0].restaurant);
                        setSelectedMenuSection('All');
                        setMenuSearchQuery('');
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Add more dishes from {cart[0].restaurant.name}</span>
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <GlassCard className="p-12 text-center space-y-4">
                    <ShoppingBag className="w-9 h-9 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-900 font-display">
                        Your bag is currently empty
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Explore wood-fired pizzas, wagyu smash burgers, and
                        royal saffron biryanis from local kitchens.
                      </p>
                    </div>
                    <GlassButton
                      variant="primary"
                      onClick={() => setActiveTab('home')}
                    >
                      Discover Kitchens
                    </GlassButton>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-4">
                      <GlassCard className="p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                          <div>
                            <p className="text-xs text-slate-500">
                              Preparing at
                            </p>
                            <h3 className="text-base font-semibold text-slate-900">
                              {cart[0].restaurant.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCart([]);
                              setAppliedCoupon(null);
                              setCouponError(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        </div>

                        <div className="divide-y divide-slate-200/60">
                          {cart.map((entry) => (
                            <div
                              key={entry.menuItem.id}
                              className="py-3.5 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {entry.menuItem.name}
                                </p>
                                <p className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                                  ₹{entry.menuItem.price.toFixed(0)} each
                                </p>
                              </div>
                              <QuantitySelector
                                quantity={entry.quantity}
                                onIncrement={() =>
                                  handleAddToCart(
                                    entry.menuItem,
                                    entry.restaurant
                                  )
                                }
                                onDecrement={() =>
                                  handleRemoveFromCart(entry.menuItem.id)
                                }
                              />
                              <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums w-16 text-right">
                                ₹
                                {(
                                  entry.menuItem.price * entry.quantity
                                ).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Apply Coupon Box in Cart */}
                      <GlassCard className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-rose-600" />
                            <span>Apply Coupon</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setActiveTab('offers')}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Browse coupons
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) =>
                              setCouponInput(e.target.value.toUpperCase())
                            }
                            placeholder="Enter coupon code (e.g. SAVE20)"
                            className="flex-1 min-h-[46px] px-4 py-2 rounded-2xl bg-white border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-rose-600"
                          />
                          <GlassButton
                            variant="primary"
                            onClick={() => validateAndApplyCoupon(couponInput)}
                          >
                            APPLY
                          </GlassButton>
                        </div>

                        {!appliedCoupon && activeValidCoupons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-medium text-slate-500">
                              Quick apply:
                            </span>
                            {activeValidCoupons.slice(0, 3).map((cpn) => (
                              <button
                                key={cpn.id}
                                type="button"
                                onClick={() => validateAndApplyCoupon(cpn.code)}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] font-mono font-semibold text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap"
                              >
                                {cpn.code}
                              </button>
                            ))}
                          </div>
                        )}

                        {couponError && (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-900">
                            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>{couponError}</span>
                          </div>
                        )}

                        {appliedCoupon && !couponError && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-600/10 to-blue-600/10 border border-rose-500/20 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-rose-600" />
                                <span>Coupon applied · {appliedCoupon.code}</span>
                              </p>
                              <p className="text-xs text-blue-700">
                                {appliedCoupon.discount_type === 'PERCENTAGE'
                                  ? `${appliedCoupon.discount_value}% OFF (Saved ₹${cartDiscount})`
                                  : `Flat ₹${appliedCoupon.discount_value} OFF`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponInput('');
                                setCouponError(null);
                              }}
                              className="text-xs font-semibold text-rose-700 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </GlassCard>
                      {/* Payment Method Selector */}
                      <GlassCard className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Choose Payment Method</span>
                          </h4>
                          <span className="text-[11px] font-medium text-slate-500">
                            100% Secure Checkout
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {(
                            [
                              {
                                id: 'UPI',
                                label: 'UPI',
                                sub: 'GPay / PhonePe',
                                Icon: Smartphone,
                              },
                              {
                                id: 'CARD',
                                label: 'Card',
                                sub: 'Credit / Debit',
                                Icon: CreditCard,
                              },
                              {
                                id: 'NET_BANKING',
                                label: 'NetBanking',
                                sub: 'All Banks',
                                Icon: Landmark,
                              },
                              {
                                id: 'WALLET',
                                label: 'Wallets',
                                sub: 'Paytm / Amazon',
                                Icon: Wallet,
                              },
                              {
                                id: 'COD',
                                label: 'Cash (COD)',
                                sub: 'Pay on Arrival',
                                Icon: Banknote,
                              },
                            ] as const
                          ).map(({ id, label, sub, Icon }) => {
                            const active = paymentMethod === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setPaymentMethod(id);
                                  setPaymentError(null);
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                                  active
                                    ? 'bg-gradient-to-br from-rose-600/10 to-blue-600/10 border-rose-600 ring-2 ring-rose-500/15'
                                    : 'bg-white/80 border-slate-200 hover:bg-white'
                                }`}
                              >
                                <Icon
                                  className={`w-4 h-4 ${
                                    active ? 'text-rose-600' : 'text-slate-600'
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                                  {label}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate">
                                  {sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* UPI Details */}
                        {paymentMethod === 'UPI' && (
                          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                            <p className="text-xs font-medium text-slate-700">
                              Select UPI App or enter your UPI ID
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {['Google Pay', 'PhonePe', 'Paytm UPI', 'BHIM'].map(
                                (app) => (
                                  <button
                                    key={app}
                                    type="button"
                                    onClick={() => setUpiApp(app)}
                                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                                      upiApp === app
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {app}
                                  </button>
                                )
                              )}
                            </div>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="Optional UPI ID (e.g. name@okaxis)"
                              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-rose-600"
                            />
                          </div>
                        )}

                        {/* Card Details */}
                        {paymentMethod === 'CARD' && (
                          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                Credit / Debit Card
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setUseSavedCard(true)}
                                  className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                                    useSavedCard
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                >
                                  Visa •••• 4242
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUseSavedCard(false)}
                                  className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                                    !useSavedCard
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                >
                                  New Card
                                </button>
                              </div>
                            </div>

                            {useSavedCard ? (
                              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-semibold text-slate-900 font-mono">
                                    •••• •••• •••• 4242
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    HDFC Visa Signature · Exp 09/28
                                  </p>
                                </div>
                                <span className="text-emerald-700 font-semibold">
                                  Verified ✓
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                      .replace(/\D/g, '')
                                      .slice(0, 16);
                                    const grouped = raw.replace(
                                      /(.{4})/g,
                                      '$1 '
                                    ).trim();
                                    setCardNumber(grouped);
                                  }}
                                  placeholder="Card Number (e.g. 4532 1234 5678 9010)"
                                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-rose-600"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      const v = e.target.value
                                        .replace(/[^\d/]/g, '')
                                        .slice(0, 5);
                                      setCardExpiry(v);
                                    }}
                                    placeholder="MM/YY"
                                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-rose-600"
                                  />
                                  <input
                                    type="password"
                                    value={cardCvv}
                                    onChange={(e) =>
                                      setCardCvv(
                                        e.target.value.replace(/\D/g, '').slice(0, 4)
                                      )
                                    }
                                    placeholder="CVV"
                                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-rose-600"
                                  />
                                  <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="Cardholder Name"
                                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-rose-600"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* NetBanking Details */}
                        {paymentMethod === 'NET_BANKING' && (
                          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                            <p className="text-xs font-medium text-slate-700">
                              Select your Bank
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                'HDFC Bank',
                                'ICICI Bank',
                                'State Bank of India',
                                'Axis Bank',
                                'Kotak Mahindra',
                              ].map((bank) => (
                                <button
                                  key={bank}
                                  type="button"
                                  onClick={() => setSelectedBank(bank)}
                                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors text-left truncate ${
                                    selectedBank === bank
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {bank}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Wallets Details */}
                        {paymentMethod === 'WALLET' && (
                          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                            <p className="text-xs font-medium text-slate-700">
                              Choose Digital Wallet
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                'Amazon Pay',
                                'Paytm Wallet',
                                'PhonePe Wallet',
                                'MobiKwik',
                              ].map((wal) => (
                                <button
                                  key={wal}
                                  type="button"
                                  onClick={() => setSelectedWallet(wal)}
                                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors text-left ${
                                    selectedWallet === wal
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {wal}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cash on Delivery Details */}
                        {paymentMethod === 'COD' && (
                          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                            <p className="font-semibold">
                              Cash / Pay-on-Delivery Selected
                            </p>
                            <p className="text-[11px] text-amber-900">
                              Pay ₹{cartTotal.toFixed(0)} in cash or scan the courier&apos;s UPI QR when your order arrives at your doorstep.
                            </p>
                          </div>
                        )}

                        {paymentError && (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-900">
                            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>{paymentError}</span>
                          </div>
                        )}
                      </GlassCard>
                    </div>

                    {/* Bill Breakdown & Checkout CTA */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                      <GlassCard elevated className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-slate-900 font-display">
                            Bill Summary
                          </h3>
                          <span className="text-[11px] font-medium text-slate-500 truncate max-w-[160px]">
                            {user.location}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">Subtotal</span>
                            <span>₹{cartSubtotal.toFixed(0)}</span>
                          </div>
                          {cartDiscount > 0 && (
                            <div className="flex justify-between font-mono tabular-nums text-rose-600 font-semibold">
                              <span className="font-sans">
                                Discount ({appliedCoupon?.code})
                              </span>
                              <span>-₹{cartDiscount.toFixed(0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">Delivery Fee</span>
                            <span>₹{cartDeliveryFee.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">Taxes</span>
                            <span>₹{cartTaxes.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-slate-900">
                            {paymentMethod === 'COD' ? 'Pay on Delivery' : 'To Pay'}
                          </span>
                          <span className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                            ₹{cartTotal.toFixed(0)}
                          </span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-slate-100/80 text-xs text-slate-600 flex items-center justify-between">
                          <span>Selected Method</span>
                          <strong className="text-slate-900">
                            {paymentMethod === 'UPI'
                              ? upiId.trim() || upiApp
                              : paymentMethod === 'CARD'
                              ? useSavedCard
                                ? 'Visa •••• 4242'
                                : 'Credit / Debit Card'
                              : paymentMethod === 'NET_BANKING'
                              ? selectedBank
                              : paymentMethod === 'WALLET'
                              ? selectedWallet
                              : 'Cash on Delivery'}
                          </strong>
                        </div>

                        <GlassButton
                          variant="primary"
                          fullWidth
                          disabled={isCheckingOut}
                          onClick={handleCheckout}
                        >
                          {isCheckingOut
                            ? 'Confirming with Kitchen...'
                            : paymentMethod === 'COD'
                            ? `Place COD Order (₹${cartTotal.toFixed(0)})`
                            : `Pay ₹${cartTotal.toFixed(0)} & Place Order`}
                        </GlassButton>
                      </GlassCard>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ORDERS VIEW */}
            {activeTab === 'orders' && (
              <section className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">
                      Your Orders & Live Timeline
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track active kitchen preparation or revisit past meals
                    </p>
                  </div>
                  <GlassButton
                    variant="secondary"
                    onClick={handleLaunchDemoMap}
                  >
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Preview Live Map</span>
                  </GlassButton>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-700 tabular-nums">
                    Active Orders ({activeOrders.length})
                  </h2>
                  {activeOrders.length === 0 ? (
                    <GlassCard className="p-8 text-center space-y-3">
                      <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-sm font-medium text-slate-700">
                        No active orders right now
                      </p>
                      <GlassButton
                        variant="primary"
                        onClick={handleLaunchDemoMap}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Launch Prototype Live Map</span>
                      </GlassButton>
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onTrack={() => setTrackingOrder(order)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-700 tabular-nums">
                    Past Orders ({pastOrders.length})
                  </h2>
                  {pastOrders.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <p className="text-xs text-slate-500">
                        Your completed order receipts will be archived here.
                      </p>
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastOrders.map((order) => (
                        <div key={order.id} className="space-y-2">
                          <OrderCard order={order} />
                          <div className="glass-surface rounded-2xl px-4 pb-3">
                            <StoreRatingBox
                              order={order}
                              existingRating={storeRatings.find(
                                (r) => r.order_id === order.id
                              )}
                              onSubmitRating={onSubmitStoreRating}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* HELP DESK VIEW */}
            {activeTab === 'help' && (
              <section className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 font-display">
                    Help & Concierge Support
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Need help with an order, refund, or delivery partner? Reach us directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <GlassCard className="lg:col-span-7 p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-900 font-display">
                      Submit a Support Request
                    </h2>

                    {ticketSuccess && (
                      <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center gap-2.5 text-xs font-medium text-blue-950">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>
                          Your support ticket has been logged. Our concierge
                          team will respond shortly.
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600">
                          Topic Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(
                            [
                              'Order issue',
                              'Missing item',
                              'Late delivery',
                              'Refund/payment issue',
                              'Restaurant issue',
                              'Delivery partner issue',
                              'General support',
                            ] as SupportCategory[]
                          ).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setTicketCategory(cat)}
                              className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                                ticketCategory === cat
                                  ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
                                  : 'bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <GlassInput
                        label="Order Reference ID (Optional)"
                        value={ticketOrderId}
                        onChange={setTicketOrderId}
                        placeholder="e.g., #8F2A1C"
                        maxLength={128}
                      />

                      <GlassInput
                        label="Subject"
                        value={ticketSubject}
                        onChange={setTicketSubject}
                        placeholder="Brief summary of how we can help"
                        maxLength={120}
                        required
                      />

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600">
                          Details
                        </label>
                        <textarea
                          rows={4}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Share any relevant details..."
                          maxLength={800}
                          required
                          className="w-full p-4 rounded-2xl bg-white/85 border border-slate-200/90 text-sm text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/15"
                        />
                      </div>

                      <GlassButton
                        type="submit"
                        variant="primary"
                        disabled={isSubmittingTicket}
                      >
                        {isSubmittingTicket
                          ? 'Submitting Request...'
                          : 'Send Support Request'}
                      </GlassButton>
                    </form>
                  </GlassCard>

                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-base font-semibold text-slate-900 font-display tabular-nums">
                      Your Support Tickets ({supportTickets.length})
                    </h2>
                    {supportTickets.length === 0 ? (
                      <GlassCard className="p-8 text-center space-y-2">
                        <LifeBuoy className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-sm font-medium text-slate-700">
                          No support tickets yet
                        </p>
                      </GlassCard>
                    ) : (
                      <div className="space-y-3">
                        {supportTickets.map((t) => (
                          <GlassCard key={t.id} className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{t.category}</span>
                              <span className="font-mono font-semibold text-blue-700">
                                {t.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              {t.subject}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {t.message}
                            </p>
                          </GlassCard>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* PROFILE VIEW */}
            {activeTab === 'profile' && (
              <section className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                <ProfileCard user={user} onLogout={onLogout} />

                <GlassCard className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 font-display">
                      Personal & Delivery Preferences
                    </h2>
                  </div>

                  <form
                    onSubmit={handleSaveProfileChanges}
                    className="space-y-4"
                  >
                    <GlassInput
                      label="Display Name"
                      value={editName}
                      onChange={setEditName}
                      maxLength={100}
                      required
                    />
                    <GlassInput
                      label="Verified Google Account"
                      value={user.email}
                      readOnly
                      verifiedBadge
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">
                        Default Delivery Neighborhood
                      </label>
                      <LocationSelector
                        currentLocation={user.location}
                        onSelectLocation={onUpdateLocation}
                      />
                    </div>
                    <GlassInput
                      label="Dietary Preferences"
                      value={editDietary}
                      onChange={setEditDietary}
                      placeholder="e.g., Vegetarian, Gluten-free"
                      maxLength={100}
                    />
                    <TimeSlotDialPicker
                      label="Preferred Delivery Time Slot (Clock Dial)"
                      value={editDeliveryNote}
                      onChange={setEditDeliveryNote}
                      startLabel="From Time"
                      endLabel="To Time"
                    />
                    <div className="pt-2">
                      <GlassButton
                        type="submit"
                        variant="primary"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile
                          ? 'Saving Changes...'
                          : 'Save Preferences'}
                      </GlassButton>
                    </div>
                  </form>
                </GlassCard>
              </section>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
};
