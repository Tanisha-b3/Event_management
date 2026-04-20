import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimation, color } from 'framer-motion';
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
    // gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    src: image2,
    title: 'Art & Culture Fest',
    description: 'Celebrate creativity with artists from around the world.',
    // gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    src: image3,
    title: 'Food Carnival',
    description: 'Taste the best cuisines from top chefs and vendors.',
    // gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    src: image4,
    title: 'Tech Expo 2025',
    description: 'Discover the latest innovations in technology and design.',
    // gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
];

// Helper function to get image URL
const getImageUrl = (event) => {
  // Try different image field names the backend might use
  const imageFields = [
    event.image,
    event.imageName,
    event.eventImage,
    event.coverImage,
    event.banner
  ].filter(Boolean);

  for (const img of imageFields) {
    if (!img) continue;

    // Already full URL
    if (img.startsWith('http') || img.startsWith('data:')) {
      return img;
    }

    // Path like 'uploads/events/filename.jpg'
    if (img.includes('uploads')) {
      return `http://localhost:5000/${img}`;
    }

    // Just filename
    if (img.includes('.')) {
      return `http://localhost:5000/uploads/events/${img}`;
    }
  }

  return null;
};

// Animated counter component
const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest));
  
  useEffect(() => {
    count.set(value);
  }, [value, count]);
  
  return <motion.span>{rounded}</motion.span>;
};

