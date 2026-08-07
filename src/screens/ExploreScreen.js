import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, StatusBar, ScrollView, Image, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Circle, Image as SvgImage, ClipPath, Defs } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { ensureLocationReady } from '../utils/locationHelper';
import { theme } from '../theme';
import { Search, LayoutGrid, Crosshair, Star, X, Navigation, Store, Smartphone, Pill, LocateFixed } from 'lucide-react-native';
import { useTranslation } from '../utils/translations';

const CATEGORY_ICONS = {
  groceries: Store,
  grocery: Store,
  staples: Store,
  electronics: Smartphone,
  pharmacy: Pill,
};

const getShopIcon = (category) => CATEGORY_ICONS[(category || '').toLowerCase()] || Store;

// react-native-maps' Android Marker snapshot never reliably captures an
// <Image>'s content in this app — confirmed on-device across four distinct
// approaches (remote URI, prefetched, base64 data-URI, and even a locally
// bundled require()'d asset with no network involved at all): every one
// rendered blank. The common thread across all of them is <Image> itself;
// Text and SVG icons both render correctly and instantly. That points to a
// Fabric (New Architecture) incompatibility in how react-native-maps
// snapshots Image content specifically, not an async-loading problem — so
// pins use a vector icon instead, which has no such issue.
const ShopMapMarker = ({ shop, onPress }) => {
  const imageUrl = shop.banner_url || shop.image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200';
  const ShopIcon = getShopIcon(shop.category);

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(shop.latitude),
        longitude: parseFloat(shop.longitude),
      }}
      onPress={onPress}
      tracksViewChanges={true}
    >
      <View style={styles.shopMarkerContainer} collapsable={false}>
        <View style={styles.shopMarkerBubble} collapsable={false}>
          {/* Fallback Icon inside the bubble */}
          <ShopIcon color={theme.colors.primary} size={20} strokeWidth={2.2} style={{ position: 'absolute' }} />
          
          {/* SVG Circular Cropped Image */}
          <Svg width={43} height={43} viewBox="0 0 100 100">
            <Defs>
              <ClipPath id={`clip-${shop.id}`}>
                <Circle cx="50" cy="50" r="50" />
              </ClipPath>
            </Defs>
            <SvgImage
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
              href={{ uri: imageUrl }}
              clipPath={`url(#clip-${shop.id})`}
            />
          </Svg>
        </View>
        <View style={styles.shopMarkerPinPoint} collapsable={false} />
      </View>
    </Marker>
  );
};

const categoryImages = {
  'All': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&q=80',
  'Groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=100&q=80',
  'Pharmacy': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80',
};

const getCategoryExploreImage = (cat) => {
  return categoryImages[cat] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&q=80';
};

