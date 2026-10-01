import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

// PROVIDER_GOOGLE on iOS requires native XCode setup unavailable in Expo managed workflow.
// Use it only on Android; iOS falls back to Apple Maps (same API, no feature loss).
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
import { Coordinates, Filters, Restaurant, RouteInfo } from '../types';
import { COLORS } from '../constants';
import { getDirections } from '../services/directionsService';
import { findRestaurantsAlongRoute } from '../services/placesService';
import SearchCard from '../components/SearchCard';
import RestaurantBottomSheet from '../components/RestaurantBottomSheet';

const INITIAL_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const DEFAULT_FILTERS: Filters = {
  timeSlotStart: null,
  timeSlotEnd: null,
  priceRange: [],
  driveThruOnly: false,
  foodTypes: [],
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const [origin, setOrigin] = useState<{ address: string; coords: Coordinates } | null>(null);
  const [destination, setDestination] = useState<{ address: string; coords: Coordinates } | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const departureTime = useRef<Date>(new Date());

  const handleUseCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow location access to use your current position.');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: Coordinates = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const label = geo
        ? [geo.street, geo.city, geo.region].filter(Boolean).join(', ')
        : 'Current Location';
      setOrigin({ address: label, coords });
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 600);
    } catch {
      Alert.alert('Error', 'Could not get your current location.');
    }
  }, []);

  const handleOriginChange = useCallback((address: string, coords: Coordinates) => {
    setOrigin({ address, coords });
  }, []);

  const handleDestinationChange = useCallback((address: string, coords: Coordinates) => {
    setDestination({ address, coords });
  }, []);

  // Fetch route + restaurants whenever both endpoints are set
  useEffect(() => {
    if (!origin || !destination) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setRestaurants([]);
      setRoute(null);
      setSelectedId(null);
      departureTime.current = new Date();

      try {
        const routeInfo = await getDirections(origin.coords, destination.coords);
        if (cancelled) return;
        setRoute(routeInfo);

        // Sample every 10th decoded point so fitToCoordinates is fast
        const sample = routeInfo.decodedPoints.filter((_, i) => i % 10 === 0);
        mapRef.current?.fitToCoordinates(sample, {
          edgePadding: { top: 180, right: 40, bottom: 320, left: 40 },
          animated: true,
        });
        sheetRef.current?.snapToIndex(1);

        const found = await findRestaurantsAlongRoute(routeInfo, departureTime.current);
        if (cancelled) return;
        setRestaurants(found);
      } catch (err: any) {
        if (!cancelled) Alert.alert('Route error', err.message ?? 'Failed to load route.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [origin, destination]);

  const handleRestaurantPress = useCallback((r: Restaurant) => {
    setSelectedId(r.id);
    mapRef.current?.animateToRegion(
      { ...r.location, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      500,
    );
  }, []);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={MAP_PROVIDER}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {route && (
          <Polyline
            coordinates={route.decodedPoints}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            geodesic
          />
        )}

        {origin && (
          <Marker coordinate={origin.coords} title="Start" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerOrigin}>
              <View style={styles.markerOriginDot} />
            </View>
          </Marker>
        )}

        {destination && (
          <Marker coordinate={destination.coords} title="End" anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerDest} />
          </Marker>
        )}

        {restaurants.map(r => (
          <Marker
            key={r.id}
            coordinate={r.location}
            title={r.name}
            onPress={() => handleRestaurantPress(r)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerRestaurant, r.id === selectedId && styles.markerSelected]}>
              <Text style={styles.markerEmoji}>🍽️</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search card floats over map */}
      <SafeAreaView style={styles.searchOverlay} edges={['top']} pointerEvents="box-none">
        <SearchCard
          onOriginChange={handleOriginChange}
          onDestinationChange={handleDestinationChange}
          onUseCurrentLocation={handleUseCurrentLocation}
          originLabel={origin?.address}
        />
      </SafeAreaView>

      {/* My location button */}
      <TouchableOpacity style={styles.locFab} onPress={handleUseCurrentLocation}>
        <Text style={styles.locFabIcon}>⊕</Text>
      </TouchableOpacity>

      <RestaurantBottomSheet
        ref={sheetRef}
        restaurants={restaurants}
        loading={loading}
        filters={filters}
        onFiltersChange={setFilters}
        onRestaurantPress={handleRestaurantPress}
        selectedId={selectedId}
        routeLoaded={route !== null || loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  locFab: {
    position: 'absolute',
    right: 14,
    bottom: 160,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  locFabIcon: { fontSize: 24, color: COLORS.primary },
  // Origin marker: filled blue circle with white ring
  markerOrigin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markerOriginDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  // Destination: red teardrop
  markerDest: {
    width: 16,
    height: 22,
    borderRadius: 8,
    backgroundColor: COLORS.closed,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Restaurant marker
  markerRestaurant: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  markerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
    transform: [{ scale: 1.2 }],
  },
  markerEmoji: { fontSize: 16 },
});
