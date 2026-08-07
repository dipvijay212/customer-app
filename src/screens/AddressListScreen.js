import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { CheckCircle2, ArrowLeft, Plus } from 'lucide-react-native';
import { useTranslation } from '../utils/translations';

export const AddressListScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axiosClient.get('/addresses');
      return res.data.addresses;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/addresses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses'])
  });

  const setDefaultMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      navigation.goBack();
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const handleDelete = (id) => {
    Alert.alert(t('delete'), t('confirmDeleteMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  const defaultAddressId = addresses?.find(a => a.is_default)?.id ?? addresses?.[0]?.id;

  const renderItem = ({ item }) => {
    const isSelected = item.id === defaultAddressId;
    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={{flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, paddingVertical: 4}}
            onPress={() => isSelected ? navigation.goBack() : setDefaultMutation.mutate(item)}
            activeOpacity={0.7}
          >
            {isSelected && <CheckCircle2 color={theme.colors.primary} size={20} style={{marginRight: 8}} />}
            <Text style={[styles.label, isSelected && {color: theme.colors.primary}]} numberOfLines={1}>
              {item.label} {isSelected && t('defaultTag')}
            </Text>
          </TouchableOpacity>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddressMapPicker', { address: item })} 
              style={{padding: 4, marginRight: 12}}
            >
              <Text style={styles.editText}>{t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 4}}>
              <Text style={styles.deleteText}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => isSelected ? navigation.goBack() : setDefaultMutation.mutate(item)}
          activeOpacity={0.7}
          style={{paddingTop: 4}}
        >
          <Text style={styles.body}>{item.line1}</Text>
          {item.line2 ? <Text style={styles.body}>{item.line2}</Text> : null}
          <Text style={styles.body}>{item.pincode}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('selectDeliveryAddress')}</Text>
      </View>
      
      <FlatList
        data={addresses}
        keyExtractor={a => a.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noSavedAddresses')}</Text>
            <Text style={styles.emptySubtext}>{t('addAddressSub')}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: theme.spacing.xl + insets.bottom }]}
        onPress={() => navigation.navigate('AddressMapPicker')}
        activeOpacity={0.85}
      >
        <Plus color="#FFF" size={20} style={{marginRight: 6}} />
        <Text style={styles.fabText}>{t('addNewAddress')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: '#0F172A',
  },
  list: {
    padding: theme.spacing.m,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    ...theme.typography.subtitle,
    color: '#334155',
    fontWeight: '700',
  },
  emptySubtext: {
    ...theme.typography.body,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.m + 2,
    borderRadius: 16,
    marginBottom: theme.spacing.m,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...theme.typography.subtitle,
    fontWeight: '700',
    fontSize: 16,
    color: '#1E293B',
  },
  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  editText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  body: {
    ...theme.typography.body,
    color: '#64748B',
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  }
});

export default AddressListScreen;
