// CheckoutModal.js
import React, { useState } from 'react';
import { useCart } from './CartContext';

// Owner's WhatsApp number (should be in environment variables in production)
const OWNER_PHONE_NUMBER = process.env.REACT_APP_OWNER_PHONE || '911234567890';

function CheckoutModal({ isOpen, onClose }) {
  const { cartState, updateCustomerInfo, clearCart, sendOrderToWhatsApp } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!cartState.customerInfo.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!cartState.customerInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cartState.customerInfo.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!cartState.customerInfo.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (cartState.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send order via WhatsApp
      const generatedOrderId = sendOrderToWhatsApp(OWNER_PHONE_NUMBER);
      
      setOrderId(generatedOrderId);
      setOrderPlaced(true);
      
      // Show success message
      setTimeout(() => {
        clearCart();
        onClose();
      }, 5000);

    } catch (error) {
      console.error('Failed to send order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => `₹${parseFloat(price).toFixed(2)}`;

  const calculateTotal = () => {
    const subtotal = cartState.totalAmount;
    const tax = subtotal * 0.05;
    const delivery = subtotal > 200 ? 0 : 20;
    return (subtotal + tax + delivery).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        {orderPlaced ? (
          <div className="order-success">
            <div className="success-icon">✓</div>
            <h2>Order Sent Successfully!</h2>
            <div className="success-message">
              <p>Your order <strong>(ID: {orderId})</strong> has been sent to the restaurant owner via WhatsApp.</p>
              <p>Total Amount: <strong>{formatPrice(calculateTotal())}</strong></p>
              <div className="whatsapp-info">
                <span className="whatsapp-icon">📱</span>
                <span>The owner will confirm your order and provide delivery details shortly.</span>
              </div>
              <p className="note">Please keep your phone handy for updates.</p>
            </div>
            <button 
              onClick={() => {
                onClose();
                clearCart();
              }}
              className="close-modal-btn"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="modal-header">
              <h2>📝 Checkout Details</h2>
              <button type="button" onClick={onClose} className="close-btn">×</button>
            </div>
            
            <div className="form-section">
              <h3>👤 Your Information</h3>
              <div className="form-group">
                <label>
                  Full Name *
                  {validationErrors.name && (
                    <span className="error-text"> - {validationErrors.name}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={cartState.customerInfo.name}
                  onChange={(e) => updateCustomerInfo('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={validationErrors.name ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>
                  Phone Number *
                  {validationErrors.phone && (
                    <span className="error-text"> - {validationErrors.phone}</span>
                  )}
                </label>
                <input
                  type="tel"
                  value={cartState.customerInfo.phone}
                  onChange={(e) => updateCustomerInfo('phone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={validationErrors.phone ? 'error' : ''}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>📍 Delivery Address</h3>
              <div className="form-group">
                <label>
                  Complete Address *
                  {validationErrors.address && (
                    <span className="error-text"> - {validationErrors.address}</span>
                  )}
                </label>
                <textarea
                  value={cartState.customerInfo.address}
                  onChange={(e) => updateCustomerInfo('address', e.target.value)}
                  placeholder="Enter complete delivery address with landmarks"
                  rows="3"
                  className={validationErrors.address ? 'error' : ''}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>📝 Special Instructions</h3>
              <div className="form-group">
                <label>Any special requests or instructions</label>
                <textarea
                  value={cartState.customerInfo.specialInstructions}
                  onChange={(e) => updateCustomerInfo('specialInstructions', e.target.value)}
                  placeholder="e.g., No onion, extra spicy, delivery instructions, etc."
                  rows="2"
                />
              </div>
            </div>

            <div className="order-summary-section">
              <h3>🛒 Order Summary</h3>
              <div className="order-items">
                {cartState.items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.type}</span>
                      <span className="item-quantity">x {item.quantity}</span>
                    </div>
                    <div className="item-price">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cartState.totalAmount)}</span>
                </div>
                <div className="price-row">
                  <span>GST (5%):</span>
                  <span>{formatPrice(cartState.totalAmount * 0.05)}</span>
                </div>
                <div className="price-row">
                  <span>Delivery:</span>
                  <span>{cartState.totalAmount > 200 ? formatPrice(0) : formatPrice(20)}</span>
                </div>
                <div className="price-row total">
                  <span>Total Amount:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <div className="whatsapp-note">
              <div className="note-icon">💡</div>
              <p>
                Your order will be sent to the restaurant owner via WhatsApp. 
                They will confirm your order and provide delivery time.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onClose}
                className="cancel-btn"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="whatsapp-checkout-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="whatsapp-icon">📱</span>
                    Send Order via WhatsApp
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;