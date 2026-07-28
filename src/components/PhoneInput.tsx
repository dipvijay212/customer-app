import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING, RADIUS } from '../constants/spacing';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText.length <= 10) {
      onChangeText(cleanedText);
    }
  };

  return (
    <View style={[styles.container, isFocused && styles.focusedContainer]}>
      <TouchableOpacity
        style={styles.countryPicker}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Country Code India Plus 91"
      >
        <Text style={styles.flag}>🇮🇳</Text>
        <Text style={styles.countryCode}>+91</Text>
        <View style={styles.dropdownIcon}>
          <Svg width={9} height={5} viewBox="0 0 10 6" fill="none">
            <Path
              d="M1 1L5 5L9 1"
              stroke={COLORS.secondaryText}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter mobile number"
          placeholderTextColor={COLORS.secondaryText}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
          maxLength={10}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmit}
          editable={!disabled}
          returnKeyType="done"
          selectionColor={COLORS.primaryGreen}
          accessibilityLabel="Mobile Number Input"
        />
        <View style={styles.phoneIconContainer}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill={COLORS.primaryGreen}>
            <Path
              d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.l,
    paddingHorizontal: 14,
  },
  focusedContainer: {
    borderColor: COLORS.primaryGreen,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 17,
    marginRight: 5,
  },
  countryCode: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.semibold,
    fontSize: 15,
    color: COLORS.primaryText,
    marginRight: 4,
  },
  dropdownIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.family.medium,
    fontWeight: FONTS.weight.medium,
    fontSize: 14.5,
    color: COLORS.primaryText,
    paddingVertical: 0,
    paddingRight: 6,
    height: '100%',
  },
  phoneIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
