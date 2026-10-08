import {
  Restaurant,
  MenuItem,
  Coupon,
  RestaurantCategory,
  GeoLocationData,
} from './types';
import pizzaImg from './assets/images/hero_artisan_pizza_1791435438606.jpg';
import burgerImg from './assets/images/food_smash_burger_1791435451024.jpg';
import biryaniImg from './assets/images/food_biryani_bowl_1791435463858.jpg';
import bowlImg from './assets/images/food_matcha_bowl_1791435474280.jpg';
import dessertImg from './assets/images/food_tiramisu_dessert_1791435489076.jpg';

export const IMAGES = {
  pizza: pizzaImg,
  burger: burgerImg,
  biryani: biryaniImg,
  healthy: bowlImg,
  dessert: dessertImg,
};

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

// Clean launch-ready empty arrays — all live entities come strictly from Firestore
export const SEED_COUPONS: Coupon[] = [];
export const SEED_RESTAURANT_CATEGORIES: RestaurantCategory[] = [];
export const SEED_RESTAURANTS: Restaurant[] = [];
export const SEED_MENU_ITEMS: MenuItem[] = [];
