const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get cart
router.get('/', cartController.getCart);

// Add to cart
router.post('/add', cartController.addToCart);

// Update cart item
router.put('/update/:itemId', cartController.updateCartItem);

// Remove from cart
router.delete('/remove/:itemId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Apply discount
router.post('/apply-discount', cartController.applyDiscount);

module.exports = router;