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

export function sampleRoutePoints(
  points: Coordinates[],
  intervalMeters: number,
): { point: Coordinates; distanceFromStart: number }[] {
  if (points.length === 0) return [];

  const samples: { point: Coordinates; distanceFromStart: number }[] = [
    { point: points[0], distanceFromStart: 0 },
  ];

  let totalDistance = 0;
  let lastSampleDistance = 0;

  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(points[i - 1], points[i]);
    if (totalDistance - lastSampleDistance >= intervalMeters) {
      samples.push({ point: points[i], distanceFromStart: totalDistance });
      lastSampleDistance = totalDistance;
    }
  }

  const last = points[points.length - 1];
  if (samples[samples.length - 1].point !== last) {
    samples.push({ point: last, distanceFromStart: totalDistance });
  }

  return samples;
}

export function findNearestRoutePoint(
  location: Coordinates,
  routePoints: Coordinates[],
): { index: number; distance: number } {
  let minDist = Infinity;
  let nearestIndex = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineDistance(location, routePoints[i]);
    if (d < minDist) {
      minDist = d;
      nearestIndex = i;
    }
  }
  return { index: nearestIndex, distance: minDist };
}

export function calculateCumulativeDistances(points: Coordinates[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + haversineDistance(points[i - 1], points[i]));
  }
  return distances;
}
