import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaArrowLeft, FaSearch, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaSortAmountDown } from 'react-icons/fa';
import { fetchEvents } from '../store/slices/eventSlice';
import { EVENT_CATEGORIES } from './constants';
import './SearchResults.css';

function SearchResults() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, loading } = useSelector((state) => state.events);
  
  // Dark mode detection
  const { mode: reduxMode } = useSelector((state) => state.theme);
  const isDark = reduxMode === 'dark' || localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    dispatch(fetchEvents({ search: searchTerm, category: category !== 'all' ? category : '' }));
  }, [dispatch, searchTerm, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm, category, location });
  };

  const filteredEvents = events.filter(event => {
    const matchesLocation = !location || event.location?.toLowerCase().includes(location.toLowerCase());
    return matchesLocation;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.date) - new Date(b.date);
      case 'date_desc':
        return new Date(b.date) - new Date(a.date);
      case 'price_low':
        return (a.ticketPrice || 0) - (b.ticketPrice || 0);
      case 'price_high':
        return (b.ticketPrice || 0) - (a.ticketPrice || 0);
      default:
        return 0;
    }
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="search-results-container">
      <div className="max-w-6xl mx-auto">
        <div className="search-results-header">
          <button 
            onClick={() => navigate(-1)}
            className="search-back-button"
          >
            <FaArrowLeft className="text-sm" />
            <span>Back</span>
          </button>
          <h1 className="search-title">
            Search Results
          </h1>
        </div>

        <div className="search-card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="search-input-wrapper flex-1">
                <FaSearch className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search events, venues, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="search-filter-button"
              >
                <FaFilter />
                Filters
              </button>
              <button 
                type="submit"
                className="search-button"
              >
                Search
              </button>
            </div>

            {showFilters && (
              <div className="filters-section">
                <div className="filter-row">
                  <div>
                    <label className="filter-label">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Categories</option>
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="filter-label">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="City or venue"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="filter-select"
                      style={{ padding: '0.625rem 1rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="filter-label">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date_asc">Date (Earliest)</option>
                      <option value="date_desc">Date (Latest)</option>
                      <option value="price_low">Price (Low to High)</option>
                      <option value="price_high">Price (High to Low)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="results-count">
            {sortedEvents.length} results found
            {searchTerm && <span> for "<strong>{searchTerm}</strong>"</span>}
          </p>
        </div>

        {loading ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="no-results">
            <FaSearch className="no-results-icon" />
            <h3>
              No events found
            </h3>
            <p>
              Try adjusting your search or filters
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setCategory('all'); setLocation(''); }}
              className="browse-button"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {sortedEvents.map((event) => (
              <div 
                key={event._id}
                onClick={() => navigate(`/event/${event._id}`)}
                className="event-result-card"
              >
                <div className="event-image-container">
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', opacity: 0.5, fontSize: '3rem' }}>📅</span>
                  </div>
                  {/* <span className="event-category-badge">
                    {event.category}
                  </span> */}
                </div>
                <div className="event-content">
                  <h3 className="event-title">
                    {event.title}
                  </h3>
                  <div className="event-meta">
                    <p className="event-meta-item">
                      <FaCalendarAlt />
                      {formatDate(event.date)}
                    </p>
                    <p className="event-meta-item">
                      <FaMapMarkerAlt />
                      {event.location || 'Location TBD'}
                    </p>
                  </div>
                  <div className="event-footer">
                    <span className="event-price">
                      {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
                    </span>
                    <span className="event-view-btn">
                      View Details
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;