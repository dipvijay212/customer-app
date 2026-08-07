import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../utils/translations';

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useContext(AuthContext);
  const t = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setGender(user.gender || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: t('validationError'),
        text2: t('fullNameRequired')
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Update locally in AuthContext
      await updateUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender
      });
      
      Toast.show({
        type: 'success',
        text1: t('profileUpdated'),
        text2: t('profileUpdatedMsg')
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9F8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={theme.colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('updateProfileHeader')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('yourInfo')}</Text>
            
            {/* Full Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('fullName')}</Text>
              <View style={styles.inputContainer}>
                <User color="#64748B" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enterFullName')}
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Number Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('mobileNumber')}</Text>
              <View style={styles.inputContainer}>
                <Phone color="#64748B" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enterMobileNumber')}
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email Address Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('emailAddress')}</Text>
              <View style={styles.inputContainer}>
                <Mail color="#64748B" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enterEmailAddress')}
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Gender Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('gender')}</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => {
                  const isSelected = gender === g;
                  const genderKey = g.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderPill, isSelected && styles.genderPillSelected]}
                      onPress={() => setGender(isSelected ? '' : g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>
                        {t(genderKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Persistent bottom save button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 16, Platform.OS === 'android' ? 32 : 20) }]}>
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20,
    paddingBottom: 16,
    backgroundColor: '#F7F9F8',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  headerTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: '#1D6B35',
    textAlign: 'center',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 24,
    ...theme.shadows.soft,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1E293B',
    padding: 0,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  genderTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  bottomBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  saveBtnDisabled: {
    backgroundColor: '#A7F3D0',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
