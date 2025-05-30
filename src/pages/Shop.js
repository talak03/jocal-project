import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';
import '../styles/Shop.css';
import Footer from "../components/Footer";

const Search = () => {
  const navigate = useNavigate();
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
  const [sortBy, setSortBy] = useState('');
  const [wishlistItems, setWishlistItems] = useState(new Set());

  const normalizeCategory = (value) => {
    if (!value) return null;

    const val = value.trim().toLowerCase();
    if (val === "bags") return null;
    if (["jewellery", "jewelry"].includes(val)) return "Jewelry";
    if (["accessories", "accessory"].includes(val)) return "Accessories";
    if (["homeware", "other"].includes(val)) return null;
    if (["clothing", "clothes"].includes(val)) return "Clothing";

    return val.charAt(0).toUpperCase() + val.slice(1); // Capitalize
  };
  useEffect(() => {

    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        const activeProducts = res.data;
        setProducts(activeProducts);

        const catMap = {};

        // First, get all active products' categories and subcategories
        activeProducts.forEach(product => {
          if (!product.category) return;

          const rawCategory = normalizeCategory(product.category);
          const rawSubcategory = normalizeCategory(product.subcategory);

          if (!rawCategory) return;

          // Initialize category if it doesn't exist
          if (!catMap[rawCategory]) {
            catMap[rawCategory] = new Set();
          }

          // Only add subcategories that actually have products
          if (rawSubcategory && rawSubcategory !== rawCategory) {
            // Verify there are products with this subcategory before adding it
            const hasProductsWithSubcategory = activeProducts.some(
              p => normalizeCategory(p.subcategory) === rawSubcategory
            );
            if (hasProductsWithSubcategory) {
              catMap[rawCategory].add(rawSubcategory);
            }
          }
        });

        // Filter out empty categories and create final object
        const categoriesObj = {};
        Object.entries(catMap).forEach(([category, subSet]) => {
          // Check if this category has any direct products
          const hasDirectProducts = activeProducts.some(
            product => normalizeCategory(product.category) === category
          );

          // Convert subcategories to array and verify each one
          const validSubs = Array.from(subSet).filter(sub =>
            activeProducts.some(product => normalizeCategory(product.subcategory) === sub)
          );

          // Only include category if it has direct products or valid subcategories
          if (hasDirectProducts || validSubs.length > 0) {
            categoriesObj[category] = validSubs;
          }
        });

        console.log('Categories with products:', categoriesObj); // For debugging
        setCategoriesWithSubs(categoriesObj);

      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const scrollY = sessionStorage.getItem("shopScrollY");
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const brandGroups = {
    "Amina's Skincare": [
      "amina's skin care",
      "aminas natural skincare",
      "aminas skincare"
    ],
    "Watan Palestine": [
      "watan",
      "watanpalestine"
    ],
    "Fair & Care": [
      "fairandcare",
      "fair & care",
      "fair and care",
      "Fair&care"
    ],
    "Sealedjo": [
      "SEALED TUMBLER CUPS"
    ],
    "August Shoes": [
      "augustshoes"
    ],
    "Joy Jewels": [
      "18k Gold Collection",
      "Diamonds Collection"
    ],
    "Zaya": [
      "CB"
    ]
  };

  const normalizeBrandName = (brand) => {
    if (!brand) return "";

    const normalizedBrand = brand.toLowerCase().trim();

    // Ignore "My Store"
    if (normalizedBrand === "my store") {
      return "";
    }

    // Check against brand groups (case-insensitive)
    for (const [groupName, variants] of Object.entries(brandGroups)) {
      // Check if the brand matches the group name
      if (groupName.toLowerCase().trim() === normalizedBrand) {
        return groupName;
      }
      // Check if the brand matches any variant
      if (variants.some(v => v.toLowerCase().trim() === normalizedBrand)) {
        return groupName;
      }
    }

    return brand.trim();
  };

  const allBrands = [...new Set([
    ...Object.keys(brandGroups),
    ...products
      .map(p => p.brand)
      .filter(Boolean)
      .filter(brand => {
        const normalizedBrand = brand.toLowerCase().trim();
        return normalizedBrand !== "my store" &&
          !Object.keys(brandGroups).some(groupName =>
            groupName.toLowerCase().trim() === normalizedBrand
          ) &&
          !Object.values(brandGroups).some(variants =>
            variants.some(v => v.toLowerCase().trim() === normalizedBrand)
          );
      })
  ])].sort();

  const filteredProducts = products.filter((product) => {
    const title = (product.title || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch = title.includes(query) || brand.includes(query);
    const matchesBrand =
      selectedBrands.length === 0 ||
      selectedBrands.map(b => normalizeBrandName(b).toLowerCase()).includes(normalizeBrandName(brand).toLowerCase());

    // Use sale price for price comparison if available
    const productPrice = product.on_sale ? Number(product.price) : Number(product.price);
    const matchesPrice = productPrice <= Number(price);

    const matchesRating = Number(product.rating || 0) >= Number(selectedRating);

    const productCategory = (product.category || '').toLowerCase().trim();
    const productSubCategory = (product.subcategory || '').toLowerCase().trim();

    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.map(c => c.toLowerCase().trim()).includes(productCategory);
    const matchesSubCategory = selectedSubCategories.length === 0 ||
      selectedSubCategories.map(s => s.toLowerCase().trim()).includes(productSubCategory);

    const categoryMatch =
      productSubCategory && selectedSubCategories.length > 0
        ? matchesSubCategory
        : matchesCategory;

    return matchesSearch && categoryMatch && matchesBrand && matchesPrice && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return Number(a.price) - Number(b.price);
      case 'price-high':
        return Number(b.price) - Number(a.price);
      case 'new':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'sale':
        return (b.on_sale ? 1 : 0) - (a.on_sale ? 1 : 0);
      default:
        return 0;
    }
  });

  const toggleSelection = (value, setter, current) => {
    setter(current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPrice(250);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedBrands([]);
    setSelectedRating(0);
    setSortBy('');
  };

  const addToWishlist = async (product, e) => {
    e.stopPropagation(); // Prevent navigation when clicking the heart

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const wishlistItem = {
      productId: product._id,
      title: product.title,
      image: product.image,
      price: product.price,
      brand: product.brand,
      url: product.url
    };

    try {
      const res = await axios.post("http://localhost:5000/api/wishlist/add", wishlistItem, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWishlistItems(prev => new Set([...prev, product._id]));
      alert(res.data.message || "Item added to wishlist!");
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Please log in to add items to your wishlist.");
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error adding item to wishlist");
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get('http://localhost:5000/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          setWishlistItems(new Set(res.data.map(item => item.productId)));
        })
        .catch((err) => console.error('Failed to fetch wishlist', err));
    }
  }, []);

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
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
      </section>

      <div className="product-wrapper">
        <section className="search-results">
          <aside className="sidebar">
            <h3>Filter</h3>
            <div className="sort-container">
              <div className="sort-dropdown">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="">Sort By</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="new">New Arrivals</option>
                  <option value="sale">On Sale</option>
                </select>
              </div>
            </div>
            {/* Category */}
            <div className="filter-group">
              <h4 onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)} style={{ cursor: 'pointer' }}>
                {categoryDropdownOpen ? "▼" : "▶"} Category
              </h4>

              {categoryDropdownOpen && (
                <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                  {Object.entries(categoriesWithSubs)
                    // Additional filter to ensure categories have products
                    .filter(([category, subs]) => {
                      const hasActiveProducts = products.some(
                        product => normalizeCategory(product.category) === category &&
                          product.price && // Ensure product has a price
                          product.image    // Ensure product has an image
                      );

                      const hasActiveSubProducts = subs.some(sub =>
                        products.some(
                          product => normalizeCategory(product.subcategory) === sub &&
                            product.price &&
                            product.image
                        )
                      );

                      return hasActiveProducts || hasActiveSubProducts;
                    })
                    .map(([category, subs]) => (
                      <div key={category}>
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() =>
                              toggleSelection(category, setSelectedCategories, selectedCategories)
                            }
                          />
                          {category}
                        </label>

                        {/* Show subcategories only if they have products */}
                        {selectedCategories.includes(category) && (
                          <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                            {subs
                              .filter(sub =>
                                products.some(
                                  product =>
                                    normalizeCategory(product.subcategory) === sub &&
                                    product.price &&
                                    product.image
                                )
                              )
                              .map((sub) => (
                                <div key={sub} style={{ paddingLeft: '1rem' }}>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={selectedSubCategories.includes(sub)}
                                      onChange={() =>
                                        toggleSelection(sub, setSelectedSubCategories, selectedSubCategories)
                                      }
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



            {/* Brand Dropdown */}
            <div className="filter-group">
              <h4 onClick={() => setBrandDropdownOpen(!brandDropdownOpen)} style={{ cursor: 'pointer' }}>
                {brandDropdownOpen ? "▼" : "▶"} Brand
              </h4>
              {brandDropdownOpen && (
                <div className="subcategory-list" style={{ paddingLeft: '1rem' }}>
                  {/* Only show brand group names */}
                  {Object.keys(brandGroups).map((brandName) => (
                    <div key={brandName}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brandName)}
                          onChange={() => toggleSelection(brandName, setSelectedBrands, selectedBrands)}
                        />
                        {brandName}
                      </label>
                    </div>
                  ))}

                  {/* Show other brands that aren't in any group and aren't group names */}
                  {products
                    .map(p => p.brand)
                    .filter(Boolean)
                    .filter(brand => {
                      const normalizedBrand = brand.toLowerCase().trim();
                      // Exclude "My Store" and check normalized brand names
                      return normalizedBrand !== "my store" &&
                        !Object.keys(brandGroups).some(groupName =>
                          groupName.toLowerCase().trim() === normalizedBrand
                        ) &&
                        !Object.values(brandGroups).some(variants =>
                          variants.some(v => v.toLowerCase().trim() === normalizedBrand)
                        );
                    })
                    .filter((brand, index, self) =>
                      self.findIndex(b => b.toLowerCase().trim() === brand.toLowerCase().trim()) === index
                    ) // Remove duplicates considering case-insensitive comparison
                    .sort()
                    .map(brand => (
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

            {/* Price */}
            <div className="filter-group">
              <h4>Price</h4>
              <input
                type="range"
                min="0"
                max="2000"
                step="10"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <p>Up to: <strong>{price} JOD</strong></p>
            </div>

            {/* Rating */}
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
            {/* Clear Filters Button */}
            <div className="filter-group">
              <button
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear All Filters
              </button>
            </div>
          </aside>
          <div className="product-grid">
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => navigate(`/item/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                > 
                  <div className="image-container">
                    <img src={(product.image&& product.image.replace("{width}", "300")) || "fallback.jpg" } alt={product.title} />
                    {product.on_sale && <span className="sale-tag">Sale!</span>}
                  </div>
                  <div className="product-info">
                    <h4>{product.title}</h4>
                    <h6>{normalizeBrandName(product.brand)}</h6>
                    <div className="price-container">
                      {product.on_sale ? (
                        <>
                          <span className="original-price">{product.original_price} JOD</span>
                          <span className="sale-price">{product.price} JOD</span>
                        </>
                      ) : (
                        <p><strong>{product.price} JOD</strong></p>
                      )}
                    </div>
                    <div className="product-actions">
                      <button
                        className="view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/item/${product._id}`);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="wishlist-btn"
                        onClick={(e) => addToWishlist(product, e)}
                      >
                        <i className={`fa-heart ${wishlistItems.has(product._id) ? 'fa-solid' : 'fa-regular'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p></p>
            )}
          </div>

        </section>
      </div>
      <Footer />
    </div >
  );
};

export default Search;

          // <div className="product-grid">
          //   {filteredProducts.length > 0 ? (
          //     filteredProducts.map((product) => (
          //       <a key={product._id} href={`/item/${product._id}`} className="product-card-link">
          //         <div className="product-card">
          //           <img
          //             src={(product.image && product.image.replace("{width}", "300")) || "fallback.jpg"}
          //             alt={product.title}
          //             style={{ cursor: "pointer" }}
          //           />
          //           <h4>{product.title}</h4>
          //           <h6>{product.brand}</h6>
          //           <p><strong>{product.price} JOD</strong></p>
          //           <div className="product-actions">
          //             <span className="buy-now">View</span>
          //             <button
          //               className="wishlist-btn"
          //               onClick={(e) => {
          //                 e.preventDefault();
          //                 addToWishlist(product);
          //               }}
          //             ></button>