import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  StatusBar
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Smartphone, Store, ShieldCheck, ArrowRight, Lock } from 'lucide-react-native';
import { theme } from '../../theme';
import { useTranslation } from '../../utils/translations';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const bottomPadding = Math.max(insets.bottom + 40, Platform.OS === 'android' ? 75 : 40);
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);

  // Animated Values initialized once
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const isPhoneValid = phone.length === 10;

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit mobile number.'
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Verification Code Sent',
        text2: 'Check your messages for the verification code.'
      });
      navigation.navigate('VerifyOTP', { phone });
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      
      {/* Soft Green Decorative Circles */}
      <View style={styles.decoCircle1} />
      <View style={styles.decoCircle2} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <KeyboardAwareScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER SECTION */}
          <Animated.View 
            style={[
              styles.header, 
              { 
                opacity: fadeAnim, 
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            {/* Circular Brand Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoInnerGlow}>
                <Store color={theme.colors.primary} size={46} />
              </View>
            </View>

            {/* Brand Title */}
            <Text style={styles.welcomeTitle}>{t('welcomeLoginTitle')}</Text>
            <Text style={styles.appName}>LocalMart</Text>
            <Text style={styles.headerSubtitle}>
              {t('loginSubHeader')}
            </Text>
          </Animated.View>

          {/* LOGIN CARD */}
          <Animated.View 
            style={[
              styles.loginCard, 
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <Text style={styles.cardTitle}>{t('enterMobileTitle')}</Text>
            <Text style={styles.cardSubtitle}>
              {t('sendOtpSubtext')}
            </Text>

            {/* PHONE FIELD */}
            <TouchableOpacity 
              style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.countryPicker} pointerEvents="none">
                <Text style={styles.countryFlag}>🇮🇳</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>
              <View style={styles.dividerVertical} pointerEvents="none" />
              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                placeholder={t('mobilePlaceholder')}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={true}
              />
              <View pointerEvents="none">
                <Smartphone color={isFocused ? theme.colors.primary : "#94A3B8"} size={22} style={styles.phoneIcon} />
              </View>
            </TouchableOpacity>

            {/* SECURITY ROW */}
            <View style={styles.securityRow}>
              <ShieldCheck color={theme.colors.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.securityText}>{t('securityNotice')}</Text>
            </View>

            {/* CONTINUE BUTTON */}
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                !isPhoneValid && styles.continueButtonDisabled
              ]} 
              onPress={handleSendOtp}
              disabled={loading || !isPhoneValid}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.continueButtonText}>{t('continueBtn')}</Text>
                  <ArrowRight color="#FFFFFF" size={20} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* BOTTOM TRUST MESSAGE */}
          <Animated.View style={[styles.trustSection, { opacity: fadeAnim }]}>
            <View style={styles.trustBadge}>
              <Lock color={theme.colors.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.trustBadgeTitle}>Safe & Secure Login</Text>
            </View>
            <Text style={styles.trustSubtitle}>
              OTP verification protects your account.
            </Text>
          </Animated.View>

          <View style={styles.spacer} />

          {/* FOOTER */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>By continuing, you agree to</Text>
            <View style={styles.legalRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
                <Text style={styles.legalLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}> • </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 40 : 56,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    alignItems: 'stretch',
  },
  decoCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
  },
  decoCircle2: {
    position: 'absolute',
    top: 140,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DCFCE7',
    opacity: 0.4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoInnerGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 56,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  phoneIcon: {
    marginLeft: 8,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trustSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },
  trustBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  trustSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: Platform.OS === 'android' ? 40 : 12,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLink: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  legalDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default LoginScreen;
>>>>>>> 6d677e0 (UI updates)
