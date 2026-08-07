import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, StatusBar } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, Check, ArrowRight } from 'lucide-react-native';
import { theme } from '../../theme';
import { useTranslation } from '../../utils/translations';

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English', subtitle: 'Default Language', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', subtitle: 'हिंदी में जारी रखें', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', subtitle: 'ગુજરાતીમાં આગળ વધો', flag: '🇮🇳' },
];

export const LanguageSelectScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { appLanguage, changeLanguage } = useContext(AuthContext);
  const t = useTranslation();
  const [selectedLang, setSelectedLang] = useState(appLanguage || 'en');

  const handleSelectLang = async (langId) => {
    setSelectedLang(langId);
    await changeLanguage(langId);
  };

  const handleContinue = async () => {
    await changeLanguage(selectedLang);
    navigation.navigate('Welcome');
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedLang;

    return (
      <TouchableOpacity 
        style={[styles.langCard, isSelected && styles.langCardSelected]}
        onPress={() => handleSelectLang(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.langLeft}>
          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
            {isSelected && <View style={styles.radioInnerCircle} />}
          </View>

          {/* Language Flag Badge */}
          <View style={styles.flagContainer}>
            <Text style={styles.flagEmoji}>{item.flag}</Text>
          </View>

          <View style={styles.langTextContainer}>
            <Text style={[styles.langNativeName, isSelected && styles.langNativeNameSelected]}>
              {item.nativeName}
            </Text>
            <Text style={styles.langName}>{item.name} • {item.subtitle}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.checkBadge}>
            <Check color="#FFF" size={16} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const bottomFooterPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 12;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Store color={theme.colors.primary} size={28} />
        </View>
        <Text style={styles.title}>{t('chooseLanguageTitle')}</Text>
        <Text style={styles.subtitle}>{t('chooseLanguageSub')}</Text>
      </View>

      {/* Language List */}
      <View style={styles.listContainer}>
        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Footer with Sticky Continue Button & Safe Area Bottom Margin */}
      <View style={[styles.footer, { paddingBottom: bottomFooterPadding }]}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue} 
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>{t('continueBtn')}</Text>
          <ArrowRight color="#FFF" size={22} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  langCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ECFDF5',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary,
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  flagContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flagEmoji: {
    fontSize: 22,
  },
  langTextContainer: {
    flex: 1,
  },
  langNativeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  langNativeNameSelected: {
    color: theme.colors.primary,
  },
  langName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default LanguageSelectScreen;

