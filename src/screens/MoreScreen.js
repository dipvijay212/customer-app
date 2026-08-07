import React, { useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Platform, StatusBar, ScrollView, Modal, TextInput, KeyboardAvoidingView, LayoutAnimation, UIManager, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { Menu, MapPin, Globe, HelpCircle, ChevronRight, ChevronDown, LogOut, Book, Trash2, ShoppingBag, ShieldCheck, Phone, User, Check, X, Store } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '../utils/translations';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export const MoreScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { logout, user: authUser, appLanguage, changeLanguage } = useContext(AuthContext);
  const t = useTranslation();

  const getAvatarLetter = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase() || 'U';
  };

  const insets = useSafeAreaInsets();
  const modalBottomPadding = Math.max(insets.bottom + 20, Platform.OS === 'android' ? 36 : 24);

  // Modals state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleLanguage = () => {
    const toValue = languageExpanded ? 0 : 1;
    setLanguageExpanded(!languageExpanded);
    Animated.timing(animatedHeight, {
      toValue,
      duration: toValue === 1 ? 300 : 250,
      useNativeDriver: false,
    }).start();
  };

  const containerHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  const containerOpacity = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });


  // User Profile Form State
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await axiosClient.get('/auth/me');
      return res.data.user;
    },
    initialData: authUser
  });

  const displayName = user?.name || 'Guest';
  const displayPhone = user?.phone || '';

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const confirmDeleteAccount = async () => {
    setDeleteModalVisible(false);
    Toast.show({
      type: 'info',
      text1: 'Account Deleted',
      text2: 'Your account has been permanently removed.'
    });
    await logout();
  };

  const getLanguageName = (code) => {
    switch(code) {
      case 'hi': return 'Hindi (हिंदी)';
      case 'gu': return 'Gujarati (ગુજરાતી)';
      default: return 'English';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const MenuItem = ({ icon: Icon, title, subtitle, badgeText, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconBox}>
        <Icon color={theme.colors.primary} size={20} />
      </View>
      <View style={styles.menuTextContainer}>
        <View style={styles.menuTitleRow}>
          <Text style={styles.menuTitle}>{title}</Text>
          {badgeText && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight color="#94A3B8" size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9F8" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Local<Text style={{color: theme.colors.primary}}>Mart</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Customer Header (Name & Mobile Number) */}
        <View style={styles.profileHero}>
          <TouchableOpacity 
            style={styles.avatarLargeContainer}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <View style={styles.avatarLetterCircle}>
              <Text style={styles.avatarLetterText}>{getAvatarLetter(displayName)}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.phoneRow}>
            <Phone color={theme.colors.primary} size={14} style={{marginRight: 6}} />
            <Text style={styles.userPhone}>{displayPhone}</Text>
          </View>
        </View>

        {/* Options Menu Card */}
        <View style={styles.menuCard}>
          {/* 1. My Profile Screen Option */}
          <MenuItem 
            icon={User} 
            title={t('myProfile')} 
            subtitle={t('myProfileSub')} 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <View style={styles.divider} />

          {/* 2. My Orders */}
          <MenuItem 
            icon={ShoppingBag} 
            title={t('myOrders')} 
            subtitle={t('myOrdersSub')} 
            onPress={() => navigation.navigate('Orders')} 
          />
          <View style={styles.divider} />
          
          {/* 3. Saved Addresses */}
          <MenuItem 
            icon={MapPin} 
            title={t('savedAddresses')} 
            subtitle={t('savedAddressesSub')} 
            badgeText="Default Set"
            onPress={() => navigation.navigate('AddressList')} 
          />
          <View style={styles.divider} />
          
          {/* 4. Manage My Shops */}
          <MenuItem 
            icon={Store} 
            title={t('manageMyShops')} 
            subtitle={t('manageMyShopsSub')} 
            onPress={() => navigation.navigate('ManageShops')} 
          />
          <View style={styles.divider} />
          
          {/* 4. My Khata Option */}
          <MenuItem 
            icon={Book} 
            title={t('myKhataUdhar')} 
            subtitle={t('myKhataSub')} 
            onPress={() => navigation.navigate('Khata')} 
          />
          <View style={styles.divider} />

          {/* 5. Privacy Policy Option */}
          <MenuItem 
            icon={ShieldCheck} 
            title={t('privacyPolicy')} 
            subtitle={t('privacyPolicySub')} 
            onPress={() => setPrivacyModalVisible(true)} 
          />
          <View style={styles.divider} />
          
          {/* 6. Language Selection Option (Inline, collapsible) */}
          <View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Globe color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{t('appLanguage')}</Text>
                <Text style={styles.menuSubtitle}>{t('appLanguageSub')}</Text>
              </View>
              {languageExpanded ? (
                <ChevronDown color="#94A3B8" size={20} />
              ) : (
                <ChevronRight color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>
            <Animated.View style={{ height: containerHeight, opacity: containerOpacity, overflow: 'hidden' }}>
              <View style={styles.languageChipsContainer}>
                {[
                  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
                  { code: 'hi', label: 'Hindi', native: 'हिंदी (Hindi)', flag: '🇮🇳' },
                  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
                ].map((lang) => {
                  const isSelected = appLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langOptionCard, isSelected && styles.langOptionCardSelected]}
                      onPress={() => {
                        changeLanguage(lang.code);
                        const toastTitle = lang.code === 'hi' ? 'भाषा बदली गई' : lang.code === 'gu' ? 'ભાષા બદલાઈ ગઈ' : 'Language Changed';
                        const toastMsg = lang.code === 'hi' ? `ऐप भाषा ${lang.label} पर सेट की गई` : lang.code === 'gu' ? `એપ્લિકેશનની ભાષા ${lang.label} સેટ થઈ ગઈ` : `App language set to ${lang.label}`;
                        Toast.show({
                          type: 'success',
                          text1: toastTitle,
                          text2: toastMsg,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 22, marginRight: 14 }}>{lang.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
                          {lang.native}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check color={theme.colors.primary} size={18} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </View>
          <View style={styles.divider} />

          {/* 7. Contact and Support Option */}
          <MenuItem 
            icon={HelpCircle} 
            title={t('contactSupport')} 
            subtitle={t('contactSupportSub')} 
            onPress={() => navigation.navigate('HelpSupport')} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModalVisible(true)} activeOpacity={0.85}>
          <LogOut color={theme.colors.primary} size={20} style={{marginRight: 8}} />
          <Text style={styles.logoutText}>{t('logOutBtn')}</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModalVisible(true)} activeOpacity={0.85}>
          <Trash2 color="#EF4444" size={20} style={{marginRight: 8}} />
          <Text style={styles.deleteText}>{t('deleteAccountBtn')}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>LocalMart v2.4.0 • Customer App</Text>
      </ScrollView>



      {/* PRIVACY POLICY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.bottomModalContent, { maxHeight: '80%', paddingBottom: modalBottomPadding }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>{t('privacyPolicy')}</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 12 }}>
              <Text style={styles.privacyHeading}>LocalMart Data Protection & Privacy</Text>
              <Text style={styles.privacyBody}>
                We value your privacy. LocalMart collects your location data only to provide accurate nearby shop information and delivery estimates.
                {'\n\n'}
                1. <Text style={{fontWeight: 'bold'}}>Data Security:</Text> All mobile numbers, addresses, and payment details are encrypted using industry standards.
                {'\n\n'}
                2. <Text style={{fontWeight: 'bold'}}>Local Shops Sharing:</Text> Only essential delivery details (Name, Address, Mobile) are shared with shopkeepers for order fulfillment.
                {'\n\n'}
                3. <Text style={{fontWeight: 'bold'}}>Your Rights:</Text> You can update your profile or delete your account at any time.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('confirmLogoutTitle')}</Text>
            <Text style={styles.modalMessage}>{t('confirmLogoutMsg')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={handleLogout}>
                <Text style={styles.modalDeleteText}>{t('logoutUpper')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('confirmDeleteTitle')}</Text>
            <Text style={styles.modalMessage}>{t('confirmDeleteMsg')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={confirmDeleteAccount}>
                <Text style={styles.modalDeleteText}>{t('deleteUpper')}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#F7F9F8',
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 22,
    color: '#15803D',
  },
  avatarContainerTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
    marginTop: 10,
    marginBottom: 28,
  },
  avatarLargeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarLetterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: '#15803D', // Premium deep green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetterText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
  },
  userName: {
    ...theme.typography.title,
    fontSize: 22,
    color: '#333',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 28,
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  menuSubtitle: {
    ...theme.typography.caption,
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  languageChipsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 4,
  },
  languageChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  langChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: theme.colors.primary,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  langChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...theme.shadows.soft,
  },
  logoutText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
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
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 24,
    ...theme.shadows.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#E2E8F0',
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
    color: '#81F2AE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalDeleteText: {
    color: '#81F2AE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  langOptionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ECFDF5',
  },
  langText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  langTextSelected: {
    color: theme.colors.primary,
  },
  langNativeText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  privacyHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  privacyBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  }
});

export default MoreScreen;
