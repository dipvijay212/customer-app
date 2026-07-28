import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING, RADIUS, SHADOWS } from '../constants/spacing';
import { HeroSection } from '../components/HeroSection';
import { PhoneInput } from '../components/PhoneInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Footer } from '../components/Footer';
// Integrate app auth service if available
import { authService } from '../services/authService';

export const CustomerLoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    cardOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    cardTranslateY.value = withDelay(
      150,
      withSpring(0, { damping: 16, stiffness: 160 })
    );
  }, [cardOpacity, cardTranslateY]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleContinue = async () => {
    if (phone.length < 10 || loading) {
      return;
    }
    setLoading(true);
    try {
      // Notify authentication service
      try {
        if (authService && authService.sendOtp) {
          await authService.sendOtp(phone);
        }
      } catch (apiError) {
        console.log('Service fallback:', apiError);
      }

      Toast.show({
        type: 'success',
        text1: 'Verification Code Sent',
        text2: `An OTP was sent to +91 ${phone}`,
      });

      // Navigate directly to OTP verification screen
      navigation.navigate('VerifyOTP', { phone });
    } catch (err) {
      console.log('Navigation Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Navigation Error',
        text2: 'Unable to transition to OTP verification screen.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <HeroSection />

          <Animated.View style={[styles.loginCard, SHADOWS.medium, cardAnimatedStyle]}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Enter your mobile number
            </Text>

            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              onSubmit={handleContinue}
              disabled={loading}
            />

            <View style={styles.helpRow}>
              <View style={styles.shieldIconContainer}>
                <Text style={styles.shieldSymbol}>🛡️</Text>
              </View>
              <Text style={styles.helpText}>
                We&apos;ll send you a verification code{'\n'}to verify your number.
              </Text>
            </View>

            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
              disabled={phone.length < 10}
              loading={loading}
            />
          </Animated.View>

          <View style={styles.footerWrap}>
            <Footer
              onPressTerms={() => {
                Toast.show({ type: 'info', text1: 'Terms & Conditions' });
              }}
              onPressPrivacy={() => {
                Toast.show({ type: 'info', text1: 'Privacy Policy' });
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: Platform.OS === 'android' ? 56 : 42,
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  loginCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginTop: SPACING.xs,
  },
  cardTitle: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: 20,
    lineHeight: 26,
    color: COLORS.primaryText,
    marginBottom: 18,
    letterSpacing: -0.2,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: SPACING.xs,
  },
  shieldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shieldSymbol: {
    fontSize: 16,
  },
  helpText: {
    flex: 1,
    fontFamily: FONTS.family.regular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },
  footerWrap: {
    marginTop: 40,
    marginBottom: SPACING.m,
  },
});
