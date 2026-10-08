export type UserRole = 'customer' | 'restaurant_partner' | 'delivery_partner';

export interface UserProfile {
  id: string;
  google_uid: string;
  name: string;
  email: string;
  profile_image: string;
  location: string;
  role: UserRole;
  delivery_preferences?: string;
  dietary_preferences?: string;
  is_online?: boolean;
  delivery_range_km?: number;
  restaurant_id?: string;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface Restaurant {
  id: string;
  owner_uid: string;
  name: string;
  owner_name: string;
  contact_phone: string;
  location: string;
  cuisine: string;
  operating_hours: string;
  rating: number;
  delivery_time: string;
  distance: string;
  price_indicator: string;
  offer_text: string;
  image_url: string;
  is_open: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

export type MenuCategory = 'Starters' | 'Main Course' | 'Beverages' | 'Desserts';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  owner_uid: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image_url: string;
  is_available: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface CartItem {
  menuItem: MenuItem;
  restaurant: Restaurant;
  quantity: number;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'RESTAURANT_ACCEPTED'
  | 'FOOD_PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  customer_uid: string;
  customer_name: string;
  delivery_address: string;
  restaurant_id: string;
  restaurant_owner_uid: string;
  restaurant_name: string;
  restaurant_location: string;
  delivery_partner_uid: string;
  delivery_partner_name: string;
  items_summary: string;
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  taxes: number;
  total: number;
  status: OrderStatus;
  estimated_arrival: string;
  distance_km: number;
  created_at?: unknown;
  updated_at?: unknown;
}

export type SupportCategory =
  | 'Order issue'
  | 'Missing item'
  | 'Late delivery'
  | 'Refund/payment issue'
  | 'Restaurant issue'
  | 'Delivery partner issue'
  | 'General support';

export interface SupportTicket {
  id: string;
  user_uid: string;
  category: SupportCategory;
  order_id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_at?: unknown;
  updated_at?: unknown;
}
