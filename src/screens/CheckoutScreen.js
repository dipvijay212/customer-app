import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { ArrowLeft, MapPin, CreditCard, Receipt, ChevronDown, CheckCircle2, Circle, Book } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCartItemTotal, getCartItemQuantityLabel } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';

export const CheckoutScreen = ({ route, navigation }) => {
  const { shopId, cartId } = route.params;
  const queryClient = useQueryClient();
  const t = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const insets = useSafeAreaInsets();

  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axiosClient.get('/addresses');
      return res.data.addresses;
    }
  });

  const setDeliveryAddressMutation = useMutation({
    mutationFn: async (address) => {
      await axiosClient.put(`/addresses/${address.id}`, {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        pincode: address.pincode,
        lat: address.latitude,
        lng: address.longitude,
        is_default: true,
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses'])
  });

  const { data: cartsData, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosClient.get('/cart');
      return res.data.carts;
    }
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post('/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      navigation.navigate('OrderConfirmation', { 
        id: data.orderId, 
        orderId: data.orderId, 
        orderNumber: data.orderNumber 
      });
    },
    onError: (err) => {
      Alert.alert('Checkout Failed', err.response?.data?.message || err.message);
    }
  });

  if (isLoadingAddresses || isLoadingCart) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const activeCart = Array.isArray(cartsData) ? cartsData.find(c => c.cart_id === cartId) : null;
  if (!activeCart) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Cart not found or empty.</Text>
      </SafeAreaView>
    );
  }

  const selectedAddressId = addresses?.find(a => a.is_default)?.id ?? addresses?.[0]?.id ?? null;

  let subtotal = 0;
  activeCart.items.forEach(item => {
    subtotal += getCartItemTotal(item);
  });
  
  const deliveryFee = 0.00;
  const taxes = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryFee + taxes;

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }
    placeOrderMutation.mutate({ shopId, addressId: selectedAddressId, payment_method: paymentMethod, note: activeCart.note });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1D6B35" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkoutHeader')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Delivery Address Section */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { marginBottom: 4 }]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MapPin color={theme.colors.primary} size={20} style={{marginRight: 8}} />
              <Text style={styles.cardTitle}>{t('selectDeliveryAddress')}</Text>
            </View>
          </View>
          <View style={styles.addressActionsRow}>
            {addresses?.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('AddressList')} style={styles.addressActionBtn}>
                <Text style={styles.addressActionText}>{t('changeBtn')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('AddressMapPicker')} style={[styles.addressActionBtn, styles.addressActionBtnPrimary]}>
              <Text style={[styles.addressActionText, styles.addressActionTextPrimary]}>{t('addNewBtn')}</Text>
            </TouchableOpacity>
          </View>

          {addresses?.map(addr => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                onPress={() => setDeliveryAddressMutation.mutate(addr)}
              >
                <View style={styles.addressPill}>
                  <Text style={styles.addressPillText}>{addr.label}</Text>
                </View>
                <Text style={styles.addressName}>Aman Sharma</Text>
                <Text style={styles.addressLine}>{addr.line1}, {addr.line2}, {addr.pincode}</Text>
                <Text style={styles.addressPhone}>+91 98765 43210</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Payment Method Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <CreditCard color={theme.colors.primary} size={20} style={{marginRight: 8}} />
              <Text style={styles.cardTitle}>{t('paymentMethod')}</Text>
            </View>
          </View>

          {/* UPI Option */}
          <TouchableOpacity 
            style={[styles.paymentItem, paymentMethod === 'upi' && styles.paymentItemSelected]}
            onPress={() => setPaymentMethod('upi')}
          >
            <View style={styles.paymentRow}>
              {paymentMethod === 'upi' ? (
                <CheckCircle2 color={theme.colors.primary} size={24} />
              ) : (
                <Circle color={theme.colors.border} size={24} />
              )}
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('onlinePayment')}</Text>
                <Text style={styles.paymentSub}>{t('instantPaymentUPI')}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* COD Option */}
          <TouchableOpacity 
            style={[styles.paymentItem, paymentMethod === 'cod' && styles.paymentItemSelected]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentRow}>
              {paymentMethod === 'cod' ? (
                <CheckCircle2 color={theme.colors.primary} size={24} />
              ) : (
                <Circle color={theme.colors.border} size={24} />
              )}
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('cashOnDelivery')}</Text>
                <Text style={styles.paymentSub}>{t('payWhenArrives')}</Text>
              </View>
              <Receipt color={theme.colors.textLight} size={24} />
            </View>
          </TouchableOpacity>

          {/* Udhar / Khata Option */}
          <TouchableOpacity 
            style={[styles.paymentItem, paymentMethod === 'udhar' && styles.paymentItemSelected]}
            onPress={() => setPaymentMethod('udhar')}
          >
            <View style={styles.paymentRow}>
              {paymentMethod === 'udhar' ? (
                <CheckCircle2 color={theme.colors.primary} size={24} />
              ) : (
                <Circle color={theme.colors.border} size={24} />
              )}
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('udharKhata')}</Text>
                <Text style={styles.paymentSub}>{t('pendingApproval')}</Text>
              </View>
              <Book color={theme.colors.textLight} size={24} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Receipt color={theme.colors.primary} size={20} style={{marginRight: 8}} />
              <Text style={styles.cardTitle}>{t('orderSummary')}</Text>
            </View>
            <ChevronDown color={theme.colors.text} size={20} />
          </View>

          <View style={styles.orderItemsList}>
            {activeCart.items.map(item => (
              <View key={item.id || item.product_id} style={styles.orderItem}>
                <Image source={{uri: item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100'}} style={styles.orderItemImg} />
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.orderItemQty}>{t('qty', { qty: getCartItemQuantityLabel(item) })}</Text>
                  {!!item.note && (
                    <Text style={styles.orderItemNote} numberOfLines={1}>{t('note', { note: item.note })}</Text>
                  )}
                </View>
                <Text style={styles.orderItemPrice}>₹{getCartItemTotal(item).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryLines}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>{t('subtotal')}</Text>
              <Text style={styles.summaryLineValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>{t('deliveryFee')}</Text>
              <Text style={[styles.summaryLineValue, {color: theme.colors.primary, fontWeight: 'bold'}]}>{t('free')}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>{t('taxes')}</Text>
              <Text style={styles.summaryLineValue}>₹{taxes.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.totalLine}>
            <Text style={styles.totalTitle}>{t('totalAmountLabel')}</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Spacer for bottom sticky button */}
        <View style={{height: 100 + insets.bottom}} /> 
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={styles.placeOrderBtn} 
          onPress={handlePlaceOrder}
          disabled={placeOrderMutation.isPending}
        >
          {placeOrderMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>{t('placeOrder')}</Text>
              <ArrowRight color="#FFF" size={20} style={{marginLeft: 8}} />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>{t('safeSecurePayments')}</Text>
      </View>
    </SafeAreaView>
  );
};

// Add ArrowRight for the Place Order button since we forgot to import it
const { ArrowRight } = require('lucide-react-native');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8', // Slightly more gray background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : theme.spacing.m,
    paddingBottom: theme.spacing.m,
    backgroundColor: '#F7F9F8',
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 22,
    color: '#1D6B35',
    marginLeft: 16,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    fontSize: 18,
  },
  addText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  addressActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  addressActionBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addressActionBtnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  addressActionText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  addressActionTextPrimary: {
    color: '#FFF',
  },
  addressItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  addressItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ECFDF5',
  },
  addressPill: {
    backgroundColor: '#EBEBEB',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  addressPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  addressName: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressLine: {
    ...theme.typography.caption,
    fontSize: 13,
    marginBottom: 2,
  },
  addressPhone: {
    ...theme.typography.caption,
    fontSize: 13,
  },
  paymentItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentItemSelected: {
    borderColor: theme.colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    ...theme.typography.body,
    fontWeight: 'bold',
    fontSize: 13,
  },
  paymentSub: {
    ...theme.typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  upiInputRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginLeft: 36, // Align with text
  },
  upiInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#333',
    textAlignVertical: 'center',
  },
  verifyBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginLeft: 8,
  },
  verifyText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  orderItemsList: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemName: {
    ...theme.typography.body,
    fontWeight: '600',
    fontSize: 13,
  },
  orderItemQty: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  orderItemNote: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    color: theme.colors.textLight,
    marginTop: 2,
  },
  orderItemPrice: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryLines: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
    marginBottom: 16,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLineLabel: {
    ...theme.typography.body,
    color: theme.colors.textLight,
  },
  summaryLineValue: {
    ...theme.typography.body,
    fontWeight: '500',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  totalTitle: {
    ...theme.typography.subtitle,
    fontSize: 18,
  },
  totalValue: {
    ...theme.typography.title,
    fontSize: 20,
    color: theme.colors.primary,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F7F9F8',
    paddingHorizontal: theme.spacing.m,
    paddingTop: 12,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  placeOrderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.textLight,
    marginTop: 12,
  }
});

export default CheckoutScreen;
