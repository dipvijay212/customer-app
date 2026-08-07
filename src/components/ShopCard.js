import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ChevronRight, Clock, MapPin } from 'lucide-react-native';

const ShopCard = ({ shop, onPress, distance, variant = 'large' }) => {
  const isOpen = shop?.status === 'active' || shop?.is_open !== false;

  const deliveryTime = shop?.delivery_time || '20-30 mins';
  const displayDistance = distance !== undefined ? `${distance.toFixed(1)} km` : shop?.distance ? `${parseFloat(shop.distance).toFixed(1)} km` : '1.2 km';

  if (variant === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.88}>
        {/* Left Shop Thumbnail Image */}
        <View style={styles.listImageWrapper}>
          <Image
            source={{ uri: shop.banner_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400' }}
            style={styles.listImage}
          />
          <View style={[styles.statusDot, { backgroundColor: isOpen ? '#22C55E' : '#94A3B8' }]} />
        </View>

        {/* Middle Content */}
        <View style={styles.listContent}>
          {/* Shop Name & Status Badge */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listName} numberOfLines={1}>{shop.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#DCFCE7' : '#F1F5F9' }]}>
              <Text style={[styles.statusBadgeText, { color: isOpen ? '#15803D' : '#64748B' }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Category Tag */}
          <View style={styles.categoryRow}>
            <Text style={styles.categoryPill}>{shop.category || 'General Store'}</Text>
          </View>

          {/* Meta Info: Rating, Delivery Time, Distance */}
          <View style={styles.metaRow}>

            <View style={styles.metaItem}>
              <Clock color={theme.colors.primary} size={13} style={{ marginRight: 3 }} />
              <Text style={styles.metaText}>{deliveryTime}</Text>
            </View>

            <Text style={styles.metaDot}>•</Text>

            <View style={styles.metaItem}>
              <MapPin color="#64748B" size={13} style={{ marginRight: 3 }} />
              <Text style={styles.metaText}>{displayDistance}</Text>
            </View>
          </View>
        </View>

        {/* Right Arrow Button */}
        <View style={styles.actionBtn}>
          <ChevronRight color={theme.colors.primary} size={18} />
        </View>
      </TouchableOpacity>
    );
  }

  // Large Card Variant (My Shops Horizontal Scroll)
  return (
    <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.largeImageContainer}>
        <Image
          source={{ uri: shop.banner_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400' }}
          style={styles.largeBanner}
        />
        <View style={[styles.largeBadgeOverlay, { backgroundColor: isOpen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(148, 163, 184, 0.9)' }]}>
          <Text style={styles.largeBadgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
        </View>
      </View>
      
      <View style={styles.largeContent}>
        <Text style={styles.largeName} numberOfLines={1}>{shop.name}</Text>
        <Text style={styles.largeCategory}>{shop.category}</Text>
        <View style={styles.largeMetaRow}>
          <Text style={styles.metaText}>{displayDistance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // List Variant (Nearby Shops)
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  listImageWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  listImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metaDot: {
    fontSize: 11,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Large Variant (My Shops)
  largeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 6,
    marginRight: 16,
    width: 220,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  largeImageContainer: {
    position: 'relative',
    width: '100%',
    height: 125,
  },
  largeBanner: {
    width: '100%',
    height: '100%',
  },
  largeBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  largeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  largeContent: {
    padding: 14,
  },
  largeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  largeCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  largeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ShopCard;
