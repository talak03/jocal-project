const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  brand: String,
  price: Number,
  image: String,
  description: String,
  url: String,
  category: String,
  subcategory: String,
  summary_en: String,
  summary_ar: String,
});

module.exports = mongoose.model('Product', productSchema);
