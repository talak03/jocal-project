const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ✅ GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ✅ ADD THIS: Get a single product by ID
router.get('/:id', async (req, res) => {
  console.log("📦 Requested product ID:", req.params.id);
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
