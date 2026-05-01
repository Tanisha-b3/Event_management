import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingEvents } from '../store/slices/eventSlice';


import './TrendingEvents.css';

/* ── Icons using Font Awesome ────────────────────────────────── */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFire, 
  faEye, 
  faHeart, 
  faTicket, 
  faMapMarkerAlt, 
  faCalendarAlt, 
  faChartLine,
  faArrowUp,
  faStar,
  faCrown,
  faMedal,
  faBolt,
  faArrowTrendUp,
} from '@fortawesome/free-solid-svg-icons';
import { useCallback } from 'react';

/* ── Helpers ──────────────────────────────────────────────────── */
const formatCurrency = (amount) => {
  if (!amount) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.9 }
};


const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatCount = (n = 0) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ── Skeleton Component ───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="te__card te__card--skeleton" aria-hidden="true">
    <div className="te__imageWrap">
      <div className="te__skeleton te__skeleton--image" />
    </div>
    <div className="te__cardBody">
      <div className="te__skeleton te__skeleton--title" />
      <div className="te__skeleton te__skeleton--line" />
      <div className="te__skeleton te__skeleton--line te__skeleton--short" />
      <div className="te__cardFooter">
        <div className="te__skeleton te__skeleton--price" />
        <div className="te__skeleton te__skeleton--stats" />
      </div>
    </div>
  </div>
);

/* ── Rank medal colors ────────────────────────────────────────── */
const RANK_CLASS = ['te__rank--gold', 'te__rank--silver', 'te__rank--bronze'];
const RANK_ICONS = [faCrown, faMedal, faMedal];

