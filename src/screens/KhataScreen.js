import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { ChevronLeft, Book, ChevronRight, ChevronDown, Store } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getCartItemTotal, getCartItemQuantityLabel } from '../utils/cartPricing';
import { useTranslation } from '../utils/translations';

export const KhataScreen = () => {
  const navigation = useNavigation();
  const t = useTranslation();
  const [expandedShopId, setExpandedShopId] = React.useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['khata'],
    queryFn: async () => {
      const res = await axiosClient.get('/khata');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const { 
    khata, 
    total_overall_pending = 0, 
    total_overall_paid = 0 
  } = data || { khata: [], total_overall_pending: 0, total_overall_paid: 0 };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Book color={theme.colors.textLight} size={64} />
      <Text style={styles.emptyTitle}>{t('noKhataRecords')}</Text>
      <Text style={styles.emptySub}>{t('noKhataSub')}</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('MainTabs')}>
        <Text style={styles.shopBtnText}>{t('startShoppingBtn')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => {
    const isExpanded = expandedShopId === item.shop.id;
    const pendingCountNum = item.transactions.filter(t => t.status === 'pending').length;
    const paidCountNum = item.transactions.filter(t => t.status === 'paid').length;

    return (
      <View style={styles.shopCardWrapper}>
        <TouchableOpacity 
          style={[styles.shopCard, isExpanded && styles.shopCardNoBottomBorder]} 
          onPress={() => setExpandedShopId(isExpanded ? null : item.shop.id)}
          activeOpacity={0.7}
        >
          <View style={styles.shopInfo}>
            <View style={styles.shopIconBox}>
              <Store color={theme.colors.primary} size={24} />
            </View>
            <View style={styles.shopDetails}>
              <Text style={styles.shopName} numberOfLines={1}>{item.shop.name}</Text>
              <Text style={styles.shopSub}>
                {t('pendingCount', { count: pendingCountNum })} • {t('paidCount', { count: paidCountNum })}
              </Text>
            </View>
          </View>
          <View style={styles.amountBox}>
            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
              {item.total_pending > 0 && (
                <Text style={styles.amountTextPending}>₹{item.total_pending.toFixed(2)}</Text>
              )}
              {item.total_paid > 0 && (
                <Text style={styles.amountTextPaid}>{t('paidAmount', { amount: item.total_paid.toFixed(2) })}</Text>
              )}
            </View>
            {isExpanded ? (
              <ChevronDown color={theme.colors.textLight} size={20} />
            ) : (
              <ChevronRight color={theme.colors.textLight} size={20} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            <Text style={styles.expandedTitle}>{t('transactionHistory')}</Text>
            {item.transactions.map((tx, idx) => (
              <View key={tx.id || idx} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.orderNumber}>{tx.orderNumber}</Text>
                  <View style={[
                    styles.statusPill, 
                    tx.status === 'pending' ? styles.statusPillPending : styles.statusPillPaid
                  ]}>
                    <Text style={[
                      styles.statusPillText, 
                      tx.status === 'pending' ? styles.statusPillTextPending : styles.statusPillTextPaid
                    ]}>
                      {tx.status === 'pending' ? t('pendingStatus') : t('paidStatus')}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.transactionDate}>
                  {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                
                <View style={styles.expandedItemsContainer}>
                  {tx.items?.map((product, pIdx) => (
                    <View key={pIdx} style={styles.productRowInline}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                        {product.image_url ? (
                          <Image source={{ uri: product.image_url }} style={styles.productThumbnail} />
                        ) : (
                          <View style={[styles.productThumbnail, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                            <Book size={10} color="#64748B" />
                          </View>
                        )}
                        <Text style={styles.productNameInline} numberOfLines={1}>
                          {product.quantity}x {product.name}
                        </Text>
                      </View>
                      <Text style={styles.productPriceInline}>₹{(product.price * product.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.transactionFooter}>
                  <Text style={styles.totalLabel}>{t('totalAmountLabel')}</Text>
                  <Text style={[
                    styles.totalValue, 
                    tx.status === 'pending' ? styles.totalValuePending : styles.totalValuePaid
                  ]}>
                    ₹{tx.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.visitShopBtnOutline}
              onPress={() => navigation.navigate('ShopStorefront', { id: item.shop.id })}
            >
              <Text style={styles.visitShopTextOutline}>{t('visitShopStorefront')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myKhataHeader')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Total Overview Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewLabel}>{t('myLedgerSummary')}</Text>
        
        <View style={styles.summaryGrid}>
          {/* Column 1: Pending (Dena Baki) */}
          <View style={styles.summaryCol}>
            <Text style={styles.summaryColLabel}>{t('denaBaki')}</Text>
            <Text style={styles.summaryAmountPending}>₹{total_overall_pending.toFixed(2)}</Text>
          </View>
          
          <View style={styles.verticalDivider} />
          
          {/* Column 2: Paid (Jama Kiya) */}
          <View style={styles.summaryCol}>
            <Text style={styles.summaryColLabel}>{t('jamaKiya')}</Text>
            <Text style={styles.summaryAmountPaid}>₹{total_overall_paid.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.overviewSub}>{t('khataNotice')}</Text>
      </View>

      {/* List */}
      <FlatList
        data={khata}
        keyExtractor={item => item.shop.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  backBtn: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 20,
  },
  overviewCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.m,
    padding: theme.spacing.l,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  overviewLabel: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  overviewAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.error, // Red for outstanding
    marginBottom: theme.spacing.s,
  },
  overviewSub: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.s,
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: theme.spacing.m,
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryColLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  summaryAmountPending: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444', // Red for pending/dues
  },
  summaryAmountPaid: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981', // Green for paid
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  amountTextPending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  amountTextPaid: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  shopCardWrapper: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.m,
  },
  shopCardNoBottomBorder: {
    paddingBottom: theme.spacing.s,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shopSub: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  emptySub: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  shopBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expandedContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  expandedTitle: {
    ...theme.typography.subtitle,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.m,
  },
  transactionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillPending: {
    backgroundColor: '#FEE2E2',
  },
  statusPillPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextPending: {
    color: '#EF4444',
  },
  statusPillTextPaid: {
    color: '#10B981',
  },
  transactionDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  expandedItemsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 6,
    marginBottom: 8,
  },
  productRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  productThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  productNameInline: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  productPriceInline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalValuePending: {
    color: '#EF4444',
  },
  totalValuePaid: {
    color: '#10B981',
  },
  visitShopBtnOutline: {
    marginTop: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  visitShopTextOutline: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  }
});
export default KhataScreen;
