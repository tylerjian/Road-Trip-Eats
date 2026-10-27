import { Coordinates } from '../types';

export function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
  }
  return points;
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

// Places evenly spaced samples along the route, interpolating between vertices so
// spacing stays exact even where the overview polyline's vertices are km apart.
export function sampleRoutePoints(
  points: Coordinates[],
  cumulativeDistances: number[],
  intervalMeters: number,
): { point: Coordinates; distanceFromStart: number }[] {
  if (points.length === 0) return [];

  const total = cumulativeDistances[cumulativeDistances.length - 1];
  const samples: { point: Coordinates; distanceFromStart: number }[] = [];

  let i = 0;
  for (let d = 0; d < total; d += intervalMeters) {
    while (cumulativeDistances[i + 1] < d) i++;
    const segLen = cumulativeDistances[i + 1] - cumulativeDistances[i];
    const t = segLen > 0 ? (d - cumulativeDistances[i]) / segLen : 0;
    const a = points[i];
    const b = points[i + 1];
    samples.push({
      point: {
        latitude: a.latitude + t * (b.latitude - a.latitude),
        longitude: a.longitude + t * (b.longitude - a.longitude),
      },
      distanceFromStart: d,
    });
  }

  samples.push({ point: points[points.length - 1], distanceFromStart: total });
  return samples;
}

// Metres per degree of latitude; longitude is scaled by cos(latitude).
const METERS_PER_DEGREE = 111320;

// Finds the closest point on the route to `location`, measuring to line segments
// (not just vertices) and only scanning the part of the route between
// `fromMeters` and `toMeters`. Uses a flat-earth approximation, which is accurate
// to well under 1% over the few km involved and avoids trig in the inner loop.
export function nearestPointOnRoute(
  location: Coordinates,
  points: Coordinates[],
  cumulativeDistances: number[],
  fromMeters: number,
  toMeters: number,
): { distance: number; distanceAlongRoute: number } {
  const cosLat = Math.cos((location.latitude * Math.PI) / 180);
  const lo = Math.max(0, lowerBound(cumulativeDistances, fromMeters) - 1);
  const hi = Math.min(points.length - 1, lowerBound(cumulativeDistances, toMeters));

  const offset = (p: Coordinates) => ({
    x: (p.longitude - location.longitude) * cosLat,
    y: p.latitude - location.latitude,
  });

  const first = offset(points[lo]);
  let bestSq = first.x * first.x + first.y * first.y;
  let bestAlong = cumulativeDistances[lo];

  for (let i = lo; i < hi; i++) {
    const a = offset(points[i]);
    const b = offset(points[i + 1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0 ? Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / lenSq)) : 0;
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const dSq = px * px + py * py;
    if (dSq < bestSq) {
      bestSq = dSq;
      bestAlong =
        cumulativeDistances[i] + t * (cumulativeDistances[i + 1] - cumulativeDistances[i]);
    }
  }

  return { distance: Math.sqrt(bestSq) * METERS_PER_DEGREE, distanceAlongRoute: bestAlong };
}

// Index of the first element >= x in an ascending array.
function lowerBound(arr: number[], x: number): number {
  let l = 0;
  let r = arr.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (arr[m] < x) l = m + 1;
    else r = m;
  }
  return l;
}

export function calculateCumulativeDistances(points: Coordinates[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + haversineDistance(points[i - 1], points[i]));
  }
  return distances;
}
