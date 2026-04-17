import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaSearch, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaArrowRight,
  FaArrowLeft,
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
  FaCalendarWeek,
  FaStar,
  FaFire,
  FaClock,
  FaInfoCircle
} from 'react-icons/fa';
import { EVENT_CATEGORIES } from './constants';
import { fetchEvents, setFilters, clearFilters } from '../store/slices/eventSlice';
import './discoverEvents.css';
import fallbackImage from "../assets/image4.jpg";
import CustomDropdown from './customDropdown';

// Enhanced Lazy Image Component with Intersection Observer
const LazyImage = ({ src, alt, className, priority = false }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, priority]);

  return (
    <div ref={imgRef} className="lazy-image-container">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${className || ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => { e.target.src = fallbackImage; }}
          loading={priority ? "eager" : "lazy"}
        />
      )}
      {!isLoaded && imageSrc && (
        <div className="image-placeholder">
          <FaSpinner className="spinner-icon animate-spin" />
        </div>
      )}
    </div>
  );
};

// Enhanced Event Card Skeleton
const EventCardSkeleton = () => (
  <div className="event-card skeleton">
    <div className="skeleton-image"></div>
    <div className="event-content">
      <div className="skeleton-title"></div>
      <div className="skeleton-description"></div>
      <div className="skeleton-meta">
        <div className="skeleton-meta-item"></div>
        <div className="skeleton-meta-item"></div>
      </div>
      <div className="skeleton-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Event Card Component
const EventCard = React.memo(({ event, onViewDetails, formatDate, formatCurrency, getAttendancePercentage }) => {
  const imageUrl = event.imageName
    ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${event.imageName}`
    : event.image || fallbackImage;

  const isHotEvent = (event.attendees / event.capacity) > 0.8;
  const isAlmostSoldOut = (event.capacity - event.attendees) < 20;
  const isFree = event.ticketPrice === 0;

  return (
    <div className="event-card group">
      <div className="event-image-container">
        <LazyImage src={imageUrl} alt={event.title} className="event-image-k" />
        
        <span className={`event-status-k ${event.status}`}>
          {event.status}
        </span>
        
        <div className="event-category-badge">
          <FaTag /> {event.category}
        </div>
        
        {isFree && (
          <div className="event-free-badge animate-pulse">
            FREE
          </div>
        )}
        
        {isHotEvent && (
          <div className="event-hot-badge">
            <FaFire /> HOT
          </div>
        )}
        
        {isAlmostSoldOut && !isFree && (
          <div className="event-soldout-badge">
            Almost Sold Out!
          </div>
        )}
      </div>

      <div className="event-content">
        <h3>{event.title}</h3>
        <p className="event-description">{event.description?.substring(0, 100)}...</p>
        
        <div className="event-meta">
          <div className="meta-item" title="Event Date">
            <FaCalendarAlt /> {formatDate(event.date)}
          </div>
          <div className="meta-item" title="Location">
            <FaMapMarkerAlt /> {event.location}
          </div>
        </div>

        <div className="event-stats">
          <div className="stat-item">
            <FaUsers /> {event.attendees || 0}/{event.capacity || 100} attendees
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${getAttendancePercentage(event.attendees || 0, event.capacity || 100)}%` }}
              />
            </div>
          </div>
          
          <div className="stat-item">
            <FaTicketAlt /> {event.ticketsSold || event.attendees || 0} tickets sold
          </div>
          
          <div className="stat-item price">
            <FaDollarSign /> 
            <span className={isFree ? 'free-price' : 'regular-price'}>
              {isFree ? 'FREE' : formatCurrency(event.ticketPrice || 0)}
            </span>
          </div>
        </div>

        <button 
          className="view-details-btn"
          onClick={() => onViewDetails(event._id || event.id)}
        >
          View Details <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
});

