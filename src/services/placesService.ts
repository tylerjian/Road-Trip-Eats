import { Coordinates, GooglePlace, Restaurant, RouteInfo } from '../types';
import {
  GOOGLE_MAPS_API_KEY,
  MAX_DISTANCE_FROM_ROUTE_METERS,
  MAX_RESULTS_PER_SEARCH,
  PRICE_LEVEL_MAP,
  ROUTE_SAMPLE_INTERVAL_METERS,
  SEARCH_RADIUS_METERS,
} from '../constants';
import {
  calculateCumulativeDistances,
  findNearestRoutePoint,
  sampleRoutePoints,
} from '../utils/polylineDecoder';
import { addSeconds } from '../utils/timeUtils';

export async function findRestaurantsAlongRoute(
  route: RouteInfo,
  departureTime: Date,
): Promise<Restaurant[]> {
  const { decodedPoints, duration, distance } = route;

  const samplePoints = sampleRoutePoints(decodedPoints, ROUTE_SAMPLE_INTERVAL_METERS);
  const cumulativeDistances = calculateCumulativeDistances(decodedPoints);

  const seen = new Map<string, Restaurant>();

  await Promise.all(
    samplePoints.map(async ({ point }) => {
      try {
        const places = await searchNearby(point);
        for (const place of places) {
          if (seen.has(place.id)) continue;

          const loc: Coordinates = {
            latitude: place.location.latitude,
            longitude: place.location.longitude,
          };

          const nearest = findNearestRoutePoint(loc, decodedPoints);
          if (nearest.distance > MAX_DISTANCE_FROM_ROUTE_METERS) continue;

          const distAlongRoute = cumulativeDistances[nearest.index];
          const fraction = distance > 0 ? distAlongRoute / distance : 0;
          const travelSeconds = fraction * duration;

          seen.set(place.id, {
            id: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            rating: place.rating ?? null,
            priceLevel: place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
            types: place.types ?? [],
            primaryType: place.primaryType ?? null,
            location: loc,
            estimatedArrivalTime: addSeconds(departureTime, travelSeconds),
            estimatedTravelMinutes: travelSeconds / 60,
            distanceAlongRoute: distAlongRoute,
            distanceFromRoute: nearest.distance,
            driveThruAvailable: place.driveThroughAvailable ?? null,
            photoName: place.photos?.[0]?.name,
            openNow: place.currentOpeningHours?.openNow ?? null,
          });
        }
      } catch (err) {
        console.warn('Places search failed for point', point, err);
      }
    }),
  );

  return Array.from(seen.values()).sort(
    (a, b) => a.estimatedArrivalTime.getTime() - b.estimatedArrivalTime.getTime(),
  );
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
        'places.currentOpeningHours',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: ['restaurant', 'fast_food_restaurant'],
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
