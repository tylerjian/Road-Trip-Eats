import { Coordinates, RouteInfo } from '../types';
import { GOOGLE_MAPS_API_KEY } from '../constants';
import { decodePolyline } from '../utils/polylineDecoder';

export async function getDirections(
  origin: Coordinates | string,
  destination: Coordinates | string,
): Promise<RouteInfo> {
  const originStr =
    typeof origin === 'string'
      ? encodeURIComponent(origin)
      : `${origin.latitude},${origin.longitude}`;

  const destStr =
    typeof destination === 'string'
      ? encodeURIComponent(destination)
      : `${destination.latitude},${destination.longitude}`;

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${originStr}&destination=${destStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(
      `Could not find a route: ${data.status}${data.error_message ? ' – ' + data.error_message : ''}`,
    );
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const decodedPoints = decodePolyline(route.overview_polyline.points);

  return {
    encodedPolyline: route.overview_polyline.points,
    duration: leg.duration.value,
    distance: leg.distance.value,
    decodedPoints,
    bounds: {
      northeast: {
        latitude: route.bounds.northeast.lat,
        longitude: route.bounds.northeast.lng,
      },
      southwest: {
        latitude: route.bounds.southwest.lat,
        longitude: route.bounds.southwest.lng,
      },
    },
  };
}
