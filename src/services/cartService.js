import api from './api';

export const cartService = {
  // Get cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add to cart
  addToCart: async (productId, quantity = 1, customization = {}, specialInstructions = '') => {
    const response = await api.post('/cart/add', {
      productId,
      quantity,
      customization,
      specialInstructions
    });
    return response.data;
  },

  // Update cart item
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/update/${itemId}`, { quantity });
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (itemId, quantity = 1) => {
    const response = await api.delete(`/cart/remove/${itemId}`, {
      data: { quantity }
    });
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },

  // Apply discount
  applyDiscount: async (discountCode) => {
    const response = await api.post('/cart/apply-discount', { discountCode });
    return response.data;
  },
};