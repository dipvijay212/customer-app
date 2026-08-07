import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Image, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Store, ArrowRight, ShieldCheck } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '../../theme';

import { useTranslation } from '../../utils/translations';

const { width, height } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const navigation = useNavigation();
  const t = useTranslation();

  const handleGetStarted = (mode) => {
    if (mode === 'register') {
      navigation.navigate('ProfileSetup', { isRegistration: true });
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContent}>
        
        {/* Full-bleed Hero Illustration */}
        <View style={styles.heroContainer}>
          <Image 
            source={require('../../assets/hero_welcome.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Subtle gradient fade blending into background */}
          <View style={styles.gradientOverlay}>
            <Svg height="100%" width="100%">
              <Defs>
                <SvgLinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#F8FAFC" stopOpacity="0" />
                  <Stop offset="1" stopColor="#F8FAFC" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
            </Svg>
          </View>
        </View>

        {/* Content Block */}
        <View style={styles.content}>
          {/* Logo Badge */}
          <View style={styles.logoBadge}>
            <Store color={theme.colors.primary} size={24} />
          </View>

          {/* Texts */}
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('welcomeSub')}</Text>

          {/* Actions */}
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleGetStarted('register')} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>{t('createAccountBtn')}</Text>
            <ArrowRight color="#FFF" size={22} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={() => handleGetStarted('login')} activeOpacity={0.6}>
            <Text style={styles.signInText}>{t('alreadyHaveAccountText')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.footer}>
          <ShieldCheck color="#94A3B8" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>{t('secureCommunityNotice')}</Text>
        </View>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  heroContainer: {
    width: '100%',
    height: height * 0.45,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  signInButton: {
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 75 : 24,
    marginBottom: Platform.OS === 'android' ? 32 : 12,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  }
});

export default WelcomeScreen;
