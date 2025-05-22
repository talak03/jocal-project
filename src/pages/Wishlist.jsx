import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError("Please log in to view your wishlist.");
      setLoading(false);
      return;
    }

    axios.get('http://localhost:5000/api/wishlist', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        setWishlist(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch wishlist', err);
        setError('Please log in to view your wishlist.');
        setLoading(false);
      });
  }, [token]);

  const removeItem = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/wishlist/remove/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWishlist(wishlist.filter(item => item.productId !== productId));
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <header className="main-navbar">
        <div className="nav-container">
          <div className="logo">JOCAL</div>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="#">Deals</a>
            <a href="#">Contact</a>
          </nav>
          <div className="nav-icons">
            <i className="fa-regular fa-user"></i>
            <i className="fa-solid fa-heart"></i>
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
        </div>
      </header>

      {/* Wishlist Hero */}
      <div style={{ position: 'relative' }}>
        <img
          src="/images/categories/DSC01325_045b1d96-ea16-408f-a234-9beaf56fecc5.webp"
          alt="Wishlist Banner"
          className="wishlist-banner"
        />
        <div className="wishlist-header-text">
          <h1>Your Wishlist</h1>
          <p>Save products you love and come back anytime!</p>
        </div>
      </div>

      {/* Wishlist Grid Section */}
      <section className="wishlist-section wishlist-container">
        {loading && <p className="not-logged">Loading...</p>}
        {error && <p className="not-logged">{error}</p>}
        {!loading && !error && (
          <div className="wishlist-grid">
            {wishlist.length === 0 ? (
              <p>Your wishlist is empty.</p>
            ) : (
              wishlist.map((item) => (
                <div className="wishlist-card" key={item.productId}>
                  <img src={item.image || 'https://via.placeholder.com/200'} alt="Product" />
                  <h4>{item.title}</h4>
                  <p>{item.brand}</p>
                  <h6>{item.price} JOD</h6>
                  <div className="wishlist-actions">
                    <button onClick={() => window.open(item.url, '_blank')} className="buy-now">
                                         Buy Nowj
                                           </button>


                    <button onClick={() => removeItem(item.productId)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}

          </div>
        )}
      </section>
    </div>
  );
};

export default Wishlist;