// Individual slide component with animations
const CarouselSlide = ({ slide, index, currentIndex, onImageError, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isActive = index === currentIndex;
  const direction = index > currentIndex ? 1 : -1;
  
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        rotateY: { duration: 0.5 }
      }
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? -45 : 45,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }
    })
  };
  
  const contentVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  const titleVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.4,
        duration: 0.5,
        type: "spring",
        stiffness: 120
      }
    }
  };
  
  const descriptionVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.5,
        duration: 0.5
      }
    }
  };
  
  const buttonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.6,
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      transition: {
        type: "spring",
        stiffness: 400
      }
    },
    tap: {
      scale: 0.95
    }
  };
  
  const imageVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div
      className="carousel-slide"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      layout
    >
      <motion.div 
        className="slide-image-container"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      >
        {!imageError && slide.src ? (
          <>
            <motion.img 
              src={slide.src} 
              alt={slide.title}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                onImageError(slide.eventId, index);
              }}
              loading="lazy"
              className={`slide-image ${imageLoaded ? 'loaded' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
            {!imageLoaded && (
              <motion.div 
                className="image-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="loader-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
          </>
        ) : (
          <motion.div 
            className="fallback-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span>{slide.title.charAt(0)}</span>
          </motion.div>
        )}
        
        {/* Gradient overlay */}
        <motion.div 
          className="slide-gradient-overlay"
          style={{ background: slide.gradient || 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      
      <motion.div 
        className="text-overlay-k"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 variants={titleVariants}>
          {slide.title.split(' ').map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              style={{ display: 'inline-block', marginRight: '4px', color:"white" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>
        
        <motion.p variants={descriptionVariants} style={{color:"white"}}>
          {slide.description}
        </motion.p>
        
        <motion.button
          className="slide-cta"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => onClick && onClick(slide.eventId)}
        >
          <span>Discover Event</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Dot indicator component
const DotIndicator = ({ isActive, onClick, index }) => {
  const dotVariants = {
    inactive: { scale: 1, opacity: 0.5 },
    active: { 
      scale: 1.2, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    hover: { scale: 1.3, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.button
      className={`carousel-dot ${isActive ? 'active' : ''}`}
      variants={dotVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={`Go to slide ${index + 1}`}
    >
      {isActive && (
        <motion.div
          className="dot-pulse"
          layoutId="dot-pulse"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

// Navigation button component
const NavButton = ({ direction, onClick, disabled }) => {
  const buttonVariants = {
    initial: { scale: 1, opacity: 0.8 },
    hover: { 
      scale: 1.1, 
      opacity: 1,
      backgroundColor: 'rgba(255,255,255,0.95)',
      transition: { type: "spring", stiffness: 400 }
    },
    tap: { scale: 0.95 },
    disabled: { opacity: 0.3, scale: 1 }
  };
  
  return (
    <motion.button
      className={`carousel-nav-btn ${direction}`}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled ? "hover" : "disabled"}
      whileTap={!disabled ? "tap" : "disabled"}
      onClick={onClick}
      disabled={disabled}
    >
      <motion.span
        animate={!disabled ? { x: direction === 'prev' ? [-2, 2, -2] : [2, -2, 2] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {direction === 'prev' ? '‹' : '›'}
      </motion.span>
    </motion.button>
  );
};

// Progress bar component
const ProgressBar = ({ currentIndex, totalSlides }) => {
  const progress = ((currentIndex + 1) / totalSlides) * 100;
  
  return (
    <motion.div className="carousel-progress">
      <motion.div 
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.div>
  );
};

// Main EventCarousel component
const EventCarousel = ({ events = [], onEventClick }) => {
  const [imageErrors, setImageErrors] = useState({});
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  const controls = useAnimation();
  
  const slides = useMemo(() => {
    if (!events || events.length === 0) return fallbackSlides;
    
    return events.slice(0, 6).map((ev, idx) => {
      const imageUrl = getImageUrl(ev);
      const fallbackSlide = fallbackSlides[idx % fallbackSlides.length];
      
      return {
        src: (imageUrl && !imageErrors[ev._id || idx]) ? imageUrl : fallbackSlide.src,
        title: ev.title || 'Featured Event',
        description: ev.description || ev.category || ev.location || 'Featured event',
        eventId: ev._id || ev.id,
        originalEvent: ev,
        gradient: fallbackSlide.gradient
      };
    });
  }, [events, imageErrors]);

  // Reset index when events change
  useEffect(() => {
    setIndex(0);
    setImageErrors({});
    controls.start({ opacity: 1, x: 0 });
  }, [events, controls]);

  // Auto-play functionality
  useEffect(() => {
    if (slides.length <= 1) return;
    
    if (isAutoPlaying && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isDragging, slides.length, index]);

  const handlePrev = () => {
    if (!isAutoPlaying) {
      controls.start({
        x: [0, -20, 0],
        transition: { duration: 0.3 }
      });
    }
    setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!isAutoPlaying) {
      controls.start({
        x: [0, 20, 0],
        transition: { duration: 0.3 }
      });
    }
    setIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (eventId, slideIndex) => {
    setImageErrors(prev => ({
      ...prev,
      [eventId || slideIndex]: true
    }));
  };

  const handleDotClick = (idx) => {
    setIsAutoPlaying(false);
    setIndex(idx);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX || e.touches?.[0]?.clientX);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    const dragEnd = e.clientX || e.changedTouches?.[0]?.clientX;
    const dragDistance = dragEnd - dragStart;
    
    if (Math.abs(dragDistance) > 50) {
      if (dragDistance > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const handleEventClick = (eventId) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  if (!slides.length) {
    return null;
  }

  return (
    <motion.div 
      className="carousel-wrapper"
      ref={carouselRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {/* Background particles effect */}
      <div className="carousel-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * 400,
              scale: Math.random() * 0.5 + 0.3,
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{
              y: [null, -30, 30, -30],
              x: [null, Math.random() * 100 - 50],
              opacity: [null, Math.random() * 0.5 + 0.1]
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <NavButton direction="prev" onClick={handlePrev} />
          <NavButton direction="next" onClick={handleNext} />
        </>
      )}

      {/* Carousel Viewport */}
      <motion.div 
        className="carousel-viewport"
        animate={controls}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" custom={index}>
          <CarouselSlide
            key={index}
            slide={slides[index]}
            index={index}
            currentIndex={index}
            onImageError={handleImageError}
            onClick={handleEventClick}
          />
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      {slides.length > 1 && (
        <ProgressBar currentIndex={index} totalSlides={slides.length} />
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <motion.div 
          className="carousel-dots"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {slides.map((_, idx) => (
            <DotIndicator
              key={idx}
              isActive={idx === index}
              onClick={() => handleDotClick(idx)}
              index={idx}
            />
          ))}
        </motion.div>
      )}

      {/* Slide Counter */}
      <motion.div 
        className="slide-counter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="current">
          <AnimatedCounter value={index + 1} />
        </span>
        <span className="separator">/</span>
        <span className="total">{slides.length}</span>
      </motion.div>

      {/* Auto-play toggle button */}
      {slides.length > 1 && (
        <motion.button
          className="autoplay-toggle"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isAutoPlaying ? '⏸' : '▶'}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EventCarousel;