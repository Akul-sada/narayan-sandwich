const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price imageUrl isAvailable category')
      .lean();

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalAmount: 0,
          totalItems: 0,
          deliveryCharge: 0,
          taxAmount: 0,
          discount: 0,
          grandTotal: 0
        }
      });
    }

    // Check if any products are no longer available
    const updatedItems = cart.items.filter(item => 
      item.product && item.product.isAvailable !== false
    );

    if (updatedItems.length !== cart.items.length) {
      cart.items = updatedItems;
      await cart.calculateTotals();
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, customization = {}, specialInstructions = '' } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    // Add item to cart
    await cart.addItem(productId, quantity, customization, specialInstructions);
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'name price imageUrl category');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not available')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    await cart.calculateTotals();
    await cart.save();

    await cart.populate('items.product', 'name price imageUrl category');

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity = 1 } = req.body; // Optional: remove specific quantity

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.find(item => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity >= item.quantity) {
      // Remove item completely
      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    } else {
      // Reduce quantity
      item.quantity -= quantity;
    }

    await cart.calculateTotals();
    await cart.save();

    await cart.populate('items.product', 'name price imageUrl category');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Apply discount to cart
// @route   POST /api/cart/apply-discount
// @access  Private
exports.applyDiscount = async (req, res) => {
  try {
    const { discountCode, discountAmount } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // In production, validate discount code here
    if (discountAmount) {
      cart.discount = Math.min(discountAmount, cart.totalAmount);
    } else if (discountCode) {
      // Apply discount based on code
      // Example: 10% discount for code "SAVE10"
      if (discountCode === 'SAVE10') {
        cart.discount = cart.totalAmount * 0.10;
      }
    }

    await cart.calculateTotals();
    await cart.save();

    await cart.populate('items.product', 'name price imageUrl category');

    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      data: cart
    });

  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};