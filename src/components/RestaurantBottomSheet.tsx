import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Restaurant, Filters } from '../types';
import { COLORS, FOOD_TYPE_OPTIONS, PRICE_DISPLAY } from '../constants';
import { isWithinTimeSlot } from '../utils/timeUtils';
import RestaurantCard from './RestaurantCard';
import FilterModal from './FilterModal';

interface Props {
  restaurants: Restaurant[];
  loading: boolean;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onRestaurantPress: (r: Restaurant) => void;
  selectedId: string | null;
  routeLoaded: boolean;
}

function applyFilters(list: Restaurant[], f: Filters): Restaurant[] {
  return list.filter(r => {
    if (f.driveThruOnly && r.driveThruAvailable !== true) return false;
    if (f.priceRange.length > 0 && (r.priceLevel === null || !f.priceRange.includes(r.priceLevel)))
      return false;
    if (f.foodTypes.length > 0 && !r.types.some(t => f.foodTypes.includes(t))) return false;
    if (!isWithinTimeSlot(r.estimatedArrivalTime, f.timeSlotStart, f.timeSlotEnd)) return false;
    return true;
  });
}

function hasActive(f: Filters): boolean {
  return f.driveThruOnly || f.priceRange.length > 0 || f.foodTypes.length > 0 || !!f.timeSlotStart;
}

const RestaurantBottomSheet = forwardRef<BottomSheet, Props>(
  ({ restaurants, loading, filters, onFiltersChange, onRestaurantPress, selectedId, routeLoaded }, ref) => {
    const snapPoints = useMemo(() => ['14%', '50%', '92%'], []);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const filtered = useMemo(() => applyFilters(restaurants, filters), [restaurants, filters]);
    const active = hasActive(filters);

    const toggleDriveThru = () =>
      onFiltersChange({ ...filters, driveThruOnly: !filters.driveThruOnly });

    const togglePrice = (level: number) => {
      const next = filters.priceRange.includes(level)
        ? filters.priceRange.filter(p => p !== level)
        : [...filters.priceRange, level];
      onFiltersChange({ ...filters, priceRange: next });
    };

    const toggleFoodType = (types: string[]) => {
      const allOn = types.every(t => filters.foodTypes.includes(t));
      const next = allOn
        ? filters.foodTypes.filter(t => !types.includes(t))
        : [...new Set([...filters.foodTypes, ...types])];
      onFiltersChange({ ...filters, foodTypes: next });
    };

    const renderItem = useCallback(
      ({ item }: { item: Restaurant }) => (
        <RestaurantCard
          restaurant={item}
          onPress={onRestaurantPress}
          isSelected={item.id === selectedId}
        />
      ),
      [onRestaurantPress, selectedId],
    );

    const Header = (
      <View>
        {/* Summary row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            {!routeLoaded
              ? 'Enter a route above to start'
              : loading
              ? 'Searching for restaurants…'
              : `${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''} on route`}
          </Text>
          <TouchableOpacity
            style={[styles.filterBtn, active && styles.filterBtnOn]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={[styles.filterBtnText, active && styles.filterBtnTextOn]}>
              Filters{active ? ' ●' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick-filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, filters.driveThruOnly && styles.chipOn]}
            onPress={toggleDriveThru}
          >
            <Text style={[styles.chipText, filters.driveThruOnly && styles.chipTextOn]}>
              🚗 Drive-Thru
            </Text>
          </TouchableOpacity>

          {([1, 2, 3] as const).map(level => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, filters.priceRange.includes(level) && styles.chipOn]}
              onPress={() => togglePrice(level)}
            >
              <Text
                style={[
                  styles.chipText,
                  filters.priceRange.includes(level) && styles.chipTextOn,
                ]}
              >
                {PRICE_DISPLAY[level]}
              </Text>
            </TouchableOpacity>
          ))}

          {FOOD_TYPE_OPTIONS.slice(0, 5).map(opt => {
            const on = opt.types.some(t => filters.foodTypes.includes(t));
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleFoodType(opt.types)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {opt.emoji} {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching along your route…</Text>
          </View>
        )}
      </View>
    );

    return (
      <>
        <BottomSheet
          ref={ref}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.handle}
        >
          <BottomSheetFlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListHeaderComponent={Header}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              routeLoaded && !loading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {active
                      ? 'No restaurants match your filters.\nTry adjusting them.'
                      : 'No restaurants found along this route.'}
                  </Text>
                </View>
              ) : null
            }
          />
        </BottomSheet>

        <FilterModal
          visible={filterModalVisible}
          filters={filters}
          onApply={onFiltersChange}
          onClose={() => setFilterModalVisible(false)}
        />
      </>
    );
  },
);

RestaurantBottomSheet.displayName = 'RestaurantBottomSheet';
export default RestaurantBottomSheet;

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: { backgroundColor: COLORS.border, width: 36, height: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterBtnOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterBtnTextOn: { color: COLORS.primary, fontWeight: '700' },
  chips: { flexGrow: 0 },
  chipsContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextOn: { color: COLORS.primary, fontWeight: '600' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  listContent: { paddingBottom: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
