import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, TextInput, Image, Platform, StatusBar, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import ShopCard from '../components/ShopCard';
import ProductCard from '../components/ProductCard';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Search, ChevronDown, ChevronRight, XCircle, Bell, QrCode, Check, Store, Star, Clock } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ensureLocationReady } from '../utils/locationHelper';
import Toast from 'react-native-toast-message';
import { getCartItemTotal } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';

const CATEGORY_IMAGE_MAP = {
  All: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&q=80',
  Groceries: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
  Grocery: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
  Vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80',
  Fruits: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80',
  Dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80',
  Household: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80',
  Electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
  Pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80',
  Beverages: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80',
  Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
};
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80';

export const HomeScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const t = useTranslation();
  
  const { data: location, isLoading: loadingLocation, isError: locationError, refetch: refetchLocation } = useQuery({
    queryKey: ['userLocation'],
    queryFn: async () => {
      return await ensureLocationReady();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const locationStatus = loadingLocation ? 'loading' : locationError ? 'failed' : 'ready';
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCartBanner, setShowCartBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { data: myShops, isLoading: loadingMyShops, refetch: refetchMyShops } = useQuery({
    queryKey: ['myShops'],
    queryFn: async () => {
      const res = await axiosClient.get('/my-shops');
      return res.data.savedShops;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: nearbyShops, isLoading: loadingNearby, refetch: refetchNearby } = useQuery({
    queryKey: ['nearbyShops', location?.latitude, location?.longitude],
    queryFn: async () => {
      if (!location) return [];
      const res = await axiosClient.get(`/shops/nearby?lat=${location.latitude}&lng=${location.longitude}`);
      return res.data.shops;
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 5,
  });

  const { data: nearbyProducts, isLoading: loadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['nearbyProducts', location?.latitude, location?.longitude, selectedCategory],
    queryFn: async () => {
      if (!location) return [];
      const res = await axiosClient.get(`/shops/nearby-products?lat=${location.latitude}&lng=${location.longitude}&category=${selectedCategory}`);
      return res.data.products;
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 5,
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosClient.get('/cart');
      return res.data.carts;
    }
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axiosClient.get('/addresses');
      return res.data.addresses;
    }
  });

  const selectedAddress = addresses?.find(a => a.is_default) || addresses?.[0];
  const locationDisplayText = selectedAddress 
    ? `${selectedAddress.label ? selectedAddress.label + ' - ' : ''}${selectedAddress.line2 || selectedAddress.line1}` 
    : 'Downtown, Sector 5';

  const globalCartCount = Array.isArray(cartData) ? cartData.reduce((acc, cart) => acc + (cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0) : 0;
  const globalCartTotal = Array.isArray(cartData) ? cartData.reduce((acc, cart) => acc + (cart.items?.reduce((sum, item) => sum + getCartItemTotal(item), 0) || 0), 0) : 0;

  const previousCountRef = useRef(globalCartCount);
  useEffect(() => {
    if (globalCartCount > 0 && globalCartCount !== previousCountRef.current) {
      setShowCartBanner(true);
      const timer = setTimeout(() => setShowCartBanner(false), 3000);
      previousCountRef.current = globalCartCount;
      return () => clearTimeout(timer);
    }
    previousCountRef.current = globalCartCount;
  }, [globalCartCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLocation(), refetchMyShops(), refetchNearby(), refetchProducts()]);
    setRefreshing(false);
  };

  const handleShopPress = (id) => {
    navigation.navigate('ShopStorefront', { id });
  };

  const nearbyCategories = ['All', ...new Set(nearbyShops?.map(s => s.category).filter(Boolean))];
  const filteredNearbyShops = selectedCategory === 'All' 
    ? nearbyShops
    : nearbyShops?.filter(s => s.category === selectedCategory);

  const addToCartMutation = useMutation({
    mutationFn: async ({ shopId, productId, quantity, unit, price, note }) => {
      const res = await axiosClient.post(`/cart/${shopId}/items`, { productId, quantity, unit, price, note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const getCartItemsForProduct = (product) => {
    if (!cartData || !Array.isArray(cartData)) return [];
    const shopCart = cartData.find(c => c.shop?.id == product.shop_id);
    if (!shopCart) return [];
    return shopCart.items?.filter(i => i.product_id == product.id) || [];
  };

  const combinedShopsMap = useMemo(() => {
    const map = new Map();
    [...(nearbyShops || []), ...(myShops || [])].forEach(s => {
      if (s && s.id && !map.has(s.id)) {
        map.set(s.id, s);
      }
    });
    return map;
  }, [nearbyShops, myShops]);

  const allShopsList = useMemo(() => Array.from(combinedShopsMap.values()), [combinedShopsMap]);

  const isSearching = searchQuery.trim().length > 0;
  
  let listData = [{ key: 'myShops' }, { key: 'nearbyShops' }];
  
  if (isSearching) {
    const query = searchQuery.trim().toLowerCase();

    // 1. Direct shop matches
    const directShopMatches = allShopsList.filter(s => 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.category && s.category.toLowerCase().includes(query))
    );

    // 2. Matching products
    const matchingProducts = (nearbyProducts || []).filter(p =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
    );

    // 3. Shops selling matching products
    const matchingProductShopIds = matchingProducts.map(p => p.shop_id);
    const productMatchingShops = allShopsList.filter(s => matchingProductShopIds.includes(s.id));

    // Combine unique matching shops
    const searchShopsResultMap = new Map();
    [...directShopMatches, ...productMatchingShops].forEach(s => {
      if (!searchShopsResultMap.has(s.id)) {
        searchShopsResultMap.set(s.id, s);
      }
    });
    const finalMatchingShops = Array.from(searchShopsResultMap.values());

    listData = [];

    if (finalMatchingShops.length > 0) {
      listData.push({
        key: 'search_shops_section',
        type: 'searchShopsSection',
        shops: finalMatchingShops,
        matchingProducts: matchingProducts,
      });
    }

    if (listData.length === 0) {
      listData = [{ key: 'no_results' }];
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        {/* Top Left: Local Area Name */}
        <TouchableOpacity style={styles.locationDropdown} onPress={() => navigation.navigate('AddressList')}>
          <MapPin color={theme.colors.primary} size={18} style={{marginRight: 6}} />
          <View style={{flexShrink: 1, paddingRight: 4}}>
            <Text style={styles.locationLabel}>{t('deliveringTo')}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.locationText} numberOfLines={1}>{locationDisplayText}</Text>
              <ChevronDown color={theme.colors.text} size={14} style={{marginLeft: 2}} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Top Right: Notification Bell */}
        <View style={styles.headerRightIcons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            activeOpacity={0.7}
          >
            <View style={styles.bellWrapper}>
              <Bell color={theme.colors.text} size={22} />
              <View style={styles.notificationBadgeDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.mainTitle}>
        <Text style={{color: theme.colors.primary}}>Local</Text> Shops
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={theme.colors.primary} size={20} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder={t('searchPlaceholderHome')}
          placeholderTextColor={theme.colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <XCircle color={theme.colors.textLight} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={listData}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        renderItem={({ item }) => {
          if (item.key === 'no_results') {
            return (
              <View style={styles.noResultsContainer}>
                <Search color={theme.colors.textLight} size={44} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtext}>
                  No products or shops found matching "{searchQuery}". Try searching for another keyword or shop name.
                </Text>
              </View>
            );
          }


          if (item.type === 'searchShopsSection') {
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Matching Shops ({item.shops.length})</Text>
                </View>
                {item.shops.map((shop, index) => {
                  const shopProducts = (item.matchingProducts || []).filter(p => p.shop_id === shop.id);
                  const isOpen = shop?.status === 'active' || shop?.is_open !== false;
                  const rating = shop?.rating || '4.8';
                  const deliveryTime = shop?.delivery_time || '20-30 mins';
                  const displayDistance = shop.distance !== undefined ? `${shop.distance.toFixed(1)} km` : shop?.distance ? `${parseFloat(shop.distance).toFixed(1)} km` : '1.2 km';

                  return (
                    <View key={`search_shop_${shop.id}_${index}`} style={styles.searchShopCardContainer}>
                      {/* Shop Header Row inside unified card */}
                      <TouchableOpacity 
                        style={styles.searchShopHeader}
                        onPress={() => handleShopPress(shop.id)}
                        activeOpacity={0.8}
                      >
                        {/* Left Shop Thumbnail Image */}
                        <View style={styles.searchShopImageWrapper}>
                          <Image
                            source={{ uri: shop.banner_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400' }}
                            style={styles.searchShopImage}
                          />
                          <View style={[styles.searchShopStatusDot, { backgroundColor: isOpen ? '#22C55E' : '#94A3B8' }]} />
                        </View>

                        {/* Middle Content */}
                        <View style={styles.searchShopContent}>
                          {/* Shop Name & Status Badge */}
                          <View style={styles.searchShopHeaderRow}>
                            <Text style={styles.searchShopName} numberOfLines={1}>{shop.name}</Text>
                            <View style={[styles.searchShopStatusBadge, { backgroundColor: isOpen ? '#DCFCE7' : '#F1F5F9' }]}>
                              <Text style={[styles.searchShopStatusBadgeText, { color: isOpen ? '#15803D' : '#64748B' }]}>
                                {isOpen ? 'Open' : 'Closed'}
                              </Text>
                            </View>
                          </View>

                          {/* Category Tag */}
                          <View style={styles.searchShopCategoryRow}>
                            <Text style={styles.searchShopCategoryPill}>{shop.category || 'General Store'}</Text>
                          </View>

                          {/* Meta Info: Rating, Delivery Time, Distance */}
                          <View style={styles.searchShopMetaRow}>
                            <View style={styles.searchShopMetaItem}>
                              <Star color="#F59E0B" fill="#F59E0B" size={13} style={{ marginRight: 3 }} />
                              <Text style={styles.searchShopRatingText}>{rating}</Text>
                            </View>

                            <Text style={styles.searchShopMetaDot}>•</Text>

                            <View style={styles.searchShopMetaItem}>
                              <Clock color={theme.colors.primary} size={13} style={{ marginRight: 3 }} />
                              <Text style={styles.searchShopMetaText}>{deliveryTime}</Text>
                            </View>

                            <Text style={styles.searchShopMetaDot}>•</Text>

                            <View style={styles.searchShopMetaItem}>
                              <MapPin color="#64748B" size={13} style={{ marginRight: 3 }} />
                              <Text style={styles.searchShopMetaText}>{displayDistance}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Right Arrow Button */}
                        <View style={styles.searchShopActionBtn}>
                          <ChevronRight color={theme.colors.primary} size={18} />
                        </View>
                      </TouchableOpacity>

                      {/* Products Section inside the SAME card container */}
                      {shopProducts.length > 0 && (
                        <View style={styles.searchShopProductsContainer}>
                          <Text style={styles.searchShopProductsTitle}>Matching Products ({shopProducts.length})</Text>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.searchShopProductsScroll}
                            keyboardShouldPersistTaps="handled"
                          >
                            {shopProducts.map((product) => {
                              const cartItems = getCartItemsForProduct(product);
                              return (
                                <ProductCard
                                  key={`shop_prod_${product.id}`}
                                  product={product}
                                  cartItems={cartItems}
                                  style={styles.searchShopProductCard}
                                  onQtyChange={(productId, quantity, unit, price, note) => {
                                    addToCartMutation.mutate({
                                      shopId: product.shop_id,
                                      productId,
                                      quantity,
                                      unit,
                                      price,
                                      note
                                    });
                                  }}
                                />
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          }

          if (item.key === 'myShops') {
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{t('myShops')}</Text>
                  {myShops?.length > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('ManageShops')} activeOpacity={0.7}>
                      <Text style={styles.manageLinkText}>Manage</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {loadingMyShops ? (
                  <ActivityIndicator style={{margin: 20}} />
                ) : myShops?.length > 0 ? (
                  <FlatList
                    horizontal
                    data={myShops}
                    keyExtractor={(shop) => shop.id.toString()}
                    renderItem={({ item: shop }) => (
                      <ShopCard shop={shop} variant="large" onPress={() => handleShopPress(shop.id)} />
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: theme.spacing.m }}
                  />
                ) : (
                  <Text style={styles.emptyText}>You haven't added any favorite shops yet.</Text>
                )}
              </View>
            );
          }

          if (item.key === 'nearbyShops') {
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{t('shopsNearby')}</Text>
                </View>
                
                {nearbyCategories.length > 1 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.nearbyCategoryCircleScroll}
                  >
                    {nearbyCategories.map(cat => {
                      const isSelected = selectedCategory === cat;
                      const imageUri = CATEGORY_IMAGE_MAP[cat] || DEFAULT_CATEGORY_IMAGE;
                      return (
                        <TouchableOpacity 
                          key={cat} 
                          style={styles.nearbyCategoryWrapper}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.8}
                        >
                          <View style={[
                            styles.nearbyCategoryCircle,
                            isSelected && styles.nearbyCategoryCircleSelected
                          ]}>
                            <Image 
                              source={{ uri: imageUri }}
                              style={styles.nearbyCategoryImage}
                              resizeMode="cover"
                            />
                            {isSelected && (
                              <View style={styles.selectedCheckOverlay}>
                                <Check color="#FFF" size={14} strokeWidth={3} />
                              </View>
                            )}
                          </View>
                          <Text 
                            style={[
                              styles.nearbyCategoryLabel,
                              isSelected && styles.nearbyCategoryLabelSelected
                            ]} 
                            numberOfLines={1}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {locationStatus === 'failed' ? (
                  <View style={styles.locationFallbackCard}>
                    <Text style={styles.locationFallbackText}>Turn on location to see shops near you</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={refetchLocation}>
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : locationStatus === 'loading' || loadingNearby ? (
                  <ActivityIndicator style={{margin: 20}} color={theme.colors.primary} />
                ) : filteredNearbyShops?.length > 0 ? (
                  <FlatList
                    data={filteredNearbyShops}
                    keyExtractor={(shop) => shop.id.toString()}
                    renderItem={({ item: shop }) => (
                      <ShopCard shop={shop} variant="list" distance={shop.distance} onPress={() => handleShopPress(shop.id)} />
                    )}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.emptyText}>
                    No shops delivering to your location for this category.
                  </Text>
                )}
              </View>
            );
          }

          return null;
        }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      />

      {/* Floating Scanner Button (Bottom Right Corner) */}
      <TouchableOpacity 
        style={[
          styles.scannerFab, 
          showCartBanner && styles.scannerFabShifted
        ]}
        onPress={() => navigation.navigate('QRScanner')}
        activeOpacity={0.85}
      >
        <QrCode color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Sticky Cart Banner */}
      {showCartBanner && (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.stickyCartBannerWrapper}>
          <TouchableOpacity style={styles.stickyCartBannerInner} onPress={() => navigation.navigate('MainTabs', { screen: 'Basket' })}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{globalCartCount}</Text>
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Text style={styles.cartTotalText}>₹{globalCartTotal.toFixed(2)}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  locationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 130,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 14,
  },
  bellWrapper: {
    position: 'relative',
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    ...theme.typography.title,
    paddingHorizontal: theme.spacing.m,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 50,
  },
  searchIcon: {
    marginRight: theme.spacing.s,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...theme.typography.body,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    marginBottom: 12,
  },
  sectionTitle: {
    ...theme.typography.title,
    fontSize: 20,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    paddingHorizontal: theme.spacing.m,
    textAlign: 'center',
    marginTop: theme.spacing.m,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryChipsContainer: {
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: theme.spacing.s,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  locationFallbackCard: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.m,
    borderRadius: 12,
    marginHorizontal: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationFallbackText: {
    ...theme.typography.body,
    color: '#856404',
    flex: 1,
    marginRight: theme.spacing.s,
  },
  retryBtn: {
    backgroundColor: '#856404',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scannerFab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
    zIndex: 99,
  },
  scannerFabShifted: {
    bottom: 90,
  },
  stickyCartBannerWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  stickyCartBannerInner: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cartCountBadge: {
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewCartText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartTotalText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nearbyCategoryCircleScroll: {
    paddingLeft: theme.spacing.m,
    paddingRight: theme.spacing.s,
    paddingVertical: 10,
    marginBottom: 8,
  },
  nearbyCategoryWrapper: {
    alignItems: 'center',
    marginRight: 16,
    width: 66,
  },
  nearbyCategoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  nearbyCategoryCircleSelected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 7,
  },
  nearbyCategoryImage: {
    width: '100%',
    height: '100%',
  },
  selectedCheckOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    backgroundColor: 'rgba(22, 163, 74, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyCategoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  nearbyCategoryLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  searchShopCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchShopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  searchShopImageWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  searchShopImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  searchShopStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchShopContent: {
    flex: 1,
    justifyContent: 'center',
  },
  searchShopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  searchShopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  searchShopStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchShopStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  searchShopCategoryRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  searchShopCategoryPill: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchShopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchShopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchShopRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  searchShopMetaDot: {
    marginHorizontal: 5,
    color: '#94A3B8',
    fontSize: 10,
  },
  searchShopMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  searchShopActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchShopProductsContainer: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  searchShopProductsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchShopProductsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  searchShopProductCard: {
    // Wide enough for the full stepper (−, unit dropdown, +) once an item is
    // in the cart — narrower widths clip the + button off the card's edge.
    width: 172,
    maxWidth: 172,
    margin: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

export default HomeScreen;
