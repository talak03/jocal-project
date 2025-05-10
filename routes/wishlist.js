


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

app.use(cors());
app.use(express.json());

//middlewareee



//POST /wishlist/add
app.post('/wishlist/add', auth, async (req, res) => {
  const{ productId, title, image , price} = req.body;
  try{
    const user= await User.findById(req.userId);
    if(!user){
      return res.status(404).json({message: 'User not found'});
    }

    const exists = user.wishlist.find(item=>item.productId.toString() === productId);
    if(exists){
      return res.status(400).json({message: 'Product already in wishlist'});
    }


      user.wishlist.push({productId, title, image, price});
      await user.save();
      return res.status(200).json({message: 'Product added to wishlist'}); 
    }
catch(err){
  res.status(500).json({message: 'Server error',error:err});
}
}
);


//GET /wishlist
app.get('/wishlist', auth, async (req, res) => {
  try{
    const user= await User.findById(req.userId);
    res.status(200).json(user.wishlist);
  }
  catch(err){
    res.status(500).json({message: 'Server error',error:err});
  }
  });

//DELETE /wishlist/remove/:productId
app.delete('/wishlist/remove/:productId', auth, async (req, res) => {
  const {productId}=req.params;
  try{
    const user = await User.findById(req.userId);
    user.wishlist=user.wishlist.filter(item=>item.productId.toString() !== productId);
    await user.save();
    return res.status(200).json({message: 'Product removed from wishlist'});
  }
  catch(err){
    res.status(500).json({message: 'Server error',error:err});
  }
});



//server starttt
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(3000, () => console.log('Server running on port 3000'));