import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { Check, Truck, ShoppingBag, HelpCircle, Calendar, Clock, Store, CreditCard } from 'lucide-react-native';
import Animated, { BounceIn, ZoomIn, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';

export const OrderConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  React.useEffect(() => {
    pulseScale.value = withDelay(150, withTiming(1.7, { duration: 900, easing: Easing.out(Easing.ease) }));
    pulseOpacity.value = withDelay(150, withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }));
  }, [pulseScale, pulseOpacity]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      navigation.navigate('MainTabs', { screen: 'Home' });
    });
    return unsubscribe;
  }, [navigation]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const params = route.params || {};
  const targetOrderId = params.id || params.orderId || params.orderNumber;

  const { data: fetchedOrder } = useQuery({
    queryKey: ['order', targetOrderId],
    queryFn: async () => {
      if (!targetOrderId) return null;
      try {
        const res = await axiosClient.get(`/orders/${targetOrderId}`);
        if (res.data) return res.data;
      } catch (e) {}
      const resList = await axiosClient.get('/orders');
      const orders = resList.data?.orders || [];
      return orders.find(o => o.id == targetOrderId || o.orderNumber == targetOrderId) || orders[0];
    },
    enabled: !!targetOrderId,
  });

  const finalOrderId = fetchedOrder?.id || params.id || params.orderId || 1;
  const displayOrderId = `#${fetchedOrder?.orderNumber || params.orderNumber || targetOrderId || finalOrderId}`;
  const displayShopName = fetchedOrder?.shop?.name || params.shopName || 'Local Shop';
  const displayTotal = fetchedOrder?.total_amount ? `₹${parseFloat(fetchedOrder.total_amount).toFixed(2)}` : (params.totalAmount || '₹0.00');
  const displayPaymentMethod = (fetchedOrder?.payment_method || params.paymentMethod || 'Online').toUpperCase();

  const orderCreatedAt = fetchedOrder?.created_at ? new Date(fetchedOrder.created_at) : new Date();
  const displayDate = orderCreatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const displayTime = orderCreatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Check Success Circle */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={styles.iconOuterCircle} entering={BounceIn.duration(800)}>
            <Animated.View style={styles.iconInnerCircle} entering={ZoomIn.delay(250).duration(400)}>
              <Check color={theme.colors.primary} size={48} strokeWidth={4} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Header Title */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>Thank you for your order! The shop is preparing your items.</Text>

        {/* ORDER DETAILS SUMMARY CARD */}
        <View style={styles.detailsCard}>
          {/* Card Header: Order ID Badge */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>ORDER ID</Text>
            <Text style={styles.cardHeaderId}>{displayOrderId}</Text>
          </View>

          <View style={styles.divider} />

          {/* Row 1: Order Date & Time */}
          <View style={styles.detailRow}>
            <View style={styles.rowIconWrapper}>
              <Calendar color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Order Date & Time</Text>
              <Text style={styles.rowValue}>{displayDate} • {displayTime}</Text>
            </View>
          </View>

          {/* Row 2: Shop Name */}
          <View style={styles.detailRow}>
            <View style={styles.rowIconWrapper}>
              <Store color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Shop Name</Text>
              <Text style={styles.rowValue}>{displayShopName}</Text>
            </View>
          </View>

          {/* Row 3: Estimated Time */}
          <View style={styles.detailRow}>
            <View style={styles.rowIconWrapper}>
              <Clock color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Estimated Delivery</Text>
              <Text style={styles.rowValue}>30-45 mins</Text>
            </View>
          </View>

          {/* Row 4: Payment Method */}
          <View style={styles.detailRow}>
            <View style={styles.rowIconWrapper}>
              <CreditCard color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Payment Method</Text>
              <Text style={styles.rowValue}>{displayPaymentMethod}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Row 5: Total Amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payment Amount</Text>
            <Text style={styles.totalValue}>{displayTotal}</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.buttonContainer}>
          {/* Track Order Button */}
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('OrderDetail', { id: finalOrderId })}
            activeOpacity={0.85}
          >
            <Truck color="#FFF" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Track Order</Text>
          </TouchableOpacity>
          
          {/* Back to Shopping Button */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.85}
          >
            <ShoppingBag color={theme.colors.primary} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Back to Shopping</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Support Link */}
        <TouchableOpacity 
          style={styles.footer}
          onPress={() => navigation.navigate('HelpSupport')}
          activeOpacity={0.7}
        >
          <HelpCircle color={theme.colors.textLight} size={16} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>
            Need help with your order? <Text style={styles.contactSupport}>Contact Support</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
  },
  iconOuterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardHeaderId: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rowIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  contactSupport: {
    color: theme.colors.primary,
    fontWeight: '700',
  }
});

export default OrderConfirmationScreen;
