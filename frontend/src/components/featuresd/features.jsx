import React, { useMemo, useState, useEffect } from 'react';
import './features.css';

import image1 from '../../assets/image3.jpg';
import image2 from '../../assets/image4.jpg';
import image3 from '../../assets/image8.jpg';
import image4 from '../../assets/image10.jpg';

const fallbackSlides = [
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

// Helper function to get image URL
const getImageUrl = (event) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace('/api', '');
  
  // Check for image in order of priority
  if (event.image) {
    // If image is a full URL or base64, use it directly
    if (event.image.startsWith('http') || event.image.startsWith('data:')) {
      return event.image;
    }
    // If image is a path, prepend base URL
    return `${BASE_URL}${event.image.startsWith('/') ? '' : '/'}${event.image}`;
  }
  
  if (event.imageName) {
    return `${BASE_URL}/uploads/events/${event.imageName}`;
  }
  
  if (event.eventImage) {
    if (event.eventImage.startsWith('http') || event.eventImage.startsWith('data:')) {
      return event.eventImage;
    }
    return `${BASE_URL}${event.eventImage.startsWith('/') ? '' : '/'}${event.eventImage}`;
  }
  
  // Return fallback based on index if no image found
  return null;
};

const EventCarousel = ({ events = [] }) => {
  const [imageErrors, setImageErrors] = useState({});
  
  const slides = useMemo(() => {
    if (!events || events.length === 0) return fallbackSlides;
    
    return events.slice(0, 6).map((ev, idx) => {
      const imageUrl = getImageUrl(ev);
      const fallbackImage = fallbackSlides[idx % fallbackSlides.length].src;
      
      return {
        src: (imageUrl && !imageErrors[ev._id || idx]) ? imageUrl : fallbackImage,
        title: ev.title || 'Featured Event',
        description: ev.description || ev.category || ev.location || 'Featured event',
        eventId: ev._id || ev.id,
        originalEvent: ev
      };
    });
  }, [events, imageErrors]);

  const [index, setIndex] = useState(0);

  // Reset index when events change
  useEffect(() => {
    setIndex(0);
    setImageErrors({});
  }, [events]);

  const handlePrev = () => {
    setIndex((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setIndex((prev) =>
      prev === slides.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageError = (eventId, slideIndex) => {
    setImageErrors(prev => ({
      ...prev,
      [eventId || slideIndex]: true
    }));
  };

  // Auto-play functionality (optional)
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [slides.length, index]);

  if (!slides.length) {
    return null;
  }

  return (
    <div className="carousel-wrapper">
      {slides.length > 1 && (
        <button className="carousel-nav-btn prev nav-btn3" onClick={handlePrev}>
          ‹
        </button>
      )}

      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: 'transform 0.5s ease-in-out'
          }}
        >
          {slides.map((slide, idx) => (
            <div className="carousel-slide" key={slide.eventId || idx}>
              <img 
                src={slide.src} 
                alt={slide.title}
                onError={() => handleImageError(slide.eventId, idx)}
                loading="lazy"
              />
              <div className="text-overlay-k">
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <button className="carousel-nav-btn next nav-btn1" onClick={handleNext}>
          ›
        </button>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === index ? 'active' : ''}`}
              onClick={() => setIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCarousel;