import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { Menu, Truck, RotateCcw, MessageSquare, Gift, HelpCircle } from 'lucide-react-native';

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
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
        <ActivityIndicator size="large" color="#006B54" />
      </SafeAreaView>
    );
  }

  const renderOrderItem = ({ item: order }) => {
    // In our DB statuses are lowercase.
    const isPreparing = order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing';
    const isDelivered = order.status === 'delivered';
    
    // Fallback UI text for items / distance
    const itemsCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const distance = order.shop?.distance ? order.shop.distance : '1.2 km away';

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
              {isDelivered ? 'Delivered' : 'Preparing'}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.itemsText}>{itemsCount} {itemsCount === 1 ? 'item' : 'items'} • {isDelivered ? 'Hand delivered' : distance}</Text>
          <Text style={styles.priceText}>₹{parseFloat(order.total_amount || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.actionsRow}>
          {isPreparing ? (
            <>
              <TouchableOpacity 
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
              >
                <Truck color="#FFF" size={16} style={{marginRight: 6}} />
                <Text style={styles.btnPrimaryText}>Track Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnIconOutline}>
                <MessageSquare color="#555" size={18} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.btnPrimary}
                onPress={() => reorderMutation.mutate(order.id)}
              >
                <RotateCcw color="#FFF" size={16} style={{marginRight: 6}} />
                <Text style={styles.btnPrimaryText}>Buy Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
              >
                <Text style={styles.btnSecondaryText}>Order Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.missingTitle}>Missing something?</Text>
      
      <TouchableOpacity style={styles.referCard}>
        <View style={styles.referIconContainer}>
          <Gift color="#FFF" size={20} />
        </View>
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpTitle}>Refer a Friend</Text>
          <Text style={styles.helpSubtitle}>Get ₹50 off your next order</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.supportCard}>
        <View style={styles.supportIconContainer}>
          <HelpCircle color="#FFF" size={20} />
        </View>
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpTitle}>Support Center</Text>
          <Text style={styles.helpSubtitle}>Need help with an order?</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{padding: 4}}>
          <Menu color="#006B54" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Shops</Text>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }} style={styles.avatar} />
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id.toString()}
        renderItem={renderOrderItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.pageTitle}>Your Orders</Text>
            <Text style={styles.pageSubtitle}>Keep track of your local neighborhood purchases</Text>
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
    color: '#006B54',
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
    backgroundColor: '#81F2AE',
  },
  statusDelivered: {
    backgroundColor: '#EBEBEB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006B54',
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
    color: '#006B54',
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
    color: '#006B54',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#006B54',
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
    backgroundColor: '#F2FBF5',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  referIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#006B54',
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
    color: '#006B54', // or blue for support, but sticking to general dark
    marginBottom: 2,
  },
  helpSubtitle: {
    ...theme.typography.caption,
    color: '#666',
  }
});

export default OrdersScreen;
