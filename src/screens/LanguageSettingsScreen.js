import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../utils/translations';

export const LanguageSettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { appLanguage, changeLanguage } = useContext(AuthContext);
  const t = useTranslation();
  const [selectedLang, setSelectedLang] = useState(appLanguage || 'en');

  const languages = [
    { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  const handleSave = () => {
    if (changeLanguage) {
      changeLanguage(selectedLang);
    }
    Toast.show({
      type: 'success',
      text1: t('languageChangedTitle'),
      text2: t('languageChangedMsg', { lang: languages.find(l => l.id === selectedLang)?.nativeName || selectedLang })
    });
    navigation.goBack();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedLang;
    
    return (
      <TouchableOpacity 
        style={[styles.langRow, isSelected && styles.langRowSelected]}
        onPress={() => setSelectedLang(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.flagContainer}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
        </View>

        <View style={styles.langInfo}>
          <Text style={styles.langName}>{item.nativeName}</Text>
          <Text style={styles.langSub}>{item.name}</Text>
        </View>

        {isSelected && (
          <View style={styles.checkIcon}>
            <Check color={theme.colors.primary} size={20} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const bottomFooterPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 12;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#1A1A1A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('languageSettingsHeader')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>{t('selectLanguageInstruction')}</Text>
        
        <FlatList
          data={languages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: bottomFooterPadding }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{t('saveLanguageBtn')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  instruction: {
    ...theme.typography.subtitle,
    margin: theme.spacing.m,
    color: theme.colors.textLight,
  },
  listContent: {
    paddingHorizontal: theme.spacing.m,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: theme.spacing.m,
    borderRadius: 12,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  langRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FFF4',
  },
  flagContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  flagEmoji: {
    fontSize: 22,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    ...theme.typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  langSub: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  checkIcon: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  }
});

export default LanguageSettingsScreen;
