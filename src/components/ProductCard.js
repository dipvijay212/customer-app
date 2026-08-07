import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Plus, Minus, ChevronDown, X, Check } from 'lucide-react-native';
import { getTotalUnitQuantityLabel } from '../utils/cartPricing';

const ProductCard = ({ product, cartItems = [], onQtyChange, isWishlisted, onWishlistToggle, style, variant = 'vertical' }) => {
  const insets = useSafeAreaInsets();

  const unitSteps = useMemo(() => {
    const name = (product.name || '').toLowerCase();
    const unit = (product.unit || 'kg').toLowerCase();
    const basePrice = parseFloat(product.price) || 3.78;

    if (unit.includes('l') || unit.includes('ml') || name.includes('milk') || name.includes('oil') || name.includes('juice')) {
      return [
        { label: '100ml', mult: 0.1, price: basePrice * 0.1 },
        { label: '250ml', mult: 0.25, price: basePrice * 0.25 },
        { label: '500ml', mult: 0.5, price: basePrice * 0.5 },
        { label: '1L', mult: 1.0, price: basePrice },
        { label: '2L', mult: 2.0, price: basePrice * 2.0 },
        { label: '3L', mult: 3.0, price: basePrice * 3.0 },
        { label: '5L', mult: 5.0, price: basePrice * 5.0 },
      ];
    } else if (unit.includes('kg') || unit.includes('g') || name.includes('apple') || name.includes('rice') || name.includes('onion') || name.includes('tomato') || name.includes('potato') || name.includes('broccoli')) {
      return [
        { label: '100g', mult: 0.1, price: basePrice * 0.1 },
        { label: '250g', mult: 0.25, price: basePrice * 0.25 },
        { label: '500g', mult: 0.5, price: basePrice * 0.5 },
        { label: '1kg', mult: 1.0, price: basePrice },
        { label: '2kg', mult: 2.0, price: basePrice * 2.0 },
        { label: '3kg', mult: 3.0, price: basePrice * 3.0 },
        { label: '5kg', mult: 5.0, price: basePrice * 5.0 },
      ];
    } else {
      return [
        { label: '1 Pack', mult: 1, price: basePrice },
        { label: '2 Packs', mult: 2, price: basePrice * 2 },
        { label: '3 Packs', mult: 3, price: basePrice * 3 },
        { label: '5 Packs', mult: 5, price: basePrice * 5 },
        { label: '10 Packs', mult: 10, price: basePrice * 10 },
      ];
    }
  }, [product.unit, product.price, product.name]);

  const [stepIdx, setStepIdx] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasInitializedStep, setHasInitializedStep] = useState(false);

  const currentStep = unitSteps[stepIdx] || unitSteps[0];
  const currentPrice = currentStep.price;

  const quantity = useMemo(() => {
    const item = cartItems.find(i => i.unit === currentStep.label);
    return item?.quantity || 0;
  }, [cartItems, currentStep.label]);

  // Reset initialization state when product ID changes
  useEffect(() => {
    setHasInitializedStep(false);
  }, [product.id]);

  // Sync stepIdx with the first active variant inside cartItems on mount/load
  useEffect(() => {
    if (!hasInitializedStep && cartItems && cartItems.length > 0) {
      const activeItem = cartItems.find(i => i.quantity > 0);
      if (activeItem) {
        const idx = unitSteps.findIndex(s => s.label === activeItem.unit);
        if (idx !== -1) {
          setStepIdx(idx);
        }
      }
      setHasInitializedStep(true);
    }
  }, [cartItems, unitSteps, hasInitializedStep]);

  const handleIncrease = () => {
    onQtyChange(product.id, quantity + 1, currentStep.label, currentPrice);
  };

  const handleDecrease = () => {
    onQtyChange(product.id, Math.max(0, quantity - 1), currentStep.label, currentPrice);
  };

  const selectStep = (index) => {
    setStepIdx(index);
    setModalVisible(false);
  };

  if (variant === 'horizontal') {
    return (
      <View style={[styles.horizontalCard, style]}>
        <View style={styles.horizontalInfoContainer}>
          <View>
            <View style={{ width: 14, height: 14, borderWidth: 1, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderRadius: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary }} />
            </View>
            <Text style={styles.horizontalName} numberOfLines={2}>{product.name}</Text>
            
            {/* Variant Selector inside horizontal card */}
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>{currentStep.label}</Text>
              <ChevronDown color={theme.colors.primary} size={12} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          <Text style={styles.horizontalPrice}>₹{currentPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
            style={styles.horizontalImage}
          />
          <View style={styles.horizontalActionWrapper}>
            {quantity > 0 ? (
              <View style={styles.horizontalStepper}>
                <TouchableOpacity onPress={handleDecrease} style={styles.horizontalStepperBtn}>
                  <Minus color={theme.colors.primary} size={14} />
                </TouchableOpacity>
                <Text style={styles.horizontalStepperText}>{getTotalUnitQuantityLabel(quantity, currentStep.label)}</Text>
                <TouchableOpacity onPress={handleIncrease} style={styles.horizontalStepperBtn}>
                  <Plus color={theme.colors.primary} size={14} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.horizontalAddButton} onPress={handleIncrease}>
                <Text style={styles.horizontalAddText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
          style={[styles.image, product.stock_status === 'out_of_stock' && { opacity: 0.5 }]}
        />
        <View style={styles.weightBadge}>
          <Text style={styles.weightBadgeText}>{currentStep.label}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {/* Dedicated Variant Selector Pill */}
        <TouchableOpacity
          style={styles.variantSelectorDropdownCard}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.variantSelectorDropdownText}>{currentStep.label}</Text>
          <ChevronDown color={theme.colors.primary} size={12} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <Text style={styles.priceRow}>
          <Text style={styles.price}>₹{currentPrice.toFixed(2)}</Text>
          <Text style={styles.unit}> / {currentStep.label}</Text>
        </Text>

        {quantity > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity style={styles.stepperButtonOutline} onPress={handleDecrease}>
              <Minus color="#333" size={15} />
            </TouchableOpacity>

            <Text style={styles.stepperText}>{getTotalUnitQuantityLabel(quantity, currentStep.label)}</Text>

            <TouchableOpacity style={styles.stepperButtonSolid} onPress={handleIncrease}>
              <Plus color="#FFF" size={15} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, product.stock_status === 'out_of_stock' && styles.disabledButton]}
            onPress={handleIncrease}
            disabled={product.stock_status === 'out_of_stock'}
          >
            {product.stock_status !== 'out_of_stock' && <Plus color="#FFF" size={14} style={{marginRight: 4}} />}
            <Text style={[styles.addText, product.stock_status === 'out_of_stock' && styles.disabledAddText]}>
              {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* UNIT SELECTOR MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {product.name} Weight / Unit</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
              style={{ maxHeight: 380 }}
            >
              {unitSteps.map((step, idx) => {
                const isSelected = stepIdx === idx;
                return (
                  <TouchableOpacity
                    key={step.label}
                    style={[styles.stepOptionRow, isSelected && styles.stepOptionRowSelected]}
                    onPress={() => selectStep(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={{flex: 1}}>
                      <Text style={[styles.stepOptionLabel, isSelected && styles.stepOptionLabelSelected]}>
                        {step.label}
                      </Text>
                    </View>
                    <Text style={styles.stepOptionPrice}>₹{step.price.toFixed(2)}</Text>
                    {isSelected && (
                      <Check color={theme.colors.primary} size={18} style={{marginLeft: 10}} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 8,
    maxWidth: '46%',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    position: 'relative',
  },
  weightBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    fontWeight: 'bold',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    ...theme.typography.body,
    color: '#333',
    marginBottom: 6,
    height: 40,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    ...theme.typography.subtitle,
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  unit: {
    ...theme.typography.caption,
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  addText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 13,
  },
  disabledAddText: {
    color: '#9CA3AF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 2,
    height: 36,
  },
  stepperButtonOutline: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepperButtonSolid: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  stepperText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepOptionRowSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: theme.colors.primary,
  },
  stepOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  stepOptionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  stepOptionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginVertical: 6,
    width: 280,
    height: 130,
  },
  horizontalInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  horizontalName: {
    ...theme.typography.body,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  horizontalPrice: {
    ...theme.typography.subtitle,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  horizontalImageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    alignItems: 'center',
  },
  horizontalImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  horizontalActionWrapper: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    ...theme.shadows.soft,
    elevation: 4,
    minWidth: 70,
  },
  horizontalAddButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  horizontalAddText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  horizontalStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  horizontalStepperBtn: {
    padding: 2,
  },
  horizontalStepperText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
    marginHorizontal: 8,
  },
  variantSelectorDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  variantSelectorDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});

export default ProductCard;
