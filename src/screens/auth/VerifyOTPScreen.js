import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from '../../utils/translations';

export const VerifyOTPScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const bottomPadding = Math.max(insets.bottom + 40, Platform.OS === 'android' ? 75 : 40);
  const { phone, isRegistration, profileData } = route.params || {};
  
  const { login } = useContext(AuthContext);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter the 6-digit OTP.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone, otp);
      
      if (isRegistration && profileData) {
        const createRes = await authService.createProfile({ phone, ...profileData });
        Toast.show({ type: 'success', text1: 'Profile Created!', text2: 'Welcome to Local Shops.' });
        await login(createRes.token, createRes.customer);
      } else {
        if (res.isNewUser) {
          // Fallback if they clicked Sign In but are actually a new user
          navigation.navigate('ProfileSetup', { phone, isVerified: true });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Welcome Back!',
            text2: 'Logged in successfully.'
          });
          await login(res.token, res.customer);
        }
      }
    } catch (e) {
      console.log('OTP Verify Error', e);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: e.message || 'Invalid OTP'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await authService.sendOtp(phone);
      Toast.show({ type: 'success', text1: 'OTP Resent' });
      setCooldown(30);
    } catch (e) {
      console.log('Resend error', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.decoCircle1} />
      <View style={styles.decoCircle2} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <KeyboardAwareScrollView 
          contentContainerStyle={[styles.keyboardView, { paddingBottom: bottomPadding }]}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
        >
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <MessageSquare color={theme.colors.primary} size={40} />
          </View>
          <Text style={styles.title}>{t('verifyOtpHeaderTitle')}</Text>
          <Text style={styles.subtitle}>{t('verifyOtpSubtitle')} +91 {phone}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('otpPlaceholder')}</Text>
          
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={[styles.otpBox, otp.length === index && styles.otpBoxActive]}>
                <Text style={styles.otpText}>{otp[index] || ''}</Text>
              </View>
            ))}
            <TextInput
              style={styles.hiddenInput}
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              keyboardType="number-pad"
              autoFocus={true}
            />
          </View>
          
          <Text style={styles.devHint}>Dev mode: use 123456</Text>

          <TouchableOpacity 
            style={[styles.button, (!otp || otp.length < 6) && styles.buttonDisabled]} 
            onPress={handleVerify}
            disabled={loading || !otp || otp.length < 6}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('verifyContinueBtn')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('didntReceiveOtp')} </Text>
          <TouchableOpacity onPress={handleResend} disabled={cooldown > 0}>
            <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
              {cooldown > 0 ? t('resendCooldownText', { cooldown }) : t('resendOtpBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  backButtonTop: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 20,
    left: theme.spacing.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  decoCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#DCFCE7',
    opacity: 0.5,
  },
  decoCircle2: {
    position: 'absolute',
    top: 150,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DCFCE7',
    opacity: 0.3,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 1.5,
    marginTop: theme.spacing.xl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.l,
    ...theme.shadows.soft,
  },
  title: {
    ...theme.typography.title,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.l,
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.l,
    ...theme.shadows.medium,
  },
  inputLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.s,
    marginLeft: theme.spacing.xs,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: theme.spacing.m,
    position: 'relative',
  },
  otpBox: {
    width: 40,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  otpText: {
    ...theme.typography.title,
    fontSize: 24,
    color: theme.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  devHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  buttonText: {
    ...theme.typography.subtitle,
    color: theme.colors.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 1.5,
    marginBottom: Platform.OS === 'android' ? 40 : 16,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
  },
  resendText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  }
});
