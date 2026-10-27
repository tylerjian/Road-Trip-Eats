export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  priceLevel: number | null; // 0–4
  types: string[];
  primaryType: string | null;
  location: Coordinates;
  estimatedArrivalTime: Date;
  estimatedTravelMinutes: number;
  distanceAlongRoute: number; // meters from start to nearest route point
  distanceFromRoute: number; // meters perpendicular from route
  driveThruAvailable: boolean | null;
  photoName?: string;
  openAtArrival: boolean | null; // null = hours unknown
}

export interface RouteInfo {
  encodedPolyline: string;
  duration: number; // total seconds
  distance: number; // total meters
  decodedPoints: Coordinates[];
  bounds: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

export interface Filters {
  timeSlotStart: Date | null;
  timeSlotEnd: Date | null;
  priceRange: number[]; // selected price levels e.g. [1, 2]
  driveThruOnly: boolean;
  foodTypes: string[]; // primaryType strings; empty = all
}

export interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  driveThroughAvailable?: boolean;
  regularOpeningHours?: { periods?: OpeningPeriod[] };
  utcOffsetMinutes?: number;
  photos?: Array<{ name: string }>;
}

export interface OpeningPeriod {
  open: { day: number; hour: number; minute: number }; // day 0 = Sunday
  close?: { day: number; hour: number; minute: number }; // absent = open 24/7
}
