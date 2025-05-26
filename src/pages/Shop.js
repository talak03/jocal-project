
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import '../styles/Shop.css';
import Footer from "../components/Footer";

const Search = () => {
  const [products, setProducts] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [price, setPrice] = useState(250);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoriesWithSubs, setCategoriesWithSubs] = useState({});
  const [authMessage, setAuthMessage] = useState("");
  const [showOnlySales, setShowOnlySales] = useState(false);

  useEffect(() => {
    const normalizeCategory = (value) => {
      if (!value) return null;
      const val = value.trim().toLowerCase();
      if (["jewellery", "jewelry"].includes(val)) return "Jewelry";
      if (["accessories", "accessory"].includes(val)) return "Accessories";
      if (["homeware", "other"].includes(val)) return null;
      if (["clothing", "clothes"].includes(val)) return "Clothing";
      return val.charAt(0).toUpperCase() + val.slice(1);
    };

    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setProducts(res.data);

        const catMap = {};
        res.data.forEach(product => {
          const rawCategory = normalizeCategory(product.category);
          const rawSubcategory = normalizeCategory(product.subcategory);
          if (!rawCategory) return;
          if (!catMap[rawCategory]) catMap[rawCategory] = new Set();
          if (rawCategory === "Clothing" && rawSubcategory === "Bags") return;
          if (rawSubcategory && rawSubcategory !== rawCategory) {
            catMap[rawCategory].add(rawSubcategory);
          }
        });

        const categoriesObj = {};
        Object.entries(catMap).forEach(([cat, subSet]) => {
          categoriesObj[cat] = Array.from(subSet);
        });

        setCategoriesWithSubs(categoriesObj);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, []);

  const allBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredProducts = products.filter((product) => {
    const title = (product.title || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = title.includes(query) || brand.includes(query);
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.map(b => b.toLowerCase()).includes(brand);
    const matchesPrice = Number(product.price) <= Number(price);
    const matchesRating = Number(product.rating || 0) >= Number(selectedRating);
    const productCategory = (product.category || '').toLowerCase().trim();
    const productSubCategory = (product.subcategory || '').toLowerCase().trim();
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.map(c => c.toLowerCase().trim()).includes(productCategory);
    const matchesSubCategory = selectedSubCategories.length === 0 || selectedSubCategories.map(s => s.toLowerCase().trim()).includes(productSubCategory);
    const categoryMatch = productSubCategory && selectedSubCategories.length > 0 ? matchesSubCategory : matchesCategory;
    const matchesSale = !showOnlySales || product.on_sale;
    return matchesSearch && categoryMatch && matchesBrand && matchesPrice && matchesRating && matchesSale;
  });

  filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));

  const toggleSelection = (value, setter, current) => {
    setter(current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]);
  };

  const addToWishlist = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthMessage("Please log in to add items to your wishlist.");
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
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuthMessage("");
      alert(res.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthMessage("Session expired. Please log in again.");
      } else {
        setAuthMessage("Something went wrong.");
      }
    }
  };

  return (
    <div>
      <Navbar />
      <section className="search-hero">
        <div className="search-hero-content">
          <h1>Give All You Need</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by title or brand..."
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
            {/* Category Filter */}
            <div className="filter-group">
              <h4 onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)} style={{ cursor: 'pointer' }}>
                {categoryDropdownOpen ? "▼" : "▶"} Category
              </h4>
              {categoryDropdownOpen && (
                <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                  {Object.keys(categoriesWithSubs).map((category) => (
                    <div key={category}>
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleSelection(category, setSelectedCategories, selectedCategories)}
                        />
                        {category}
                      </label>
                      {selectedCategories.includes(category) && categoriesWithSubs[category].length > 0 && (
                        <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                          {categoriesWithSubs[category].map((sub) => (
                            <div key={sub} style={{ paddingLeft: '1rem' }}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectedSubCategories.includes(sub)}
                                  onChange={() => toggleSelection(sub, setSelectedSubCategories, selectedSubCategories)}
                                />
                                {sub}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div className="filter-group">
              <h4 onClick={() => setBrandDropdownOpen(!brandDropdownOpen)} style={{ cursor: 'pointer' }}>
                {brandDropdownOpen ? "▼" : "▶"} Brand
              </h4>
              {brandDropdownOpen && (
                <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                  {allBrands.map((brand) => (
                    <div key={brand}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleSelection(brand, setSelectedBrands, selectedBrands)}
                        />
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <h4>Price</h4>
              <input
                type="range"
                min="0"
                max="3000"
                step="10"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <p>Up to: <strong>{price} JOD</strong></p>
            </div>

            {/* Sale Filter */}
            <div className="filter-group">
              <h4>Offers</h4>
              <label>
                <input
                  type="checkbox"
                  checked={showOnlySales}
                  onChange={() => setShowOnlySales(!showOnlySales)}
                />
                Show Only Sales
              </label>
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <h4>Review</h4>
              <div className="star-filter" id="starFilter">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <span
                    key={rating}
                    data-value={rating}
                    className={selectedRating >= rating ? "selected" : ""}
                    onClick={() => setSelectedRating(rating)}
                    style={{ cursor: "pointer", color: selectedRating >= rating ? "#f5b50a" : "#ccc" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <a key={product._id} href={`/item/${product._id}`} className="product-card-link">
                  <div className="product-card">
                    <img
                      src={(product.image && product.image.replace("{width}", "300")) || "fallback.jpg"}
                      alt={product.title}
                      style={{ cursor: "pointer" }}
                    />
                    <h4>{product.title}</h4>
                    <h6>{product.brand}</h6>
                    <p><strong>{product.price} JOD</strong></p>
                    <div className="product-actions">
                      <span className="buy-now">View</span>
                      <button
                        className="wishlist-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          addToWishlist(product);
                        }}
                      >
                        <i className="fa-regular fa-heart"></i>
                      </button>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p></p>
            )}
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default Search;