const Discover = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Redux state
  const { 
    events: reduxEvents, 
    loading: eventsLoading, 
    error: eventsError,
    filters: reduxFilters,
    pagination
  } = useSelector((state) => state.events);
  
  // Local State Management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(reduxFilters.category || 'all');
  const [locationFilter, setLocationFilter] = useState(reduxFilters.location || '');
  const [sortBy, setSortBy] = useState('date');
  const [priceRange, setPriceRange] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(12);

  // Debounced filters for client-side filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('');

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Technology': '💻',
      'Music': '🎵',
      'Food': '🍔',
      'Business': '💼',
      'Holiday': '🎉',
      'Sports': '⚽',
      'Conference': '🎤',
      'Workshop': '🔧',
      'Meetup': '👥',
      'Festival': '🎪',
      'Entertainment': '🎬',
      'Education': '📚',
      'Art': '🎨',
      'Health': '🏥',
      'Gaming': '🎮',
      'Literature': '📖',
      'Fundraiser': '🤝'
    };
    return icons[category] || '📌';
  };

  // Options Configuration
  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    ...EVENT_CATEGORIES.map(category => ({
      value: category.toLowerCase(),
      label: category,
      icon: getCategoryIcon(category)
    }))
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
    { value: 36, label: '36 per page', icon: '🔢' },
    { value: 48, label: '48 per page', icon: '🔢' }
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'All Prices', icon: '💰' },
    { value: 'free', label: 'Free Events', icon: '🎁', badge: 'Best Deal' },
    { value: 'under_25', label: 'Under $25', icon: '💵' },
    { value: '25_50', label: '$25 - $50', icon: '💵' },
    { value: '50_100', label: '$50 - $100', icon: '💵' },
    { value: 'over_100', label: 'Over $100', icon: '💎' }
  ];

  // Helper Functions
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAttendancePercentage = (attendees, capacity) => {
    return Math.min(Math.round((attendees / capacity) * 100), 100);
  };

  // Fetch events from Redux when filters change
  useEffect(() => {
    const fetchEventsData = async () => {
      // Build filter object for backend
      const filterParams = {
        page: currentPage,
        limit: eventsPerPage,
        location: debouncedLocationFilter,
      };
      
      // Remove empty values
      Object.keys(filterParams).forEach(key => {
        if (!filterParams[key]) delete filterParams[key];
      });
      
      // Update Redux filters
      dispatch(setFilters({
        category: selectedCategory,
        location: locationFilter,
        search: searchTerm
      }));
      
      // Fetch events using Redux thunk
      await dispatch(fetchEvents(filterParams));
    };
    
    fetchEventsData();
  }, [dispatch, currentPage, eventsPerPage, selectedCategory, debouncedSearchTerm, debouncedLocationFilter]);

  // Sync URL params with Redux state
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    else params.delete('category');
    if (locationFilter) params.set('location', locationFilter);
    else params.delete('location');
    setSearchParams(params);
  }, [searchTerm, selectedCategory, locationFilter, setSearchParams]);

  // Debounce search and location filters
  useEffect(() => {
    const searchTimer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    const locationTimer = setTimeout(() => setDebouncedLocationFilter(locationFilter), 300);
    return () => {
      clearTimeout(searchTimer);
      clearTimeout(locationTimer);
    };
  }, [searchTerm, locationFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, debouncedLocationFilter, selectedCategory, priceRange, sortBy, eventsPerPage]);

  // Filter and Sort Events (client-side filtering on fetched events)
  const filteredEvents = useMemo(() => {
    let filtered = [...reduxEvents];
    
    // Filter by search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower) ||
        event.category?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
     if (selectedCategory && selectedCategory !== 'all') {
    filtered = filtered.filter(event => {
      const eventCategory = event.category?.toLowerCase();
      const selectedCatLower = selectedCategory.toLowerCase();
      return eventCategory === selectedCatLower;
    });
  }
    
    // Filter by location
    if (debouncedLocationFilter) {
      const locationLower = debouncedLocationFilter.toLowerCase();
      filtered = filtered.filter(event => 
        event.location?.toLowerCase().includes(locationLower)
      );
    }
    
    // Client-side filtering for price range (since backend doesn't support it)
    if (priceRange !== 'all') {
      filtered = filtered.filter(event => {
        const price = event.ticketPrice || 0;
        switch(priceRange) {
          case 'free': return price === 0;
          case 'under_25': return price > 0 && price < 25;
          case '25_50': return price >= 25 && price <= 50;
          case '50_100': return price > 50 && price <= 100;
          case 'over_100': return price > 100;
          default: return true;
        }
      });
    }
    
    // Client-side sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
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

  // Get unique locations from Redux events
  const uniqueLocations = useMemo(
    () => [...new Set(reduxEvents.map(event => event.location).filter(Boolean))],
    [reduxEvents]
  );

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('date');
    setSearchTerm('');
    setLocationFilter('');
    setCurrentPage(1);
    dispatch(clearFilters());
  };

  // Pagination handlers
  const goToPage = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const totalPages = pagination?.pages || 1;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Calculate displayed range
  const indexOfFirstEvent = (currentPage - 1) * eventsPerPage + 1;
  const indexOfLastEvent = Math.min(currentPage * eventsPerPage, pagination?.total || 0);

  // Check if any filters are active
  const hasActiveFilters = selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'date' || searchTerm || locationFilter;

  // Get current events for display
  const displayedEvents = Array.isArray(filteredEvents) ? filteredEvents : [];

  // Loading state
  const isLoading = eventsLoading && reduxEvents.length === 0;

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1 className="gradient-text">Discover Amazing Events</h1>
        <p>Find and book tickets for the best events in your city</p>
      </div>

      {/* Search Bar */}
      {/* <div className="search-bar-container">
        <div className="search-input-wrapper-large">
          <FaSearch className="search-icon-large" />
          <input
            type="text"
            placeholder="Search events by title, category, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-large"
          />
          {searchTerm && (
            <button className="clear-search-btn-large" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>
      </div> */}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <div className="filters-title">
            <FaFilter /> Filter Events
          </div>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              <FaTimes /> Clear All Filters
            </button>
          )}
        </div>

        <div className="filters-grid">
          <CustomDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Select Category"
            icon={<FaTag />}
            className="filter-dropdown"
            withIcons={true}
          />

          <CustomDropdown
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Sort By"
            icon={<FaSortAmountDown />}
            className="filter-dropdown"
            withIcons={true}
          />

          <CustomDropdown
            options={priceRangeOptions}
            value={priceRange}
            onChange={setPriceRange}
            placeholder="Price Range"
            icon={<FaDollarSign />}
            className="filter-dropdown"
            withIcons={true}
          />

          <div className="location-filter-wrapper">
  <CustomDropdown
    options={uniqueLocations.map((location) => ({
      label: location,
      value: location,
    }))}
    value={locationFilter}
    onChange={(value) => {
      setLocationFilter(value);
      setCurrentPage(1);
    }}
    placeholder="Filter by location..."
    className="location-dropdown"
  />

  {locationFilter && (
    <button
      className="clear-location-filter"
      onClick={() => setLocationFilter('')}
    >
      <FaTimes />
    </button>
  )}
