import React, { useState } from 'react';
import './features.css';

import image1 from '../../assets/image3.jpg';
import image2 from '../../assets/image4.jpg';
import image3 from '../../assets/image8.jpg';
import image4 from '../../assets/image10.jpg';

const images = [
  {
    src: image1,
    title: 'Summer Gala 2025',
    description: 'Join us for an unforgettable evening of music & fun!',
  },
  {
    src: image2,
    title: 'Art & Culture Fest',
    description: 'Celebrate creativity with artists from around the world.',
  },
  {
    src: image3,
    title: 'Food Carnival',
    description: 'Taste the best cuisines from top chefs and vendors.',
  },
  {
    src: image4,
    title: 'Tech Expo 2025',
    description: 'Discover the latest innovations in technology and design.',
  },
];

const EventCarousel = () => {
  const [index, setIndex] = useState(0);

  const handlePrev = () => {
    setIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="carousel-wrapper">
      <button className="nav-btn3" onClick={handlePrev}>
        ‹
      </button>

      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${index * 100}%)`,
          }}
        >
          {images.map((image, idx) => (
            <div className="carousel-slide" key={idx}>
              <img src={image.src} alt={`Slide ${idx + 1}`} />
              <div className="text-overlay">
                <h2>{image.title}</h2>
                <p>{image.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="nav-btn1" onClick={handleNext}>
        ›
      </button>
    </div>
  );
};

export default EventCarousel;
