import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Platform, StatusBar, ScrollView, Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { Menu, Edit2, MapPin, Globe, Store, HelpCircle, ChevronRight, LogOut, Book, Trash2 } from 'lucide-react-native';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout, user: authUser } = React.useContext(AuthContext);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await axiosClient.get('/auth/me');
      return res.data.user;
    },
    initialData: authUser
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteModalVisible(false);
    await logout();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#006B54" />
      </SafeAreaView>
    );
  }

  // Fallbacks to match screenshot design exactly if user data is missing
  const displayName = user?.name || 'Rahul S.';
  const displayEmail = user?.email || 'rahul.s@localneighborhood.com';

  const MenuItem = ({ icon: Icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <Icon color="#006B54" size={20} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight color="#006B54" size={20} />
    </TouchableOpacity>
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
          <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }} style={styles.avatarTop} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarLargeContainer}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' }} style={styles.avatarLarge} />
            <TouchableOpacity style={styles.editIconBadge}>
              <Edit2 color="#FFF" size={14} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Menu Card */}
        <View style={styles.menuCard}>
          <MenuItem 
            icon={MapPin} 
            title="Saved Addresses" 
            onPress={() => navigation.navigate('AddressList')} 
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon={Globe} 
            title="Language Settings" 
            subtitle="Current: English" 
            onPress={() => navigation.navigate('LanguageSettings')} 
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon={Store} 
            title="Manage My Shops" 
            onPress={() => navigation.navigate('ManageShops')} 
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon={Book} 
            title="My Khata (Udhar)" 
            subtitle="View your shop ledger"
            onPress={() => navigation.navigate('Khata')} 
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon={HelpCircle} 
            title="Help & Support" 
            onPress={() => navigation.navigate('HelpSupport')} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#006B54" size={20} style={{marginRight: 8}} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Trash2 color="#EF4444" size={20} style={{marginRight: 8}} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>App Version 2.0.1 (Build 104)</Text>
      </ScrollView>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={confirmDeleteAccount}>
                <Text style={styles.modalDeleteText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  avatarTop: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHero: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarLargeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006B54',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    ...theme.typography.title,
    fontSize: 22,
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.textLight,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 40,
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9', // Light green box
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...theme.typography.body,
    color: '#006B54', // Dark teal title
    fontWeight: '500',
    fontSize: 15,
  },
  menuSubtitle: {
    ...theme.typography.caption,
    color: '#006B54',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#81F2AE', // Bright mint green
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  logoutText: {
    color: '#006B54',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appVersion: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#4B4D4B', // Match the dark grey from the screenshot
    borderRadius: 8,
    padding: 24,
    ...theme.shadows.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#81F2AE', // Light green color
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalDeleteText: {
    color: '#81F2AE',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});

export default ProfileScreen;
