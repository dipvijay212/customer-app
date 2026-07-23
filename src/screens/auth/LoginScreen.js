import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { Smartphone, Store, ShieldCheck } from 'lucide-react-native';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRegister = route.params?.mode === 'register';
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Number',
        text2: 'Please enter a valid 10-digit phone number.'
      });
      return;
    }

    setLoading(true);
    try {
      await authService.sendOtp(phone);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'Check your messages for the code.'
      });
      navigation.navigate('VerifyOTP', { phone });
    } catch (e) {
      console.log('OTP Send Error', e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send OTP.'
      });
    } finally {
      setLoading(false);
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
          contentContainerStyle={styles.keyboardView}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Store color={theme.colors.primary} size={40} />
          </View>
          <Text style={styles.title}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister 
              ? 'Enter your phone number to set up your new profile.' 
              : 'Enter your phone number to sign in or create a new account instantly.'}
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefix}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Mobile number"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              autoFocus={true}
            />
            <Smartphone color={theme.colors.textLight} size={20} style={{ marginRight: theme.spacing.m, alignSelf: 'center' }} />
          </View>

          <TouchableOpacity 
            style={[styles.button, (!phone || phone.length < 10) && styles.buttonDisabled]} 
            onPress={handleSendOtp}
            disabled={loading || !phone || phone.length < 10}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Continue' : 'Get OTP'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ShieldCheck color={theme.colors.textLight} size={16} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>Your data is safe and strictly protected.</Text>
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
  decoCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E8F5E9',
    opacity: 0.5,
  },
  decoCircle2: {
    position: 'absolute',
    top: 150,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8F5E9',
    opacity: 0.3,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 1.5,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.background,
    borderRadius: 28, // pill-shaped
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
    height: 56, 
  },
  prefixContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  prefix: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    ...theme.typography.body,
    paddingHorizontal: theme.spacing.m,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: 28, // pill-shaped
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.primary,
    opacity: 0.4,
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
    marginTop: theme.spacing.xl * 2,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  }
});
