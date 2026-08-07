import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Package, Truck, Tag, BookOpen, CheckCheck, Trash2, Info, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'order',
    title: 'Order Delivered! 🎉',
    message: 'Your order #ORD-8923 from Fresh Mart has been delivered. Enjoy your items!',
    time: '10 mins ago',
    read: false,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    targetScreen: 'OrderDetail',
    params: { orderId: 'ORD-8923' }
  },
  {
    id: '2',
    type: 'order',
    title: 'Out for Delivery 🚚',
    message: 'Delivery executive Rahul is on his way with your groceries from Fresh Mart.',
    time: '45 mins ago',
    read: false,
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    targetScreen: 'Orders'
  },
  {
    id: '3',
    type: 'offer',
    title: 'Special Discount: 20% OFF! 🏷️',
    message: 'Get 20% off on fresh vegetables at Golden Harvest Grocers. Use code LOCAL20 at checkout.',
    time: '2 hours ago',
    read: false,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    targetScreen: 'CategoryProducts',
    params: { category: 'Groceries' }
  },
  {
    id: '4',
    type: 'khata',
    title: 'Khata Ledger Updated 📖',
    message: 'Fresh Mart updated your Khata ledger: +₹450 pending. Total pending balance: ₹450.',
    time: 'Yesterday, 6:30 PM',
    read: true,
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    targetScreen: 'Khata'
  },
  {
    id: '5',
    type: 'general',
    title: 'New Store Nearby! 🏪',
    message: 'Organic Greens is now delivering in Downtown, Sector 5. Explore their fresh catalog.',
    time: '2 days ago',
    read: true,
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    targetScreen: 'Explore'
  }
];

export const NotificationsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Orders', 'Offers', 'Khata'];

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Orders') return n.type === 'order';
    if (selectedFilter === 'Offers') return n.type === 'offer';
    if (selectedFilter === 'Khata') return n.type === 'khata';
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationPress = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));

    if (item.targetScreen) {
      navigation.navigate(item.targetScreen, item.params);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return Truck;
      case 'offer':
        return Tag;
      case 'khata':
        return BookOpen;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 12) + 8;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" translucent />

      {/* Header with Dynamic Top Padding */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color={theme.colors.text} size={22} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerRightActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.actionBtn} activeOpacity={0.7}>
                <CheckCheck color={theme.colors.primary} size={18} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} style={styles.actionBtn} activeOpacity={0.7}>
              <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category Filter Chips */}
      {notifications.length > 0 && (
        <View style={styles.filterContainer}>
          {filters.map(filter => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const IconComponent = getNotificationIcon(item.type);
          return (
            <TouchableOpacity
              style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                <IconComponent color={item.iconColor} size={22} />
              </View>

              <View style={styles.textWrapper}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadBadge} />}
                </View>
                <Text style={styles.cardMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>

              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Bell color="#94A3B8" size={48} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Orders, offers and updates will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  notificationCardUnread: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  cardMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
