export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const COLORS = {
  primary: '#1A73E8',
  primaryLight: '#E8F0FE',
  white: '#FFFFFF',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#202124',
  textSecondary: '#5F6368',
  border: '#E0E0E0',
  divider: '#F1F3F4',
  rating: '#F9AB00',
  driveThru: '#34A853',
  closed: '#EA4335',
};

export const FOOD_TYPE_OPTIONS: { label: string; types: string[]; emoji: string }[] = [
  { label: 'Fast Food', types: ['fast_food_restaurant'], emoji: '🍔' },
  { label: 'Burgers', types: ['hamburger_restaurant'], emoji: '🍔' },
  { label: 'Pizza', types: ['pizza_restaurant'], emoji: '🍕' },
  { label: 'Mexican', types: ['mexican_restaurant'], emoji: '🌮' },
  { label: 'Chinese', types: ['chinese_restaurant'], emoji: '🥡' },
  { label: 'Japanese', types: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant'], emoji: '🍱' },
  { label: 'American', types: ['american_restaurant'], emoji: '🥩' },
  { label: 'Italian', types: ['italian_restaurant'], emoji: '🍝' },
  { label: 'Sandwiches', types: ['sandwich_shop'], emoji: '🥪' },
  { label: 'Seafood', types: ['seafood_restaurant'], emoji: '🐟' },
  { label: 'BBQ', types: ['barbecue_restaurant'], emoji: '🍖' },
  { label: 'Cafe', types: ['cafe', 'coffee_shop'], emoji: '☕' },
];

export const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export const PRICE_DISPLAY = ['Free', '$', '$$', '$$$', '$$$$'];

// Sample one route point every 20 km to find restaurants
export const ROUTE_SAMPLE_INTERVAL_METERS = 20000;
// Search 3 km around each sampled point
export const SEARCH_RADIUS_METERS = 3000;
// Ignore restaurants more than 3 km off the actual route line
export const MAX_DISTANCE_FROM_ROUTE_METERS = 3000;
export const MAX_RESULTS_PER_SEARCH = 10;
