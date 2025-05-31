const express = require('express');
const router = express.Router();
const Review = require('../Models/review');
const auth = require('../middleware/auth');
// GET reviews by productId
router.get('/:productId', async (req, res) => {
 try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'username') 
      .sort({ createdDate: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});



// POST new review
router.post('/',auth , async (req, res) => {
  const { productId, rating, comment } = req.body;
  try {
    const newReview = new Review({
      productId,
      userId: req.userId, 
      rating,
      comment,
      createdDate: new Date(),
    });
    await newReview.save();
   const populatedReview = await Review.findById(newReview._id).populate('userId', 'username');

    res.status(201).json(populatedReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});


router.delete('/:id', auth, async (req, res) => {
if(req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Access denied' });
}
try
{
  await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review" });
  }
});


module.exports = router; 
