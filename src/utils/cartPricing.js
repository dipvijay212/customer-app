export const getCartItemTotal = (item) => {
  const price = parseFloat(item.price) || 0;
  return price * item.quantity;
};

export const getCartItemQuantityLabel = (item) => `${item.quantity} ${item.unit}`;

export const getTotalUnitQuantityLabel = (quantity, unitLabel) => {
  if (!unitLabel) return `${quantity}`;
  return `${quantity} x ${unitLabel}`;
};
