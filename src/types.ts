export type UserRole = 'customer' | 'restaurant_partner' | 'delivery_partner';

export interface GeoLocationData {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface UserProfile {
  id: string;
  google_uid: string;
  name: string;
  email: string;
  profile_image: string;
  location: string;
  lat?: number;
  lng?: number;
  place_id?: string;
  role: UserRole;
  delivery_preferences?: string;
  dietary_preferences?: string;
  is_online?: boolean;
  delivery_range_km?: number;
  restaurant_id?: string;
  // Courier Profile & Performance Statistics
  total_rides?: number;
  orders_delivered?: number;
  cancelled_deliveries?: number;
  points?: number;
  courier_rating?: number;
  acceptance_rate?: number;
  current_streak_days?: number;
  total_earnings?: number;
  current_lat?: number;
  current_lng?: number;
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
  lat?: number;
  lng?: number;
  cuisine: string;
  operating_hours: string;
  rating: number;
  rating_count?: number;
  delivery_time: string;
  distance: string;
  price_indicator: string;
  offer_text: string;
  image_url: string;
  is_open: boolean; // Kitchen Status: true = OPEN (🟢), false = CLOSED (🔴)
  created_at?: unknown;
  updated_at?: unknown;
}

export interface RestaurantCategory {
  id: string;
  restaurant_id: string;
  owner_uid: string;
  name: string;
  display_order: number;
  active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

export type MenuCategory = string;

export interface MenuItem {
  id: string;
  restaurant_id: string;
  owner_uid: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  maximum_discount: number;
  minimum_order_value: number;
  start_date: string;
  expiry_date: string;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  active: boolean;
  restaurant_id: string; // 'GLOBAL' or specific restaurant_id
  owner_uid: string;
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
  | 'COURIER_ACCEPTED'
  | 'GOING_TO_RESTAURANT'
  | 'ARRIVED_AT_RESTAURANT'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_AT_CUSTOMER'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'COD';
export type PaymentStatus = 'PAID' | 'PENDING_COD';

export interface Order {
  id: string;
  customer_uid: string;
  customer_name: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  restaurant_id: string;
  restaurant_owner_uid: string;
  restaurant_name: string;
  restaurant_location: string;
  restaurant_lat?: number;
  restaurant_lng?: number;
  delivery_partner_uid: string;
  delivery_partner_name: string;
  delivery_partner_rating?: number;
  courier_lat?: number;
  courier_lng?: number;
  items_summary: string;
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  coupon_code?: string;
  taxes: number;
  total: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_detail?: string;
  status: OrderStatus;
  estimated_arrival: string;
  distance_km: number;
  accepted_at?: string;
  arrived_at_restaurant_at?: string;
  picked_up_at?: string;
  arrived_at_customer_at?: string;
  delivered_at?: string;
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

export interface StoreRating {
  id: string;
  order_id: string;
  restaurant_id: string;
  customer_uid: string;
  customer_name: string;
  rating: number;
  courier_rating?: number;
  comment: string;
  created_at?: unknown;
}

export interface OrderChatMessage {
  id: string;
  order_id: string;
  sender_uid: string;
  sender_name: string;
  sender_role: UserRole;
  text: string;
  created_at?: unknown;
}

