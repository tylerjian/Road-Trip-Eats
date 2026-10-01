import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, GOOGLE_MAPS_API_KEY } from '../constants';
import { Coordinates } from '../types';

interface Props {
  onOriginChange: (address: string, coords: Coordinates) => void;
  onDestinationChange: (address: string, coords: Coordinates) => void;
  onUseCurrentLocation: () => void;
  originLabel?: string;
}

export default function SearchCard({
  onOriginChange,
  onDestinationChange,
  onUseCurrentLocation,
  originLabel,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Route line indicator */}
      <View style={styles.routeBar} pointerEvents="none">
        <View style={styles.dotOrigin} />
        <View style={styles.line} />
        <View style={styles.dotDest} />
      </View>

      <View style={styles.fields}>
        {/* Origin */}
        <View style={styles.inputRow}>
          <GooglePlacesAutocomplete
            placeholder={originLabel || 'Starting location…'}
            onPress={(data, details) => {
              if (details?.geometry?.location) {
                onOriginChange(data.description, {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
              }
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
            fetchDetails
            styles={acStyles}
            enablePoweredByContainer={false}
            keepResultsAfterBlur={false}
            onFail={err => console.warn('Places (origin):', err)}
            onNotFound={() => console.warn('Places (origin): not found')}
          />
          <TouchableOpacity
            onPress={onUseCurrentLocation}
            style={styles.locBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.locIcon}>📍</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Destination */}
        <View style={styles.inputRow}>
          <GooglePlacesAutocomplete
            placeholder="Destination…"
            onPress={(data, details) => {
              if (details?.geometry?.location) {
                onDestinationChange(data.description, {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
              }
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
            fetchDetails
            styles={acStyles}
            enablePoweredByContainer={false}
            keepResultsAfterBlur={false}
            onFail={err => console.warn('Places (dest):', err)}
            onNotFound={() => console.warn('Places (dest): not found')}
          />
        </View>
      </View>
    </View>
  );
}

const acStyles = {
  container: { flex: 1 },
  textInputContainer: { backgroundColor: 'transparent' },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 15,
    color: COLORS.text,
    height: 40,
    paddingHorizontal: 4,
    marginTop: 0,
    marginBottom: 0,
  },
  // The list renders inside the component; removing height constraints on
  // the parent (inputRow) lets it overflow downward and stay visible.
  listView: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginTop: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 9999,
  },
  row: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row' as const,
  },
  description: { fontSize: 14, color: COLORS.text },
  separator: { height: 1, backgroundColor: COLORS.divider },
  poweredContainer: { height: 0, opacity: 0 },
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  routeBar: {
    width: 16,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    marginRight: 8,
  },
  dotOrigin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 3,
    minHeight: 8,
  },
  dotDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.closed,
  },
  fields: { flex: 1 },
  // No height constraint — lets the autocomplete list expand downward freely
  inputRow: { flexDirection: 'row', alignItems: 'flex-start' },
  divider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 4 },
  locBtn: { paddingTop: 10, paddingLeft: 6 },
  locIcon: { fontSize: 18 },
});
