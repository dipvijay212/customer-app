import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, ZapOff, Image as ImageIcon, QrCode, CheckCircle2, KeyRound, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import axiosClient from '../api/axiosClient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.72;

export const QRScannerScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 16, Platform.OS === 'android' ? 36 : 24);

  const [flashlight, setFlashlight] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Fetch shops to pick a random one
  const { data: shops } = useQuery({
    queryKey: ['nearbyShopsForScanner'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/shops/nearby?lat=23.0225&lng=72.5714');
        return res.data.shops || [];
      } catch (e) {
        return [];
      }
    }
  });

  // Animated scanner line
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(SCAN_BOX_SIZE - 8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => cancelAnimation(translateY);
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const handleQRDetected = (targetShopId) => {
    if (!isScanning) return;
    setIsScanning(false);
    setScannedSuccess(true);

    Toast.show({
      type: 'success',
      text1: 'QR Code Scanned!',
      text2: 'Opening shop storefront...',
      position: 'top',
    });

    setTimeout(() => {
      let selectedId = targetShopId;
      if (!selectedId) {
        if (shops && shops.length > 0) {
          const randomIndex = Math.floor(Math.random() * shops.length);
          selectedId = shops[randomIndex].id;
        } else {
          selectedId = 1; // Fallback default shop
        }
      }
      navigation.replace('ShopStorefront', { id: selectedId });
    }, 1200);
  };

  const handleSimulateScan = () => {
    handleQRDetected();
  };

  const handleGalleryPick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Gallery Error',
          text2: result.errorMessage || 'Could not open photo library',
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        handleQRDetected();
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Failed to access photo library',
      });
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a shop code' });
      return;
    }
    setManualModalVisible(false);
    handleQRDetected(parseInt(manualCode) || 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Flashlight overlay effect */}
      {flashlight && <View style={styles.flashlightOverlay} pointerEvents="none" />}

      {/* Top Bar Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Shop QR Code</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFlashlight(!flashlight)}>
          {flashlight ? <Zap color="#F59E0B" size={22} fill="#F59E0B" /> : <ZapOff color="#FFF" size={22} />}
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder Area */}
      <View style={styles.cameraContainer}>
        {/* Viewfinder Window */}
        <View style={styles.viewfinder}>
          {/* Corner Accents */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Animated Laser Line */}
          {isScanning && !scannedSuccess && (
            <Animated.View style={[styles.scanLine, animatedLineStyle]} />
          )}

          {/* Success Overlay */}
          {scannedSuccess && (
            <View style={styles.successContainer}>
              <CheckCircle2 color={theme.colors.primary} size={64} />
              <Text style={styles.successText}>Store Verified!</Text>
            </View>
          )}
        </View>

        <Text style={styles.instructionText}>
          Align the QR code within the frame to automatically scan and open the shop.
        </Text>
      </View>

      {/* Bottom Action Controls */}
      <View style={[styles.bottomControls, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity style={styles.scanActionBtn} onPress={handleSimulateScan} activeOpacity={0.85}>
          <QrCode color="#FFF" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.scanActionBtnText}>Simulate QR Scan</Text>
        </TouchableOpacity>

        <View style={styles.secondaryControlsRow}>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={handleGalleryPick}
          >
            <ImageIcon color="#FFF" size={20} />
            <Text style={styles.secondaryBtnText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => setManualModalVisible(true)}
          >
            <KeyRound color="#FFF" size={20} />
            <Text style={styles.secondaryBtnText}>Enter Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MANUAL SHOP CODE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={manualModalVisible}
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Shop Code</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Type the shop ID displayed on the store counter</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. 101"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleManualSubmit}>
              <Text style={styles.modalSubmitText}>Open Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  flashlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  viewfinder: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 12,
  },
  instructionText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  scanActionBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  scanActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  secondaryBtnText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 20,
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default QRScannerScreen;
