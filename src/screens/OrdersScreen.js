import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { Truck, RotateCcw, HelpCircle, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from '../utils/translations';

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axiosClient.get('/orders');
      return res.data.orders;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const reorderMutation = useMutation({
    mutationFn: async (orderId) => {
      const res = await axiosClient.post(`/orders/${orderId}/reorder`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      navigation.navigate('MainTabs', { screen: 'Basket' });
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const renderOrderItem = ({ item: order }) => {
    // In our DB statuses are lowercase.
    const isPreparing = order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing';
    const isDelivered = order.status === 'delivered';
    
    // Fallback UI text for items / distance
    const itemsCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const distanceText = order.shop?.distance ? t('kmAway', { distance: `${parseFloat(order.shop.distance).toFixed(1)} km` }) : t('kmAway', { distance: '1.2 km' });

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Image source={{uri: order.shop?.banner_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&q=80'}} style={styles.shopLogo} />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>{order.shop?.name || 'Local Shop'}</Text>
            <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</Text>
          </View>
          <View style={[styles.statusPill, isDelivered ? styles.statusDelivered : styles.statusPreparing]}>
            {isDelivered && <Text style={[styles.statusIcon, {color: '#555'}]}>✓</Text>}
            {!isDelivered && <View style={styles.statusDot} />}
            <Text style={[styles.statusText, isDelivered ? styles.statusTextDelivered : styles.statusTextPreparing]}>
              {isDelivered ? t('delivered') : t('preparing')}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.itemsText}>{itemsCount} {itemsCount === 1 ? t('item') : t('items')} • {isDelivered ? t('handDelivered') : distanceText}</Text>
          <Text style={styles.priceText}>₹{parseFloat(order.total_amount || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.actionsRow}>
          {isPreparing ? (
            <TouchableOpacity 
              style={[styles.btnPrimary, { marginRight: 0 }]}
              onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
            >
              <Truck color="#FFF" size={16} style={{marginRight: 6}} />
              <Text style={styles.btnPrimaryText}>{t('orderDetails')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.btnPrimary}
                onPress={() => reorderMutation.mutate(order.id)}
              >
                <RotateCcw color="#FFF" size={16} style={{marginRight: 6}} />
                <Text style={styles.btnPrimaryText}>{t('buyAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
              >
                <Text style={styles.btnSecondaryText}>{t('orderDetails')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.missingTitle}>{t('missingSomething')}</Text>

      <TouchableOpacity style={styles.supportCard} onPress={() => navigation.navigate('HelpSupport')}>
        <View style={styles.supportIconContainer}>
          <HelpCircle color="#FFF" size={20} />
        </View>
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpTitle}>{t('supportCenter')}</Text>
          <Text style={styles.helpSubtitle}>{t('needHelpOrder')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{padding: 4}} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Home' })}>
          <ArrowLeft color={theme.colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('localShopsHeader')}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id.toString()}
        renderItem={renderOrderItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.pageTitle}>{t('yourOrders')}</Text>
            <Text style={styles.pageSubtitle}>{t('yourOrdersSub')}</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
    backgroundColor: '#FFF',
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    ...theme.typography.title,
    fontSize: 24,
    color: '#333',
    marginBottom: 4,
  },
  pageSubtitle: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textLight,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  orderDate: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPreparing: {
    backgroundColor: '#DCFCE7',
  },
  statusDelivered: {
    backgroundColor: '#EBEBEB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },
  statusIcon: {
    fontSize: 10,
    marginRight: 4,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextPreparing: {
    color: theme.colors.primary,
  },
  statusTextDelivered: {
    color: '#555',
  },
  orderDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsText: {
    ...theme.typography.caption,
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    ...theme.typography.subtitle,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  btnSecondaryText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnIconOutline: {
    width: 44,
    height: 44,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    marginTop: 24,
  },
  missingTitle: {
    ...theme.typography.subtitle,
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  referIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#03A9F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  helpSubtitle: {
    ...theme.typography.caption,
    color: '#666',
  }
});

export default OrdersScreen;
