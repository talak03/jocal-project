import React from "react";
import "./FeaturedDeals.css";

const featuredData = [
  {
    title: "JOBEDU",
    promo: "JOXLOC20",
    video: "/videos/deal5.mp4",
  },
  {
    title: "ZAYA",
    promo: "FLASH30",
    video: "/videos/deal2.mp4",
  },
  {
    title: "PURE",
    promo: "BEAUTY15",
    video: "/videos/deal1.mp4",
  },
  
];

const FeaturedDeals = () => {
  return (
    <section className="featured-deals">
      <h2>Top Deals</h2>

      <div className="deals-grid">
        {featuredData.map((deal, index) => (
          <div className="gucci-card" key={index}>
            <div className="media-container">
              {deal.video ? (
                <video
                  src={deal.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="gucci-media"
                />
              ) : (
                <img
                  src={deal.gallery[0]}
                  alt={deal.title}
                  className="gucci-media"
                />
              )}
            </div>
            <div className="gucci-info">
              <h3>{deal.title}</h3>
              <p>
                Use Code: <strong>{deal.promo}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedDeals;
