import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faHeart,
  faEye,
  faTicket,
  faArrowRight,
  faArrowLeft,
  faStar,
  faFire,
  faCheck,
  faShoppingCart,
  faMapMarkerAlt,
  faCalendarAlt,
  faChartLine,
  faHandSparkles
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { fetchEvents } from '../store/slices/eventSlice';
import { addFavorite } from '../store/slices/favoritesSlice';
import { addToCartAsync } from '../store/slices/cartSlice';
import useAuth from '../store/hooks/useAuth';
import './SwipeCards.css';

// Constants
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const CARD_STACK_DEPTH = 3;

/* ── Helper Functions ────────────────────────────────────────── */
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatCount = (n = 0) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ── Enhanced Card Component with Framer Motion ──────────────── */
const SwipeCard = ({ card, onSwipe, onCardClick, onAddToCart, index, totalCards, isAuthenticated }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 0.8, 1, 0.8, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
  const [direction, setDirection] = useState(null);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > SWIPE_VELOCITY_THRESHOLD) {
      const swipeDirection = offset > 0 ? 'right' : 'left';
      setDirection(swipeDirection);
      onSwipe(swipeDirection, card);
      
      x.set(offset > 0 ? 500 : -500);
      setTimeout(() => {
        setDirection(null);
        x.set(0);
      }, 300);
    } else {
      x.set(0);
    }
  };

  const saveOpacity = useTransform(x, [0, 150], [0, 1]);
  const skipOpacity = useTransform(x, [-150, 0], [1, 0]);

  return (
    <motion.div
      className={`sc__card ${direction === 'right' ? 'sc__card--saving' : ''} ${direction === 'left' ? 'sc__card--skipping' : ''}`}
      style={{
        x,
        rotate,
        opacity,
        scale,
        zIndex: totalCards - index,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        cursor: 'grab',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, x: -300 }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
        delay: index * 0.05
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* Image Section */}
      <div className="sc__imageContainer">
        {card?.image ? (
          <motion.img
            src={card.image}
            alt={card.title}
            className="sc__cardImage"
            draggable={false}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="sc__imagePlaceholder" aria-hidden="true">
            <motion.span 
              className="sc__placeholderEmoji"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎭
            </motion.span>
          </div>
        )}
        <div className="sc__imageOverlay" />
      </div>

      {/* Badges */}
      <div className="sc__badges">
        <motion.span 
          className="sc__categoryBadge"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FontAwesomeIcon icon={faStar} size="xs" style={{ marginRight: '6px' }} />
          {card?.category || 'Event'}
        </motion.span>
        <motion.span 
          className="sc__viewsBadge"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FontAwesomeIcon icon={faEye} style={{ marginRight: '4px' }} />
          {formatCount(card?.views)}
        </motion.span>
      </div>

      {/* Swipe Stamps */}
      <motion.div
        className="sc__stamp sc__stamp--save"
        style={{ opacity: saveOpacity }}
        aria-hidden="true"
      >
        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
          <FontAwesomeIcon icon={faHeart} />
        </motion.span>
        SAVE
      </motion.div>
      
      <motion.div
        className="sc__stamp sc__stamp--skip"
        style={{ opacity: skipOpacity }}
        aria-hidden="true"
      >
        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
          <FontAwesomeIcon icon={faTimes} />
        </motion.span>
        SKIP
      </motion.div>

      {/* Trending Indicator */}
      {index < 3 && (
        <motion.div 
          className="sc__trendingIndicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <FontAwesomeIcon icon={faFire} beat style={{ marginRight: '6px' }} />
          <span>Trending #{index + 1}</span>
        </motion.div>
      )}

      {/* Card Content */}
      <motion.div 
        className="sc__cardContent"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <motion.h3 
          className="sc__eventTitle"
          whileHover={{ x: 5 }}
        >
          {card?.title}
        </motion.h3>
        
        <div className="sc__metaRow">
          <FontAwesomeIcon icon={faCalendarAlt} className="sc__metaIcon" />
          <span className="sc__metaText">{formatDate(card?.date)}</span>
          <span className="sc__metaDot" />
          <FontAwesomeIcon icon={faMapMarkerAlt} className="sc__metaIcon" />
          <span className="sc__metaText sc__metaLocation">{card?.location}</span>
        </div>

        {/* Engagement Stats */}
        <div className="sc__engagementStats">
          <div className="sc__engagementStat">
            <FontAwesomeIcon icon={faHeartRegular} className="sc__statIcon" />
            <span>{formatCount(card?.likes)} likes</span>
          </div>
          <div className="sc__engagementStat">
            <FontAwesomeIcon icon={faTicket} className="sc__statIcon" />
            <span>{formatCount(card?.ticketsSold)} sold</span>
          </div>
          {card?.trendingScore && (
            <div className="sc__engagementStat">
              <FontAwesomeIcon icon={faChartLine} className="sc__statIcon" />
              <span>{card.trendingScore}% trending</span>
            </div>
          )}
        </div>

        <div className="sc__cardFooter">
          <div>
            {card?.ticketPrice > 0 ? (
              <motion.div whileHover={{ scale: 1.05 }} className="sc__priceWrapper">
                <p className="sc__price">
                  ${card.ticketPrice}
                  <span className="sc__priceSub">/ticket</span>
                </p>
              </motion.div>
            ) : (
              <motion.span 
                className="sc__freeBadge"
                whileHover={{ scale: 1.05 }}
              >
                <FontAwesomeIcon icon={faCheck} style={{ marginRight: '6px' }} />
                Free Entry
              </motion.span>
            )}
          </div>
          
          <div className="sc__cardActions">
            <motion.button
              className="sc__cartBtn"
              onClick={() => onAddToCart(card)}
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? "Please login to add to cart" : "Add to cart"}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
            </motion.button>
            
            <motion.button
              className="sc__viewLink"
              onClick={() => onCardClick(card?._id)}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              Details
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: '6px' }} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Main Component ──────────────────────────────────────────── */
const SwipeCards = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated || !!localStorage.getItem('token');
  const token = auth.token || localStorage.getItem('token');
  const { events, loading } = useSelector((state) => state.events);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    dispatch(fetchEvents({ filterType: 'active', limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (events.length > 0) {
      setCards(events);
    }
  }, [events]);

  const handleSwipe = async (swipeDirection, card) => {
    if (!card) return;

    setDirection(swipeDirection);

    if (swipeDirection === 'right') {
      if (!isAuthenticated || !token) {
        toast.error('Please login to save events');
        navigate('/login');
      } else {
        try {
          await dispatch(addFavorite({
            eventId: card._id,
            eventData: {
              title: card.title,
              date: card.date instanceof Date ? card.date.toISOString() : new Date(card.date).toISOString(),
              location: card.location,
              category: card.category,
              ticketPrice: card.ticketPrice,
              imageName: card.imageName,
              image: card.image,
              organizer: card.organizer,
              status: card.status,
            }
          })).unwrap();
          toast.success('Event saved!');
          setShowConfetti(true);
          setShowSuccessMessage(true);
          setTimeout(() => setShowConfetti(false), 1500);
          setTimeout(() => setShowSuccessMessage(false), 2000);
        } catch (err) {
          toast.error(err || 'Failed to save event');
        }
      }
    }

    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, cards.length));
      setDirection(null);
    }, 300);
  };

  const handleCardClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleAddToCart = async (card) => {
    if (!card) {
      toast.error('No card available');
      return;
    }

    if (!isAuthenticated || !token) {
      toast.error('Please login to add tickets to cart');
      navigate('/login');
      return;
    }

    try {
      await dispatch(addToCartAsync({
        id: `${card._id}-General`,
        eventId: card._id,
        eventName: card.title,
        eventTitle: card.title,
        ticketType: 'General Admission',
        price: card.ticketPrice || 0,
        quantity: 1,
        eventDate: card.date instanceof Date ? card.date.toISOString() : new Date(card.date).toISOString(),
        eventImage: card.image || card.imageName ? `http://localhost:5000/uploads/events/${card.imageName || card.image}` : null,
        eventLocation: card.location,
      })).unwrap();

      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err || 'Failed to add to cart');
    }
  };

  const handleStartOver = () => {
    setCurrentIndex(0);
    setCards(events);
  };

  const isDone = currentIndex >= cards.length;
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
  const currentCard = cards[currentIndex];

  // Loading State
  if (loading && cards.length === 0) {
    return (
      <div className="sc__container">
        <motion.div 
          className="sc__loadingState"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="sc__loadingSpinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FontAwesomeIcon icon={faHandSparkles} size="2x" />
          </motion.div>
          <p className="sc__loadingText">Finding amazing events for you...</p>
        </motion.div>
      </div>
    );
  }

  // Done State
  if (isDone) {
    return (
      <div className="sc__container">
        <motion.div 
          className="sc__doneState"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <motion.div 
            className="sc__doneIcon"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 0.6 }}
          >
            <FontAwesomeIcon icon={faHandSparkles} size="3x" />
          </motion.div>
          <h2 className="sc__doneTitle">All caught up!</h2>
          <p className="sc__doneSubtitle">You've discovered {cards.length} amazing events</p>
          <motion.button
            className="sc__startOverBtn"
            onClick={handleStartOver}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
            Start over
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="sc__wrapper">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            className="sc__confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="sc__confettiPiece"
                initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 200,
                  y: -100 - Math.random() * 100,
                  scale: 1,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="sc__successMessage"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <FontAwesomeIcon icon={faHeart} beat style={{ marginRight: '10px' }} />
            Saved to favorites!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="sc__header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="sc__title">
            Discover
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ display: 'inline-block', marginLeft: '8px' }}
            >
              <FontAwesomeIcon icon={faHandSparkles} />
            </motion.span>
            <br />Events
          </h2>
          <p className="sc__subtitle">Swipe right to save, left to skip</p>
        </div>
        <motion.span 
          className="sc__counter"
          whileHover={{ scale: 1.05 }}
        >
          <FontAwesomeIcon icon={faStar} style={{ marginRight: '6px' }} />
          {currentIndex + 1} / {cards.length}
        </motion.span>
      </motion.div>

      {/* Card Stack */}
      <div className="sc__stack">
        {/* Ghost Cards */}
        {cards.slice(currentIndex + 1, currentIndex + CARD_STACK_DEPTH + 1).map((_, idx) => (
          <motion.div
            key={`ghost-${idx}`}
            className={`sc__ghost sc__ghost--${idx === 0 ? 'mid' : 'back'}`}
            initial={{ scale: 0.95 - idx * 0.03, y: idx * 8 }}
            animate={{ scale: 0.95 - idx * 0.03, y: idx * 8 }}
            style={{ zIndex: cards.length - idx }}
          />
        ))}

        {/* Active Card */}
        <AnimatePresence>
          {cards.slice(currentIndex, currentIndex + 1).map((card, idx) => (
            <SwipeCard
              key={card._id}
              card={card}
              index={idx}
              totalCards={cards.length}
              onSwipe={handleSwipe}
              onCardClick={handleCardClick}
              onAddToCart={handleAddToCart}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <motion.div 
        className="sc__actionButtons"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.button
          className="sc__actionBtn sc__actionBtn--skip"
          onClick={() => handleSwipe('left', currentCard)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            boxShadow: ['0px 0px 0px rgba(239, 68, 68, 0)', '0px 0px 15px rgba(239, 68, 68, 0.5)', '0px 0px 0px rgba(239, 68, 68, 0)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
          <span className="sc__btnLabel">Skip</span>
        </motion.button>

        <motion.button
          className="sc__actionBtn sc__actionBtn--view"
          onClick={() => handleCardClick(currentCard?._id)}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <FontAwesomeIcon icon={faEye} size="lg" />
          <span className="sc__btnLabel">View</span>
        </motion.button>

        <motion.button
          className={`sc__actionBtn sc__actionBtn--ticket ${!isAuthenticated ? 'sc__actionBtn--disabled' : ''}`}
          onClick={() => {
            console.log('Buy clicked', { currentCard, isAuthenticated, token });
            handleAddToCart(currentCard);
          }}
          whileHover={{ scale: isAuthenticated ? 1.1 : 1 }}
          whileTap={{ scale: isAuthenticated ? 0.9 : 1 }}
        >
          <FontAwesomeIcon icon={faTicket} size="lg" />
          <span className="sc__btnLabel">Buy</span>
        </motion.button>

        <motion.button
          className="sc__actionBtn sc__actionBtn--save"
          onClick={() => handleSwipe('right', currentCard)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            boxShadow: ['0px 0px 0px rgba(16, 185, 129, 0)', '0px 0px 15px rgba(16, 185, 129, 0.5)', '0px 0px 0px rgba(16, 185, 129, 0)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FontAwesomeIcon icon={faHeart} size="lg" />
          <span className="sc__btnLabel">Save</span>
        </motion.button>
      </motion.div>

      {/* Progress Bar */}
      <div className="sc__progressSection">
        <div className="sc__progressBar" role="progressbar">
          <motion.div 
            className="sc__progressFill" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="sc__progressStats">
          <span>{Math.round(progress)}% complete</span>
          <span>{cards.length - currentIndex} remaining</span>
        </div>
      </div>

      {/* Swipe Hint */}
      <motion.div 
        className="sc__swipeHint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.span
          animate={{ x: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </motion.span>
        Swipe to discover
        <motion.span
          animate={{ x: [5, -5, 5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </motion.span>
      </motion.div>
    </div>
  );
};

export default SwipeCards;