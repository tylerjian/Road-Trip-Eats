import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Restaurant } from '../types';
import { COLORS, PRICE_DISPLAY } from '../constants';
import { formatTime, formatDistance } from '../utils/timeUtils';

interface Props {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  isSelected?: boolean;
}

const TYPE_EMOJI: Record<string, string> = {
  fast_food_restaurant: '🍔',
  hamburger_restaurant: '🍔',
  pizza_restaurant: '🍕',
  mexican_restaurant: '🌮',
  chinese_restaurant: '🥡',
  japanese_restaurant: '🍱',
  sushi_restaurant: '🍱',
  ramen_restaurant: '🍜',
  american_restaurant: '🥩',
  italian_restaurant: '🍝',
  sandwich_shop: '🥪',
  seafood_restaurant: '🐟',
  barbecue_restaurant: '🍖',
  cafe: '☕',
  coffee_shop: '☕',
};

function getEmoji(primaryType: string | null, types: string[]): string {
  if (primaryType && TYPE_EMOJI[primaryType]) return TYPE_EMOJI[primaryType];
  for (const t of types) {
    if (TYPE_EMOJI[t]) return TYPE_EMOJI[t];
  }
  return '🍽️';
}

function formatTypeName(primaryType: string | null): string {
  if (!primaryType) return 'Restaurant';
  return primaryType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Restaurant', '')
    .replace('Shop', '')
    .trim();
}

export default function RestaurantCard({ restaurant, onPress, isSelected }: Props) {
  const emoji = getEmoji(restaurant.primaryType, restaurant.types);
  const price = restaurant.priceLevel !== null ? PRICE_DISPLAY[restaurant.priceLevel] : null;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.time}>{formatTime(restaurant.estimatedArrivalTime)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.typeText}>{formatTypeName(restaurant.primaryType)}</Text>
          <Text style={styles.detour}>
            {formatDistance(restaurant.distanceFromRoute)} off-route
          </Text>
        </View>

        <View style={styles.row}>
          {restaurant.rating !== null && (
            <Text style={styles.rating}>★ {restaurant.rating.toFixed(1)}</Text>
          )}
          {price && <Text style={styles.price}>{price}</Text>}
          {restaurant.driveThruAvailable === true && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Drive-Thru</Text>
            </View>
          )}
          {restaurant.openNow === false && (
            <Text style={styles.closed}>Closed</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    alignItems: 'flex-start',
  },
  cardSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  iconWrapSelected: {
    backgroundColor: COLORS.primary,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    flexShrink: 0,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detour: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rating: {
    fontSize: 13,
    color: COLORS.rating,
    fontWeight: '500',
    marginRight: 6,
  },
  price: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  badge: {
    backgroundColor: COLORS.driveThru + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.driveThru,
    fontWeight: '600',
  },
  closed: {
    fontSize: 12,
    color: COLORS.closed,
  },
});
