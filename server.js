const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
require('dotenv').config();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // for parsing JSON requests
//app.use(express.static(path.join(__dirname, 'public')));



app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/Contact'));
//app.use('/api/protected', require('./routes/protected'));
app.use('/api/products', require('./routes/Product')); // <--- this one is critical ✅
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/reviews', require('./routes/review'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🌐 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ DB connection error:', err));
