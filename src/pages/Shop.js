import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/Shop.css';

const Search = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [price, setPrice] = useState(250);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);

  // 🚀 Fetch products when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setProducts(res.data);
        console.log(res.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
    fetchProducts();
  }, []);

  // 🔍 Filtering logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.title || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes("All Products") ||
      selectedCategories.includes(product.category);
    const matchesPrice = Number(product.price) <= Number(price);
    const matchesRating = Number(product.rating || 0) >= Number(selectedRating);
  
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });
  

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  // Handle rating change
  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
  };

  return (
    <div>
      <header className="main-navbar">
        <div className="nav-container">
          <div className="logo">JOCAL</div>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="#">Deals</a>
            <a href="/contact.html">Contact</a>
          </nav>
          <div className="nav-icons">
            <i className="fa-regular fa-user"></i>
            <i className="fa-regular fa-heart"></i>
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
        </div>
      </header>

      <section className="search-hero">
        <div className="search-hero-content">
          <h1>Give All You Need</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search on Jocal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button>Search</button>
          </div>
        </div>
      </section>

      <div className="product-wrapper">
        <section className="search-results">
          <aside className="sidebar">
            <h3>Filter</h3>

            <div className="filter-group">
              <h4>Category</h4>
              <ul>
                {["All Products", "For Home", "For Music", "For Storage"].map((category) => (
                  <li key={category}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    {category}
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-group">
              <h4>Price</h4>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <p>Up to: <span id="priceValue">{`$${price}`}</span></p>
            </div>

            <div className="filter-group">
              <h4>Review</h4>
              <div className="star-filter" id="starFilter">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <span
                    key={rating}
                    data-value={rating}
                    className={selectedRating >= rating ? "selected" : ""}
                    onClick={() => handleRatingChange(rating)}
                    style={{ cursor: "pointer", color: selectedRating >= rating ? "#f5b50a" : "#ccc" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="product-grid">
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <a key={product._id} href={`/item/${product._id}`} className="product-card-link">
                  <div className="product-card">
                    <img src={product.image} alt={product.title} />
                    <h4>{product.title}</h4>
                    <h6>{product.brand}</h6>
                    <p><strong>{product.price} JOD</strong></p>
                    <div className="product-actions">
                      <span className="buy-now">View</span>
                      <button className="wishlist-btn">
                        <i className="fa-regular fa-heart"></i>
                      </button>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p>No products found</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Search;
