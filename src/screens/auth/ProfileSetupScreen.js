import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import {
  User,
  Mail,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react-native';

export const ProfileSetupScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { isRegistration, isVerified, phone: initialPhone } = route.params || {};
  
  const { appLanguage, login } = useContext(AuthContext);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(initialPhone || '');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const scrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Input Refs for reliable focus
  const phoneRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(25)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Calculate profile completion percentage
  const calculateProgress = () => {
    let current = 25;
    if (phone.length === 10) current += 25;
    if (name.trim().length > 0) current += 25;
    if (email.trim().length > 0 || gender) current += 25;
    return Math.min(current, 100);
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage, progressAnim]);

  const handleSubmit = async () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Please enter your full name');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!phone || phone.length < 10) {
      setPhoneError('Enter a valid 10-digit mobile number');
      isValid = false;
    } else {
      setPhoneError('');
    }

    if (!isValid) return;

    setLoading(true);
    try {
      if (isVerified) {
        const res = await authService.createProfile({
          phone,
          name,
          email,
          gender,
          language: appLanguage || 'en'
        });
        Toast.show({ type: 'success', text1: 'Profile Created!', text2: 'Welcome to Local Shops.' });
        await login(res.token, res.customer);
      } else {
        await authService.sendOtp(phone);
        Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Check your messages for the code.' });
        
        navigation.navigate('VerifyOTP', { 
          phone, 
          isRegistration: true, 
          profileData: { name, email, gender, language: appLanguage || 'en' }
        });
      }
    } catch (e) {
      console.log('Error', e);
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim().length > 0 && phone.length === 10;

  const getInputStyle = (fieldName, hasError) => [
    styles.inputContainer,
    focusedField === fieldName && styles.inputContainerFocused,
    hasError && styles.inputContainerError
  ];

  const getIconColor = (fieldName) => 
    focusedField === fieldName ? theme.colors.primary : '#94A3B8';

  const bottomPadding = Math.max(insets.bottom, 16) + 8;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Soft Background Accents */}
      <View style={styles.decoCircle1} pointerEvents="none" />
      <View style={styles.decoCircle2} pointerEvents="none" />

      <ScrollView 
        ref={scrollRef}
        style={styles.keyboardView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + keyboardHeight + 16 }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {/* Top Bar with Step Badge */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <ArrowLeft color="#1E293B" size={22} />
            </TouchableOpacity>

            <View style={styles.stepBadge}>
              <Sparkles color={theme.colors.primary} size={14} style={{ marginRight: 5 }} />
              <Text style={styles.stepBadgeText}>QUICK SETUP</Text>
            </View>
          </View>

          {/* Header Title & Subtitle */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.title}>{isRegistration ? t('createAccountHeader') : t('setupProfileHeader')}</Text>
            <Text style={styles.subtitle}>{t('enterDetailsSub')}</Text>

            {/* Profile Completion Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Profile Strength</Text>
                <Text style={styles.progressValue}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                      }) 
                    }
                  ]} 
                />
              </View>
            </View>
          </Animated.View>
          
          {/* Elevated Form Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <User color={theme.colors.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderText}>PERSONAL INFORMATION</Text>
            </View>

            {/* Mobile Number */}
            <Text style={styles.inputLabel}>{t('phoneLabel')} <Text style={styles.asterisk}>*</Text></Text>
            <TouchableOpacity 
              style={getInputStyle('phone', !!phoneError)}
              activeOpacity={1}
              onPress={() => phoneRef.current?.focus()}
            >
              <View style={styles.prefixContainer} pointerEvents="none">
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.prefix}>+91</Text>
                <View style={styles.prefixDivider} />
              </View>
              <TextInput
                ref={phoneRef}
                style={styles.input}
                placeholder={t('mobilePlaceholder')}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  if (phoneError) setPhoneError('');
                }}
                maxLength={10}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                editable={true}
              />
              {phone.length === 10 && (
                <CheckCircle2 color={theme.colors.primary} size={18} style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            {/* Full Name */}
            <Text style={styles.inputLabel}>{t('fullNameLabel')}</Text>
            <TouchableOpacity 
              style={getInputStyle('name', !!nameError)}
              activeOpacity={1}
              onPress={() => nameRef.current?.focus()}
            >
              <User color={getIconColor('name')} size={20} style={styles.inputIcon} />
              <TextInput
                ref={nameRef}
                style={styles.input}
                placeholder={t('fullNamePlaceholder')}
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                autoCapitalize="words"
                onFocus={() => {
                  setFocusedField('name');
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 60, animated: true });
                  }, 150);
                }}
                onBlur={() => setFocusedField(null)}
                editable={true}
              />
              {name.trim().length > 0 && (
                <CheckCircle2 color={theme.colors.primary} size={18} style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

            {/* Email Address */}
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <TouchableOpacity 
              style={getInputStyle('email')}
              activeOpacity={1}
              onPress={() => emailRef.current?.focus()}
            >
              <Mail color={getIconColor('email')} size={20} style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                onFocus={() => {
                  setFocusedField('email');
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 160, animated: true });
                  }, 150);
                }}
                onBlur={() => setFocusedField(null)}
                editable={true}
              />
            </TouchableOpacity>

            {/* Gender Selection */}
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>{t('genderLabel')}</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => {
                const isSelected = gender === g;
                const genderKey = g.toLowerCase() + 'Option';
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

          {/* Action Section (Scrolling with content) */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.button, !isFormValid && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading || !isFormValid}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {isVerified ? t('updateDetailsBtn') : t('submitRegistrationBtn')}
                  </Text>
                  <ArrowRight color="#FFFFFF" size={20} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footerPill}>
              <ShieldCheck color={theme.colors.primary} size={15} style={{ marginRight: 6 }} />
              <Text style={styles.footerText}>100% Encrypted & Secure Data</Text>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  decoCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DCFCE7',
    opacity: 0.7,
  },
  decoCircle2: {
    position: 'absolute',
    top: 180,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#ECFDF5',
    opacity: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginLeft: 2,
  },
  asterisk: {
    color: '#EF4444',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputIcon: {
    marginRight: 12,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefixDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
    height: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  genderPill: {
    flex: 1,
    height: 42,
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
  actionSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  }
});

export default ProfileSetupScreen;