/* ── Animated Card Component ──────────────────────────────────── */
const TrendingCard = ({ event, index, onCardClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
        delay: index * 0.1
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 400
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.1,
      rotate: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const rankVariants = {
    hidden: { x: -20, opacity: 0, rotate: -10 },
    visible: { 
      x: 0, 
      opacity: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        delay: index * 0.1 + 0.2
      }
    },
    hover: {
      scale: 1.05,
      x: 2,
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  const trendScoreVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${Math.min(event.trendScore || 0, 100)}%`,
      transition: {
        duration: 1,
        delay: index * 0.1 + 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.article
      className={`te__card ${index < 3 ? 'te__card--topRanked' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onCardClick(event._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(event._id)}
      aria-label={`View ${event.title}, currently ranked #${index + 1} trending`}
    >
      {/* Image Section */}
      <div className="te__imageWrap">
        {event.image ? (
          <motion.img
            src={event.image}
            alt={event.title}
            className="te__image"
            draggable={false}
            variants={imageVariants}
            whileHover="hover"
          />
        ) : (
          <motion.div 
            className="te__imageFallback" 
            aria-hidden="true"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            🎭
          </motion.div>
        )}

        {/* Rank Badge */}
        <motion.div 
          className={`te__rank ${RANK_CLASS[index] ?? ''}`}
          variants={rankVariants}
          whileHover="hover"
        >
          <FontAwesomeIcon 
            icon={RANK_ICONS[index] || faStar} 
            size="sm" 
            style={{ marginRight: '4px' }}
          />
          <span className="te__rankNumber">#{index + 1}</span>
          <span className="te__rankLabel">
            {index === 0 ? 'TRENDING' : index === 1 ? 'HOT' : index === 2 ? 'RISING' : ''}
          </span>
        </motion.div>

        {/* Category Chip */}
        {event.category && (
          <motion.span 
            className="te__catChip"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.15 }}
            whileHover={{ scale: 1.05, x: -3 }}
          >
            <FontAwesomeIcon icon={faStar} size="xs" style={{ marginRight: '4px' }} />
            {event.category}
          </motion.span>
        )}

        {/* Hot Badge for #1 */}
        {index === 0 && (
          <motion.span 
            className="te__hotBadge" 
            aria-label="Hottest event"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              delay: 0.3,
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ scale: 1.1 }}
          >
            <FontAwesomeIcon icon={faFire} beat style={{ marginRight: '6px' }} />
            #1 TRENDING
          </motion.span>
        )}

        {/* Trend Badges for #2 and #3 */}
        {index === 1 && (
          <motion.span 
            className="te__trendBadge te__trendBadge--hot"
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <FontAwesomeIcon icon={faBolt} style={{ marginRight: '4px' }} />
            HOT
          </motion.span>
        )}
        
        {index === 2 && (
          <motion.span 
            className="te__trendBadge te__trendBadge--rising"
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '4px' }} />
            RISING
          </motion.span>
        )}
      </div>

      {/* Card Body */}
      <motion.div 
        className="te__cardBody"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        <motion.h3 
          className="te__title"
          whileHover={{ x: 5 }}
        >
          {event.title}
        </motion.h3>

        <div className="te__meta">
          <motion.span 
            className="te__metaItem"
            whileHover={{ x: 3 }}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            {formatDate(event.date)}
          </motion.span>
          <motion.span 
            className="te__metaItem te__metaItem--location"
            whileHover={{ x: 3 }}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            {event.location}
          </motion.span>
        </div>

        {/* Trend Score Indicator */}
        {event.trendingScore && (
          <motion.div 
            className="te__trendScore" 
            title="Trending score based on engagement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.35 }}
          >
            <div className="te__trendScoreBar">
              <motion.div 
                className="te__trendScoreFill"
                variants={trendScoreVariants}
                initial="hidden"
                animate="visible"
              />
            </div>
            <motion.span 
              className="te__trendScoreValue"
              whileHover={{ x: 2 }}
            >
              <FontAwesomeIcon icon={faChartLine} />
              {event.trendingScore}% trend intensity
            </motion.span>
          </motion.div>
        )}

        <div className="te__cardFooter">
          <motion.span 
            className={`te__price${!event.ticketPrice ? ' te__price--free' : ''}`}
            whileHover={{ scale: 1.05 }}
          >
            {formatCurrency(event.ticketPrice)}
          </motion.span>

          <div className="te__stats">
            <motion.span 
              className="te__stat te__stat--views" 
              title="Total views"
              whileHover={{ y: -2, scale: 1.1 }}
            >
              <FontAwesomeIcon icon={faEye} />
              {formatCount(event.views)}
            </motion.span>
            <motion.span 
              className="te__stat te__stat--likes" 
              title="Total likes"
              whileHover={{ y: -2, scale: 1.1 }}
            >
              <FontAwesomeIcon icon={faHeart} />
              {formatCount(event.likes)}
            </motion.span>
            <motion.span 
              className="te__stat te__stat--tickets" 
              title="Tickets sold"
              whileHover={{ y: -2, scale: 1.1 }}
            >
              <FontAwesomeIcon icon={faTicket} />
              {formatCount(event.bookings || event.ticketsSold)}
            </motion.span>
          </div>
        </div>

        {/* Engagement Rate for Top 3 */}
        {index < 3 && event.engagementRate && (
          <motion.div 
            className="te__engagement" 
            title="Higher than average engagement"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.45 }}
          >
            <motion.span 
              className="te__engagementBadge"
              whileHover={{ scale: 1.05 }}
            >
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: '4px' }} />
              {event.engagementRate}% above avg
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </motion.article>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const TrendingEvents = ({ limit = 10 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trendingEvents, loading, error } = useSelector((state) => state.events);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeTrendingEvents = useMemo(() => {
    return (trendingEvents || []).filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    });
  }, [trendingEvents, now]);

  useEffect(() => {
    dispatch(fetchTrendingEvents());
  }, [dispatch]);

  const handleCardClick = useCallback((eventId) => {
    navigate(`/event/${eventId}`);
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  return (
    <motion.section
      className="te__section"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="te__header">
        <FontAwesomeIcon icon={faArrowTrendUp} />
        <h2 className="te__heading">
          Trending Events
          <span className="te__headingSubtext">
            <FontAwesomeIcon icon={faFire} style={{ marginRight: "4px" }} />
            Most popular right now
          </span>
        </h2>
      </motion.div>

      {/* Trend Banner */}
      <motion.div className="te__trendBanner">
        <FontAwesomeIcon icon={faChartLine} />
        <span>Ranked by real-time engagement • Views • Likes • Ticket sales</span>
      </motion.div>

      {/* Main Content */}
      <div className="te__grid">
        {loading && (
          <>
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </>
        )}

        {error && (
          <div className="te__error">Failed to load events. Please try again later.</div>
        )}

        {!loading && !error && activeTrendingEvents?.length === 0 && (
          <div className="te__empty">No trending events yet</div>
        )}

        {!loading && !error && activeTrendingEvents?.length > 0 && (
          activeTrendingEvents.slice(0, limit).map((event, index) => (
            <TrendingCard
              key={event._id}
              event={event}
              index={index}
              onCardClick={handleCardClick}
            />
          ))
        )}
      </div>

      {/* Ranking Note */}
      <motion.div className="te__rankingNote">
        <FontAwesomeIcon icon={faArrowTrendUp} />
        <span>These events are ranked by an algorithm considering views, likes, shares, and ticket sales velocity</span>
      </motion.div>
    </motion.section>
  );
};



export default TrendingEvents;