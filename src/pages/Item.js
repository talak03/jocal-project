
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../styles/Item.css'; 
import axios from "axios";
import { stripHtml } from 'string-strip-html';
import Navbar from "../components/Navbar";

const Item = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviewInput, setReviewInput] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviews, setReviews] = useState([]);

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
    fetchProductAndReviews();
  }, [id]);

  const addReview = async () => {
    if (reviewInput.trim()) {
      const newReview = {
        productId: id,
        userId: "68149292ca83a1e59d81f4c9",
        rating: selectedRating,
        comment: reviewInput
      };
      try {
        await axios.post('http://localhost:5000/api/reviews', newReview);
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

  if (!product) return <div></div>;

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

          <div className="review-section">
            <h3>Reviews</h3>
            <ul className="review-list">
              {reviews.map((r, index) => (
                <li key={index}>
                  <strong>{r.userId?.username || "User"}</strong> – {"★".repeat(r.rating)}<br />
                  {r.comment}
                </li>
              ))}
            </ul>

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
          </div>

        </div>
      </div>
    </div>
  );
};

export default Item;