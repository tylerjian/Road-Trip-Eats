import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Filters } from '../types';
import { COLORS, FOOD_TYPE_OPTIONS, PRICE_DISPLAY } from '../constants';

interface Props {
  visible: boolean;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

const TIME_PRESETS = [
  { label: 'Breakfast', startH: 6, startM: 0, endH: 10, endM: 0 },
  { label: 'Lunch', startH: 11, startM: 0, endH: 14, endM: 0 },
  { label: 'Dinner', startH: 17, startM: 0, endH: 21, endM: 0 },
  { label: 'Late Night', startH: 21, startM: 0, endH: 2, endM: 0 },
];

function makeDate(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function matchesPreset(
  preset: (typeof TIME_PRESETS)[number],
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start || !end) return false;
  return start.getHours() === preset.startH && end.getHours() === preset.endH;
}

export default function FilterModal({ visible, filters, onApply, onClose }: Props) {
  const [local, setLocal] = useState<Filters>(filters);

  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible]);

  const togglePrice = (level: number) => {
    setLocal(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(level)
        ? prev.priceRange.filter(p => p !== level)
        : [...prev.priceRange, level],
    }));
  };

  const toggleFoodTypes = (types: string[]) => {
    const allActive = types.every(t => local.foodTypes.includes(t));
    setLocal(prev => ({
      ...prev,
      foodTypes: allActive
        ? prev.foodTypes.filter(t => !types.includes(t))
        : [...new Set([...prev.foodTypes, ...types])],
    }));
  };

  const setPreset = (preset: (typeof TIME_PRESETS)[number] | null) => {
    if (!preset) {
      setLocal(prev => ({ ...prev, timeSlotStart: null, timeSlotEnd: null }));
    } else {
      setLocal(prev => ({
        ...prev,
        timeSlotStart: makeDate(preset.startH, preset.startM),
        timeSlotEnd: makeDate(preset.endH, preset.endM),
      }));
    }
  };

  const reset = () => {
    setLocal({ timeSlotStart: null, timeSlotEnd: null, priceRange: [], driveThruOnly: false, foodTypes: [] });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Meal Time */}
          <Text style={styles.section}>Meal Time</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !local.timeSlotStart && styles.chipOn]}
              onPress={() => setPreset(null)}
            >
              <Text style={[styles.chipText, !local.timeSlotStart && styles.chipTextOn]}>Any Time</Text>
            </TouchableOpacity>
            {TIME_PRESETS.map(p => (
              <TouchableOpacity
                key={p.label}
                style={[styles.chip, matchesPreset(p, local.timeSlotStart, local.timeSlotEnd) && styles.chipOn]}
                onPress={() =>
                  setPreset(matchesPreset(p, local.timeSlotStart, local.timeSlotEnd) ? null : p)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    matchesPreset(p, local.timeSlotStart, local.timeSlotEnd) && styles.chipTextOn,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <Text style={styles.section}>Price Range</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4].map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, local.priceRange.includes(level) && styles.chipOn]}
                onPress={() => togglePrice(level)}
              >
                <Text
                  style={[styles.chipText, local.priceRange.includes(level) && styles.chipTextOn]}
                >
                  {PRICE_DISPLAY[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Drive-Thru */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Drive-Thru Only</Text>
            <Switch
              value={local.driveThruOnly}
              onValueChange={val => setLocal(prev => ({ ...prev, driveThruOnly: val }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Food Type */}
          <Text style={styles.section}>Food Type</Text>
          <View style={styles.chipRow}>
            {FOOD_TYPE_OPTIONS.map(opt => {
              const active = opt.types.some(t => local.foodTypes.includes(t));
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, styles.chipWithEmoji, active && styles.chipOn]}
                  onPress={() => toggleFoodTypes(opt.types)}
                >
                  <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.chipText, active && styles.chipTextOn]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => {
              onApply(local);
              onClose();
            }}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cancel: { fontSize: 15, color: COLORS.textSecondary },
  reset: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 14, marginRight: 5 },
  chipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextOn: { color: COLORS.primary, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
    marginVertical: 8,
  },
  toggleLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
