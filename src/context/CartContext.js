import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalAmount: 0,
    totalItems: 0,
    taxAmount: 0,
    deliveryCharge: 0,
    discount: 0,
    grandTotal: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();



  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from localStorage for guest users
      const savedCart = localStorage.getItem('guest_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);


  useEffect(()=>{
    loadCart();
  },[loadCart]);

  const addToCart = async (product, quantity = 1, customization = {}, specialInstructions = '') => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        const response = await cartService.addToCart(
          product._id,
          quantity,
          customization,
          specialInstructions
        );
        
        if (response.success) {
          setCart(response.data);
          return { success: true, cart: response.data };
        }
      } else {
        // Handle guest cart
        const updatedCart = { ...cart };
        const existingItemIndex = updatedCart.items.findIndex(
          item => item.product._id === product._id && 
          JSON.stringify(item.customization) === JSON.stringify(customization)
        );

        if (existingItemIndex > -1) {
          updatedCart.items[existingItemIndex].quantity += quantity;
        } else {
          updatedCart.items.push({
            product,
            quantity,
            price: product.price,
            name: product.name,
            customization,
            specialInstructions,
            _id: Date.now().toString() // Temporary ID for guest
          });
        }

        // Calculate totals
        updateCartTotals(updatedCart);
        setCart(updatedCart);
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        
        return { success: true, cart: updatedCart };
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to cart');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const updateCartTotals = (cartData) => {
    let totalAmount = 0;
    let totalItems = 0;
    
    cartData.items.forEach(item => {
      totalAmount += item.price * item.quantity;
      totalItems += item.quantity;
    });
    
    const taxAmount = totalAmount * 0.05;
    const deliveryCharge = totalAmount > 200 ? 0 : 20;
    const grandTotal = totalAmount + taxAmount + deliveryCharge - cartData.discount;
    
    cartData.totalAmount = parseFloat(totalAmount.toFixed(2));
    cartData.totalItems = totalItems;
    cartData.taxAmount = parseFloat(taxAmount.toFixed(2));
    cartData.deliveryCharge = deliveryCharge;
    cartData.grandTotal = parseFloat(grandTotal.toFixed(2));
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        return removeFromCart(itemId);
      }

      if (isAuthenticated) {
        const response = await cartService.updateCartItem(itemId, newQuantity);
        if (response.success) {
          setCart(response.data);
        }
      } else {
        const updatedCart = { ...cart };
        const itemIndex = updatedCart.items.findIndex(item => item._id === itemId);
        
        if (itemIndex > -1) {
          updatedCart.items[itemIndex].quantity = newQuantity;
          updateCartTotals(updatedCart);
          setCart(updatedCart);
          localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (isAuthenticated) {
        const response = await cartService.removeFromCart(itemId);
        if (response.success) {
          setCart(response.data);
        }
      } else {
        const updatedCart = { ...cart };
        updatedCart.items = updatedCart.items.filter(item => item._id !== itemId);
        updateCartTotals(updatedCart);
        setCart(updatedCart);
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        const response = await cartService.clearCart();
        if (response.success) {
          setCart(response.data);
        }
      } else {
        const emptyCart = {
          items: [],
          totalAmount: 0,
          totalItems: 0,
          taxAmount: 0,
          deliveryCharge: 0,
          discount: 0,
          grandTotal: 0
        };
        setCart(emptyCart);
        localStorage.setItem('guest_cart', JSON.stringify(emptyCart));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear cart');
    }
  };

  const syncGuestCart = async () => {
    if (!isAuthenticated || cart.items.length === 0) return;
    
    try {
      // If user was guest and now logged in, sync guest cart to server
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        const guestCartData = JSON.parse(guestCart);
        
        // Add each item from guest cart to server cart
        for (const item of guestCartData.items) {
          await cartService.addToCart(
            item.product._id,
            item.quantity,
            item.customization,
            item.specialInstructions
          );
        }
        
        // Clear guest cart
        localStorage.removeItem('guest_cart');
        await loadCart(); // Reload cart from server
      }
    } catch (err) {
      console.error('Failed to sync guest cart:', err);
    }
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncGuestCart,
    isAuthenticated
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};