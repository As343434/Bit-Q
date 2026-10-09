import React, { useState, useMemo } from 'react';
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
} from '../types';
import { FOOD_CATEGORIES } from '../seedData';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  LocationSelector,
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
} from './GlassUI';
import { InteractiveRouteMap } from './InteractiveMap';

export const CustomerExperience: React.FC<{
  user: UserProfile;
  restaurants: Restaurant[];
  categories: RestaurantCategory[];
  menuItems: MenuItem[];
  coupons: Coupon[];
  orders: Order[];
  supportTickets: SupportTicket[];
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
  }) => Promise<Order | null>;
  onSubmitSupportTicket: (ticket: {
    category: SupportCategory;
    order_id: string;
    subject: string;
    message: string;
  }) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  restaurants,
  categories,
  menuItems,
  coupons,
  orders,
  supportTickets,
  onUpdateLocation,
  onUpdateProfile,
  onPlaceOrder,
  onSubmitSupportTicket,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('home');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Discovery filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMenuSection, setSelectedMenuSection] = useState<string>('All');

  // Cart & Coupon state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
    return restaurants.filter((r) => {
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
    });
  }, [restaurants, menuItems, selectedCategory, searchQuery]);

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

  const customerOrders = useMemo(
    () => orders.filter((o) => o.customer_uid === user.google_uid),
    [orders, user.google_uid]
  );

  const liveTrackedOrder = useMemo(() => {
    if (!trackingOrder) return null;
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
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16">
      <NavigationBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedRestaurant(null);
          setTrackingOrder(null);
          setActiveTab(tab);
        }}
        cartCount={totalCartItems}
        currentLocation={user.location}
        onSelectLocation={onUpdateLocation}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {/* LIVE ORDER TRACKING WITH INTERACTIVE LEAFLET ROUTE MAP */}
        {liveTrackedOrder ? (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Orders</span>
              </button>
              <span className="text-xs font-mono text-stone-500 tabular-nums">
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

                {/* Courier Details Card */}
                {liveTrackedOrder.delivery_partner_name && (
                  <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-stone-500">
                        Assigned Delivery Partner
                      </p>
                      <h4 className="text-base font-semibold text-stone-900">
                        {liveTrackedOrder.delivery_partner_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600">
                        <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                        {(
                          liveTrackedOrder.delivery_partner_rating || 5.0
                        ).toFixed(1)}
                      </span>
                      <p className="text-xs text-slate-500">
                        ETA {liveTrackedOrder.estimated_arrival}
                      </p>
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Right Column: Live Order Status Timeline & Summary */}
              <div className="lg:col-span-5 space-y-5">
                <GlassCard className="p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 font-display">
                      Your Order Status
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Real-time updates synced between restaurant, courier, and
                      your table
                    </p>
                  </div>

                  <StatusTimeline currentStatus={liveTrackedOrder.status} />

                  <div className="pt-4 border-t border-stone-200/60 space-y-2 text-xs">
                    <p className="font-semibold text-stone-800">
                      Order Items ({liveTrackedOrder.item_count})
                    </p>
                    <p className="text-stone-600 leading-relaxed">
                      {liveTrackedOrder.items_summary}
                    </p>
                    <div className="flex items-center justify-between pt-2 font-mono text-sm font-semibold text-stone-900 tabular-nums">
                      <span>Total Paid</span>
                      <span>₹{liveTrackedOrder.total.toFixed(0)}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </section>
        ) : selectedRestaurant ? (
          /* RESTAURANT DETAIL PAGE */
          <section className="space-y-8 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setSelectedRestaurant(null);
                setSelectedMenuSection('All');
              }}
              className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discovery</span>
            </button>

            <div className="relative rounded-3xl overflow-hidden aspect-[16/9] max-h-[340px] w-full bg-stone-200 shadow-sm">
              <ResilientImage
                src={selectedRestaurant.image_url}
                alt={selectedRestaurant.name}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-200 mb-2">
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
                    <h1 className="text-2xl sm:text-4xl font-bold font-display">
                      {selectedRestaurant.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-rose-200 mt-1">
                      {selectedRestaurant.is_open
                        ? selectedRestaurant.offer_text
                        : '🔴 Kitchen Closed — Currently Not Accepting New Orders'}
                    </p>
                  </div>
                  <div className="glass-elevated text-slate-900 px-4 py-2.5 rounded-2xl flex items-center gap-4 text-xs font-semibold tabular-nums">
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

            {/* Dynamic Restaurant Categories Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {restaurantMenuSections.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedMenuSection(cat)}
                  className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedMenuSection === cat
                      ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
                      : 'glass-surface text-slate-700 hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {menuItems.filter(
              (m) =>
                m.restaurant_id === selectedRestaurant.id &&
                (selectedMenuSection === 'All' ||
                  m.category === selectedMenuSection)
            ).length === 0 ? (
              <GlassCard className="p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-stone-800">
                  No dishes available in this category yet
                </p>
                <p className="text-xs text-stone-500">
                  The restaurant partner is currently updating their menu.
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems
                  .filter(
                    (m) =>
                      m.restaurant_id === selectedRestaurant.id &&
                      (selectedMenuSection === 'All' ||
                        m.category === selectedMenuSection)
                  )
                  .map((item) => (
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

            {totalCartItems > 0 && (
              <div className="sticky bottom-20 md:bottom-6 z-30 max-w-xl mx-auto">
                <div className="glass-elevated rounded-3xl p-4 border border-emerald-900/20 flex items-center justify-between gap-4 shadow-xl">
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}{' '}
                      from {cart[0].restaurant.name}
                    </p>
                    <p className="text-base font-mono font-bold text-stone-900 tabular-nums">
                      ₹{cartSubtotal.toFixed(0)}{' '}
                      <span className="text-xs font-sans font-normal text-stone-500">
                        plus taxes
                      </span>
                    </p>
                  </div>
                  <GlassButton
                    variant="primary"
                    onClick={() => {
                      setSelectedRestaurant(null);
                      setActiveTab('cart');
                    }}
                  >
                    <span>View Bag & Checkout</span>
                  </GlassButton>
                </div>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* HOME DISCOVERY VIEW */}
            {activeTab === 'home' && (
              <div className="space-y-10 animate-fadeIn">
                <section className="glass-elevated rounded-3xl p-5 sm:p-7 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
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

                  <div className="flex items-center gap-2.5 overflow-x-auto pt-1 pb-1">
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
                        <h2 className="text-xl font-bold text-stone-900 font-display">
                          Available Offers & Coupons
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Apply any active coupon code directly in your cart
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('offers')}
                        className="text-xs font-semibold text-rose-600 hover:underline"
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
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Nearby Restaurants Grid */}
                <section className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-stone-900 font-display">
                        {selectedCategory === 'All'
                          ? 'Neighborhood Kitchens'
                          : `${selectedCategory} Kitchens`}
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Showing {filteredRestaurants.length} curated partners
                        near {user.location}
                      </p>
                    </div>
                    {(searchQuery || selectedCategory !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {filteredRestaurants.length === 0 ? (
                    <GlassCard className="p-12 text-center space-y-3">
                      <Compass className="w-8 h-8 text-stone-400 mx-auto" />
                      <h3 className="text-lg font-semibold text-stone-900 font-display">
                        {restaurants.length === 0
                          ? 'No partner kitchens are live yet'
                          : 'No kitchens match your current filter'}
                      </h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        {restaurants.length === 0
                          ? 'Partner kitchens and menus appear here in real time as restaurant partners onboard and open their kitchens.'
                          : 'Try clearing your search query or switching to a different category.'}
                      </p>
                      {(searchQuery || selectedCategory !== 'All') && (
                        <GlassButton
                          variant="secondary"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
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
                          onClick={() => setSelectedRestaurant(restaurant)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* DEDICATED OFFERS / COUPONS PAGE */}
            {activeTab === 'offers' && (
              <section className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 font-display">
                    Available Offers & Coupons
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Tap APPLY on any coupon to attach it to your dining bag
                  </p>
                </div>

                {coupons.filter((c) => c.active).length === 0 ? (
                  <GlassCard className="p-12 text-center space-y-3">
                    <Tag className="w-8 h-8 text-stone-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-stone-900 font-display">
                      No active coupons right now
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
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
                              <div className="flex items-center justify-between text-xs text-stone-500">
                                <span className="font-mono font-bold text-emerald-900 text-sm">
                                  {cpn.code}
                                </span>
                                <span>
                                  {isExpired
                                    ? 'Expired'
                                    : `Valid until ${cpn.expiry_date}`}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-stone-900 font-display">
                                {cpn.discount_type === 'PERCENTAGE'
                                  ? `${cpn.discount_value}% OFF (Maximum discount ₹${cpn.maximum_discount})`
                                  : `₹${cpn.discount_value} OFF`}
                              </h3>
                              <p className="text-xs text-stone-600">
                                On orders above ₹{cpn.minimum_order_value} ·{' '}
                                {cpn.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between">
                              <span className="text-xs text-stone-500">
                                Min order ₹{cpn.minimum_order_value}
                              </span>
                              <GlassButton
                                variant={isApplied ? 'primary' : 'secondary'}
                                disabled={isExpired}
                                onClick={() => {
                                  setCouponInput(cpn.code);
                                  validateAndApplyCoupon(cpn.code);
                                  setActiveTab('cart');
                                }}
                              >
                                {isApplied
                                  ? '✓ Applied'
                                  : isExpired
                                  ? 'Expired'
                                  : 'APPLY'}
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
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 font-display">
                    Your Dining Bag
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Delivering to {user.location}
                  </p>
                </div>

                {cart.length === 0 ? (
                  <GlassCard className="p-12 text-center space-y-4">
                    <ShoppingBag className="w-9 h-9 text-stone-400 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-stone-900 font-display">
                        Your bag is currently empty
                      </h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
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
                        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                          <div>
                            <p className="text-xs text-stone-500">
                              Preparing at
                            </p>
                            <h3 className="text-base font-semibold text-stone-900">
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
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:text-rose-900"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        </div>

                        <div className="divide-y divide-stone-200/50">
                          {cart.map((entry) => (
                            <div
                              key={entry.menuItem.id}
                              className="py-3.5 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-stone-900 truncate">
                                  {entry.menuItem.name}
                                </p>
                                <p className="text-xs font-mono text-stone-500 tabular-nums mt-0.5">
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
                              <span className="text-sm font-mono font-semibold text-stone-900 tabular-nums w-16 text-right">
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
                    </div>

                    {/* Bill Breakdown & Checkout CTA */}
                    <div className="lg:col-span-5 space-y-4">
                      <GlassCard elevated className="p-6 space-y-4">
                        <h3 className="text-base font-semibold text-stone-900 font-display">
                          Bill Summary
                        </h3>

                        <div className="space-y-2.5 text-xs text-stone-600">
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">Subtotal</span>
                            <span>₹{cartSubtotal.toFixed(0)}</span>
                          </div>
                          {cartDiscount > 0 && (
                            <div className="flex justify-between font-mono tabular-nums text-emerald-800 font-semibold">
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

                        <div className="pt-3 border-t border-stone-200/70 flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-stone-900">
                            Total
                          </span>
                          <span className="text-xl font-mono font-bold text-stone-900 tabular-nums">
                            ₹{cartTotal.toFixed(0)}
                          </span>
                        </div>

                        <GlassButton
                          variant="primary"
                          fullWidth
                          disabled={isCheckingOut}
                          onClick={handleCheckout}
                        >
                          {isCheckingOut
                            ? 'Confirming with Kitchen...'
                            : 'Proceed to Checkout'}
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
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 font-display">
                    Your Orders & Live Timeline
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Track active kitchen preparation or revisit past meals
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-stone-700">
                    Active Orders ({activeOrders.length})
                  </h2>
                  {activeOrders.length === 0 ? (
                    <GlassCard className="p-8 text-center space-y-2">
                      <Clock className="w-6 h-6 text-stone-400 mx-auto" />
                      <p className="text-sm font-medium text-stone-700">
                        No active orders right now
                      </p>
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
                  <h2 className="text-sm font-semibold text-stone-700">
                    Past Orders ({pastOrders.length})
                  </h2>
                  {pastOrders.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <p className="text-xs text-stone-500">
                        Your completed order receipts will be archived here.
                      </p>
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
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
                  <h1 className="text-2xl font-bold text-stone-900 font-display">
                    Help & Concierge Support
                  </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <GlassCard className="lg:col-span-7 p-6 space-y-5">
                    <h2 className="text-base font-semibold text-stone-900 font-display">
                      Submit a Support Request
                    </h2>

                    {ticketSuccess && (
                      <div className="p-4 rounded-2xl bg-emerald-900/10 border border-emerald-900/20 flex items-center gap-2.5 text-xs font-medium text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span>
                          Your support ticket has been logged. Our concierge
                          team will respond shortly.
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-600">
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
                              className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                                ticketCategory === cat
                                  ? 'bg-emerald-900 text-white'
                                  : 'bg-white/80 text-stone-700 border border-stone-200/80 hover:bg-white'
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
                        <label className="text-xs font-medium text-stone-600">
                          Details
                        </label>
                        <textarea
                          rows={4}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Share any relevant details..."
                          maxLength={800}
                          required
                          className="w-full p-4 rounded-2xl bg-white/85 border border-stone-200/90 text-sm text-stone-900 focus:outline-none focus:border-emerald-800"
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
                    <h2 className="text-base font-semibold text-stone-900 font-display">
                      Your Support Tickets ({supportTickets.length})
                    </h2>
                    {supportTickets.length === 0 ? (
                      <GlassCard className="p-8 text-center space-y-2">
                        <LifeBuoy className="w-7 h-7 text-stone-400 mx-auto" />
                        <p className="text-sm font-medium text-stone-700">
                          No support tickets yet
                        </p>
                      </GlassCard>
                    ) : (
                      <div className="space-y-3">
                        {supportTickets.map((t) => (
                          <GlassCard key={t.id} className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-stone-500">
                              <span>{t.category}</span>
                              <span className="font-mono font-semibold text-emerald-900">
                                {t.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-stone-900">
                              {t.subject}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
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
                    <h2 className="text-lg font-semibold text-stone-900 font-display">
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
                      <label className="text-xs font-medium text-stone-600">
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
                    <GlassInput
                      label="Delivery Drop-off Instructions"
                      value={editDeliveryNote}
                      onChange={setEditDeliveryNote}
                      placeholder="e.g., Leave with building concierge"
                      maxLength={200}
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
          </>
        )}
      </main>
    </div>
  );
};
