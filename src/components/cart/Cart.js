import React, { useState } from 'react';
import { 
  FaShoppingCart, 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaArrowRight,
  FaUser,
  FaWhatsapp
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, syncGuestCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = (itemId, delta) => {
    const currentItem = cart.items.find(item => item._id === itemId);
    if (!currentItem) return;
    
    const newQuantity = currentItem.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(itemId, newQuantity);
    } else {
      removeFromCart(itemId);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setIsCheckingOut(true);
    
    try {
      // Sync guest cart if needed
      await syncGuestCart();
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Format message for WhatsApp
    const phoneNumber = process.env.REACT_APP_OWNER_PHONE || '911234567890';
    let message = `*New Order Request*%0A%0A`;
    
    // Customer info
    if (user) {
      message += `*Customer:* ${user.name || 'Guest'}%0A`;
      message += `*Phone:* ${user.mobileNumber}%0A`;
    } else {
      message += `*Customer:* Guest%0A`;
    }
    
    // Items
    message += `%0A*Order Items:*%0A`;
    cart.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}%0A`;
    });
    
    // Total
    message += `%0A*Total:* ₹${cart.grandTotal.toFixed(2)}%0A`;
    message += `%0A_Please confirm this order._`;
    
    // Encode and open WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">
          <FaShoppingCart />
        </div>
        <h3>Your cart is empty</h3>
        <p>Add delicious items from our menu</p>
        <button 
          className="browse-menu-btn"
          onClick={() => navigate('/')}
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <div className="cart-title-section">
          <h2 className="cart-title">
            <FaShoppingCart className="cart-title-icon" />
            Your Order
          </h2>
          <span className="cart-count-badge">{cart.totalItems} items</span>
        </div>
        
        <button 
          className="clear-cart-btn"
          onClick={clearCart}
          disabled={cart.items.length === 0}
        >
          <FaTrash />
          Clear All
        </button>
      </div>

      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item._id} className="cart-item">
            <div className="cart-item-info">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-price-per">₹{item.price.toFixed(2)} each</p>
              
              {item.specialInstructions && (
                <p className="special-instructions">
                  <span className="instructions-label">Note: </span>
                  {item.specialInstructions}
                </p>
              )}
            </div>

            <div className="cart-item-controls">
              <div className="quantity-controls">
                <button 
                  className="qty-btn minus"
                  onClick={() => handleQuantityChange(item._id, -1)}
                >
                  <FaMinus />
                </button>
                
                <span className="quantity">{item.quantity}</span>
                
                <button 
                  className="qty-btn plus"
                  onClick={() => handleQuantityChange(item._id, 1)}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="item-total">
                ₹{(item.price * item.quantity).toFixed(2)}
              </div>
              
              <button 
                className="remove-item-btn"
                onClick={() => removeFromCart(item._id)}
                title="Remove item"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-section">
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">₹{cart.totalAmount.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span className="summary-label">GST (5%)</span>
            <span className="summary-value">₹{cart.taxAmount.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span className="summary-label">Delivery Charge</span>
            <span className={`summary-value ${cart.deliveryCharge === 0 ? 'free' : ''}`}>
              {cart.deliveryCharge === 0 ? 'FREE' : `₹${cart.deliveryCharge.toFixed(2)}`}
            </span>
          </div>
          
          {cart.discount > 0 && (
            <div className="summary-row discount">
              <span className="summary-label">Discount</span>
              <span className="summary-value">-₹{cart.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="summary-divider"></div>
          
          <div className="summary-row total">
            <span className="summary-label">Total Amount</span>
            <span className="summary-value total-amount">
              ₹{cart.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="delivery-info">
          <p className="free-delivery-note">
            {cart.totalAmount >= 200 ? (
              <span className="success-text">🎉 Free delivery applied!</span>
            ) : (
              <>
                <span className="info-text">Add ₹{(200 - cart.totalAmount).toFixed(2)} more for free delivery</span>
              </>
            )}
          </p>
        </div>

        <div className="cart-actions">
          <button 
            className="secondary-action-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
          
          <div className="primary-actions">
            <button 
              className="whatsapp-order-btn"
              onClick={handleWhatsAppOrder}
              disabled={isCheckingOut}
            >
              <FaWhatsapp className="whatsapp-icon" />
              Order via WhatsApp
            </button>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isAuthenticated ? (
                <>
                  Proceed to Checkout
                  <FaArrowRight className="arrow-icon" />
                </>
              ) : (
                <>
                  <FaUser className="user-icon" />
                  Login to Checkout
                </>
              )}
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="guest-notice">
            <p className="notice-text">
              <span className="notice-icon">💡</span>
              You're shopping as a guest. 
              <button 
                className="login-link"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              to save your cart and get faster checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;