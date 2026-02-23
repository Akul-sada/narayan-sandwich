// CartContext.js - Updated with Cookie Functions
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const initialState = {
  items: [],
  totalAmount: 0,
  customerInfo: {
    name: '',
    phone: '',
    address: '',
    specialInstructions: ''
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return {
          ...state,
          items: updatedItems,
          totalAmount: state.totalAmount + parseFloat(action.payload.price)
        };
      } else {
        const newItem = {
          ...action.payload,
          quantity: 1
        };
        return {
          ...state,
          items: [...state.items, newItem],
          totalAmount: state.totalAmount + parseFloat(action.payload.price)
        };
      }

    case 'REMOVE_ITEM':
      const itemIndex = state.items.findIndex(
        item => item.id === action.payload
      );
      const existingItem = state.items[itemIndex];
      const updatedTotalAmount = state.totalAmount - parseFloat(existingItem.price);
      
      if (existingItem.quantity === 1) {
        const filteredItems = state.items.filter(item => item.id !== action.payload);
        return {
          ...state,
          items: filteredItems,
          totalAmount: updatedTotalAmount
        };
      } else {
        const updatedItems = [...state.items];
        updatedItems[itemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity - 1
        };
        return {
          ...state,
          items: updatedItems,
          totalAmount: updatedTotalAmount
        };
      }

    case 'CLEAR_ITEM':
      const itemToClear = state.items.find(item => item.id === action.payload);
      const clearAmount = parseFloat(itemToClear.price) * itemToClear.quantity;
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        totalAmount: state.totalAmount - clearAmount
      };

    case 'UPDATE_CUSTOMER_INFO':
      return {
        ...state,
        customerInfo: {
          ...state.customerInfo,
          [action.payload.field]: action.payload.value
        }
      };

    case 'SET_CART':
      return {
        ...state,
        ...action.payload
      };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
};

// Cookie utility functions
const cookieUtils = {
  setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; Secure; HttpOnly; SameSite=Strict`;
  },

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(';').shift();
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch {
        return null;
      }
    }
    return null;
  },

  deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// WhatsApp utility
const whatsAppUtils = {
  formatOrderMessage(cartState) {
    const { items, totalAmount, customerInfo } = cartState;
    
    let message = `*🚀 NEW ORDER REQUESTED*%0A%0A`;
    
    // Customer Information
    message += `*👤 Customer Details:*%0A`;
    message += `Name: ${customerInfo.name}%0A`;
    message += `Phone: ${customerInfo.phone}%0A`;
    message += `Address: ${customerInfo.address}%0A`;
    
    if (customerInfo.specialInstructions) {
      message += `Special Instructions: ${customerInfo.specialInstructions}%0A`;
    }
    
    message += `%0A*📋 Order Items:*%0A`;
    
    // Order Items
    items.forEach((item, index) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      message += `${index + 1}. ${item.type} x${item.quantity} - ₹${itemTotal.toFixed(2)}%0A`;
    });
    
    // Summary
    message += `%0A*💰 Order Summary:*%0A`;
    message += `Subtotal: ₹${totalAmount.toFixed(2)}%0A`;
    message += `GST (5%): ₹${(totalAmount * 0.05).toFixed(2)}%0A`;
    message += `Delivery: ${totalAmount > 200 ? '₹0.00' : '₹20.00'}%0A`;
    message += `*Total: ₹${(parseFloat(totalAmount) + (totalAmount * 0.05) + (totalAmount > 200 ? 0 : 20)).toFixed(2)}*%0A`;
    
    // Timestamp
    message += `%0A*🕒 Order Time:* ${new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    })}%0A`;
    
    message += `%0A_Please confirm this order and provide estimated delivery time._`;
    
    return message;
  },

  generateWhatsAppLink(phoneNumber, message) {
    // Clean phone number (remove +, spaces, etc.)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanedPhone}?text=${message}`;
  }
};

export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from cookies on mount
  useEffect(() => {
    const savedCart = cookieUtils.getCookie('restaurant_cart');
    if (savedCart) {
      dispatch({ type: 'SET_CART', payload: savedCart });
    }
  }, []);

  // Save cart to cookies on change
  useEffect(() => {
    cookieUtils.setCookie('restaurant_cart', cartState, 1); // Expires in 1 day
  }, [cartState]);

  const addItemToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItemFromCart = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const clearItemFromCart = (id) => {
    dispatch({ type: 'CLEAR_ITEM', payload: id });
  };

  const updateCustomerInfo = (field, value) => {
    dispatch({ 
      type: 'UPDATE_CUSTOMER_INFO', 
      payload: { field, value } 
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    cookieUtils.deleteCookie('restaurant_cart');
  };

  const sendOrderToWhatsApp = (ownerPhoneNumber) => {
    if (!ownerPhoneNumber) {
      throw new Error('Owner phone number is required');
    }

    const message = whatsAppUtils.formatOrderMessage(cartState);
    const whatsappLink = whatsAppUtils.generateWhatsAppLink(ownerPhoneNumber, message);
    
    // Save order to cookies before sending
    const orderData = {
      ...cartState,
      orderId: `ORD${Date.now()}`,
      orderTime: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save order in separate cookie
    const existingOrders = cookieUtils.getCookie('restaurant_orders') || [];
    existingOrders.push(orderData);
    cookieUtils.setCookie('restaurant_orders', existingOrders, 7); // Keep for 7 days
    
    // Open WhatsApp
    window.open(whatsappLink, '_blank');
    
    return orderData.orderId;
  };

  const value = {
    cartState,
    addItemToCart,
    removeItemFromCart,
    clearItemFromCart,
    updateCustomerInfo,
    clearCart,
    sendOrderToWhatsApp,
    cookieUtils
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};