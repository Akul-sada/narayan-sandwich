import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaHome } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/" className="logo">
            <span className="logo-icon"><img src="./logo.jpeg" alt="narayan snacks parlour logo"/></span>
          </Link>
        </div>
         <div className="user-section">
          {isAuthenticated ? (
            <div className="user-dropdown">
              <button className="user-btn">
                <FaUser className="user-icon" />
                <span className="user-name">
                  {user?.name || user?.mobileNumber}
                </span>
              </button>
              
              <div className="dropdown-menu">
                <div className="user-info">
                  <p className="user-email">{user?.email || 'No email'}</p>
                  <p className="user-mobile">{user?.mobileNumber}</p>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item" onClick={handleLogout}>
                  <FaSignOutAlt className="dropdown-icon" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              <FaUser className="login-icon" />
              <span className="login-text">Login</span>
            </Link>
          )}
        </div>

        <nav className="nav-section">
          <Link to="/" className="nav-link">
            <FaHome className="nav-icon" />
            <span className="nav-text">Menu</span>
          </Link>
          
          <Link to="/cart" className="nav-link cart-link">
            <div className="cart-wrapper">
              <FaShoppingCart className="nav-icon" />
              {cart.totalItems > 0 && (
                <span className="cart-badge">{cart.totalItems}</span>
              )}
            </div>
            <span className="nav-text">Cart</span>
            {cart.totalItems > 0 && (
              <span className="cart-total">₹{cart.grandTotal.toFixed(2)}</span>
            )}
          </Link>
        </nav>

       

        
      </div>
    </header>
  );
};

export default Header;