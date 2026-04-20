import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  FaSearch,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaUsers,
  FaTicketAlt,
  FaDollarSign,
  FaTag,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaFilter,
  FaSortAmountDown,
  FaStar,
  FaFire,
  FaInfoCircle,
  FaBolt,
  FaGlobe,
  FaCompass,
  FaEdit
} from 'react-icons/fa';
import { EVENT_CATEGORIES } from './constants';
import { fetchEvents, setFilters, clearFilters } from '../store/slices/eventSlice';
import { getUserRole } from '../utils/auth';
import './discoverEvents.css';
import fallbackImage from "../assets/image4.jpg";
import CustomDropdown from './customDropdown';

// ─── Animation Variants ──────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const headerVariants = {
  initial: { opacity: 0, y: -40 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  },
};

const filterVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.15 }
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0, y: -20, scale: 0.96,
    transition: { duration: 0.25 }
  },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const badgeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

const skeletonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const skeletonItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
};

// ─── Lazy Image ───────────────────────────────────────────────────────────────

const LazyImage = ({ src, alt, className, priority = false }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) { setImageSrc(src); return; }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setImageSrc(src); observer.unobserve(e.target); } }),
      { rootMargin: '120px', threshold: 0.01 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => { if (imgRef.current) observer.unobserve(imgRef.current); };
  }, [src, priority]);

  return (
    <div ref={imgRef} className="lazy-image-container">
      <AnimatePresence>
        {!isLoaded && imageSrc && (
          <motion.div
            className="image-placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <FaSpinner className="spinner-icon" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {imageSrc && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${className || ''}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => { e.target.src = fallbackImage; setIsLoaded(true); }}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const EventCardSkeleton = () => (
  <motion.div
    className="event-card skeleton"
    variants={skeletonItemVariants}
    layout
  >
    <div className="skeleton-image" />
    <div className="event-content">
      <div className="skeleton-title" />
      <div className="skeleton-description" />
      <div className="skeleton-meta">
        <div className="skeleton-meta-item" />
        <div className="skeleton-meta-item" />
      </div>
      <div className="skeleton-stats">
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
      </div>
      <div className="skeleton-button" />
    </div>
  </motion.div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const AnimatedProgressBar = ({ percentage }) => (
  <div className="progress-bar">
    <motion.div
      className="progress-fill"
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    />
  </div>
);

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = React.memo(({ event, onViewDetails, onEdit, formatDate, formatCurrency, getAttendancePercentage, index }) => {
  const [hovered, setHovered] = useState(false);
  const isAdmin = getUserRole() === 'admin';

  const imageUrl = event.imageName
    ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${event.imageName}`
    : event.image || fallbackImage;

  const attendancePct = getAttendancePercentage(event.attendees || 0, event.capacity || 100);
  const isHotEvent = attendancePct > 80;
  const isAlmostSoldOut = (event.capacity - event.attendees) < 20;
  const isFree = event.ticketPrice === 0;

  return (
    <motion.div
      className="event-card"
      variants={cardVariants}
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className="event-image-container">
        <LazyImage src={imageUrl} alt={event.title} className="event-image-k" priority={index < 3} />

        {/* Overlay gradient on hover */}
        <motion.div
          className="card-overlay-gradient"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <motion.span
          className={`event-status-k ${event.status}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {event.status}
        </motion.span>

        <motion.div className="event-category-badge" variants={badgeVariants}>
          <FaTag /> {event.category}
        </motion.div>

        <AnimatePresence>
          {isFree && (
            <motion.div
              className="event-free-badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              exit={{ scale: 0, opacity: 0 }}
            >
              FREE
            </motion.div>
          )}
          {isHotEvent && (
            <motion.div
              className="event-hot-badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <FaFire />
              </motion.span>
              HOT
            </motion.div>
          )}
          {isAlmostSoldOut && !isFree && (
            <motion.div
              className="event-soldout-badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
            >
              Almost Sold Out!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="event-content">
        <h3>{event.title}</h3>
        <p className="event-description">{event.description?.substring(0, 100)}...</p>

        <div className="event-meta">
          <motion.div className="meta-item" whileHover={{ x: 3 }} title="Event Date">
            <FaCalendarAlt /> {formatDate(event.date)}
          </motion.div>
          <motion.div className="meta-item" whileHover={{ x: 3 }} title="Location">
            <FaMapMarkerAlt /> {event.location}
          </motion.div>
        </div>

        <div className="event-stats">
          <div className="stat-item">
            <span className="stat-label"><FaUsers /> {event.attendees || 0}/{event.capacity || 100} attendees</span>
            <AnimatedProgressBar percentage={attendancePct} />
          </div>
          <div className="stat-item">
            <FaTicketAlt /> {event.ticketsSold || event.attendees || 0} tickets sold
          </div>
          <div className="stat-item price">
            <FaDollarSign />
            <motion.span
              className={isFree ? 'free-price' : 'regular-price'}
              animate={isFree ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isFree ? 'FREE' : formatCurrency(event.ticketPrice || 0)}
            </motion.span>
          </div>
        </div>

        <motion.button
          className="view-details-btn"
          onClick={() => onViewDetails(event._id || event.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          View Details
          <motion.span
            animate={hovered ? { x: 5 } : { x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <FaArrowRight />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
});

// ─── Floating Orb Background ──────────────────────────────────────────────────

const FloatingOrbs = () => (
  <div className="floating-orbs" aria-hidden="true">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className={`orb orb-${i + 1}`}
        animate={{
          x: [0, 30, -20, 10, 0],
          y: [0, -25, 15, -10, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 12 + i * 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 2,
        }}
      />
    ))}
  </div>
);

// ─── Active Filter Chip ───────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }) => (
  <motion.span
    className="filter-chip"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    layout
  >
    {label}
    <motion.button
      onClick={onRemove}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      className="chip-close"
    >
      <FaTimes />
    </motion.button>
  </motion.span>
);

// ─── Pagination Button ────────────────────────────────────────────────────────

const PaginationBtn = ({ onClick, disabled, active, children, isDots }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled || isDots}
    className={`pagination-page-btn ${active ? 'active' : ''} ${isDots ? 'dots' : ''}`}
    whileHover={!disabled && !isDots ? { scale: 1.1 } : {}}
    whileTap={!disabled && !isDots ? { scale: 0.92 } : {}}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    {children}
  </motion.button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Discover = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { events: reduxEvents, loading: eventsLoading, error: eventsError, filters: reduxFilters, pagination } =
    useSelector((state) => state.events);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState(reduxFilters.location || '');
  const [sortBy, setSortBy] = useState('date');
  const [priceRange, setPriceRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(12);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const getCategoryIcon = (category) => {
    const icons = {
      'Technology': '💻', 'Music': '🎵', 'Food': '🍔', 'Business': '💼',
      'Holiday': '🎉', 'Sports': '⚽', 'Conference': '🎤', 'Workshop': '🔧',
      'Meetup': '👥', 'Festival': '🎪', 'Entertainment': '🎬', 'Education': '📚',
      'Art': '🎨', 'Health': '🏥', 'Gaming': '🎮', 'Literature': '📖', 'Fundraiser': '🤝'
    };
    return icons[category] || '📌';
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    ...EVENT_CATEGORIES.map(c => ({ value: c.toLowerCase(), label: c, icon: getCategoryIcon(c) }))
  ];

  const sortOptions = [
    { value: 'date', label: 'Date: Nearest First', icon: '📅', badge: 'Recommended' },
    { value: 'date_desc', label: 'Date: Farthest First', icon: '📅' },
    { value: 'price_asc', label: 'Price: Low to High', icon: '💰' },
    { value: 'price_desc', label: 'Price: High to Low', icon: '💰' },
    { value: 'popularity', label: 'Most Popular', icon: '🔥', badge: 'Trending' },
    { value: 'name_asc', label: 'Name: A to Z', icon: '📝' },
    { value: 'name_desc', label: 'Name: Z to A', icon: '📝' }
  ];

  const perPageOptions = [
    { value: 6, label: '6 per page', icon: '🔢' },
    { value: 9, label: '9 per page', icon: '🔢' },
    { value: 12, label: '12 per page', icon: '🔢', badge: 'Recommended' },
    { value: 18, label: '18 per page', icon: '🔢' },
    { value: 24, label: '24 per page', icon: '🔢' },
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'All Prices', icon: '💰' },
    { value: 'free', label: 'Free Events', icon: '🎁', badge: 'Best Deal' },
    { value: 'under_25', label: 'Under $25', icon: '💵' },
    { value: '25_50', label: '$25 - $50', icon: '💵' },
    { value: '50_100', label: '$50 - $100', icon: '💵' },
    { value: 'over_100', label: 'Over $100', icon: '💎' }
  ];

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const getAttendancePercentage = (attendees, capacity) =>
    Math.min(Math.round((attendees / capacity) * 100), 100);

  useEffect(() => {
    const filterParams = { page: currentPage, limit: eventsPerPage, location: debouncedLocationFilter };
    Object.keys(filterParams).forEach(k => { if (!filterParams[k]) delete filterParams[k]; });
    dispatch(setFilters({ category: selectedCategory, location: locationFilter, search: searchTerm }));
    dispatch(fetchEvents(filterParams));
  }, [dispatch, currentPage, eventsPerPage, selectedCategory, debouncedSearchTerm, debouncedLocationFilter]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) params.set('search', searchTerm); else params.delete('search');
    if (selectedCategory !== 'all') params.set('category', selectedCategory); else params.delete('category');
    if (locationFilter) params.set('location', locationFilter); else params.delete('location');
    setSearchParams(params);
  }, [searchTerm, selectedCategory, locationFilter]);

  useEffect(() => {
    const t1 = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    const t2 = setTimeout(() => setDebouncedLocationFilter(locationFilter), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [searchTerm, locationFilter]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, debouncedLocationFilter, selectedCategory, priceRange, sortBy, eventsPerPage]);

  const filteredEvents = useMemo(() => {
    let filtered = [...reduxEvents];
    if (debouncedSearchTerm) {
      const s = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s) ||
        e.location?.toLowerCase().includes(s) || e.category?.toLowerCase().includes(s)
      );
    }
    if (selectedCategory && selectedCategory !== 'all')
      filtered = filtered.filter(e => e.category?.toLowerCase() === selectedCategory.toLowerCase());
    if (debouncedLocationFilter)
      filtered = filtered.filter(e => e.location?.toLowerCase().includes(debouncedLocationFilter.toLowerCase()));
    if (priceRange !== 'all') {
      filtered = filtered.filter(e => {
        const p = e.ticketPrice || 0;
        if (priceRange === 'free') return p === 0;
        if (priceRange === 'under_25') return p > 0 && p < 25;
        if (priceRange === '25_50') return p >= 25 && p <= 50;
        if (priceRange === '50_100') return p > 50 && p <= 100;
        if (priceRange === 'over_100') return p > 100;
        return true;
      });
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(a.date) - new Date(b.date);
        case 'date_desc': return new Date(b.date) - new Date(a.date);
        case 'price_asc': return (a.ticketPrice || 0) - (b.ticketPrice || 0);
        case 'price_desc': return (b.ticketPrice || 0) - (a.ticketPrice || 0);
        case 'popularity': return (b.attendees || 0) - (a.attendees || 0);
        case 'name_asc': return (a.title || '').localeCompare(b.title || '');
        case 'name_desc': return (b.title || '').localeCompare(a.title || '');
        default: return 0;
      }
    });
    return filtered;
  }, [reduxEvents, debouncedSearchTerm, debouncedLocationFilter, selectedCategory, priceRange, sortBy]);

  const uniqueLocations = useMemo(
    () => [...new Set(reduxEvents.map(e => e.location).filter(Boolean))],
    [reduxEvents]
  );

  const clearAllFilters = () => {
    setSelectedCategory('all'); setPriceRange('all'); setSortBy('date');
    setSearchTerm(''); setLocationFilter(''); setCurrentPage(1);
    dispatch(clearFilters());
  };

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getPageNumbers = () => {
    const pages = [];
    const total = pagination?.pages || 1;
    if (total <= 5) { for (let i = 1; i <= total; i++) pages.push(i); }
    else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...'); pages.push(total); }
    else if (currentPage >= total - 2) { pages.push(1); pages.push('...'); for (let i = total - 3; i <= total; i++) pages.push(i); }
    else { pages.push(1); pages.push('...'); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push('...'); pages.push(total); }
    return pages;
  };

  const indexOfFirstEvent = (currentPage - 1) * eventsPerPage + 1;
  const indexOfLastEvent = Math.min(currentPage * eventsPerPage, pagination?.total || 0);
  const hasActiveFilters = selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'date' || searchTerm || locationFilter;
  const displayedEvents = Array.isArray(filteredEvents) ? filteredEvents : [];
  const isLoading = eventsLoading && reduxEvents.length === 0;

  return (
    <motion.div
      className="discover-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <FloatingOrbs />

      {/* ── Header ── */}
      <motion.div className="discover-header" variants={headerVariants}>
        <motion.div
          className="header-eyebrow"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FaCompass className="eyebrow-icon" />
          <span>Explore &amp; Discover</span>
        </motion.div>
        <motion.h1
          className="gradient-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Discover Amazing Events
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          Find and book tickets for the best events in your city
        </motion.p>

        {/* Search */}
        <motion.div
          className="search-bar-container"
          initial={{ opacity: 0, y: 15, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55 }}
        >
          <motion.div
            className={`search-input-wrapper-large ${searchFocused ? 'focused' : ''}`}
            animate={{ boxShadow: searchFocused ? '0 0 0 3px rgba(139, 92, 246, 0.25)' : '0 0 0 0px rgba(139,92,246,0)' }}
          >
            <motion.span
              animate={{ scale: searchFocused ? 1.15 : 1, color: searchFocused ? '#8b5cf6' : '#94a3b8' }}
            >
              <FaSearch className="search-icon-large" />
            </motion.span>
            <input
              type="text"
              placeholder="Search by title, category, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="search-input-large"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  className="clear-search-btn-large"
                  onClick={() => setSearchTerm('')}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div className="filters-section" variants={filterVariants}>
        <div className="filters-header">
          <div className="filters-title">
            <motion.span whileHover={{ rotate: 15 }} style={{ display: 'inline-block' }}>
              <FaFilter />
            </motion.span>
            Filter Events
          </div>
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                className="clear-filters-btn"
                onClick={clearAllFilters}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <FaTimes /> Clear All Filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="filters-grid">
          <CustomDropdown options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory}
            placeholder="Select Category" icon={<FaTag />} className="filter-dropdown" withIcons />
          <CustomDropdown options={sortOptions} value={sortBy} onChange={setSortBy}
            placeholder="Sort By" icon={<FaSortAmountDown />} className="filter-dropdown" withIcons />
          <CustomDropdown options={priceRangeOptions} value={priceRange} onChange={setPriceRange}
            placeholder="Price Range" icon={<FaDollarSign />} className="filter-dropdown" withIcons />
          <div className="location-filter-wrapper">
            <CustomDropdown
              options={uniqueLocations.map(l => ({ label: l, value: l }))}
              value={locationFilter}
              onChange={(v) => { setLocationFilter(v); setCurrentPage(1); }}
              placeholder="Filter by location…"
              className="location-dropdown"
            />
            <AnimatePresence>
              {locationFilter && (
                <motion.button
                  className="clear-location-filter"
                  onClick={() => setLocationFilter('')}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <CustomDropdown options={perPageOptions} value={eventsPerPage}
            onChange={(v) => { setEventsPerPage(v); setCurrentPage(1); }}
            placeholder="Items per page" className="filter-dropdown-k" />
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              className="active-filters-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {selectedCategory !== 'all' && <FilterChip label={`Category: ${selectedCategory}`} onRemove={() => setSelectedCategory('all')} />}
              {priceRange !== 'all' && <FilterChip label={`Price: ${priceRange}`} onRemove={() => setPriceRange('all')} />}
              {sortBy !== 'date' && <FilterChip label={`Sort: ${sortBy}`} onRemove={() => setSortBy('date')} />}
              {searchTerm && <FilterChip label={`Search: "${searchTerm}"`} onRemove={() => setSearchTerm('')} />}
              {locationFilter && <FilterChip label={`Location: ${locationFilter}`} onRemove={() => setLocationFilter('')} />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Results Info ── */}
      <AnimatePresence>
        {!isLoading && pagination?.total > 0 && (
          <motion.div
            className="results-info-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="results-count">
              <FaInfoCircle />
              Showing {indexOfFirstEvent}–{indexOfLastEvent} of {pagination.total} events
            </div>
            <motion.div
              className="results-badge"
              key={displayedEvents.length}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''} found
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      <AnimatePresence>
        {eventsError && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FaInfoCircle /><span>{eventsError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Events Grid ── */}
      {isLoading ? (
        <motion.div
          className="events-grid-k"
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
        >
          {Array(eventsPerPage).fill().map((_, i) => <EventCardSkeleton key={i} />)}
        </motion.div>
      ) : displayedEvents.length > 0 ? (
        <>
          <motion.div
            className="events-grid-k"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            key={`page-${currentPage}-${selectedCategory}-${sortBy}`}
          >
            <AnimatePresence mode="popLayout">
              {displayedEvents.map((event, i) => (
                <EventCard
                  key={event._id || event.id}
                  event={event}
                  index={i}
                  onViewDetails={(id) => navigate(`/event/${id}`)}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  getAttendancePercentage={getAttendancePercentage}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ── Pagination ── */}
          {pagination?.pages > 1 && (
            <motion.div
              className="pagination-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="pagination-controls">
                <motion.button
                  className="pagination-nav-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaChevronLeft /> Previous
                </motion.button>

                <div className="pagination-pages">
                  <AnimatePresence mode="popLayout">
                    {getPageNumbers().map((page, i) => (
                      <PaginationBtn
                        key={`${page}-${i}`}
                        onClick={() => typeof page === 'number' && goToPage(page)}
                        active={currentPage === page}
                        isDots={page === '...'}
                        disabled={page === '...'}
                      >
                        {page}
                      </PaginationBtn>
                    ))}
                  </AnimatePresence>
                </div>

                <motion.button
                  className="pagination-nav-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === (pagination?.pages || 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next <FaChevronRight />
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="empty-state-icon"
            animate={{ rotate: [0, -10, 10, -5, 5, 0], y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔍
          </motion.div>
          <h3>No events found</h3>
          <p>We couldn't find any events matching your criteria</p>
          <motion.button
            className="empty-state-btn"
            onClick={clearAllFilters}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Clear all filters
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Discover;