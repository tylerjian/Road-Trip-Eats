import { Coordinates, GooglePlace, Restaurant, RouteInfo } from '../types';
import {
  GOOGLE_MAPS_API_KEY,
  MAX_CONCURRENT_SEARCHES,
  MAX_DISTANCE_FROM_ROUTE_METERS,
  MAX_RESULTS_PER_SEARCH,
  PRICE_LEVEL_MAP,
  ROUTE_MATCH_WINDOW_METERS,
  ROUTE_SAMPLE_INTERVAL_METERS,
  SEARCH_RADIUS_METERS,
} from '../constants';
import {
  calculateCumulativeDistances,
  nearestPointOnRoute,
  sampleRoutePoints,
} from '../utils/polylineDecoder';
import { addSeconds, isOpenAt } from '../utils/timeUtils';

export async function findRestaurantsAlongRoute(
  route: RouteInfo,
  departureTime: Date,
): Promise<Restaurant[]> {
  const { decodedPoints, duration } = route;

  const cumulativeDistances = calculateCumulativeDistances(decodedPoints);
  // Use the polyline's own length, not the road distance from Directions: the
  // simplified overview polyline cuts corners, so mixing the two skews ETAs early.
  const polylineLength = cumulativeDistances[cumulativeDistances.length - 1] ?? 0;
  const samplePoints = sampleRoutePoints(
    decodedPoints,
    cumulativeDistances,
    ROUTE_SAMPLE_INTERVAL_METERS,
  );

  const seen = new Map<string, Restaurant>();
  let failures = 0;
  let lastError: unknown;

  await mapWithConcurrency(samplePoints, MAX_CONCURRENT_SEARCHES, async ({ point, distanceFromStart }) => {
    let places: GooglePlace[];
    try {
      places = await searchNearby(point);
    } catch (err) {
      failures++;
      lastError = err;
      console.warn('Places search failed for point', point, err);
      return;
    }

    for (const place of places) {
      if (seen.has(place.id)) continue;

      const loc: Coordinates = {
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      };

      const nearest = nearestPointOnRoute(
        loc,
        decodedPoints,
        cumulativeDistances,
        distanceFromStart - ROUTE_MATCH_WINDOW_METERS,
        distanceFromStart + ROUTE_MATCH_WINDOW_METERS,
      );
      if (nearest.distance > MAX_DISTANCE_FROM_ROUTE_METERS) continue;

      const fraction = polylineLength > 0 ? nearest.distanceAlongRoute / polylineLength : 0;
      const travelSeconds = fraction * duration;
      const arrival = addSeconds(departureTime, travelSeconds);

      seen.set(place.id, {
        id: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        rating: place.rating ?? null,
        priceLevel: place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
        types: place.types ?? [],
        primaryType: place.primaryType ?? null,
        location: loc,
        estimatedArrivalTime: arrival,
        estimatedTravelMinutes: travelSeconds / 60,
        distanceAlongRoute: nearest.distanceAlongRoute,
        distanceFromRoute: nearest.distance,
        driveThruAvailable: place.driveThroughAvailable ?? null,
        photoName: place.photos?.[0]?.name,
        openAtArrival: isOpenAt(place.regularOpeningHours?.periods, place.utcOffsetMinutes, arrival),
      });
    }
  });

  // One failed point just leaves a gap, but if every search failed the API itself
  // is broken (bad key, API not enabled) and an empty list would be misleading.
  if (samplePoints.length > 0 && failures === samplePoints.length) {
    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Restaurant search failed: ${reason}`);
  }

  return Array.from(seen.values()).sort(
    (a, b) => a.estimatedArrivalTime.getTime() - b.estimatedArrivalTime.getTime(),
  );
}

// Runs `fn` over `items` with at most `limit` calls in flight at once.
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function searchNearby(center: Coordinates): Promise<GooglePlace[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.priceLevel',
        'places.primaryType',
        'places.types',
        'places.driveThroughAvailable',
        'places.regularOpeningHours',
        'places.utcOffsetMinutes',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: ['restaurant', 'fast_food_restaurant', 'cafe', 'coffee_shop', 'sandwich_shop'],
      maxResultCount: MAX_RESULTS_PER_SEARCH,
      locationRestriction: {
        circle: {
          center: { latitude: center.latitude, longitude: center.longitude },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Places API ${response.status}: ${text}`);
  }

  const data = await response.json();
  return (data.places ?? []) as GooglePlace[];
}
