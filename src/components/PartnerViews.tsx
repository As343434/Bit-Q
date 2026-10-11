import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  Store,
  Bike,
  Navigation,
  Clock,
  DollarSign,
  Utensils,
  Tag,
  Star,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  FolderPlus,
} from 'lucide-react';
import {
  UserProfile,
  Restaurant,
  RestaurantCategory,
  MenuItem,
  Coupon,
  Order,
  OrderStatus,
  StoreRating,
  OrderChatMessage,
} from '../types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  StatusToggle,
  ProfileCard,
  ResilientImage,
  TimeSlotDialPicker,
  BitQLogo,
  OrderChatPanel,
} from './GlassUI';
import { InteractiveRouteMap } from './InteractiveMap';

/* ==========================================================================
   1. RESTAURANT PARTNER EXPERIENCE
   ========================================================================== */
type RestaurantTab =
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'offers'
  | 'profile';

export const RestaurantPartnerExperience: React.FC<{
  user: UserProfile;
  restaurant: Restaurant | null;
  categories: RestaurantCategory[];
  menuItems: MenuItem[];
  coupons: Coupon[];
  orders: Order[];
  storeRatings: StoreRating[];
  orderMessages: OrderChatMessage[];
  onSendOrderMessage: (orderId: string, text: string) => Promise<void>;
  onCreateOrUpdateRestaurant: (data: Partial<Restaurant>) => Promise<void>;
  onCreateCategory: (name: string) => Promise<RestaurantCategory | null>;
  onUpdateCategory: (
    catId: string,
    updates: Partial<RestaurantCategory>
  ) => Promise<void>;
  onDeleteCategory: (catId: string) => Promise<void>;
  onAddMenuItem: (item: {
    name: string;
    description: string;
    price: number;
    category: string;
    category_id?: string;
    image_url: string;
    is_available: boolean;
  }) => Promise<void>;
  onUpdateMenuItem: (
    itemId: string,
    updates: Partial<MenuItem>
  ) => Promise<void>;
  onDeleteMenuItem: (itemId: string) => Promise<void>;
  onCreateCoupon: (coupon: {
    code: string;
    description: string;
    discount_type: 'PERCENTAGE' | 'FLAT';
    discount_value: number;
    maximum_discount: number;
    minimum_order_value: number;
    expiry_date: string;
  }) => Promise<void>;
  onToggleCoupon: (couponId: string, active: boolean) => Promise<void>;
  onDeleteCoupon: (couponId: string) => Promise<void>;
  onUpdateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus
  ) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  restaurant,
  categories,
  menuItems,
  coupons,
  orders,
  storeRatings,
  orderMessages,
  onSendOrderMessage,
  onCreateOrUpdateRestaurant,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onCreateCoupon,
  onToggleCoupon,
  onDeleteCoupon,
  onUpdateOrderStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<RestaurantTab>('dashboard');

  // Menu Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('199');
  const [itemCategory, setItemCategory] = useState<string>('Main Course');
  const [itemImage, setItemImage] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [itemModalError, setItemModalError] = useState<string | null>(null);

  // Inline Create Category inside Add Dish or Category Manager
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renamingCatText, setRenamingCatText] = useState('');

  // Create Offer / Coupon State
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDesc, setCpnDesc] = useState('');
  const [cpnType, setCpnType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [cpnValue, setCpnValue] = useState('20');
  const [cpnMinOrder, setCpnMinOrder] = useState('500');
  const [cpnMaxDiscount, setCpnMaxDiscount] = useState('100');
  const [cpnExpiry, setCpnExpiry] = useState('2027-12-31');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  // Restaurant Profile State
  const [restName, setRestName] = useState(restaurant?.name || '');
  const [restCuisine, setRestCuisine] = useState(restaurant?.cuisine || '');
  const [restPhone, setRestPhone] = useState(restaurant?.contact_phone || '');
  const [restHours, setRestHours] = useState(restaurant?.operating_hours || '');
  const [restOffer, setRestOffer] = useState(restaurant?.offer_text || '');
  const [isSavingRest, setIsSavingRest] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setRestName(restaurant.name || '');
      setRestCuisine(restaurant.cuisine || '');
      setRestPhone(restaurant.contact_phone || '');
      setRestHours(restaurant.operating_hours || '');
      setRestOffer(restaurant.offer_text || '');
    }
  }, [restaurant]);

  const partnerUid = user.google_uid || user.id;
  const myRestaurantId =
    restaurant?.id ||
    user.restaurant_id ||
    `rest-${partnerUid.slice(0, 12)}`;

  const myCategories = useMemo(() => {
    const list = categories
      .filter(
        (c) =>
          c.restaurant_id === myRestaurantId ||
          c.owner_uid === partnerUid ||
          c.owner_uid === user.id
      )
      .sort((a, b) => a.display_order - b.display_order);
    return list;
  }, [categories, myRestaurantId, partnerUid, user.id]);

  // Combined selectable categories for Add Dish dropdown
  const selectableCategoryNames = useMemo(() => {
    const customNames = myCategories.filter((c) => c.active).map((c) => c.name);
    const defaults = ['Pizza', 'Burgers', 'Starters', 'Main Course', 'Drinks', 'Desserts'];
    return Array.from(new Set([...customNames, ...defaults]));
  }, [myCategories]);

  const myMenuItems = useMemo(() => {
    return menuItems.filter(
      (m) =>
        m.restaurant_id === myRestaurantId ||
        m.owner_uid === partnerUid ||
        m.owner_uid === user.id
    );
  }, [menuItems, myRestaurantId, partnerUid, user.id]);

  const myCoupons = useMemo(() => {
    return coupons.filter(
      (c) =>
        c.restaurant_id === myRestaurantId ||
        c.owner_uid === partnerUid ||
        c.owner_uid === user.id ||
        c.restaurant_id === 'GLOBAL'
    );
  }, [coupons, myRestaurantId, partnerUid, user.id]);

  const restaurantOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.restaurant_id === myRestaurantId ||
        o.restaurant_owner_uid === partnerUid ||
        o.restaurant_owner_uid === user.id
    );
  }, [orders, myRestaurantId, partnerUid, user.id]);

  const totalRevenue = useMemo(
    () =>
      restaurantOrders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((acc, o) => acc + o.total, 0),
    [restaurantOrders]
  );

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('199');
    setItemCategory(selectableCategoryNames[0] || 'Main Course');
    setItemImage('');
    setItemAvailable(true);
    setIsCreatingCategory(false);
    setItemModalError(null);
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price.toFixed(0));
    setItemCategory(item.category);
    setItemImage(item.image_url === '/favicon.svg' ? '' : item.image_url);
    setItemAvailable(item.is_available);
    setIsCreatingCategory(false);
    setItemModalError(null);
    setIsItemModalOpen(true);
  };

  const handleCreateNewCategorySubmit = async () => {
    if (!newCategoryName.trim()) return;
    setCategoryError(null);
    const created = await onCreateCategory(newCategoryName.trim());
    if (created) {
      setItemCategory(created.name);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  const handleSafeDeleteCategory = async (cat: RestaurantCategory) => {
    setCategoryError(null);
    const dependentDishes = myMenuItems.filter(
      (m) => m.category.toLowerCase() === cat.name.toLowerCase()
    );
    if (dependentDishes.length > 0) {
      setCategoryError(
        `Cannot delete "${cat.name}" while ${dependentDishes.length} dish(es) belong to it. Reassign or remove those dishes first.`
      );
      return;
    }
    await onDeleteCategory(cat.id);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemModalError(null);

    const cleanName = itemName.trim();
    if (!cleanName) {
      setItemModalError('Please enter a Dish Name.');
      return;
    }

    const numericPrice = Number(itemPrice);
    const parsedPrice =
      !Number.isNaN(numericPrice) && numericPrice >= 1 ? numericPrice : 199;
    const cleanDesc =
      itemDesc.trim() || `Freshly prepared ${cleanName} from our kitchen.`;
    const cleanImage = itemImage.trim() || '/favicon.svg';
    const cleanCategory =
      (itemCategory && itemCategory.trim()) ||
      selectableCategoryNames[0] ||
      'Main Course';

    setIsSavingItem(true);
    try {
      const matchedCat = myCategories.find((c) => c.name === cleanCategory);
      if (editingItem) {
        await onUpdateMenuItem(editingItem.id, {
          name: cleanName,
          description: cleanDesc,
          price: parsedPrice,
          category: cleanCategory,
          category_id: matchedCat?.id || 'default',
          image_url: cleanImage,
          is_available: itemAvailable,
        });
      } else {
        await onAddMenuItem({
          name: cleanName,
          description: cleanDesc,
          price: parsedPrice,
          category: cleanCategory,
          category_id: matchedCat?.id || 'default',
          image_url: cleanImage,
          is_available: itemAvailable,
        });
      }
      setIsItemModalOpen(false);
    } catch (err) {
      console.error('Failed to save dish:', err);
      setItemModalError(
        'Could not save dish to Firestore. Please check your connection or permissions and try again.'
      );
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleCreateOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;
    setIsSavingCoupon(true);
    try {
      await onCreateCoupon({
        code: cpnCode.trim().toUpperCase(),
        description:
          cpnDesc.trim() ||
          `${cpnValue}${cpnType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
        discount_type: cpnType,
        discount_value: Math.max(1, Number(cpnValue) || 20),
        minimum_order_value: Math.max(0, Number(cpnMinOrder) || 300),
        maximum_discount: Math.max(10, Number(cpnMaxDiscount) || 100),
        expiry_date: cpnExpiry || '2027-12-31',
      });
      setCpnCode('');
      setCpnDesc('');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleSaveRestaurantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRest(true);
    try {
      await onCreateOrUpdateRestaurant({
        name: restName.trim(),
        cuisine: restCuisine.trim(),
        contact_phone: restPhone.trim(),
        operating_hours: restHours.trim(),
        offer_text: restOffer.trim(),
      });
    } finally {
      setIsSavingRest(false);
    }
  };

  const isKitchenOpen = restaurant?.is_open ?? true;

  return (
    <div className="min-h-screen pb-24 md:pb-16">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 glass-surface border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <BitQLogo size="sm" />
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {(
              [
                { id: 'dashboard', label: 'Overview' },
                { id: 'orders', label: 'Orders' },
                { id: 'menu', label: 'Menu & Categories' },
                { id: 'offers', label: 'Offers / Coupons' },
                { id: 'profile', label: 'Kitchen Profile' },
              ] as { id: RestaurantTab; label: string }[]
            ).map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveTab(nav.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-slate-900 font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <span>{nav.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="restaurantTopNavUnderline"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 30,
                      }}
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-rose-600 to-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dedicated Kitchen Status Toggle (🟢 OPEN vs 🔴 CLOSED) */}
          <div className="flex items-center gap-3">
            <StatusToggle
              mode="kitchen"
              isOnline={isKitchenOpen}
              onToggle={(next) =>
                onCreateOrUpdateRestaurant({ is_open: next })
              }
              onlineLabel="🟢 OPEN"
              offlineLabel="🔴 CLOSED"
            />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-slate-200/80 grid grid-cols-5 items-center h-16 px-2">
        {(
          [
            { id: 'dashboard', label: 'Overview' },
            { id: 'orders', label: 'Orders' },
            { id: 'menu', label: 'Menu' },
            { id: 'offers', label: 'Offers' },
            { id: 'profile', label: 'Profile' },
          ] as { id: RestaurantTab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl text-xs ${
              activeTab === item.id
                ? 'text-rose-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`rest-tab-${activeTab}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
        {activeTab === 'dashboard' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Kitchen Status:{' '}
                  <strong className="text-stone-900">
                    {isKitchenOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                  </strong>{' '}
                  · {restaurant?.location || user.location}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display mt-0.5">
                  {restaurant?.name || restName}
                </h1>
              </div>
              <GlassButton variant="primary" onClick={openAddModal}>
                <Plus className="w-4 h-4" />
                <span>Add Dish to Menu</span>
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Total Kitchen Revenue</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  ₹{totalRevenue.toFixed(0)}
                </p>
                <p className="text-xs text-emerald-800">
                  Across {restaurantOrders.length} table tickets
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Active Menu Dishes</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {myMenuItems.filter((i) => i.is_available).length} /{' '}
                  {myMenuItems.length}
                </p>
                <p className="text-xs text-stone-500">
                  Across {selectableCategoryNames.length} categories
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Active Offers</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {myCoupons.filter((c) => c.active).length}
                </p>
                <p className="text-xs text-stone-500">
                  Rating {restaurant?.rating.toFixed(1) || '4.9'} ★
                </p>
              </GlassCard>
            </div>

            {/* Live Incoming Orders Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 font-display">
                  Incoming & Active Kitchen Tickets
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-emerald-900 hover:underline"
                >
                  View all orders →
                </button>
              </div>

              {restaurantOrders.length === 0 ? (
                <GlassCard className="p-10 text-center space-y-2">
                  <Store className="w-7 h-7 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    Waiting for new customer orders
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurantOrders.slice(0, 6).map((order) => (
                    <GlassCard key={order.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-stone-500 tabular-nums">
                            #{order.id.slice(-6).toUpperCase()} ·{' '}
                            {order.status.replace(/_/g, ' ')}
                          </span>
                          <h4 className="text-base font-semibold text-stone-900 mt-0.5">
                            Guest: {order.customer_name}
                          </h4>
                        </div>
                        <span className="text-base font-mono font-bold text-stone-900 tabular-nums">
                          ₹{order.total.toFixed(0)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 py-2.5 border-y border-stone-200/60">
                        {order.items_summary}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'ORDER_PLACED' && (
                          <>
                            <GlassButton
                              variant="primary"
                              onClick={() =>
                                onUpdateOrderStatus(
                                  order.id,
                                  'RESTAURANT_ACCEPTED'
                                )
                              }
                            >
                              Accept Order
                            </GlassButton>
                            <GlassButton
                              variant="danger"
                              onClick={() =>
                                onUpdateOrderStatus(order.id, 'CANCELLED')
                              }
                            >
                              Reject
                            </GlassButton>
                          </>
                        )}
                        {order.status === 'RESTAURANT_ACCEPTED' && (
                          <GlassButton
                            variant="primary"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'FOOD_PREPARING')
                            }
                          >
                            Start Preparing Food
                          </GlassButton>
                        )}
                        {order.status === 'FOOD_PREPARING' && (
                          <GlassButton
                            variant="primary"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')
                            }
                          >
                            Mark Ready for Pickup
                          </GlassButton>
                        )}
                        {order.status !== 'ORDER_PLACED' &&
                          order.status !== 'RESTAURANT_ACCEPTED' &&
                          order.status !== 'FOOD_PREPARING' && (
                            <span className="text-xs font-medium text-emerald-900">
                              Stage: {order.status.replace(/_/g, ' ')}
                              {order.delivery_partner_name
                                ? ` · Courier: ${order.delivery_partner_name}`
                                : ''}
                            </span>
                          )}
                      </div>

                      {order.status !== 'DELIVERED' &&
                        order.status !== 'CANCELLED' && (
                          <div className="pt-2">
                            <OrderChatPanel
                              orderId={order.id}
                              currentUserRole="restaurant_partner"
                              messages={orderMessages}
                              onSendMessage={onSendOrderMessage}
                            />
                          </div>
                        )}
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

            {/* Store Ratings & Guest Reviews Summary */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900 font-display">
                Store Ratings & Guest Reviews (
                {
                  storeRatings.filter(
                    (r) => r.restaurant_id === myRestaurantId
                  ).length
                }
                )
              </h2>
              {storeRatings.filter((r) => r.restaurant_id === myRestaurantId)
                .length === 0 ? (
                <GlassCard className="p-6 text-center text-xs text-stone-500">
                  Customer ratings and reviews for your restaurant will appear here automatically.
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {storeRatings
                    .filter((r) => r.restaurant_id === myRestaurantId)
                    .map((rtg) => (
                      <GlassCard key={rtg.id} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-900">
                            {rtg.customer_name}
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <Star className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                            {rtg.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          "{rtg.comment}"
                        </p>
                      </GlassCard>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MENU & CUSTOMIZABLE CATEGORIES MANAGER TAB */}
        {activeTab === 'menu' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 font-display">
                  Menu & Custom Categories Manager
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Create custom restaurant categories, manage dish image URLs
                  with live preview, and toggle dish availability
                </p>
              </div>
              <GlassButton variant="primary" onClick={openAddModal}>
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </GlassButton>
            </div>

            {/* Custom Category Management Section */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-stone-900 font-display">
                    Restaurant Food Categories
                  </h2>
                  <p className="text-xs text-stone-500">
                    Create, rename, reorder, enable/disable, or safely delete
                    custom categories
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category (e.g. Chef Specials)"
                    className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:border-emerald-800"
                  />
                  <GlassButton
                    variant="secondary"
                    onClick={handleCreateNewCategorySubmit}
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Category</span>
                  </GlassButton>
                </div>
              </div>

              {categoryError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{categoryError}</span>
                </div>
              )}

              {myCategories.length === 0 ? (
                <p className="text-xs text-stone-500">
                  Default categories active ({selectableCategoryNames.join(' · ')}
                  ). Create a custom category above to customize your menu
                  sections.
                </p>
              ) : (
                <div className="divide-y divide-stone-200/60">
                  {myCategories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-stone-400 w-5">
                          #{idx + 1}
                        </span>
                        {renamingCatId === cat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={renamingCatText}
                              onChange={(e) =>
                                setRenamingCatText(e.target.value)
                              }
                              className="px-3 py-1 rounded-xl border border-stone-300 text-xs"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (renamingCatText.trim()) {
                                  await onUpdateCategory(cat.id, {
                                    name: renamingCatText.trim(),
                                  });
                                }
                                setRenamingCatId(null);
                              }}
                              className="text-xs font-semibold text-emerald-900"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-stone-900">
                            {cat.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCategory(cat.id, { active: !cat.active })
                          }
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                            cat.active
                              ? 'bg-emerald-900/10 text-emerald-900'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {cat.active ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            onUpdateCategory(cat.id, {
                              display_order: Math.max(1, cat.display_order - 1),
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCategory(cat.id, {
                              display_order: cat.display_order + 1,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCatId(cat.id);
                            setRenamingCatText(cat.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSafeDeleteCategory(cat)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Menu Dishes List */}
            {myMenuItems.length === 0 ? (
              <GlassCard className="p-10 text-center space-y-3">
                <Utensils className="w-7 h-7 text-stone-400 mx-auto" />
                <p className="text-sm font-semibold text-stone-800">
                  Your kitchen menu is empty
                </p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Add your signature dishes with prices, categories, and photos
                  so customers can start ordering.
                </p>
                <GlassButton variant="primary" onClick={openAddModal}>
                  <Plus className="w-4 h-4" />
                  <span>Add First Dish</span>
                </GlassButton>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myMenuItems.map((item) => (
                  <GlassCard
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                        <ResilientImage
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-stone-500">
                          {item.category} ·{' '}
                          <strong className="font-mono text-stone-900 tabular-nums">
                            ₹{item.price.toFixed(0)}
                          </strong>
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900 truncate mt-0.5">
                          {item.name}
                        </h4>
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMenuItem(item.id, {
                                is_available: !item.is_available,
                              })
                            }
                            className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                              item.is_available
                                ? 'bg-emerald-900/10 text-emerald-900'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {item.is_available
                              ? 'Available ✓'
                              : 'Marked Sold Out'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        aria-label="Edit item"
                        className="min-w-[40px] min-h-[40px] rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMenuItem(item.id)}
                        aria-label="Delete item"
                        className="min-w-[40px] min-h-[40px] rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* OFFERS / COUPON MANAGEMENT FOR RESTAURANTS */}
        {activeTab === 'offers' && (
          <section className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 font-display">
                Offers & Coupon Management
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Create promotional coupon codes, set minimum order thresholds,
                and track customer redemptions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Create Offer Form */}
              <GlassCard className="lg:col-span-5 p-6 space-y-4">
                <h2 className="text-base font-semibold text-stone-900 font-display">
                  Create Offer
                </h2>
                <form onSubmit={handleCreateOfferSubmit} className="space-y-4">
                  <GlassInput
                    label="Coupon Code"
                    value={cpnCode}
                    onChange={(v) => setCpnCode(v.toUpperCase())}
                    placeholder="SAVE20"
                    maxLength={25}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <GlassInput
                      label="Discount Value"
                      type="number"
                      value={cpnValue}
                      onChange={setCpnValue}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-600">
                        Discount Type
                      </label>
                      <select
                        value={cpnType}
                        onChange={(e) =>
                          setCpnType(
                            e.target.value as 'PERCENTAGE' | 'FLAT'
                          )
                        }
                        className="w-full min-h-[48px] px-3 py-2 rounded-2xl bg-white/85 border border-stone-200 text-sm"
                      >
                        <option value="PERCENTAGE">% Percentage</option>
                        <option value="FLAT">₹ Flat Amount</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <GlassInput
                      label="Minimum Order (₹)"
                      type="number"
                      value={cpnMinOrder}
                      onChange={setCpnMinOrder}
                      required
                    />
                    <GlassInput
                      label="Maximum Discount (₹)"
                      type="number"
                      value={cpnMaxDiscount}
                      onChange={setCpnMaxDiscount}
                      required
                    />
                  </div>

                  <GlassInput
                    label="Valid Until (Date)"
                    type="date"
                    value={cpnExpiry}
                    onChange={setCpnExpiry}
                    required
                  />

                  <GlassInput
                    label="Short Offer Description"
                    value={cpnDesc}
                    onChange={setCpnDesc}
                    placeholder="e.g., Valid on wood-fired pizzas & starters"
                    maxLength={140}
                  />

                  <GlassButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSavingCoupon}
                  >
                    {isSavingCoupon ? 'Creating Offer...' : 'Create Offer'}
                  </GlassButton>
                </form>
              </GlassCard>

              {/* Active Coupons List */}
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-base font-semibold text-stone-900 font-display">
                  Active & Scheduled Coupons ({myCoupons.length})
                </h2>
                {myCoupons.length === 0 ? (
                  <GlassCard className="p-10 text-center space-y-2">
                    <Tag className="w-7 h-7 text-stone-400 mx-auto" />
                    <p className="text-sm font-semibold text-stone-800">
                      No promotional coupons created yet
                    </p>
                    <p className="text-xs text-stone-500">
                      Create your first coupon code using the form to offer
                      discounts to customers.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="space-y-3">
                    {myCoupons.map((cpn) => (
                      <GlassCard
                        key={cpn.id}
                        className="p-5 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-900 text-sm">
                              {cpn.code}
                            </span>
                            <span className="text-xs text-stone-500">
                              · Used {cpn.used_count} times
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-stone-900">
                            {cpn.discount_type === 'PERCENTAGE'
                              ? `${cpn.discount_value}% OFF (Max ₹${cpn.maximum_discount})`
                              : `Flat ₹${cpn.discount_value} OFF`}{' '}
                            on orders above ₹{cpn.minimum_order_value}
                          </p>
                          <p className="text-xs text-stone-500">
                            Valid until {cpn.expiry_date} · {cpn.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleCoupon(cpn.id, !cpn.active)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold ${
                              cpn.active
                                ? 'bg-emerald-900 text-white'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {cpn.active ? 'Active' : 'Paused'}
                          </button>
                          {cpn.owner_uid === user.google_uid && (
                            <button
                              type="button"
                              onClick={() => onDeleteCoupon(cpn.id)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <section className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-stone-900 font-display">
              All Kitchen Orders ({restaurantOrders.length})
            </h1>
            {restaurantOrders.length === 0 ? (
              <GlassCard className="p-10 text-center space-y-2">
                <Store className="w-7 h-7 text-stone-400 mx-auto" />
                <p className="text-sm font-semibold text-stone-800">
                  No kitchen orders yet
                </p>
                <p className="text-xs text-stone-500">
                  Customer orders placed for your restaurant will appear here in
                  real time.
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurantOrders.map((order) => (
                  <GlassCard key={order.id} className="p-5 space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs font-mono text-stone-500">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <h4 className="text-base font-semibold text-stone-900">
                          {order.customer_name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          {order.delivery_address}
                        </p>
                      </div>
                      <span className="text-base font-mono font-bold text-stone-900 tabular-nums">
                        ₹{order.total.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 py-2 border-y border-stone-200/60">
                      {order.items_summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-900">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <div className="flex gap-2">
                        {order.status === 'ORDER_PLACED' && (
                          <GlassButton
                            variant="primary"
                            onClick={() =>
                              onUpdateOrderStatus(
                                order.id,
                                'RESTAURANT_ACCEPTED'
                              )
                            }
                          >
                            Accept
                          </GlassButton>
                        )}
                        {order.status === 'RESTAURANT_ACCEPTED' && (
                          <GlassButton
                            variant="primary"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'FOOD_PREPARING')
                            }
                          >
                            Start Prep
                          </GlassButton>
                        )}
                        {order.status === 'FOOD_PREPARING' && (
                          <GlassButton
                            variant="primary"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')
                            }
                          >
                            Ready for Pickup
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <section className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <ProfileCard user={user} onLogout={onLogout} />

            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 font-display">
                  Storefront & Kitchen Availability
                </h2>
                <StatusToggle
                  mode="kitchen"
                  isOnline={isKitchenOpen}
                  onToggle={(next) =>
                    onCreateOrUpdateRestaurant({ is_open: next })
                  }
                  onlineLabel="🟢 Kitchen OPEN"
                  offlineLabel="🔴 Kitchen CLOSED"
                />
              </div>
              <form
                onSubmit={handleSaveRestaurantSettings}
                className="space-y-4"
              >
                <GlassInput
                  label="Restaurant Brand Name"
                  value={restName}
                  onChange={setRestName}
                  maxLength={120}
                  required
                />
                <GlassInput
                  label="Cuisine & Culinary Tags"
                  value={restCuisine}
                  onChange={setRestCuisine}
                  maxLength={80}
                  required
                />
                <GlassInput
                  label="Featured Storefront Offer Banner"
                  value={restOffer}
                  onChange={setRestOffer}
                  maxLength={100}
                  required
                />
                <GlassInput
                  label="Business Phone"
                  value={restPhone}
                  onChange={setRestPhone}
                  maxLength={30}
                  required
                />
                <TimeSlotDialPicker
                  label="Operating Time Slot (Clock Dial)"
                  value={restHours}
                  onChange={setRestHours}
                  startLabel="Opens At"
                  endLabel="Closes At"
                />
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={isSavingRest}
                >
                  {isSavingRest
                    ? 'Saving Storefront...'
                    : 'Save Storefront Settings'}
                </GlassButton>
              </form>
            </GlassCard>
          </section>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Add / Edit Dish Modal with Image URL Input, Live Preview & Custom Categories */}
      <GlassModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Dish' : 'Add Dish to Menu'}
      >
        <form onSubmit={handleSaveMenuItem} className="space-y-4">
          <GlassInput
            label="Dish Name"
            value={itemName}
            onChange={setItemName}
            placeholder="e.g., San Marzano Burrata Pizza"
            maxLength={120}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Price (₹)"
              type="number"
              value={itemPrice}
              onChange={setItemPrice}
              required
            />

            {/* Dynamic Category Selector + Inline [+ Create New Category] */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-600">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-xs font-semibold text-emerald-900 hover:underline"
                >
                  + Create New Category
                </button>
              </div>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-white/85 border border-stone-200/90 text-sm text-stone-900 focus:outline-none focus:border-emerald-800"
              >
                {selectableCategoryNames.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCreatingCategory && (
            <div className="p-3.5 rounded-2xl bg-emerald-900/5 border border-emerald-900/20 flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (e.g. Chef Specials)"
                className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs"
              />
              <GlassButton
                type="button"
                variant="primary"
                onClick={handleCreateNewCategorySubmit}
              >
                Create Category
              </GlassButton>
            </div>
          )}

          {/* Dish Image URL Input + Live Image Preview */}
          <div className="space-y-2">
            <GlassInput
              label="Dish Image URL (Optional)"
              value={itemImage}
              onChange={setItemImage}
              placeholder="https://..."
              helperText="Paste a direct image link for your dish or leave blank for the BiteQ emblem"
            />
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-100/80 border border-slate-200/70">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                <ResilientImage
                  src={itemImage}
                  alt={itemName || 'Dish Preview'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold text-slate-700">
                  Live Dish Card Preview
                </p>
                <p className="text-[11px] text-slate-500">
                  If no image URL is provided, BiteQ displays a clean branded culinary card.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Short Culinary Description (Optional)
            </label>
            <textarea
              rows={2}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Describe key ingredients and preparation style..."
              maxLength={300}
              className="w-full p-3.5 rounded-2xl bg-white/85 border border-slate-200/90 text-sm text-slate-900 focus:outline-none focus:border-rose-600"
            />
          </div>

          {itemModalError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{itemModalError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-stone-700">
              In-Stock & Available Immediately
            </span>
            <button
              type="button"
              onClick={() => setItemAvailable(!itemAvailable)}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold ${
                itemAvailable
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {itemAvailable ? 'Available ✓' : 'Unavailable'}
            </button>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <GlassButton
              variant="subtle"
              onClick={() => setIsItemModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSavingItem}
            >
              {isSavingItem ? 'Saving...' : 'Save Dish'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};

/* ==========================================================================
   2. DELIVERY PARTNER / COURIER EXPERIENCE
   ========================================================================== */
type DeliveryTab = 'dashboard' | 'active' | 'earnings' | 'profile';

export const DeliveryPartnerExperience: React.FC<{
  user: UserProfile;
  orders: Order[];
  orderMessages: OrderChatMessage[];
  onSendOrderMessage: (orderId: string, text: string) => Promise<void>;
  onToggleOnline: (isOnline: boolean) => Promise<void>;
  onUpdateRange: (rangeKm: number) => Promise<void>;
  onAdvanceDeliveryState: (
    order: Order,
    nextStatus: OrderStatus,
    courierCoords?: [number, number]
  ) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  orders,
  orderMessages,
  onSendOrderMessage,
  onToggleOnline,
  onUpdateRange,
  onAdvanceDeliveryState,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('dashboard');
  const isOnline = user.is_online ?? true;
  const rangeKm = user.delivery_range_km ?? 5;

  // Single Active Delivery Enforcement (Courier cannot accept incompatible orders simultaneously)
  const activeDelivery = useMemo(
    () =>
      orders.find(
        (o) =>
          o.delivery_partner_uid === user.google_uid &&
          o.status !== 'DELIVERED' &&
          o.status !== 'CANCELLED'
      ) || null,
    [orders, user.google_uid]
  );

  // Available nearby dispatches when ONLINE
  const availableRequests = useMemo(() => {
    if (!isOnline) return [];
    return orders.filter(
      (o) =>
        (o.status === 'READY_FOR_PICKUP' ||
          o.status === 'FOOD_PREPARING' ||
          o.status === 'RESTAURANT_ACCEPTED' ||
          o.status === 'ORDER_PLACED') &&
        !o.delivery_partner_uid &&
        o.distance_km <= rangeKm
    );
  }, [orders, isOnline, rangeKm]);

  const completedDeliveries = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.delivery_partner_uid === user.google_uid &&
          o.status === 'DELIVERED'
      ),
    [orders, user.google_uid]
  );

  // Courier Statistics & Performance Metrics (Strictly real Firestore user profile & completed order data)
  const stats = useMemo(() => {
    const deliveredCount = Math.max(
      user.orders_delivered ?? 0,
      completedDeliveries.length
    );
    const totalRides = Math.max(
      user.total_rides ?? 0,
      completedDeliveries.length
    );
    const points = Math.max(
      user.points ?? 0,
      completedDeliveries.length * 25
    );
    const rating = user.courier_rating ?? 5.0;
    const acceptanceRate = user.acceptance_rate ?? 100;
    const cancelledCount = user.cancelled_deliveries ?? 0;
    const streakDays = user.current_streak_days ?? 0;
    const sessionEarnings = completedDeliveries.reduce(
      (sum, o) => sum + Math.max(40, o.delivery_fee),
      0
    );
    const totalEarnings = Math.max(user.total_earnings ?? 0, sessionEarnings);
    return {
      totalRides,
      deliveredCount,
      points,
      rating,
      acceptanceRate,
      cancelledCount,
      streakDays,
      totalEarnings,
    };
  }, [user, completedDeliveries]);

  // Step-by-step Courier Status Action Button Helper
  const renderCourierNextActionButton = (order: Order) => {
    switch (order.status) {
      case 'COURIER_ACCEPTED':
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'GOING_TO_RESTAURANT', [
                (order.restaurant_lat || 12.9784) - 0.008,
                (order.restaurant_lng || 77.6408) - 0.008,
              ])
            }
          >
            Start Pickup (Going to Restaurant)
          </GlassButton>
        );
      case 'GOING_TO_RESTAURANT':
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'ARRIVED_AT_RESTAURANT', [
                order.restaurant_lat || 12.9784,
                order.restaurant_lng || 77.6408,
              ])
            }
          >
            Arrived at Restaurant
          </GlassButton>
        );
      case 'ARRIVED_AT_RESTAURANT':
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'OUT_FOR_DELIVERY', [
                ((order.restaurant_lat || 12.9784) +
                  (order.delivery_lat || 12.961)) /
                  2,
                ((order.restaurant_lng || 77.6408) +
                  (order.delivery_lng || 77.638)) /
                  2,
              ])
            }
          >
            Order Picked Up (Start Customer Route)
          </GlassButton>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'ARRIVED_AT_CUSTOMER', [
                order.delivery_lat || 12.961,
                order.delivery_lng || 77.638,
              ])
            }
          >
            Arrived at Customer
          </GlassButton>
        );
      case 'ARRIVED_AT_CUSTOMER':
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'DELIVERED', [
                order.delivery_lat || 12.961,
                order.delivery_lng || 77.638,
              ])
            }
          >
            <Check className="w-4 h-4" />
            <span>Mark Delivered</span>
          </GlassButton>
        );
      default:
        return (
          <GlassButton
            variant="primary"
            fullWidth
            onClick={() =>
              onAdvanceDeliveryState(order, 'COURIER_ACCEPTED', [
                (order.restaurant_lat || 12.9784) - 0.01,
                (order.restaurant_lng || 77.6408) - 0.01,
              ])
            }
          >
            Start Pickup
          </GlassButton>
        );
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 glass-surface border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <BitQLogo size="sm" />
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {(
              [
                { id: 'dashboard', label: 'Dispatch Radar' },
                { id: 'active', label: 'Active Route' },
                { id: 'earnings', label: 'Earnings' },
                { id: 'profile', label: 'Courier Profile' },
              ] as { id: DeliveryTab; label: string }[]
            ).map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveTab(nav.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-slate-900 font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <span>{nav.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="courierTopNavUnderline"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 30,
                      }}
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-rose-600 to-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Delivery Status ONLINE / OFFLINE Control */}
          <div className="flex items-center gap-3">
            <StatusToggle
              mode="courier"
              isOnline={isOnline}
              onToggle={onToggleOnline}
              onlineLabel="● ONLINE [ ON ]"
              offlineLabel="● OFFLINE [ OFF ]"
            />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-slate-200/80 grid grid-cols-4 items-center h-16 px-2">
        {(
          [
            { id: 'dashboard', label: 'Radar' },
            { id: 'active', label: 'Active Route' },
            { id: 'earnings', label: 'Earnings' },
            { id: 'profile', label: 'Profile' },
          ] as { id: DeliveryTab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl text-xs ${
              activeTab === item.id
                ? 'text-rose-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`courier-tab-${activeTab}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
        {/* DISPATCH RADAR TAB */}
        {activeTab === 'dashboard' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="glass-elevated rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Delivery Status</span>
                  <span aria-hidden="true">·</span>
                  <span>{user.location}</span>
                </div>
                <h1 className="text-2xl font-bold text-stone-900 font-display">
                  {isOnline ? '● ONLINE' : '● OFFLINE'}
                </h1>
                <p className="text-xs text-stone-500">
                  {isOnline
                    ? `Scanning kitchens within ${rangeKm} km radius`
                    : 'New requests paused. Any active delivery remains live.'}
                </p>
              </div>

              <div className="md:col-span-7 glass-surface rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">
                    Active Delivery Service Range
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-900 tabular-nums">
                    [ {rangeKm} km ]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[3, 5, 8, 12, 15].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => onUpdateRange(km)}
                      className={`flex-1 min-h-[40px] rounded-xl text-xs font-mono font-semibold transition-all tabular-nums ${
                        rangeKm === km
                          ? 'bg-gradient-to-r from-rose-600 to-blue-600 text-white shadow-sm'
                          : 'bg-white/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ACCEPTED ORDERS / ACTIVE DELIVERY SECTION */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900 font-display">
                ACTIVE DELIVERY
              </h2>

              {!activeDelivery ? (
                <GlassCard className="p-8 text-center space-y-3">
                  <Bike className="w-7 h-7 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    No active delivery
                  </p>
                  {!isOnline && (
                    <GlassButton
                      variant="primary"
                      onClick={() => onToggleOnline(true)}
                    >
                      Go Online
                    </GlassButton>
                  )}
                </GlassCard>
              ) : (
                <GlassCard
                  elevated
                  className="p-6 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-semibold text-emerald-900">
                      Order #{activeDelivery.id.slice(-5).toUpperCase()} ·{' '}
                      {activeDelivery.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-xl font-bold text-stone-900 font-display">
                      {activeDelivery.restaurant_name}
                    </h3>
                    <p className="text-xs text-stone-600">
                      Pickup: 2.1 km away ({activeDelivery.restaurant_location})
                      · Customer: {activeDelivery.distance_km} km away (
                      {activeDelivery.delivery_address})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <GlassButton
                      variant="primary"
                      onClick={() => setActiveTab('active')}
                    >
                      View Route
                    </GlassButton>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Nearby Delivery Requests */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900 font-display">
                Nearby Delivery Opportunities ({availableRequests.length})
              </h2>

              {!isOnline ? (
                <GlassCard className="p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-stone-800">
                    You are currently Offline
                  </p>
                  <GlassButton
                    variant="primary"
                    onClick={() => onToggleOnline(true)}
                  >
                    Go Online
                  </GlassButton>
                </GlassCard>
              ) : availableRequests.length === 0 ? (
                <GlassCard className="p-10 text-center space-y-2">
                  <Clock className="w-7 h-7 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    No unassigned dispatches within {rangeKm} km
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRequests.map((req) => (
                    <GlassCard key={req.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-emerald-900 font-semibold tabular-nums">
                            {req.distance_km} km away · Est. Payout ₹
                            {(req.delivery_fee + 35).toFixed(0)}
                          </span>
                          <h4 className="text-base font-semibold text-stone-900 mt-1">
                            {req.restaurant_name}
                          </h4>
                          <p className="text-xs text-stone-500">
                            Deliver to: {req.delivery_address}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-stone-500">
                          #{req.id.slice(-5).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-200/60">
                        <span className="text-xs text-stone-500">
                          {req.item_count} items · {req.status.replace(/_/g, ' ')}
                        </span>
                        <GlassButton
                          variant="primary"
                          disabled={Boolean(activeDelivery)}
                          onClick={async () => {
                            await onAdvanceDeliveryState(
                              req,
                              'COURIER_ACCEPTED',
                              [
                                (req.restaurant_lat || 12.9784) - 0.01,
                                (req.restaurant_lng || 77.6408) - 0.01,
                              ]
                            );
                            setActiveTab('active');
                          }}
                        >
                          {activeDelivery
                            ? 'Complete Current Order First'
                            : 'Accept Delivery'}
                        </GlassButton>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* DEDICATED ACTIVE DELIVERY ROUTE SCREEN WITH REAL INTERACTIVE LEAFLET MAP */}
        {activeTab === 'active' && (
          <section className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 font-display">
                ACTIVE DELIVERY ROUTE
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Live route navigation, pickup & drop-off waypoints, and status
                progression
              </p>
            </div>

            {!activeDelivery ? (
              <GlassCard className="p-12 text-center space-y-4">
                <Navigation className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="text-lg font-semibold text-stone-900 font-display">
                  No active delivery right now
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Accept a delivery opportunity from the Dispatch Radar to
                  launch turn-by-turn route tracking.
                </p>
                <GlassButton
                  variant="primary"
                  onClick={() => setActiveTab('dashboard')}
                >
                  Open Dispatch Radar
                </GlassButton>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <InteractiveRouteMap
                    restaurantName={activeDelivery.restaurant_name}
                    restaurantCoords={[
                      activeDelivery.restaurant_lat || 12.9784,
                      activeDelivery.restaurant_lng || 77.6408,
                    ]}
                    customerName={activeDelivery.customer_name}
                    customerAddress={activeDelivery.delivery_address}
                    customerCoords={[
                      activeDelivery.delivery_lat || 12.961,
                      activeDelivery.delivery_lng || 77.638,
                    ]}
                    courierName={user.name}
                    courierCoords={[
                      activeDelivery.courier_lat ||
                        (activeDelivery.restaurant_lat || 12.9784) - 0.005,
                      activeDelivery.courier_lng ||
                        (activeDelivery.restaurant_lng || 77.6408) - 0.005,
                    ]}
                    etaText={activeDelivery.estimated_arrival}
                    distanceKm={activeDelivery.distance_km}
                    statusLabel={`ACTIVE DELIVERY • ${activeDelivery.status.replace(
                      /_/g,
                      ' '
                    )}`}
                    showNavigateButton
                  />
                </div>

                <div className="lg:col-span-5 space-y-5">
                  <GlassCard elevated className="p-6 space-y-5">
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-semibold text-emerald-900">
                        Order #{activeDelivery.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="space-y-1">
                        <p className="text-xs text-stone-500">Restaurant</p>
                        <h3 className="text-base font-bold text-stone-900">
                          {activeDelivery.restaurant_name}
                        </h3>
                        <p className="text-xs text-stone-600">
                          Pickup: {activeDelivery.restaurant_location}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 space-y-1">
                        <p className="text-xs text-stone-500">Customer</p>
                        <h4 className="text-base font-bold text-stone-900">
                          {activeDelivery.customer_name}
                        </h4>
                        <p className="text-xs text-stone-600">
                          Drop-off: {activeDelivery.delivery_address}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs font-mono">
                        <span>ETA: {activeDelivery.estimated_arrival}</span>
                        <span>Distance: {activeDelivery.distance_km} km</span>
                      </div>
                    </div>

                    {/* Step-by-Step Delivery Status Timeline */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/60">
                      {(
                        [
                          { id: 'COURIER_ACCEPTED', label: 'ACCEPTED' },
                          {
                            id: 'GOING_TO_RESTAURANT',
                            label: 'GOING TO RESTAURANT',
                          },
                          {
                            id: 'ARRIVED_AT_RESTAURANT',
                            label: 'ARRIVED AT RESTAURANT',
                          },
                          { id: 'OUT_FOR_DELIVERY', label: 'ORDER PICKED UP & GOING TO CUSTOMER' },
                          {
                            id: 'ARRIVED_AT_CUSTOMER',
                            label: 'ARRIVED AT CUSTOMER',
                          },
                          { id: 'DELIVERED', label: 'DELIVERED' },
                        ] as { id: OrderStatus; label: string }[]
                      ).map((st) => {
                        const isCurrent = activeDelivery.status === st.id;
                        return (
                          <div
                            key={st.id}
                            className={`flex items-center gap-2.5 text-xs py-1 ${
                              isCurrent
                                ? 'font-bold text-emerald-950'
                                : 'text-stone-500'
                            }`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isCurrent
                                  ? 'bg-emerald-800 ring-4 ring-emerald-800/15'
                                  : 'bg-stone-300'
                              }`}
                            />
                            <span>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dynamic Action CTA */}
                    <div className="pt-2">
                      {renderCourierNextActionButton(activeDelivery)}
                    </div>
                  </GlassCard>

                  <OrderChatPanel
                    orderId={activeDelivery.id}
                    currentUserRole="delivery_partner"
                    messages={orderMessages}
                    onSendMessage={onSendOrderMessage}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* EARNINGS TAB */}
        {activeTab === 'earnings' && (
          <section className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-stone-900 font-display">
              Courier Earnings & Completed Trips
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Total Earnings</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-800">
                  100% tips + distance payouts
                </p>
              </GlassCard>
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Completed Deliveries</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {stats.deliveredCount}
                </p>
                <p className="text-xs text-stone-500">Verified drop-offs</p>
              </GlassCard>
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Reward Points</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {stats.points.toLocaleString()}
                </p>
                <p className="text-xs text-stone-500">
                  {stats.streakDays}-day active streak
                </p>
              </GlassCard>
            </div>
          </section>
        )}

        {/* DEDICATED COURIER PROFILE & PERFORMANCE STATISTICS */}
        {activeTab === 'profile' && (
          <section className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Top Courier Identity & Rating Card */}
            <GlassCard elevated className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-3xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-emerald-900 text-white flex items-center justify-center text-2xl font-bold font-display">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>Verified Delivery Partner</span>
                    <span aria-hidden="true">·</span>
                    <span>{user.location}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-stone-900 font-display">
                    {user.name}
                  </h1>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-amber-600 font-semibold text-sm tracking-tight">
                      ★★★★★
                    </span>
                    <span className="text-sm font-mono font-bold text-stone-900 tabular-nums">
                      {stats.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusToggle
                  mode="courier"
                  isOnline={isOnline}
                  onToggle={onToggleOnline}
                  onlineLabel="● ONLINE [ ON ]"
                  offlineLabel="● OFFLINE [ OFF ]"
                />
                <GlassButton variant="secondary" onClick={onLogout}>
                  Sign Out
                </GlassButton>
              </div>
            </GlassCard>

            {/* Primary 3-Column Highlight Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <GlassCard className="p-5 text-center space-y-1">
                <p className="text-xs font-medium text-stone-500">
                  Total Rides
                </p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">
                  {stats.totalRides}
                </p>
              </GlassCard>
              <GlassCard className="p-5 text-center space-y-1">
                <p className="text-xs font-medium text-stone-500">Delivered</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-900 tabular-nums">
                  {stats.deliveredCount}
                </p>
              </GlassCard>
              <GlassCard className="p-5 text-center space-y-1">
                <p className="text-xs font-medium text-stone-500">Points</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">
                  {stats.points.toLocaleString()}
                </p>
              </GlassCard>
            </div>

            {/* Detailed Courier Performance Section */}
            <GlassCard className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-stone-900 font-display">
                  Performance & Reliability Metrics
                </h2>
                <p className="text-xs text-stone-500">
                  Updated automatically after every completed delivery
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Average Rating</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    {stats.rating.toFixed(1)} ⭐
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Acceptance Rate</p>
                  <p className="text-lg font-mono font-bold text-emerald-900 tabular-nums">
                    {stats.acceptanceRate}%
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Completed Deliveries</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    {stats.deliveredCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Total Earnings</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    ₹{stats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Total Rides</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    {stats.totalRides}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Cancelled</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    {stats.cancelledCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Points</p>
                  <p className="text-lg font-mono font-bold text-emerald-900 tabular-nums">
                    {stats.points.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/75 border border-stone-200/70 space-y-1">
                  <p className="text-xs text-stone-500">Current Streak</p>
                  <p className="text-lg font-mono font-bold text-stone-900 tabular-nums">
                    {stats.streakDays} days
                  </p>
                </div>
              </div>
            </GlassCard>
          </section>
        )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