export const ExploreScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const t = useTranslation();

  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategories, setShowCategories] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  const [locationStatus, setLocationStatus] = useState('loading');

  const loadLocation = async () => {
    setLocationStatus('loading');
    try {
      const loc = await ensureLocationReady();
      const coords = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      setUserLocation(coords);
      setRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLocationStatus('ready');
    } catch (err) {
      console.warn('Explore location failed:', err);
      setLocationStatus('failed');
      setRegion(null);
    }
  };

  // 1. Fetch Location
  useEffect(() => {
    loadLocation();
  }, []);

  // 2. Fetch Nearby Shops
  const { data: nearbyShops } = useQuery({
    queryKey: ['exploreShops_v3', region?.latitude, region?.longitude, selectedDistance],
    queryFn: async () => {
      if (!region) return [];
      const res = await axiosClient.get(`/shops/nearby?lat=${region.latitude}&lng=${region.longitude}&radius=${selectedDistance}`);
      return res.data.shops;
    },
    enabled: !!region
  });

  // 3. Fetch Nearby Products
  const { data: nearbyProducts } = useQuery({
    queryKey: ['exploreProducts', region?.latitude, region?.longitude, selectedDistance],
    queryFn: async () => {
      if (!region) return [];
      const res = await axiosClient.get(`/shops/nearby-products?lat=${region.latitude}&lng=${region.longitude}&category=All`);
      return res.data.products || [];
    },
    enabled: !!region
  });

  const filteredShops = useMemo(() => {
    if (!nearbyShops) return [];
    
    let result = nearbyShops;
    
    if (selectedCategory !== 'All') {
      result = result.filter(shop => shop.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      
      // 1. Direct shop name or category matches
      const directShopMatches = result.filter(shop => {
        const matchName = shop.name && shop.name.toLowerCase().includes(lowerQuery);
        const matchCategory = shop.category && shop.category.toLowerCase().includes(lowerQuery);
        return matchName || matchCategory;
      });

      // 2. Matching products
      const matchingProducts = (nearbyProducts || []).filter(p =>
        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
        (p.category && p.category.toLowerCase().includes(lowerQuery))
      );

      // 3. Shops selling matching products
      const matchingProductShopIds = matchingProducts.map(p => p.shop_id);
      const productMatchingShops = result.filter(shop => matchingProductShopIds.includes(shop.id));

      // Combine unique shops
      const combinedMatchesMap = new Map();
      [...directShopMatches, ...productMatchingShops].forEach(s => {
        if (!combinedMatchesMap.has(s.id)) {
          combinedMatchesMap.set(s.id, s);
        }
      });
      result = Array.from(combinedMatchesMap.values());
    }
    
    return result;
  }, [nearbyShops, nearbyProducts, searchQuery, selectedCategory]);

  const availableCategories = useMemo(() => {
    if (!nearbyShops) return ['All'];
    return ['All', ...new Set(nearbyShops.map(s => s.category).filter(Boolean))];
  }, [nearbyShops]);

  const suggestions = useMemo(() => {
    if (!nearbyShops || !searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    const list = [];
    const seenNames = new Set();
    
    // 1. Direct shop name matches
    nearbyShops.forEach(shop => {
      if (shop.name && shop.name.toLowerCase().includes(lowerQuery) && !seenNames.has(shop.name)) {
        seenNames.add(shop.name);
        list.push({
          text: shop.name,
          image: shop.banner_url || shop.image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200',
          type: 'shop'
        });
      }
    });

    // 2. Direct category matches
    nearbyShops.forEach(shop => {
      if (shop.category && shop.category.toLowerCase().includes(lowerQuery) && !seenNames.has(shop.category)) {
        seenNames.add(shop.category);
        list.push({
          text: shop.category,
          image: getCategoryExploreImage(shop.category),
          type: 'category'
        });
      }
    });

    // 3. Direct product name matches
    (nearbyProducts || []).forEach(p => {
      if (p.name && p.name.toLowerCase().includes(lowerQuery) && !seenNames.has(p.name)) {
        seenNames.add(p.name);
        list.push({
          text: p.name,
          image: p.image_url || 'https://via.placeholder.com/60',
          type: 'product'
        });
      }
    });

    return list.slice(0, 5);
  }, [nearbyShops, nearbyProducts, searchQuery]);

  const centerOnUser = async () => {
    try {
      const loc = await ensureLocationReady();
      const newRegion = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (err) {
      // The helper already shows alerts
    }
  };

  const handleMarkerPress = (shop) => {
    setSelectedShop(shop);
    if (mapRef.current && shop.latitude && shop.longitude) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(shop.latitude),
        longitude: parseFloat(shop.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  if (locationStatus === 'failed') {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Location Required</Text>
          <Text style={styles.fallbackText}>Please turn on location to explore shops around you.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadLocation}>
            <Text style={styles.retryBtnText}>Turn On Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={Platform.OS === 'ios'}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {Platform.OS === 'android' && userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userLocationDotOuter}>
              <View style={styles.userLocationDotInner} />
            </View>
          </Marker>
        )}
        {filteredShops?.map((shop) => (
          <ShopMapMarker
            key={shop.id.toString()}
            shop={shop}
            onPress={() => handleMarkerPress(shop)}
          />
        ))}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView style={styles.floatingHeaderSafeArea}>
        <View style={styles.floatingHeaderRow}>
          <View style={{ flex: 1, zIndex: 20 }}>
            <View style={styles.searchBar}>
              <Search color="#666" size={20} style={{marginRight: 10}} />
              <TextInput 
                style={styles.searchInput}
                placeholder={t('searchPlaceholderExplore')}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
            </View>

            {/* Suggestions Dropdown */}
            {isSearchFocused && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(suggestion.text);
                      setIsSearchFocused(false);
                    }}
                  >
                    {suggestion.image ? (
                      <Image 
                        source={{ uri: suggestion.image }} 
                        style={styles.suggestionImage} 
                      />
                    ) : (
                      <Search color="#999" size={16} style={{marginRight: 12}} />
                    )}
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, showCategories && { backgroundColor: theme.colors.primary }]} 
            onPress={() => setShowCategories(!showCategories)}
          >
            <LayoutGrid color={showCategories ? "#FFF" : theme.colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Categories Selector Chips (Toggleable) */}
        {showCategories && (
          <View style={[styles.distanceSelectorContainer, { marginBottom: 8 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.distanceScroll}>
              {availableCategories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.categoryExploreChip, isSelected && styles.categoryExploreChipSelected]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: getCategoryExploreImage(cat) }} style={styles.categoryExploreChipImage} />
                    <Text style={[styles.categoryExploreChipText, isSelected && styles.categoryExploreChipTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}


      </SafeAreaView>

      {/* GPS Button */}
      <TouchableOpacity style={[styles.gpsBtn, selectedShop ? { bottom: 180 } : {}]} onPress={centerOnUser}>
        <LocateFixed color={theme.colors.primary} size={24} />
      </TouchableOpacity>

      {/* Shop Popup Card */}
      {selectedShop && (
        <View style={styles.shopPopupContainer}>
          <TouchableOpacity 
            style={styles.shopPopupCard}
            onPress={() => navigation.navigate('ShopStorefront', { id: selectedShop.id })}
          >
            <TouchableOpacity style={styles.shopPopupClose} onPress={() => setSelectedShop(null)}>
              <X color="#666" size={20} />
            </TouchableOpacity>
            
            <Image source={{ uri: selectedShop.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e' }} style={styles.shopPopupImage} />
            <View style={styles.shopPopupContent}>
              <Text style={styles.shopPopupName} numberOfLines={1}>{selectedShop.name}</Text>
              <Text style={styles.shopPopupCategory}>{selectedShop.category}</Text>
              <View style={styles.shopPopupMeta}>
                <View style={styles.shopPopupRating}>
                  <Star color="#F59E0B" fill="#F59E0B" size={14} />
                  <Text style={styles.shopPopupRatingText}>{selectedShop.rating_avg}</Text>
                </View>
                <View style={styles.shopPopupDistance}>
                  <Navigation color="#666" size={14} />
                  <Text style={styles.shopPopupDistanceText}>
                    {selectedShop.distance ? selectedShop.distance.toFixed(1) + ' km' : 'Nearby'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  floatingHeaderSafeArea: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    ...theme.shadows.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 8,
    ...theme.shadows.medium,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  suggestionImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    ...theme.shadows.medium,
  },
  gpsBtn: {
    position: 'absolute',
    bottom: 20, // Tab bar is translucent or below this usually
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
    zIndex: 10,
  },
  distanceSelectorContainer: {
    marginTop: 12,
  },
  distanceScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  distanceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  distanceChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  distanceChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  distanceChipTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  shopPopupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'transparent',
  },
  shopPopupCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  shopPopupClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  shopPopupImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  shopPopupContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  shopPopupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopPopupCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  shopPopupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopPopupRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  shopPopupRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  shopPopupDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopPopupDistanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fallbackContainer: {
    backgroundColor: '#ECFDF5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 30,
  },
  fallbackTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  fallbackText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shopMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopMarkerBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  shopMarkerImage: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
  },
  shopMarkerPinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.primary,
    marginTop: -1,
  },
  categoryExploreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryExploreChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryExploreChipImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
    backgroundColor: '#E2E8F0',
  },
  categoryExploreChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryExploreChipTextSelected: {
    color: '#FFF',
  },
  userLocationDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
});

export default ExploreScreen;
