
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../styles/Item.css'; 
import axios from "axios";
import { stripHtml } from 'string-strip-html';
import Navbar from "../components/Navbar";
    const token = localStorage.getItem("token");


const Item = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviewInput, setReviewInput] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/products/${id}`),
          axios.get(`http://localhost:5000/api/reviews/${id}`)
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Failed to fetch product or reviews", error);
      }
    };
  
const storedToken = localStorage.getItem("token");
setIsLoggedIn(!!storedToken);

    fetchProductAndReviews();
  }, [id]);

  const addReview = async () => {
    if(!token) {
      alert("Please log in to submit a review.");
      return;
    }
    if (reviewInput.trim()) {
      const newReview = {
        productId: id,
        rating: selectedRating,
        comment: reviewInput
      };
      try {
        await axios.post('http://localhost:5000/api/reviews', newReview, {
       headers:{
          Authorization: `Bearer ${token}`, 
       },
      });
        setReviewInput('');
        setSelectedRating(0);

        const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/${id}`);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Failed to submit review", error);
      }
    }
  };



  const addToWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const wishlistItem = {
      productId: product._id,
      title: product.title,
      image: product.image,
      price: product.price
    };

    try {
      const res = await axios.post("http://localhost:5000/api/wishlist/add", wishlistItem, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert(res.data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Error adding to wishlist");
    }
  };


 const calculateAverageRating = () => {
  if(!reviews || reviews.length === 0) return 0;
  const total= reviews.reduce((sum, r) => sum + r.rating, 0);
  return (total / reviews.length).toFixed(1);
 };


  if (!product) return <div></div>;
const avgRating = calculateAverageRating();

  return (
    <div>
      <Navbar/>
      <div className="product-page">
        <div className="product-container">

          <div className="product-left">
            <img
              src={product.image.replace("{width}", "300")}
              alt={product.title}
              className="main-image"
            />

            <h2 className="product-title">{product.title}</h2>
            <div className="brand"> {product.brand}</div>
            <div className="price">{product.price} JOD</div>
            

            <div className="product-buttons">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i> Visit Original Website
              </a>
              <button className="btn-primary" onClick={addToWishlist}>
                <i className="fa-regular fa-heart"></i> Add to Wishlist
              </button>
            </div>
          </div>
 <br />

          <div className="review-section">
            <div className="averagerating">
  {"★".repeat(Math.round(avgRating)) + "☆".repeat(5 - Math.round(avgRating))}
  <span style={{ marginLeft: '8px' }}>
    {avgRating} / 5 ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
  </span>
</div>
<div><br />
  <h3>Summary Review</h3>
  <p>{stripHtml(product.summary_en).result || "No summary available."}</p><br />
  <p>{stripHtml(product.summary_ar).result || "No summary available."}</p>
</div><br /><br />
           <h3>Reviews</h3>
            <ul className="review-list">
              {reviews.map((r, index) => (
                <li key={index}>
                  <strong>{r.userId?.username || "User"}</strong> – {"★".repeat(r.rating)}<br />
                  {r.comment}
                </li>
              ))}
            </ul>
           {isLoggedIn ?(
            <div className="review-form">
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{ cursor: "pointer", color: star <= selectedRating ? "#FFD700" : "#ccc", fontSize: "20px" }}
                    onClick={() => setSelectedRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                placeholder="Write your review..."
              />
              <button onClick={addReview} className="btn-primary">Submit</button>
            </div>
           ) : (
              <p className="login-warning">Please log in to submit a review.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Item;