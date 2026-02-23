import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/header/Header';
import MenuDisplay from './components/menu/MenuDisplay';
import Cart from './components/cart/Cart';
import Checkout from './components/checkout/Checkout';
import Login from './components/login/Login';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<MenuDisplay />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Restaurant Name. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;