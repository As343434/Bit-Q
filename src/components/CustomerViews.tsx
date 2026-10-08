import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  Trash2,
  Navigation,
  LifeBuoy,
  CheckCircle2,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  Restaurant,
  MenuItem,
  CartItem,
  Order,
  SupportTicket,
  SupportCategory,
  MenuCategory,
} from '../types';
import { FOOD_CATEGORIES, CURATED_DEALS } from '../seedData';
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

export const CustomerExperience: React.FC<{
  user: UserProfile;
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  supportTickets: SupportTicket[];
  onUpdateLocation: (loc: string) => Promise<void>;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onPlaceOrder: (orderPayload: {
    restaurant: Restaurant;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
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
  menuItems,
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
  const [activePromoCode, setActivePromoCode] = useState('BITQFIRST');
  const [selectedMenuSection, setSelectedMenuSection] = useState<
    MenuCategory | 'All'
  >('All');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // Filtered restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (!r.is_open) return false;
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

  // Cart helpers
  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const getItemQuantity = (itemId: string) => {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCart((prev) => {
      // If cart has items from another restaurant, replace cleanly or keep same restaurant
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

  // Cart Pricing Math
  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      ),
    [cart]
  );

  const activeDeal = CURATED_DEALS.find((d) => d.code === activePromoCode);
  const cartDiscount = useMemo(() => {
    if (!activeDeal || cartSubtotal < activeDeal.minOrder) return 0;
    return Number((cartSubtotal * activeDeal.discountRate).toFixed(2));
  }, [activeDeal, cartSubtotal]);

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (activePromoCode === 'FREEDEL' && cartSubtotal >= 15) return 0;
    return 2.99;
  }, [cart.length, activePromoCode, cartSubtotal]);

  const cartTaxes = useMemo(
    () => Number(((cartSubtotal - cartDiscount) * 0.08).toFixed(2)),
    [cartSubtotal, cartDiscount]
  );

  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        Number(
          (
            cartSubtotal -
            cartDiscount +
            cartDeliveryFee +
            cartTaxes
          ).toFixed(2)
        )
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
        taxes: cartTaxes,
        total: cartTotal,
      });
      if (created) {
        setCart([]);
        setSelectedRestaurant(null);
        setTrackingOrder(created);
        setActiveTab('orders');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Keep live tracked order synced with incoming Firestore updates
  const liveTrackedOrder = useMemo(() => {
    if (!trackingOrder) return null;
    return orders.find((o) => o.id === trackingOrder.id) || trackingOrder;
  }, [orders, trackingOrder]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
      ),
    [orders]
  );

  const pastOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
      ),
    [orders]
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
    <div className="min-h-screen bg-[#F7F6F2] pb-24 md:pb-16">
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
        {/* LIVE ORDER TRACKING DEDICATED EXPERIENCE */}
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
              {/* Clean Interactive Map Layer with Floating Glass Cards */}
              <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-stone-200/80 bg-[#EAE6DF] min-h-[420px] p-6 flex flex-col justify-between">
                {/* Architectural Street Grid SVG Map Backdrop */}
                <svg
                  className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                  viewBox="0 0 800 500"
                  fill="none"
                >
                  <rect width="800" height="500" fill="#EAE6DF" />
                  <path
                    d="M0 120 H800 M0 260 H800 M0 390 H800 M160 0 V500 M380 0 V500 M620 0 V500"
                    stroke="#DCD6CD"
                    strokeWidth="16"
                  />
                  <path
                    d="M80 0 L720 500"
                    stroke="#E2DDD5"
                    strokeWidth="24"
                  />
                  {/* Animated Route Path between Restaurant and Customer */}
                  <path
                    d="M180 340 C290 310, 450 200, 610 150"
                    stroke="#064E3B"
                    strokeWidth="5"
                    strokeDasharray="10 8"
                    strokeLinecap="round"
                  />
                  {/* Restaurant Origin Pin */}
                  <circle
                    cx="180"
                    cy="340"
                    r="12"
                    fill="#064E3B"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                  />
                  {/* Courier Midpoint Pulse */}
                  <circle
                    cx="410"
                    cy="240"
                    r="16"
                    fill="#D97706"
                    fillOpacity="0.25"
                  />
                  <circle
                    cx="410"
                    cy="240"
                    r="8"
                    fill="#D97706"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  {/* Customer Destination Pin */}
                  <circle
                    cx="610"
                    cy="150"
                    r="12"
                    fill="#18181B"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                  />
                </svg>

                {/* Top Floating Glass Card: Estimated Arrival & Status */}
                <div className="relative z-10 glass-elevated rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-stone-500">Estimated Arrival</p>
                    <p className="text-xl font-bold text-stone-900 font-display tabular-nums">
                      {liveTrackedOrder.estimated_arrival}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500">Current Stage</p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {liveTrackedOrder.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Bottom Floating Glass Card: Route Endpoints & Courier */}
                <div className="relative z-10 glass-elevated rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-stone-700">
                      <Navigation className="w-4 h-4 text-emerald-900" />
                      <span className="font-semibold">
                        {liveTrackedOrder.restaurant_name}
                      </span>
                    </div>
                    <span className="font-mono text-stone-500 tabular-nums">
                      {liveTrackedOrder.distance_km} km route
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
                    <span>
                      Delivering to:{' '}
                      <strong className="text-stone-900">
                        {liveTrackedOrder.delivery_address}
                      </strong>
                    </span>
                    <span>
                      {liveTrackedOrder.delivery_partner_name
                        ? `Courier: ${liveTrackedOrder.delivery_partner_name}`
                        : 'Assigning nearby courier'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Order Status Timeline & Summary */}
              <div className="lg:col-span-5 space-y-5">
                <GlassCard className="p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 font-display">
                      Live Kitchen & Courier Timeline
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Real-time updates synced directly from the kitchen and
                      delivery partner
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
                      <span>${liveTrackedOrder.total.toFixed(2)}</span>
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
              onClick={() => setSelectedRestaurant(null)}
              className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discovery</span>
            </button>

            {/* Hero Restaurant Banner with Measured Scrim */}
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
                    <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                      {selectedRestaurant.offer_text}
                    </p>
                  </div>
                  <div className="glass-elevated text-stone-900 px-4 py-2.5 rounded-2xl flex items-center gap-4 text-xs font-semibold tabular-nums">
                    <span className="inline-flex items-center gap-1 text-emerald-900">
                      <Star className="w-4 h-4 fill-emerald-800 text-emerald-800" />
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

            {/* Menu Category Interactive Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(
                ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'] as (
                  | MenuCategory
                  | 'All'
                )[]
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedMenuSection(cat)}
                  className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedMenuSection === cat
                      ? 'bg-emerald-900 text-white'
                      : 'glass-surface text-stone-700 hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
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

            {/* Sticky Floating Bag Preview when Cart has items */}
            {totalCartItems > 0 && (
              <div className="sticky bottom-20 md:bottom-6 z-30 max-w-xl mx-auto">
                <div className="glass-elevated rounded-3xl p-4 border border-emerald-900/20 flex items-center justify-between gap-4 shadow-xl">
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}{' '}
                      from {cart[0].restaurant.name}
                    </p>
                    <p className="text-base font-mono font-bold text-stone-900 tabular-nums">
                      ${cartSubtotal.toFixed(2)}{' '}
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
          /* STANDARD CUSTOMER TABS */
          <>
            {(activeTab === 'home' || activeTab === 'search') && (
              <div className="space-y-10 animate-fadeIn">
                {/* Top Discovery Bar: Location + Search */}
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

                  {/* Food Categories Interactive Strip */}
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

                {/* Horizontal Glass Deals Section (Shown on Home when not actively searching) */}
                {activeTab === 'home' && !searchQuery && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-stone-900 font-display">
                          Curated Table Privileges
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Select a privilege to apply automatically to your bag
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {CURATED_DEALS.map((deal) => (
                        <OfferCard
                          key={deal.id}
                          code={deal.code}
                          title={deal.title}
                          subtitle={deal.subtitle}
                          activeCode={activePromoCode}
                          onApply={setActivePromoCode}
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
                        delivering to {user.location}
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
                        No kitchens match your current filter
                      </h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Try clearing your search query or exploring all
                        neighborhood categories.
                      </p>
                      <GlassButton
                        variant="secondary"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                      >
                        Explore All Kitchens
                      </GlassButton>
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

            {/* CART VIEW */}
            {activeTab === 'cart' && (
              <section className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
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
                            onClick={() => setCart([])}
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
                                  ${entry.menuItem.price.toFixed(2)} each
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
                                $
                                {(
                                  entry.menuItem.price * entry.quantity
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
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
                            <span className="font-sans">Item Subtotal</span>
                            <span>${cartSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">
                              Glass-Layer Delivery Fee
                            </span>
                            <span>${cartDeliveryFee.toFixed(2)}</span>
                          </div>
                          {cartDiscount > 0 && (
                            <div className="flex justify-between font-mono tabular-nums text-emerald-800 font-medium">
                              <span className="font-sans">
                                Privilege Discount ({activePromoCode})
                              </span>
                              <span>-${cartDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-mono tabular-nums">
                            <span className="font-sans">
                              Taxes & Kitchen Packaging
                            </span>
                            <span>${cartTaxes.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-200/70 flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-stone-900">
                            Total Payable
                          </span>
                          <span className="text-xl font-mono font-bold text-stone-900 tabular-nums">
                            ${cartTotal.toFixed(2)}
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

                {/* Active Orders */}
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
                      <p className="text-xs text-stone-500">
                        When you place an order, its real-time kitchen and
                        courier timeline appears here.
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

                {/* Past Orders */}
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
                  <p className="text-xs text-stone-500 mt-0.5">
                    Dedicated assistance for orders, refunds, kitchens, and
                    delivery partners
                  </p>
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
                          placeholder="Share any relevant details so we can resolve this quickly..."
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
                        <p className="text-xs text-stone-500">
                          If you ever experience an issue with an order, you can
                          track its resolution here.
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
                    <button
                      type="button"
                      onClick={() => setActiveTab('help')}
                      className="text-xs font-semibold text-emerald-900 hover:underline"
                    >
                      Need Help? Open Concierge Desk →
                    </button>
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