</div>


          <CustomDropdown
            options={perPageOptions}
            value={eventsPerPage}
            onChange={(value) => {
              setEventsPerPage(value);
              setCurrentPage(1);
            }}
            placeholder="Items per page"
            className="filter-dropdown-k"
          />
        </div>
      </div>

      {/* Results Info */}
      {!isLoading && pagination?.total > 0 && (
        <div className="results-info-bar">
          <div className="results-count">
            <FaInfoCircle /> 
            Showing {indexOfFirstEvent} - {indexOfLastEvent} of {pagination.total} events
          </div>
          <div className="results-badge">
            {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* Error Message */}
      {eventsError && (
        <div className="error-message">
          <FaInfoCircle />
          <span>{eventsError}</span>
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className={`events-${viewMode}-k`}>
          {Array(eventsPerPage).fill().map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      ) : displayedEvents.length > 0 ? (
        <>
          <div className={`events-${viewMode}-k`}>
            {displayedEvents.map((event) => (
              <EventCard
                key={event._id || event.id}
                event={event}
                onViewDetails={(id) => navigate(`/event/${id}`)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getAttendancePercentage={getAttendancePercentage}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination?.pages > 1 && (
            <div className="pagination-container">
              <div className="pagination-controls">
                <button 
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-nav-btn"
                >
                  <FaChevronLeft /> Previous
                </button>
                
                <div className="pagination-pages">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && goToPage(page)}
                      className={`pagination-page-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === (pagination?.pages || 1)}
                  className="pagination-nav-btn"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No events found</h3>
          <p>We couldn't find any events matching your criteria</p>
          <button className="empty-state-btn" onClick={clearAllFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Discover;