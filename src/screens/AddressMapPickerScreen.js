import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Home, Briefcase, Tag, AlignLeft, Map as MapIcon, ArrowLeft, Crosshair, Check, Sparkles, Search, Navigation, LocateFixed } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';
import { ensureLocationReady } from '../utils/locationHelper';
import Toast from 'react-native-toast-message';
import { useTranslation } from '../utils/translations';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_LAT = 21.2334;
const DEFAULT_LNG = 72.8637;

export const AddressMapPickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const mapRef = useRef(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const editAddress = route.params?.address;

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axiosClient.get('/addresses');
      return res.data.addresses;
    }
  });

  const defaultSaved = addresses?.find(a => a.is_default) || addresses?.[0];
  const initialAddressTarget = editAddress || defaultSaved;

  const getInitialLat = () => {
    if (initialAddressTarget?.latitude) return parseFloat(initialAddressTarget.latitude);
    if (initialAddressTarget?.lat) return parseFloat(initialAddressTarget.lat);
    return DEFAULT_LAT;
  };

  const getInitialLng = () => {
    if (initialAddressTarget?.longitude) return parseFloat(initialAddressTarget.longitude);
    if (initialAddressTarget?.lng) return parseFloat(initialAddressTarget.lng);
    return DEFAULT_LNG;
  };

  const [region, setRegion] = useState({
    latitude: getInitialLat(),
    longitude: getInitialLng(),
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [label, setLabel] = useState(initialAddressTarget ? initialAddressTarget.label : 'Home');
  const [line1, setLine1] = useState(initialAddressTarget ? initialAddressTarget.line1 : '');
  const [line2, setLine2] = useState(initialAddressTarget ? initialAddressTarget.line2 || '' : '');
  const [pincode, setPincode] = useState(initialAddressTarget ? initialAddressTarget.pincode : '');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const fetchForwardGeocode = async (queryText) => {
    if (!queryText || queryText.trim().length < 2) return;
    setIsGeocoding(true);
    try {
      const searchQuery = queryText.toLowerCase().includes('surat') 
        ? queryText 
        : `${queryText}, Surat, Gujarat, India`;
        
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CustomerApp/1.0',
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        const newRegion = {
          latitude: newLat,
          longitude: newLng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 800);
        
        const addr = result.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || queryText;
        const line2Val = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || 'Surat';
        const pincodeVal = addr.postcode || '394105';

        setFormattedAddress(result.display_name || `${queryText}, ${line2Val} - ${pincodeVal}`);
        setLine1(queryText);
        if (line2Val) setLine2(line2Val);
        if (pincodeVal) setPincode(pincodeVal);
        
        Toast.show({
          type: 'success',
          text1: 'Location Found 📍',
          text2: `Updated map to ${queryText}`,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Address Not Found',
          text2: 'Could not find exact coordinates on map. You can still save your entered address.',
        });
      }
    } catch (err) {
      console.log('Forward geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initial location setup
  useEffect(() => {
    if (initialAddressTarget && (initialAddressTarget.lat || initialAddressTarget.latitude)) {
      const initialLat = getInitialLat();
      const initialLng = getInitialLng();
      const newRegion = {
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      fetchReverseGeocode(initialLat, initialLng);
    } else {
      ensureLocationReady()
        .then((loc) => {
          if (loc && loc.latitude && loc.longitude) {
            // Check if it's the Android Emulator default Mountain View location (lat ~37.42, lon ~-122.08)
            const isEmulatorDefaultUS = (Math.abs(loc.latitude - 37.42) < 1.5 && Math.abs(loc.longitude - (-122.08)) < 1.5);
            const targetLat = isEmulatorDefaultUS ? DEFAULT_LAT : loc.latitude;
            const targetLng = isEmulatorDefaultUS ? DEFAULT_LNG : loc.longitude;

            const newRegion = {
              latitude: targetLat,
              longitude: targetLng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            fetchReverseGeocode(targetLat, targetLng);
          }
        })
        .catch(() => {
          fetchReverseGeocode(DEFAULT_LAT, DEFAULT_LNG);
        });
    }
  }, [addresses]);

  const fetchReverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'CustomerApp/1.0',
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || addr.residential || '';
        const house = addr.house_number || addr.building || '';
        const line1Val = house ? `${house}, ${road}` : road || (data.display_name ? data.display_name.split(',')[0] : '');
        const line2Val = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.village || 'Surat';
        const pincodeVal = addr.postcode || '394105';
        
        setLine1(line1Val || 'Utran Road');
        setLine2(line2Val || 'Utran, Surat');
        setPincode(pincodeVal || '394105');
        setFormattedAddress(data.display_name || `${line1Val}, ${line2Val} - ${pincodeVal}`);
      } else {
        setFallbackAddress();
      }
    } catch (err) {
      setFallbackAddress();
    } finally {
      setIsGeocoding(false);
    }
  };

  const setFallbackAddress = () => {
    setLine1('Utran Road, Near Utran Char Rasta');
    setLine2('Utran, Surat');
    setPincode('394105');
    setFormattedAddress('Utran Road, Near Utran Char Rasta, Utran, Surat - 394105');
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    fetchReverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const handleRecenter = async () => {
    try {
      const loc = await ensureLocationReady();
      if (loc && loc.latitude && loc.longitude) {
        const isEmulatorDefaultUS = (Math.abs(loc.latitude - 37.42) < 1.5 && Math.abs(loc.longitude - (-122.08)) < 1.5);
        const targetLat = isEmulatorDefaultUS ? DEFAULT_LAT : loc.latitude;
        const targetLng = isEmulatorDefaultUS ? DEFAULT_LNG : loc.longitude;

        const targetRegion = {
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(targetRegion);
        mapRef.current?.animateToRegion(targetRegion, 800);
        fetchReverseGeocode(targetLat, targetLng);
      }
    } catch (e) {
      mapRef.current?.animateToRegion(region, 500);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editAddress) {
        await axiosClient.put(`/addresses/${editAddress.id}`, payload);
      } else {
        await axiosClient.post('/addresses', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      queryClient.invalidateQueries(['userLocation']);
      queryClient.invalidateQueries(['nearbyShops']);
      queryClient.invalidateQueries(['nearbyProducts']);
      Toast.show({
        type: 'success',
        text1: 'Delivery Location Set! 📍',
        text2: 'Default address updated successfully.',
      });
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  });

  const handleSave = () => {
    if (!line1 || !pincode) {
      Alert.alert('Validation Error', 'Please fill all required address fields.');
      return;
    }

    saveMutation.mutate({
      label: label || 'Home',
      line1,
      line2,
      pincode,
      lat: region.latitude,
      lng: region.longitude,
      is_default: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft color="#1A1A1A" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editAddress ? 'Edit Location' : 'Choose Delivery Location'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Map Container with Fixed Center Pin */}
        <View style={[styles.mapWrapper, keyboardHeight > 0 && styles.mapWrapperCollapsed]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
          />

          {/* FIXED CENTER PIN OVERLAY (Stays still while map moves beneath it) */}
          <View style={styles.fixedPinOverlay} pointerEvents="none">
            <View style={styles.fixedPinWrapper}>
              <View style={styles.calloutBubble}>
                <Sparkles color="#16A34A" size={12} style={{ marginRight: 4 }} />
                <Text style={styles.calloutText}>Order delivered here</Text>
              </View>
              <View style={styles.pinIconBox}>
                <MapPin color="#FFFFFF" fill="#16A34A" size={38} />
              </View>
              <View style={styles.pinShadowDot} />
            </View>
          </View>

          {/* Recenter Button */}
          <TouchableOpacity 
            style={styles.recenterBtn} 
            onPress={handleRecenter}
            activeOpacity={0.85}
          >
            <LocateFixed color="#16A34A" size={24} />
          </TouchableOpacity>
        </View>

        {/* Bottom Address Form Sheet */}
        <KeyboardAwareScrollView 
          contentContainerStyle={[
            styles.formContainer, 
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : Math.max(insets.bottom + 16, Platform.OS === 'android' ? 32 : 20) }
          ]} 
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'android' ? 160 : 100}
          extraHeight={160}
        >
          {/* Detected Address Display Banner */}
          <View style={styles.detectedAddressBox}>
            <View style={styles.detectedHeaderRow}>
              <MapPin color={theme.colors.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.detectedHeaderTitle}>Selected Location</Text>
              {isGeocoding && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
            </View>
            <Text style={styles.detectedAddressText} numberOfLines={2}>
              {isGeocoding ? 'Locating address details...' : (formattedAddress || `${line1}, ${line2} - ${pincode}`)}
            </Text>
          </View>

          {/* Label Type Selector Pills */}
          <Text style={styles.labelSectionTitle}>Save Address As</Text>
          <View style={styles.labelPillRow}>
            {[
              { id: 'Home', icon: Home },
              { id: 'Work', icon: Briefcase },
              { id: 'Other', icon: Tag },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = label === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.labelPill, isSelected && styles.labelPillSelected]}
                  onPress={() => setLabel(item.id)}
                  activeOpacity={0.8}
                >
                  <IconComp color={isSelected ? '#16A34A' : '#64748B'} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.labelPillText, isSelected && styles.labelPillTextSelected]}>
                    {item.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Autofilled Address Form Inputs */}
          <View style={styles.inputContainer}>
            <AlignLeft color="#64748B" size={18} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { flex: 1 }]} 
              placeholder="House / Flat / Building / Address *" 
              value={line1} 
              onChangeText={setLine1} 
              onSubmitEditing={() => fetchForwardGeocode(line1)}
              placeholderTextColor="#94A3B8" 
              returnKeyType="search"
            />
            <TouchableOpacity 
              onPress={() => fetchForwardGeocode(line1)}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <Search color="#16A34A" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10, marginBottom: 0 }]}>
              <MapIcon color="#64748B" size={18} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Street / Area" 
                value={line2} 
                onChangeText={setLine2} 
                placeholderTextColor="#94A3B8" 
              />
            </View>
            <View style={[styles.inputContainer, { width: 110, marginBottom: 0 }]}>
              <TextInput 
                style={styles.input} 
                placeholder="Pincode *" 
                value={pincode} 
                onChangeText={setPincode} 
                keyboardType="number-pad" 
                placeholderTextColor="#94A3B8" 
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, Platform.OS === 'android' ? 32 : 20) }]}>
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSave}
              disabled={saveMutation.isPending}
              activeOpacity={0.85}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Check color="#FFF" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Confirm & Set Location</Text>
                </View>
              )}
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
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  mapWrapper: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  mapWrapperCollapsed: {
    height: 100,
  },
  mapSearchBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  mapSearchBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 6,
  },
  mapSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fixedPinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedPinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36, // Adjust offset so tip of pin lands on exact map center
  },
  calloutBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  calloutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  pinIconBox: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  pinShadowDot: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: 2,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  detectedAddressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detectedHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  detectedAddressText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '500',
  },
  labelSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  labelPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  labelPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  labelPillSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
  },
  labelPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  labelPillTextSelected: {
    color: '#16A34A',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  }
});

export default AddressMapPickerScreen;

