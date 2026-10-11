import {
  Restaurant,
  MenuItem,
  Coupon,
  RestaurantCategory,
  GeoLocationData,
} from './types';

// Default real geographic hubs for quick initial selection alongside live Nominatim search
export const POPULAR_LOCATIONS_DATA: GeoLocationData[] = [
  {
    formattedAddress: 'Indiranagar, Bengaluru, Karnataka',
    lat: 12.9784,
    lng: 77.6408,
    placeId: 'place-indiranagar-blr',
  },
  {
    formattedAddress: 'Koramangala, Bengaluru, Karnataka',
    lat: 12.9352,
    lng: 77.6245,
    placeId: 'place-koramangala-blr',
  },
  {
    formattedAddress: 'Sector 49, Gurugram, Haryana',
    lat: 28.412,
    lng: 77.0491,
    placeId: 'place-sec49-ggn',
  },
  {
    formattedAddress: 'Bandra West, Mumbai, Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
    placeId: 'place-bandra-mum',
  },
  {
    formattedAddress: 'Hauz Khas, New Delhi',
    lat: 28.5535,
    lng: 77.1942,
    placeId: 'place-hkv-del',
  },
  {
    formattedAddress: 'Jubilee Hills, Hyderabad, Telangana',
    lat: 17.4319,
    lng: 78.4097,
    placeId: 'place-jubilee-hyd',
  },
  {
    formattedAddress: 'Koregaon Park, Pune, Maharashtra',
    lat: 18.5362,
    lng: 73.894,
    placeId: 'place-kp-pune',
  },
];

export const POPULAR_LOCATIONS = POPULAR_LOCATIONS_DATA.map(
  (l) => l.formattedAddress
);

export const FOOD_CATEGORIES = [
  { id: 'All', label: 'All Cravings', subtitle: 'Partner kitchens' },
  { id: 'Pizza', label: 'Pizza', subtitle: 'Wood-fired & artisanal' },
  { id: 'Burgers', label: 'Burgers', subtitle: 'Craft grill & brioche' },
  { id: 'Indian', label: 'Indian', subtitle: 'Traditional & contemporary' },
  { id: 'Healthy', label: 'Healthy', subtitle: 'Fresh bowls & salads' },
  { id: 'Desserts', label: 'Desserts', subtitle: 'Patisserie & sweet' },
  { id: 'Chinese', label: 'Chinese', subtitle: 'Wok & dim sum' },
];

// Standard Dish & Price Catalog (Automatically available for restaurants so dish prices don't require manual entry)
export const STANDARD_DISH_CATALOG: Array<{
  name: string;
  description: string;
  price: number;
  category: string;
}> = [
  {
    name: 'Margherita Burrata Artisan Pizza',
    description: 'San Marzano tomato, fresh burrata, sweet basil, and cold-pressed olive oil on 48-hour sourdough crust.',
    price: 389,
    category: 'Pizza',
  },
  {
    name: 'Smoked Pepperoni & Hot Honey Pizza',
    description: 'Crisp wood-fired crust topped with artisanal pepperoni cups, mozzarella, and wildflower chili honey.',
    price: 449,
    category: 'Pizza',
  },
  {
    name: 'Truffle Brioche Smash Burger',
    description: 'Double-seared tender patty, aged cheddar, caramelized onions, and black truffle aioli on toasted brioche.',
    price: 329,
    category: 'Burgers',
  },
  {
    name: 'Crispy Peri-Peri Crunch Burger',
    description: 'Golden herb-crusted fillet, pickled jalapeños, crisp lettuce, and smoky peri-peri glaze.',
    price: 279,
    category: 'Burgers',
  },
  {
    name: 'Royal Saffron Dum Biryani',
    description: 'Slow-cooked aged basmati rice layered with aromatic spices, caramelized onions, mint, and saffron raita.',
    price: 369,
    category: 'Indian',
  },
  {
    name: 'Old Delhi Paneer Makhani & Garlic Naan',
    description: 'Velvety slow-simmered tomato-cashew gravy with char-grilled cottage cheese and buttered garlic naan.',
    price: 319,
    category: 'Indian',
  },
  {
    name: 'Mediterranean Quinoa & Avocado Bowl',
    description: 'Herbed tri-color quinoa, roasted chickpeas, Hass avocado, cherry tomatoes, and lemon-tahini dressing.',
    price: 299,
    category: 'Healthy',
  },
  {
    name: 'Belgian Dark Chocolate Lava Torte',
    description: 'Warm 70% dark couverture chocolate center served with Madagascar vanilla bean creme.',
    price: 229,
    category: 'Desserts',
  },
];

export function buildDefaultRestaurantMenu(
  restaurantId: string,
  ownerUid: string
): MenuItem[] {
  return STANDARD_DISH_CATALOG.map((dish, idx) => ({
    id: `std-${restaurantId}-${idx + 1}`,
    restaurant_id: restaurantId,
    owner_uid: ownerUid,
    category_id: 'default',
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: dish.category,
    image_url: '/favicon.svg',
    is_available: true,
  }));
}

// Clean launch-ready empty arrays — all live entities come strictly from Firestore
export const SEED_COUPONS: Coupon[] = [];
export const SEED_RESTAURANT_CATEGORIES: RestaurantCategory[] = [];
export const SEED_RESTAURANTS: Restaurant[] = [];
export const SEED_MENU_ITEMS: MenuItem[] = [];

