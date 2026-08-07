import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TextInput, TouchableOpacity, SafeAreaView, Platform, StatusBar, Modal, KeyboardAvoidingView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import ProductCard from '../components/ProductCard';
import { ArrowLeft, Search, Star, Check, Clock, MapPin, FileText, Plus, Camera, Upload, X, CheckCircle2, ClipboardList, Minus, Bookmark, ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCartItemTotal } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';
import Toast from 'react-native-toast-message';

const CATEGORY_IMAGE_MAP = {
  All: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&q=80',
  Groceries: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
  Grocery: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
  Staples: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80',
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

const StorefrontHeader = React.memo(({
  shop,
  categories,
  isOpen,
  navigation,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  onOpenCustomOrder,
  isSaved,
  onToggleSave,
  cartCount = 0,
}) => {
  const t = useTranslation();
  const deliveryTime = shop?.delivery_time || '20-30 mins';
  const displayDistance = shop?.distance ? `${parseFloat(shop.distance).toFixed(1)} km` : '1.2 km';

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color={theme.colors.primary} size={26} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('localShopsHeader')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.cartIconBtn} 
          onPress={() => navigation.navigate('MainTabs', { screen: 'Basket' })}
          activeOpacity={0.8}
        >
          <ShoppingCart color={theme.colors.primary} size={22} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <Image source={{ uri: shop.banner_url || 'https://via.placeholder.com/600x300' }} style={styles.banner} />
        
        <TouchableOpacity 
          style={[styles.bannerBookmarkBtn, isSaved && styles.bannerBookmarkBtnActive]} 
          onPress={onToggleSave}
          activeOpacity={0.85}
        >
          <Bookmark 
            color="#FFFFFF" 
            fill={isSaved ? '#FFFFFF' : 'rgba(0,0,0,0.15)'} 
            size={20} 
          />
        </TouchableOpacity>

        <View style={styles.bannerOverlay}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#16A34A' : theme.colors.error }]}>
              <Text style={styles.statusText}>{isOpen ? t('open') : t('closed')}</Text>
            </View>
            <View style={styles.timingBadge}>
              <Clock color="#FFF" size={13} style={{ marginRight: 4 }} />
              <Text style={styles.timingText}>{deliveryTime}</Text>
            </View>
            <View style={styles.distanceBadge}>
              <MapPin color="#FFF" size={13} style={{ marginRight: 4 }} />
              <Text style={styles.distanceText}>{displayDistance}</Text>
            </View>
          </View>
          <Text style={styles.shopNameOverlay}>{shop.name}</Text>
          <Text style={styles.shopAddressOverlay} numberOfLines={2}>
            {shop.address} • {displayDistance} • {deliveryTime}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="#999" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={[{ id: null, name: 'All' }, ...(categories || [])]}
        keyExtractor={(item, idx) => (item.id || item.name || item || idx).toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryCircleScroll}
        renderItem={({ item }) => {
          const catName = typeof item === 'string' ? item : item.name;
          const isActive = (activeCategory === catName) || (activeCategory === null && catName === 'All');
          const imageUri = CATEGORY_IMAGE_MAP[catName] || DEFAULT_CATEGORY_IMAGE;
          return (
            <TouchableOpacity
              style={styles.categoryWrapper}
              onPress={() => setActiveCategory(catName === 'All' ? null : catName)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.categoryCircle,
                isActive && styles.categoryCircleActive
              ]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                {isActive && (
                  <View style={styles.selectedCheckOverlay}>
                    <Check color="#FFF" size={14} strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]} numberOfLines={1}>
                {catName}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
});

export const ShopStorefrontScreen = ({ route }) => {
  const { id: shopId, source } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCartBanner, setShowCartBanner] = useState(false);
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { data: shopData, isLoading: isShopLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const url = source ? `/shops/${shopId}?source=${source}` : `/shops/${shopId}`;
      const res = await axiosClient.get(url);
      return res.data;
    }
  });

  const { data: myShops } = useQuery({
    queryKey: ['myShops'],
    queryFn: async () => {
      const res = await axiosClient.get('/my-shops');
      return res.data.savedShops;
    }
  });

  const isSaved = (myShops || []).some(s => s.id == shopId);

  const toggleSaveShopMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await axiosClient.delete(`/my-shops/${shopId}`);
      } else {
        await axiosClient.post('/my-shops', { shopId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myShops']);
      Toast.show({
        type: 'success',
        text1: isSaved ? 'Removed from My Shops' : 'Saved to My Shops! ❤️',
        text2: isSaved ? 'Shop removed from your saved shops.' : 'Shop added to your saved shops!',
        position: 'top',
        visibilityTime: 2500,
      });
    }
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', shopId, searchQuery, activeCategory],
    queryFn: async () => {
      let url = `/shops/${shopId}/products?`;
      if (searchQuery) url += `search=${searchQuery}&`;
      if (activeCategory) url += `category=${activeCategory}&`;
      const res = await axiosClient.get(url);
      return res.data.products;
    }
  });

  const displayedProducts = useMemo(() => {
    if (!productsData) return [];
    let items = productsData;
    if (activeCategory && activeCategory !== 'All') {
      const lowerCat = activeCategory.toLowerCase();
      items = items.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        if (pCat === lowerCat) return true;
        if (lowerCat === 'vegetables' && (pCat.includes('veg') || pName.includes('broccoli') || pName.includes('onion') || pName.includes('tomato') || pName.includes('potato') || pName.includes('carrot'))) return true;
        if (lowerCat === 'fruits' && (pCat.includes('fruit') || pName.includes('apple') || pName.includes('banana') || pName.includes('orange') || pName.includes('mango'))) return true;
        if (lowerCat === 'dairy' && (pCat.includes('dairy') || pName.includes('milk') || pName.includes('egg') || pName.includes('butter') || pName.includes('cheese'))) return true;
        if (lowerCat === 'staples' && (pCat.includes('staple') || pCat.includes('groc') || pName.includes('rice') || pName.includes('flour') || pName.includes('oil') || pName.includes('dal'))) return true;
        if (lowerCat === 'snacks' && (pCat.includes('snack') || pName.includes('chip') || pName.includes('nut'))) return true;
        return pCat.includes(lowerCat) || pName.includes(lowerCat);
      });
    }
    if (searchQuery && searchQuery.trim()) {
      const lowerQ = searchQuery.trim().toLowerCase();
      items = items.filter((p) => 
        (p.name && p.name.toLowerCase().includes(lowerQ)) ||
        (p.category && p.category.toLowerCase().includes(lowerQ))
      );
    }
    return items;
  }, [productsData, activeCategory, searchQuery]);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosClient.get('/cart');
      return res.data.carts;
    }
  });



  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, unit, price }) => {
      await axiosClient.post(`/cart/${shopId}/items`, { productId, quantity, unit, price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const currentShopCart = Array.isArray(cartData) ? cartData.find(c => c.shop?.id === parseInt(shopId)) : null;
  const cartItemsCount = currentShopCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = currentShopCart?.items?.reduce((sum, item) => sum + getCartItemTotal(item), 0) || 0;

  const previousCountRef = useRef(cartItemsCount);
  useEffect(() => {
    if (cartItemsCount > 0 && cartItemsCount !== previousCountRef.current) {
      setShowCartBanner(true);
      const timer = setTimeout(() => setShowCartBanner(false), 3000);
      previousCountRef.current = cartItemsCount;
      return () => clearTimeout(timer);
    }
    previousCountRef.current = cartItemsCount;
  }, [cartItemsCount]);

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customItemText, setCustomItemText] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [customQtyValue, setCustomQtyValue] = useState('1');
  const [customUnit, setCustomUnit] = useState('kg');
  const [hasAttachedList, setHasAttachedList] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const handleAddCustomOrder = async () => {
    if (!customItemText.trim() && !hasAttachedList) {
      Toast.show({
        type: 'error',
        text1: 'Details Required',
        text2: 'Please describe the unlisted item or attach a list image.'
      });
      return;
    }

    setIsSubmittingCustom(true);
    try {
      const parsedQty = Math.max(1, Math.round(parseFloat(customQtyValue) || 1));
      await axiosClient.post(`/cart/${shopId}/items`, {
        productId: 1,
        quantity: parsedQty
      });
      
      queryClient.invalidateQueries(['cart']);
      setCustomModalVisible(false);
      setCustomItemText('');
      setCustomBudget('');
      setCustomQtyValue('1');
      setCustomUnit('kg');
      setHasAttachedList(false);
      setShowCartBanner(true);
      
      Toast.show({
        type: 'success',
        text1: 'Custom Order Added! 🎉',
        text2: `${customQtyValue} ${customUnit} custom request added to your basket for ${shop?.name || 'this shop'}`
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not process custom order request.'
      });
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  if (isShopLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const { shop } = shopData;
  const categories = shop.categories || [];
  const isOpen = shop.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={
          <StorefrontHeader
            shop={shop}
            categories={categories}
            isOpen={isOpen}
            navigation={navigation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onOpenCustomOrder={() => setCustomModalVisible(true)}
            isSaved={isSaved}
            onToggleSave={() => toggleSaveShopMutation.mutate()}
            cartCount={cartItemsCount}
          />
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cartItems = currentShopCart?.items?.filter(i => i.product_id === item.id) || [];
          
          return (
            <ProductCard 
              product={item} 
              cartItems={cartItems} 
              onQtyChange={(productId, quantity, unit, price) => addToCartMutation.mutate({ productId, quantity, unit, price })}
            />
          );
        }}
        ListEmptyComponent={
          isProductsLoading ? (
            <ActivityIndicator style={{marginTop: 40}} color={theme.colors.primary} />
          ) : (
            <Text style={styles.emptyText}>No products found.</Text>
          )
        }
      />

      {showCartBanner && (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.stickyCartBannerWrapper, { bottom: Math.max(insets.bottom + 16, Platform.OS === 'ios' ? 24 : 16) }]}>
          <TouchableOpacity style={styles.stickyCartBannerInner} onPress={() => navigation.navigate('MainTabs', { screen: 'Basket' })}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{cartItemsCount}</Text>
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Text style={styles.cartTotalText}>₹{cartTotal.toFixed(2)}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* CUSTOM ORDER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={customModalVisible}
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ClipboardList color={theme.colors.primary} size={22} style={{marginRight: 8}} />
                <Text style={styles.modalTitle}>Custom Order Request</Text>
              </View>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)} style={{padding: 4}}>
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Request unlisted products directly from <Text style={{fontWeight: '700', color: theme.colors.primary}}>{shop.name}</Text>.
            </Text>

            {/* Item Details Input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Item Description / Shopping List *</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="e.g. 1 kg fresh local sweets, 2 packets special tea leaves, 500g A2 ghee..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={4}
                value={customItemText}
                onChangeText={setCustomItemText}
                textAlignVertical="top"
              />
            </View>

            {/* Custom Quantity & Measurement Unit */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Product Quantity & Measurement Unit *</Text>
              
              {/* Quick Weight/Pack Chips */}
              <View style={styles.quickChipsRow}>
                {[
                  { label: '500 g', val: '500', unit: 'g' },
                  { label: '1 kg', val: '1', unit: 'kg' },
                  { label: '2 kg', val: '2', unit: 'kg' },
                  { label: '1 Litre', val: '1', unit: 'L' },
                  { label: '1 Packet', val: '1', unit: 'Packet' },
                ].map((chip) => {
                  const isActive = customQtyValue === chip.val && customUnit === chip.unit;
                  return (
                    <TouchableOpacity
                      key={chip.label}
                      style={[styles.quickChip, isActive && styles.quickChipActive]}
                      onPress={() => {
                        setCustomQtyValue(chip.val);
                        setCustomUnit(chip.unit);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickChipText, isActive && styles.quickChipTextActive]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Quantity Stepper + Unit Selector */}
              <View style={styles.customQtyUnitRow}>
                {/* Stepper + Input */}
                <View style={styles.qtyStepperBox}>
                  <TouchableOpacity 
                    style={styles.qtyStepperBtn}
                    onPress={() => {
                      const num = parseFloat(customQtyValue) || 1;
                      setCustomQtyValue(Math.max(1, num - 1).toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Minus color={theme.colors.primary} size={16} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.qtyNumberInput}
                    value={customQtyValue}
                    onChangeText={setCustomQtyValue}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />

                  <TouchableOpacity 
                    style={styles.qtyStepperBtn}
                    onPress={() => {
                      const num = parseFloat(customQtyValue) || 0;
                      setCustomQtyValue((num + 1).toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus color={theme.colors.primary} size={16} />
                  </TouchableOpacity>
                </View>

                {/* Unit Selector Pills */}
                <View style={styles.unitSelectorRow}>
                  {['kg', 'g', 'L', 'Packet', 'Pcs'].map((u) => {
                    const isSelected = customUnit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitPill, isSelected && styles.unitPillActive]}
                        onPress={() => setCustomUnit(u)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.customQtySummaryText}>
                Selected: <Text style={{fontWeight: '700', color: theme.colors.primary}}>{customQtyValue} {customUnit}</Text>
              </Text>
            </View>

            {/* Estimated Budget Input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Estimated Budget (Optional)</Text>
              <View style={styles.budgetInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="e.g. 200"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={customBudget}
                  onChangeText={setCustomBudget}
                />
              </View>
            </View>

            {/* Photo / List Attachment */}
            <TouchableOpacity 
              style={[styles.attachButton, hasAttachedList && styles.attachButtonActive]}
              onPress={() => setHasAttachedList(!hasAttachedList)}
              activeOpacity={0.8}
            >
              <Camera color={hasAttachedList ? theme.colors.primary : "#64748B"} size={20} style={{marginRight: 10}} />
              <View style={{flex: 1}}>
                <Text style={[styles.attachText, hasAttachedList && {color: theme.colors.primary, fontWeight: '700'}]}>
                  {hasAttachedList ? 'Shopping List Attached 📸' : 'Attach Photo of Shopping List / Note'}
                </Text>
                <Text style={styles.attachSubtext}>
                  {hasAttachedList ? 'Tap to remove attachment' : 'Take a photo or upload list image'}
                </Text>
              </View>
              {hasAttachedList && <CheckCircle2 color={theme.colors.primary} size={20} />}
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitCustomBtn} 
              onPress={handleAddCustomOrder}
              disabled={isSubmittingCustom}
              activeOpacity={0.85}
            >
              {isSubmittingCustom ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitCustomBtnText}>Add Custom Item to Basket</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', // Entire background is white in mockup
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  headerWrapper: {
    backgroundColor: '#FFF',
    paddingBottom: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  navTitle: {
    ...theme.typography.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  bannerContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    overflow: 'hidden', // Ensure overlay doesn't leak out
  },
  banner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark gradient over the image
    justifyContent: 'flex-end',
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: theme.colors.primary,
  },
  statusText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  timingText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  shopNameOverlay: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  shopAddressOverlay: {
    color: '#EEE',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16, 
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customOrderHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  customOrderHeaderBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    ...theme.typography.body,
    fontSize: 15,
    color: '#333',
  },
  categoryCircleScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 16,
    paddingTop: 4,
  },
  categoryWrapper: {
    alignItems: 'center',
    marginRight: 16,
    width: 66,
  },
  categoryCircle: {
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
  categoryCircleActive: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 7,
  },
  categoryImage: {
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
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 100, // Make room for sticky banner
  },
  columnWrapper: {
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  stickyCartBannerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
  },
  stickyCartBannerInner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...theme.shadows.soft,
  },
  cartCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', // Slightly lighter overlay
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: '#FFF',
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
  customOrderCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  customOrderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customOrderIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customOrderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  customOrderBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  customOrderBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  customOrderSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  customOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 4,
  },
  customOrderBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 90,
  },
  quickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: theme.colors.primary,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  customQtyUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  qtyStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 3,
  },
  qtyStepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyNumberInput: {
    width: 46,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 4,
  },
  unitSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitPill: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  unitPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  unitPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  customQtySummaryText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  attachButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: theme.colors.primary,
  },
  attachText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  attachSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  submitCustomBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  submitCustomBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  saveShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveShopBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  saveShopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveShopBtnTextActive: {
    color: '#15803D',
  },
  cartIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerBookmarkBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerBookmarkBtnActive: {
    backgroundColor: '#16A34A',
  },
});

export default ShopStorefrontScreen;
