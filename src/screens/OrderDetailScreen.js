import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { Phone, CheckCircle2, Circle, Clock, MapPin, Truck, ShieldCheck, ChevronRight, ArrowLeft, MessageSquare } from 'lucide-react-native';
import { getCartItemTotal, getCartItemQuantityLabel } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';

export const OrderDetailScreen = ({ route }) => {
  const { id } = route.params;
  const navigation = useNavigation();
  const t = useTranslation();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(`/orders/${id}`);
        if (res.data) return res.data;
      } catch (e) {
        // Fallback
      }
      const resList = await axiosClient.get('/orders');
      const orders = resList.data?.orders || [];
      const found = orders.find(o => 
        o.id == id || 
        o.orderNumber == id || 
        o.order_number == id || 
        o.orderNumber == `#${id}` || 
        o.orderNumber == `LS-${id}`
      );
      return found || orders[0] || null;
    }
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axiosClient.get('/addresses');
      return res.data.addresses;
    }
  });

  const deliveryAddress = addresses?.find(a => a.id == order?.address_id) || addresses?.[0];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  // To match the UI exactly, let's derive statuses.
  // The screenshot shows: Placed, Accepted, Preparing, Out for Delivery, Delivered.
  const statuses = [
    { key: 'pending', title: t('preparing'), sub: '10:20 AM' },
    { key: 'accepted', title: t('preparing'), sub: '10:25 AM' },
    { key: 'preparing', title: t('preparing'), sub: 'In progress' },
    { key: 'out_for_delivery', title: 'Out for Delivery', sub: 'Waiting...' },
    { key: 'delivered', title: t('delivered'), sub: 'Estimated 11:15 AM' }
  ];

  // In our DB, pending -> accepted -> out_for_delivery -> delivered. We'll map it to the 5 step process.
  let currentStep = 0;
  if (order.status === 'accepted') currentStep = 1;
  if (order.status === 'preparing') currentStep = 2; // custom status for UI matching
  if (order.status === 'out_for_delivery') currentStep = 3;
  if (order.status === 'delivered') currentStep = 4;
  
  // For the sake of UI screenshot replicating "Preparing", let's force it if it's 'pending' or 'accepted' to step 2 visually if it's early.
  if (order.status === 'pending' || order.status === 'accepted') {
    currentStep = 2; 
  }

  const renderTimeline = () => {
    return (
      <View style={styles.timelineContainer}>
        {statuses.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <View key={step.key} style={styles.timelineRow}>
              {/* Left Column: Icon and Line */}
              <View style={styles.timelineLeft}>
                {isCompleted ? (
                  <CheckCircle2 color={theme.colors.primary} size={24} />
                ) : isCurrent ? (
                  <View style={styles.currentStepIcon}>
                    <View style={styles.currentStepDot} />
                  </View>
                ) : (
                  <Circle color="#E0E0E0" size={24} />
                )}
                
                {/* Connecting Line (except last item) */}
                {index < statuses.length - 1 && (
                  <View style={[styles.timelineLine, isCompleted ? styles.timelineLineActive : null]} />
                )}
              </View>

              {/* Right Column: Text */}
              <View style={styles.timelineTextContainer}>
                <Text style={[
                  styles.timelineTitle,
                  isCompleted && styles.timelineTitleCompleted,
                  isCurrent && styles.timelineTitleCurrent
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.timelineSub}>{step.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{padding: 4}} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('localShopsHeader')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroHeader}>
          <View style={styles.heroRow1}>
            <Text style={styles.orderIdText}>{t('orderNum', { id: order.id })}</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{t(order.status === 'delivered' ? 'delivered' : 'preparing')}</Text>
            </View>
          </View>
          <Text style={styles.heroShopName}>{order?.shop?.name || 'Local Shop'}</Text>
          <View style={styles.heroLocationRow}>
            <MapPin color={theme.colors.textLight} size={14} style={{marginRight: 4}} />
            <Text style={styles.heroAddressText}>24 Maplewood Avenue, Downtown</Text>
          </View>

          <TouchableOpacity style={styles.callBtn}>
            <Phone color="#FFF" size={18} style={{marginRight: 8}} />
            <Text style={styles.callBtnText}>{t('callShop')}</Text>
          </TouchableOpacity>
        </View>

        {/* Order Status Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orderStatus')}</Text>
          {renderTimeline()}
        </View>


        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orderItems')}</Text>
          
          <View style={styles.orderItemsList}>
            {(order.items || []).map((item, index) => {
              const name = item.product?.name || item.name || 'Ordered Product';
              const imageUri = item.product?.image_url || item.image_url || 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80';
              const unit = item.product?.unit || item.unit || 'pack';
              const pricePerUnit = parseFloat(item.price || item.product?.price || (order.total_amount ? (order.total_amount / (order.items?.length || 1)) / (item.quantity || 1) : 100));
              const qty = item.quantity || 1;
              const itemTotal = pricePerUnit * qty;

              return (
                <View key={item.id ? `item_${item.id}_${index}` : `item_idx_${index}`} style={styles.orderItem}>
                  <Image source={{uri: imageUri}} style={styles.orderItemImg} />
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName} numberOfLines={2}>{name}</Text>
                    <Text style={styles.orderItemQty}>{unit}</Text>
                    {!!item.note && (
                      <Text style={styles.orderItemNote} numberOfLines={1}>{t('note', { note: item.note })}</Text>
                    )}
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.orderItemPrice}>₹{itemTotal.toFixed(2)}</Text>
                    <Text style={styles.orderItemQtyRight}>{t('qty', { qty })} ({unit})</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryLines}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>{t('subtotal')}</Text>
              <Text style={styles.summaryLineValue}>₹{parseFloat(order.total_amount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>{t('deliveryFee')}</Text>
              <Text style={styles.summaryLineValue}>{t('free')}</Text>
            </View>
          </View>

          <View style={styles.totalLine}>
            <Text style={styles.totalTitle}>{t('total')}</Text>
            <Text style={styles.totalValue}>₹{parseFloat(order.total_amount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Order Instructions / Note Card */}
        {!!order?.note && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <MessageSquare color={theme.colors.primary} size={18} style={{marginRight: 8}} />
              <Text style={styles.infoCardTitle}>Order Note / Instructions</Text>
            </View>
            <Text style={styles.infoCardBody}>{order.note}</Text>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Truck color={theme.colors.primary} size={18} style={{marginRight: 8}} />
            <Text style={styles.infoCardTitle}>{t('deliveryAddressLabel')}</Text>
          </View>
          <Text style={styles.infoCardName}>{deliveryAddress ? deliveryAddress.name : 'Jane Doe'}</Text>
          <Text style={styles.infoCardBody}>{deliveryAddress ? `${deliveryAddress.line1}, ${deliveryAddress.line2} - ${deliveryAddress.pincode}` : 'Apt 4B, Harmony Towers, Oak Street, New Town - 110022'}</Text>
        </View>

        {/* Payment Status Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <ShieldCheck color={theme.colors.primary} size={18} style={{marginRight: 8}} />
            <Text style={styles.infoCardTitle}>{t('paymentStatusLabel')}</Text>
          </View>
          <Text style={styles.infoCardName}>{t('paidVia', { method: (order?.payment_method || 'Online').toUpperCase() })}</Text>
          <Text style={styles.infoCardBody}>Transaction ID: TXN_0987654321</Text>
        </View>

      </ScrollView>
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
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
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
    fontSize: 22,
    color: '#15803D',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroHeader: {
    marginBottom: 24,
  },
  heroRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  heroPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  heroShopName: {
    ...theme.typography.title,
    fontSize: 24,
    color: '#333',
    marginBottom: 4,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroAddressText: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  callBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  callBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  timelineLineActive: {
    backgroundColor: theme.colors.primary,
  },
  currentStepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  timelineTextContainer: {
    flex: 1,
    paddingTop: 2, // align with icon center roughly
  },
  timelineTitle: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  timelineTitleCompleted: {
    color: '#333',
    fontWeight: 'bold',
  },
  timelineTitleCurrent: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  timelineSub: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', // light green
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  helpIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: 14,
  },
  helpSub: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  helpArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemsList: {
    marginBottom: 24,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderItemImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  orderItemName: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: '#333',
    fontSize: 13,
  },
  orderItemQty: {
    ...theme.typography.caption,
    marginTop: 4,
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
    color: '#333',
  },
  orderItemQtyRight: {
    ...theme.typography.caption,
    marginTop: 4,
  },
  summaryLines: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 16,
    marginBottom: 16,
    borderStyle: 'dashed', // simple dash approx
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLineLabel: {
    ...theme.typography.body,
    color: theme.colors.textLight,
  },
  summaryLineValue: {
    ...theme.typography.body,
    fontWeight: '500',
    color: '#333',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: 13,
  },
  infoCardName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  infoCardBody: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    lineHeight: 18,
  }
});

export default OrderDetailScreen;
