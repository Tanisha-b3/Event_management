import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaArrowRight,
  FaUsers,
  FaTicketAlt,
  FaDollarSign,
  FaTag,
  FaTimes
} from 'react-icons/fa';
import { EVENT_CATEGORIES, getEvents as fetchEvents } from './constants';
import './discoverEvents.css';
import Footer from '../pages/footer.jsx';
import Header from '../pages/header.jsx';
const Discover = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
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

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      const loaded = await fetchEvents();
      setEvents(loaded);
      setIsLoading(false);
    };

    loadEvents();
  }, []);

  // Get unique locations for suggestions
  const uniqueLocations = useMemo(
    () => [...new Set(events.map(event => event.location).filter(Boolean))],
    [events]
  );

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = 
      locationFilter === '' ||
      event.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || event.category === selectedCategory;
    
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const getAttendancePercentage = (attendees, capacity) => {
    return Math.min(Math.round((attendees / capacity) * 100), 100);
  };

  const clearLocationFilter = () => {
    setLocationFilter('');
  };

  return (
    <>
      <Header />
      <div className="discover-container">
        <div className="discover-header">
          <h1>Discover Events</h1>
          <p>Find your next unforgettable experience</p>
        </div>

        <div className="discover-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="location-filter-container">
            <div className="location-input-wrapper">
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="search-input"
                list="location-suggestions"
              />
              {locationFilter && (
                <button className="clear-location-btn" onClick={clearLocationFilter}>
                  <FaTimes />
                </button>
              )}
            </div>
            <datalist id="location-suggestions">
              {uniqueLocations.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>

          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="All">All Categories</option>
              {EVENT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <div className="event-card" key={event._id || event.id}>
                <div 
                  className="event-image-container"
                  style={{ backgroundImage: `url(${event.image})`}}
                >
                  <span className={`event-status ${event.status}`}>
                    {event.status}
                  </span>
                  <div className="event-category-badge">
                    <FaTag /> {event.category}
                  </div>
                </div>

                <div className="event-content">
                  <h3>{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-meta">
                    <div className="meta-item">
                      <FaCalendarAlt /> {formatDate(event.date)}
                    </div>
                    <div className="meta-item">
                      <FaMapMarkerAlt /> {event.location}
                    </div>
                  </div>

                  <div className="event-stats">
                    <div className="stat-item">
                      <FaUsers /> {event.attendees}/{event.capacity} ({getAttendancePercentage(event.attendees, event.capacity)}%)
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getAttendancePercentage(event.attendees, event.capacity)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FaTicketAlt /> {event.ticketsSold} tickets sold
                    </div>
                    <div className="stat-item">
                      <FaDollarSign /> {formatCurrency(event.revenue)}
                    </div>
                  </div>

                  <button 
                    className="view-details-btn"
                    onClick={() =>  navigate(`/event/${event._id || event.id}`)}
                  >
                    View Details <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-events-found">
            <h3>No events match your search criteria</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Discover;
