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

// Search circles of 4 km every 5 km along the route. Adjacent circles overlap
// enough to fully cover a 3 km band either side of the road
// (sqrt(4^2 - 2.5^2) ≈ 3.1 km), so no stretch of the route goes unsearched.
export const ROUTE_SAMPLE_INTERVAL_METERS = 5000;
export const SEARCH_RADIUS_METERS = 4000;
// Ignore restaurants more than 3 km off the actual route line
export const MAX_DISTANCE_FROM_ROUTE_METERS = 3000;
// Places API maximum; billing is per request, so fetching the cap costs nothing extra
export const MAX_RESULTS_PER_SEARCH = 20;
// Cap on simultaneous Places requests so long routes don't burst hundreds at once
export const MAX_CONCURRENT_SEARCHES = 6;
// How far along the route (either side of the sample that found a place) to look
// for its nearest point. Generous because winding roads make along-route distance
// much longer than straight-line distance.
export const ROUTE_MATCH_WINDOW_METERS = 4 * (SEARCH_RADIUS_METERS + MAX_DISTANCE_FROM_ROUTE_METERS);
