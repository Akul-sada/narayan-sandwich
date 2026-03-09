import React, { useState } from 'react';
import { FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import menuData from './menuData.json';  
import './MenuDisplay.css';
import '../../styleTheme/theme.css';

const MenuDisplay = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useCart();

  // Extract all categories from the JSON
  const categories = ['all', ...menuData.menu.map(cat => cat.category)];
  
  // Flatten all items for "all" view, or filter by category
  const allItems = menuData.menu.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      category: cat.category
    }))
  );

  const filteredItems = activeCategory === 'all' 
    ? allItems 
    : allItems.filter(item => item.category === activeCategory);

  const handleQuantityChange = (productId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta)
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    if (quantity < 1) return;
    
    addToCart({
      _id: item.id,
      name: item.type,
      price: parseFloat(item.price),
      category: item.category,
      isVeg: item.isVeg ?? true,
      preparationTime: item.preparationTime ?? 10,
      imageUrl: item.imageUrl || ''
    }, quantity);
    
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  return (
    <div className="menu-display">
      {/* Category Navigation */}
      <div className="category-nav">
        <div className="category-scroll">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'All Items' : category}
              <span className="category-count">
                {category === 'all' 
                  ? allItems.length 
                  : allItems.filter(item => item.category === category).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-item">
            {/* ... rest of your JSX (image, name, price, quantity selector, add to cart) */}
            <div className="item-content">
              <h3 className='item-name'>{item.type}</h3>
              <p className="item-price">₹{item.price}</p>
              <div className="item-actions">
                <div className="quantity-selector">
                  <button onClick={() => handleQuantityChange(item.id, -1)}><FaMinus /></button>
                  <span>{quantities[item.id] || 0}</span>
                  <button onClick={() => handleQuantityChange(item.id, 1)}><FaPlus /></button>
                </div>
                <button onClick={() => handleAddToCart(item)}>
                 <FaShoppingCart className="cart-icon" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuDisplay;