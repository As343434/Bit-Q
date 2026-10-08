import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  UserProfile,
  Restaurant,
  MenuItem,
  MenuCategory,
  Order,
  OrderStatus,
} from '../types';
import { IMAGES } from '../seedData';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  StatusToggle,
  ProfileCard,
  ResilientImage,
} from './GlassUI';

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
  menuItems: MenuItem[];
  orders: Order[];
  onCreateOrUpdateRestaurant: (data: Partial<Restaurant>) => Promise<void>;
  onAddMenuItem: (item: {
    name: string;
    description: string;
    price: number;
    category: MenuCategory;
    image_url: string;
    is_available: boolean;
  }) => Promise<void>;
  onUpdateMenuItem: (
    itemId: string,
    updates: Partial<MenuItem>
  ) => Promise<void>;
  onDeleteMenuItem: (itemId: string) => Promise<void>;
  onUpdateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus
  ) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  restaurant,
  menuItems,
  orders,
  onCreateOrUpdateRestaurant,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onUpdateOrderStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<RestaurantTab>('dashboard');

  // Menu Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('16.00');
  const [itemCategory, setItemCategory] =
    useState<MenuCategory>('Main Course');
  const [itemImage, setItemImage] = useState(IMAGES.pizza);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Restaurant Profile / Offers State
  const [restName, setRestName] = useState(
    restaurant?.name || `${user.name}'s Artisanal Kitchen`
  );
  const [restCuisine, setRestCuisine] = useState(
    restaurant?.cuisine || 'Pizza · Contemporary'
  );
  const [restPhone, setRestPhone] = useState(
    restaurant?.contact_phone || '+1 (555) 234-5678'
  );
  const [restHours, setRestHours] = useState(
    restaurant?.operating_hours || '11:00 AM – 10:30 PM'
  );
  const [restOffer, setRestOffer] = useState(
    restaurant?.offer_text || '20% off orders above $25'
  );
  const [isSavingRest, setIsSavingRest] = useState(false);

  const myMenuItems = useMemo(() => {
    if (!restaurant) return [];
    return menuItems.filter((m) => m.restaurant_id === restaurant.id);
  }, [menuItems, restaurant]);

  const restaurantOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (restaurant && o.restaurant_id === restaurant.id) ||
        o.restaurant_owner_uid === user.google_uid ||
        o.restaurant_owner_uid === 'system_curated'
    );
  }, [orders, restaurant, user.google_uid]);

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
    setItemPrice('16.50');
    setItemCategory('Main Course');
    setItemImage(IMAGES.pizza);
    setItemAvailable(true);
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price.toFixed(2));
    setItemCategory(item.category);
    setItemImage(item.image_url);
    setItemAvailable(item.is_available);
    setIsItemModalOpen(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Math.max(0.5, Number(itemPrice) || 12);
    setIsSavingItem(true);
    try {
      if (editingItem) {
        await onUpdateMenuItem(editingItem.id, {
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parsedPrice,
          category: itemCategory,
          image_url: itemImage.trim() || IMAGES.pizza,
          is_available: itemAvailable,
        });
      } else {
        await onAddMenuItem({
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parsedPrice,
          category: itemCategory,
          image_url: itemImage.trim() || IMAGES.pizza,
          is_available: itemAvailable,
        });
      }
      setIsItemModalOpen(false);
    } finally {
      setIsSavingItem(false);
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

  return (
    <div className="min-h-screen bg-[#F7F6F2] pb-24 md:pb-16">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 glass-surface border-b border-stone-200/60 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-xl font-bold tracking-tight text-stone-900 font-display whitespace-nowrap"
          >
            Bit&apos;Q (e=&apos;)
          </button>

          {/* Zone 2: 5 Clean Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {(
              [
                { id: 'dashboard', label: 'Overview' },
                { id: 'orders', label: 'Orders' },
                { id: 'menu', label: 'Menu Manager' },
                { id: 'offers', label: 'Offers' },
                { id: 'profile', label: 'Kitchen Profile' },
              ] as { id: RestaurantTab; label: string }[]
            ).map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveTab(nav.id)}
                className={`py-1 transition-colors whitespace-nowrap ${
                  activeTab === nav.id
                    ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                    : 'hover:text-stone-900'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action (Kitchen Availability Toggle) */}
          <div className="flex items-center gap-3">
            <StatusToggle
              isOnline={restaurant?.is_open ?? true}
              onToggle={(next) =>
                onCreateOrUpdateRestaurant({ is_open: next })
              }
              onlineLabel="Kitchen Open"
              offlineLabel="Kitchen Paused"
            />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-stone-200/80 grid grid-cols-5 items-center h-16 px-2">
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
                ? 'text-emerald-900 font-semibold'
                : 'text-stone-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {activeTab === 'dashboard' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-stone-500">
                  Restaurant Partner Console · {restaurant?.location || user.location}
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Total Kitchen Revenue</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  ${totalRevenue.toFixed(2)}
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
                  Instant availability sync enabled
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Active Promo Banner</p>
                <p className="text-base font-semibold text-stone-900 truncate">
                  {restaurant?.offer_text || restOffer}
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
                  <p className="text-xs text-stone-500">
                    Your kitchen is live on customer discovery feeds.
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurantOrders.slice(0, 4).map((order) => (
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
                          ${order.total.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 py-2.5 border-y border-stone-200/60">
                        {order.items_summary}
                      </p>

                      {/* Kitchen Status Controls */}
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
                        {(order.status === 'READY_FOR_PICKUP' ||
                          order.status === 'OUT_FOR_DELIVERY' ||
                          order.status === 'DELIVERED') && (
                          <span className="text-xs font-medium text-emerald-900">
                            Stage: {order.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MENU MANAGER TAB */}
        {activeTab === 'menu' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 font-display">
                  Menu Manager & Availability
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Add, edit, price, or toggle in-stock availability for your
                  dishes
                </p>
              </div>
              <GlassButton variant="primary" onClick={openAddModal}>
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </GlassButton>
            </div>

            {myMenuItems.length === 0 ? (
              <GlassCard className="p-12 text-center space-y-4">
                <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-stone-900 font-display">
                    Your kitchen menu is empty
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Add your first starter, main course, beverage, or dessert so
                    customers can order from your storefront.
                  </p>
                </div>
                <GlassButton variant="primary" onClick={openAddModal}>
                  Create First Dish
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
                            ${item.price.toFixed(2)}
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

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <section className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-stone-900 font-display">
              All Kitchen Orders ({restaurantOrders.length})
            </h1>
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
                      ${order.total.toFixed(2)}
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
                            onUpdateOrderStatus(order.id, 'RESTAURANT_ACCEPTED')
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
          </section>
        )}

        {/* OFFERS & PROFILE TABS */}
        {(activeTab === 'offers' || activeTab === 'profile') && (
          <section className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <ProfileCard user={user} onLogout={onLogout} />

            <GlassCard className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-stone-900 font-display">
                Storefront & Promotional Offer Configuration
              </h2>
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
                  label="Featured Promotional Offer Text"
                  value={restOffer}
                  onChange={setRestOffer}
                  placeholder="e.g., 20% off above $20"
                  maxLength={100}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput
                    label="Business Phone"
                    value={restPhone}
                    onChange={setRestPhone}
                    maxLength={30}
                    required
                  />
                  <GlassInput
                    label="Operating Hours"
                    value={restHours}
                    onChange={setRestHours}
                    maxLength={80}
                    required
                  />
                </div>
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={isSavingRest}
                >
                  {isSavingRest
                    ? 'Saving Storefront...'
                    : 'Save Storefront & Offer'}
                </GlassButton>
              </form>
            </GlassCard>
          </section>
        )}
      </main>

      {/* Add / Edit Menu Item Modal */}
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
            placeholder="e.g., Burrata & San Marzano Pizza"
            maxLength={120}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              label="Price (USD)"
              type="number"
              value={itemPrice}
              onChange={setItemPrice}
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-600">
                Category
              </label>
              <select
                value={itemCategory}
                onChange={(e) =>
                  setItemCategory(e.target.value as MenuCategory)
                }
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/85 border border-stone-200/90 text-sm text-stone-900 focus:outline-none focus:border-emerald-800"
              >
                <option value="Starters">Starters</option>
                <option value="Main Course">Main Course</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">
              Short Culinary Description
            </label>
            <textarea
              rows={3}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Describe key ingredients and preparation style..."
              maxLength={300}
              required
              className="w-full p-3.5 rounded-2xl bg-white/85 border border-stone-200/90 text-sm text-stone-900 focus:outline-none focus:border-emerald-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">
              Select Dish Photography Preset
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Pizza', url: IMAGES.pizza },
                { label: 'Burger', url: IMAGES.burger },
                { label: 'Biryani', url: IMAGES.biryani },
                { label: 'Bowl', url: IMAGES.healthy },
                { label: 'Dessert', url: IMAGES.dessert },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setItemImage(preset.url)}
                  className={`p-1.5 rounded-xl border text-center transition-all ${
                    itemImage === preset.url
                      ? 'border-emerald-900 bg-emerald-900/5 font-semibold'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-10 object-cover rounded-lg mb-1"
                  />
                  <span className="text-[10px] block">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
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
   2. DELIVERY PARTNER EXPERIENCE
   ========================================================================== */
type DeliveryTab = 'dashboard' | 'active' | 'earnings' | 'profile';

export const DeliveryPartnerExperience: React.FC<{
  user: UserProfile;
  orders: Order[];
  onToggleOnline: (isOnline: boolean) => Promise<void>;
  onUpdateRange: (rangeKm: number) => Promise<void>;
  onAcceptOrAdvanceDelivery: (
    orderId: string,
    nextStatus: OrderStatus
  ) => Promise<void>;
  onLogout: () => Promise<void>;
}> = ({
  user,
  orders,
  onToggleOnline,
  onUpdateRange,
  onAcceptOrAdvanceDelivery,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('dashboard');
  const isOnline = user.is_online ?? true;
  const rangeKm = user.delivery_range_km ?? 5;

  // Delivery opportunities within configured range
  const availableRequests = useMemo(() => {
    if (!isOnline) return [];
    return orders.filter(
      (o) =>
        (o.status === 'READY_FOR_PICKUP' ||
          o.status === 'FOOD_PREPARING' ||
          o.status === 'RESTAURANT_ACCEPTED') &&
        (!o.delivery_partner_uid || o.delivery_partner_uid === user.google_uid) &&
        o.distance_km <= rangeKm
    );
  }, [orders, isOnline, rangeKm, user.google_uid]);

  const myActiveDeliveries = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.delivery_partner_uid === user.google_uid &&
          o.status !== 'DELIVERED' &&
          o.status !== 'CANCELLED'
      ),
    [orders, user.google_uid]
  );

  const completedDeliveries = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.delivery_partner_uid === user.google_uid &&
          o.status === 'DELIVERED'
      ),
    [orders, user.google_uid]
  );

  const totalEarnings = useMemo(
    () =>
      completedDeliveries.reduce(
        (sum, o) => sum + Math.max(4.5, o.delivery_fee + 3.0),
        0
      ),
    [completedDeliveries]
  );

  return (
    <div className="min-h-screen bg-[#F7F6F2] pb-24 md:pb-16">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 glass-surface border-b border-stone-200/60 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Zone 1: Single Text Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-xl font-bold tracking-tight text-stone-900 font-display whitespace-nowrap"
          >
            Bit&apos;Q (e=&apos;)
          </button>

          {/* Zone 2: 4 Clean Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {(
              [
                { id: 'dashboard', label: 'Dispatch Radar' },
                { id: 'active', label: 'Active Route' },
                { id: 'earnings', label: 'Earnings' },
                { id: 'profile', label: 'Courier Profile' },
              ] as { id: DeliveryTab; label: string }[]
            ).map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveTab(nav.id)}
                className={`py-1 transition-colors whitespace-nowrap ${
                  activeTab === nav.id
                    ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-emerald-800 decoration-2'
                    : 'hover:text-stone-900'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action (ONLINE / OFFLINE Status Toggle) */}
          <div className="flex items-center gap-3">
            <StatusToggle
              isOnline={isOnline}
              onToggle={onToggleOnline}
              onlineLabel="● ONLINE"
              offlineLabel="○ OFFLINE"
            />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-elevated border-t border-stone-200/80 grid grid-cols-4 items-center h-16 px-2">
        {(
          [
            { id: 'dashboard', label: 'Radar' },
            { id: 'active', label: 'Active' },
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
                ? 'text-emerald-900 font-semibold'
                : 'text-stone-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {(activeTab === 'dashboard' || activeTab === 'active') && (
          <section className="space-y-8 animate-fadeIn">
            {/* Availability & Service Range Control Bar */}
            <div className="glass-elevated rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Courier Status</span>
                  <span aria-hidden="true">·</span>
                  <span>{user.location}</span>
                </div>
                <h1 className="text-2xl font-bold text-stone-900 font-display">
                  {isOnline
                    ? 'Available · Receiving Requests'
                    : 'Currently Offline'}
                </h1>
                <p className="text-xs text-stone-500">
                  {isOnline
                    ? `Scanning kitchens within ${rangeKm} km radius`
                    : 'Switch to ONLINE to start receiving nearby delivery requests'}
                </p>
              </div>

              {/* Delivery Range Selector */}
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
                      className={`flex-1 min-h-[40px] rounded-xl text-xs font-mono font-semibold transition-colors tabular-nums ${
                        rangeKm === km
                          ? 'bg-emerald-900 text-white'
                          : 'bg-white/80 text-stone-700 hover:bg-white'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Delivery Tracking Section */}
            {myActiveDeliveries.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-900 font-display">
                  Active Delivery Route ({myActiveDeliveries.length})
                </h2>
                {myActiveDeliveries.map((order) => (
                  <GlassCard
                    key={order.id}
                    elevated
                    className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                  >
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                        <Navigation className="w-4 h-4" />
                        <span>{order.status.replace(/_/g, ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {order.distance_km} km trip
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 font-display">
                        Pickup: {order.restaurant_name}
                      </h3>
                      <p className="text-xs text-stone-600">
                        Drop-off Destination:{' '}
                        <strong className="text-stone-900">
                          {order.customer_name} — {order.delivery_address}
                        </strong>
                      </p>
                      <p className="text-xs text-stone-500">
                        Items: {order.items_summary}
                      </p>
                    </div>

                    <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                      {order.status !== 'OUT_FOR_DELIVERY' && (
                        <GlassButton
                          variant="primary"
                          fullWidth
                          onClick={() =>
                            onAcceptOrAdvanceDelivery(
                              order.id,
                              'OUT_FOR_DELIVERY'
                            )
                          }
                        >
                          Confirm Pickup · Start Delivery
                        </GlassButton>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <GlassButton
                          variant="primary"
                          fullWidth
                          onClick={() =>
                            onAcceptOrAdvanceDelivery(order.id, 'DELIVERED')
                          }
                        >
                          <Check className="w-4 h-4" />
                          <span>Complete Drop-off · Mark Delivered</span>
                        </GlassButton>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Nearby Delivery Requests */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900 font-display">
                Nearby Delivery Opportunities ({availableRequests.length})
              </h2>

              {!isOnline ? (
                <GlassCard className="p-10 text-center space-y-3">
                  <Bike className="w-8 h-8 text-stone-400 mx-auto" />
                  <h3 className="text-base font-semibold text-stone-900 font-display">
                    You are currently Offline
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Toggle your status to ONLINE in the top bar to view and
                    accept nearby kitchen dispatches.
                  </p>
                  <GlassButton
                    variant="primary"
                    onClick={() => onToggleOnline(true)}
                  >
                    Go Online Now
                  </GlassButton>
                </GlassCard>
              ) : availableRequests.length === 0 ? (
                <GlassCard className="p-10 text-center space-y-2">
                  <Clock className="w-7 h-7 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    No unassigned dispatches within {rangeKm} km
                  </p>
                  <p className="text-xs text-stone-500">
                    Try expanding your service range above to 12 km or 15 km, or
                    wait for incoming kitchen orders.
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRequests.map((req) => (
                    <GlassCard key={req.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-emerald-900 font-semibold tabular-nums">
                            {req.distance_km} km away · Est.Payout $
                            {(req.delivery_fee + 3.5).toFixed(2)}
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
                          onClick={() =>
                            onAcceptOrAdvanceDelivery(
                              req.id,
                              'OUT_FOR_DELIVERY'
                            )
                          }
                        >
                          Accept & Pick Up
                        </GlassButton>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
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
                <p className="text-xs text-stone-500">Completed Payouts</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  ${totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-800">
                  100% tips + base distance fare
                </p>
              </GlassCard>
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Completed Deliveries</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {completedDeliveries.length}
                </p>
                <p className="text-xs text-stone-500">Verified drop-offs</p>
              </GlassCard>
              <GlassCard className="p-6 space-y-1">
                <p className="text-xs text-stone-500">Configured Range</p>
                <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
                  {rangeKm} km
                </p>
                <p className="text-xs text-stone-500">Active dispatch zone</p>
              </GlassCard>
            </div>

            {completedDeliveries.length === 0 ? (
              <GlassCard className="p-10 text-center space-y-2">
                <DollarSign className="w-7 h-7 text-stone-400 mx-auto" />
                <p className="text-sm font-medium text-stone-700">
                  No completed deliveries yet
                </p>
                <p className="text-xs text-stone-500">
                  Accept and complete a delivery request to see your itemized
                  trip earnings here.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {completedDeliveries.map((trip) => (
                  <GlassCard
                    key={trip.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {trip.restaurant_name} → {trip.delivery_address}
                      </p>
                      <p className="text-xs text-stone-500">
                        {trip.distance_km} km · Delivered
                      </p>
                    </div>
                    <span className="text-base font-mono font-bold text-emerald-900 tabular-nums">
                      +${Math.max(4.5, trip.delivery_fee + 3.0).toFixed(2)}
                    </span>
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
          </section>
        )}
      </main>
    </div>
  );
};
