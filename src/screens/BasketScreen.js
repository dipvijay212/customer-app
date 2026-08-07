import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, SafeAreaView, Platform, StatusBar, TextInput, ScrollView, KeyboardAvoidingView, Keyboard, Dimensions } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { MapPin, Store, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Pencil, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getCartItemTotal, getCartItemQuantityLabel, getTotalUnitQuantityLabel } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';

export const BasketScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isTotalExpanded, setIsTotalExpanded] = useState(false);
  const flatListRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const activeInputRef = useRef(null);

  const adjustScroll = () => {
    const node = activeInputRef.current?.current;
    if (!node || !node.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const visibleBottom = windowHeight - keyboardHeightRef.current;
      const overlap = y + height - visibleBottom;
      if (overlap > 0) {
        flatListRef.current?.scrollToOffset({
          offset: scrollOffsetRef.current + overlap + 24,
          animated: true,
        });
      }
    });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeightRef.current = e.endCoordinates?.height || 0;
      if (activeInputRef.current) {
        setTimeout(adjustScroll, 100);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data: cartsData, isLoading } = useQuery({
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

  const updateCartMutation = useMutation({
    mutationFn: async ({ shopId, productId, quantity, unit, price, note }) => {
      await axiosClient.post(`/cart/${shopId}/items`, { productId, quantity, unit, price, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const handleCheckout = (cart, draftNote) => {
    const finalNote = draftNote !== undefined ? draftNote : (cart.note || '');
    if (finalNote !== cart.note) {
      axiosClient.post(`/cart/${cart.shop.id}/note`, { note: finalNote });
    }
    navigation.navigate('Checkout', { cartId: cart.cart_id, shopId: cart.shop.id });
  };

  const activeCarts = useMemo(
    () => (Array.isArray(cartsData) ? cartsData.filter(cart => cart.items && cart.items.length > 0) : []),
    [cartsData]
  );

  const grandCartsTotal = useMemo(() => {
    return activeCarts.reduce((totalSum, cart) => {
      const cartSubtotal = cart.items.reduce((sum, item) => sum + getCartItemTotal(item), 0);
      return totalSum + cartSubtotal;
    }, 0);
  }, [activeCarts]);

  // The shop-note TextInput is nested inside a FlatList item, so opening the
  // keyboard doesn't bring it into view on its own. Scrolling to the cart
  // *item* isn't precise enough — a card's height (and so the note field's
  // position within it) varies with how many products are in that shop's
  // cart. Instead, once the keyboard is up, measure the input's actual
  // on-screen position and scroll exactly enough to clear the keyboard.
  const scrollToInput = (inputRef) => {
    activeInputRef.current = inputRef;
    setTimeout(adjustScroll, 150);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  // Calculate totals assuming only one shop's cart is being checked out at a time,
  // or we can just display the first cart in the design.
  // The design shows one long list of items, possibly from multiple shops or one shop.
  // We'll map through carts and show the checkout block inside or below each shop's items.
  // To match the design, we'll render a single ScrollView/FlatList.

  const renderCartItem = (product, shopId) => {
    return (
      <View key={`${product.product_id}-${product.unit}`} style={styles.itemRow}>
        <Image source={{ uri: product.image_url || 'https://via.placeholder.com/60' }} style={styles.itemImage} />

        <View style={styles.itemDetails}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
            <TouchableOpacity onPress={() => updateCartMutation.mutate({ shopId, productId: product.product_id, quantity: 0, unit: product.unit })}>
              <Trash2 color={theme.colors.textLight} size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemUnit}>{product.unit} • ₹{parseFloat(product.price).toFixed(2)}/{product.unit}</Text>

          <View style={styles.itemBottomRow}>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateCartMutation.mutate({ shopId, productId: product.product_id, quantity: product.quantity - 1, unit: product.unit })}
              >
                <Minus color={theme.colors.primary} size={14} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{getTotalUnitQuantityLabel(product.quantity, product.unit)}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateCartMutation.mutate({ shopId, productId: product.product_id, quantity: product.quantity + 1, unit: product.unit })}
              >
                <Plus color={theme.colors.primary} size={14} />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>₹{getCartItemTotal(product).toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

const CartSection = React.memo(({ cart, updateCartMutation, navigation, renderCartItem, handleCheckout, onNoteFocus }) => {
  const { shop, items } = cart;
  const queryClient = useQueryClient();
  const t = useTranslation();
  const noteInputRef = useRef(null);
  const containerRef = useRef(null);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(cart.note || '');

  const updateCartNoteMutation = useMutation({
    mutationFn: async (note) => {
      await axiosClient.post(`/cart/${shop.id}/note`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const subtotal = items.reduce((sum, i) => sum + getCartItemTotal(i), 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <View ref={containerRef} style={styles.cartCard}>
      {/* Shop Header */}
      <View style={styles.shopHeader}>
        <Store color={theme.colors.primary} size={20} style={{marginRight: 8}} />
        <Text style={styles.shopName}>{shop.name}</Text>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {items.map(product => renderCartItem(product, shop.id))}
      </View>

      {/* Keep Shopping / Add More Button */}
      <TouchableOpacity 
        style={styles.addMoreItemsBtn} 
        onPress={() => navigation.navigate('ShopStorefront', { id: shop.id })}
        activeOpacity={0.8}
      >
        <Plus color={theme.colors.primary} size={16} style={{ marginRight: 6 }} />
        <Text style={styles.addMoreItemsText}>{t('addMoreItems')}</Text>
      </TouchableOpacity>

      {/* Common Order Note */}
      <View style={styles.commonNoteContainer}>
        {isEditingNote ? (
          <View style={styles.commonNoteInputRow}>
            <TextInput
              ref={noteInputRef}
              style={styles.commonNoteInput}
              placeholder={t('addInstructionsPlaceholder')}
              placeholderTextColor="#94A3B8"
              value={noteDraft}
              onChangeText={setNoteDraft}
              onFocus={() => onNoteFocus?.(containerRef)}
              autoFocus
            />
            <TouchableOpacity
              style={styles.commonNoteSaveBtn}
              onPress={() => {
                updateCartNoteMutation.mutate(noteDraft);
                setIsEditingNote(false);
              }}
            >
              <Text style={styles.commonNoteSaveText}>{t('saveBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.commonNoteLink}
            onPress={() => {
              setNoteDraft(cart.note || '');
              setIsEditingNote(true);
            }}
            activeOpacity={0.7}
          >
            <Pencil color={theme.colors.primary} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.commonNoteLinkText} numberOfLines={1}>
              {cart.note ? `Note: ${cart.note}` : t('addShopInstructions')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('subtotal')}</Text>
          <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('deliveryFee')}</Text>
          <Text style={[styles.totalValue, {color: theme.colors.primary, fontWeight: 'bold'}]}>{t('free')}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>{t('total')}</Text>
          <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Proceed Button */}
      <TouchableOpacity style={styles.proceedBtn} onPress={() => handleCheckout(cart, noteDraft)}>
        <Text style={styles.proceedText}>{t('proceedToPay')}</Text>
        <ArrowRight color="#FFF" size={20} style={{marginLeft: 8}} />
      </TouchableOpacity>
    </View>
  );
});

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{padding: 4}} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Home' })}>
          <ArrowLeft color={theme.colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('basketHeader')}</Text>
      </View>


      {/* Grand Total Summary Card */}
      {activeCarts.length > 0 && (
        <View style={styles.grandSummaryCard}>
          <TouchableOpacity 
            style={styles.grandSummaryHeader}
            onPress={() => setIsTotalExpanded(!isTotalExpanded)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.grandSummaryLabel}>{t('basketGrandTotal')}</Text>
              <Text style={styles.grandSummaryCartsCount}>{t('totalAcrossShops', { count: activeCarts.length, s: activeCarts.length > 1 ? 's' : '' })}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.grandSummaryValue}>₹{grandCartsTotal.toFixed(2)}</Text>
              {isTotalExpanded ? (
                <ChevronUp color="#15803D" size={20} style={{ marginLeft: 8 }} />
              ) : (
                <ChevronDown color="#15803D" size={20} style={{ marginLeft: 8 }} />
              )}
            </View>
          </TouchableOpacity>

          {isTotalExpanded && (
            <View style={styles.grandSummaryBreakdown}>
              <View style={styles.grandSummaryDivider} />
              {activeCarts.map((cart) => {
                const cartSubtotal = cart.items.reduce((sum, item) => sum + getCartItemTotal(item), 0);
                return (
                  <View key={cart.cart_id} style={styles.breakdownRow}>
                    <Text style={styles.breakdownShopName}>{cart.shop.name}</Text>
                    <Text style={styles.breakdownShopTotal}>₹{cartSubtotal.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {(activeCarts.length === 0) ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag color={theme.colors.primary} size={40} />
          </View>
          <Text style={styles.emptyTitle}>{t('emptyBasket')}</Text>
          <Text style={styles.emptyText}>{t('emptyBasketSub')}</Text>
          <TouchableOpacity
            style={styles.emptyShopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={styles.emptyShopBtnText}>{t('startShoppingBtn')}</Text>
            <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={activeCarts}
          keyExtractor={(cart) => cart.cart_id.toString()}
          renderItem={({ item }) => (
            <CartSection
              cart={item}
              updateCartMutation={updateCartMutation}
              navigation={navigation}
              renderCartItem={renderCartItem}
              handleCheckout={handleCheckout}
              onNoteFocus={scrollToInput}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20,
    paddingBottom: 16,
    backgroundColor: '#F7F9F8',
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 24,
    color: '#1D6B35',
    flex: 1,
    marginLeft: 16,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  deliveryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  deliveryAddress: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  changeBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 24,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  shopName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#333',
  },
  itemsContainer: {
    padding: 20,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  itemUnit: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    marginTop: 4,
    marginBottom: 12,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 20,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 8,
    color: '#333',
  },
  itemTotal: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  noteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  noteLinkText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#F7F9F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12,
    color: '#333',
  },
  noteSaveBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteSaveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  totalsContainer: {
    backgroundColor: '#F7F9F8',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    ...theme.typography.body,
    color: theme.colors.textLight,
  },
  totalValue: {
    ...theme.typography.body,
    color: '#333',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    marginBottom: 0,
  },
  grandTotalLabel: {
    ...theme.typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    ...theme.typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
  },
  proceedBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  proceedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: '#1D6B35',
    marginBottom: 8,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyShopBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  emptyShopBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addMoreItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addMoreItemsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  recSection: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  recScroll: {
    paddingRight: 20,
    gap: 12,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    width: 190,
  },
  recImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },
  recDetails: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  recName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  recPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  recAddBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  recAddBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  commonNoteContainer: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  commonNoteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  commonNoteInput: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    paddingVertical: 8,
  },
  commonNoteSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  commonNoteSaveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commonNoteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  commonNoteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  grandSummaryCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  grandSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandSummaryBreakdown: {
    marginTop: 12,
  },
  grandSummaryDivider: {
    height: 1,
    backgroundColor: '#D1FAE5',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownShopName: {
    fontSize: 13,
    color: '#064E3B',
    fontWeight: '600',
  },
  breakdownShopTotal: {
    fontSize: 14,
    color: '#064E3B',
    fontWeight: '700',
  },
  grandSummaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
  },
  grandSummaryCartsCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  grandSummaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
  },
});

export default BasketScreen;
