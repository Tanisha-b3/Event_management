import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTicketAlt,
  FaArrowLeft,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import CreateEvent from '../createEvent.jsx';
import CustomDropdown from '../customDropdown.jsx';
import './organizer.css';
import { apiClient } from '../../utils/api';
import { getUserRole } from '../../utils/auth';
import { toast } from 'react-toastify';
import image4 from '../../assets/image4.jpg';

// Lazy Image Component with Intersection Observer
const LazyImage = ({ src, alt, className, fallbackSrc }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const imgRef = useRef(null);

  useEffect(() => {
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

    const currentImg = imgRef.current;
    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setImageSrc(fallbackSrc || image4);
  };

  return (
    <div ref={imgRef} className="lazy-image-container">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${className || ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      {!isLoaded && imageSrc && (
        <div className="image-placeholder">
          <FaSpinner className="spinner-icon" />
        </div>
      )}
    </div>
  );
};

// Skeleton Loader for Event Cards
const EventCardSkeleton = () => (
  <div className="event-card skeleton">
    <div className="skeleton-image"></div>
    <div className="event-details">
      <div className="skeleton-title"></div>
      <div className="skeleton-meta">
        <div className="skeleton-meta-item"></div>
        <div className="skeleton-meta-item"></div>
      </div>
      <div className="skeleton-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
      <div className="skeleton-description"></div>
    </div>
    <div className="event-actions">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

const Organizer = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [currentEvent, setCurrentEvent] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const role = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('Organiser: Stored user:', user);
        return user?.role || 'booker';
      }
    } catch (e) {
      console.error('Error getting role:', e);
    }
    return 'booker';
  })();
  
  console.log('Organiser: Determined role:', role);

  useEffect(() => {
    if (role !== 'admin' && role !== 'organiser') {
      navigate('/');
    }
  }, [role, navigate]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load events from API with backend pagination
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { getEvents } = await import('../constants');
        const { events: evs, pagination: pag } = await getEvents(currentPage, eventsPerPage, true); // myEvents=true for organiser
        setEvents(evs);
        setPagination(pag);
      } catch (err) {
        console.error('Error fetching events:', err);
        toast.error('Failed to load events');
        setEvents([]);
        setPagination({ page: 1, limit: eventsPerPage, total: 0, pages: 1 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [currentPage, eventsPerPage]);

  // Filter events based on search


  // Use backend events directly for current page
  const currentEvents = events;
  const totalPages = pagination.pages;

  // Reset to first page when search or events change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, events.length]);

  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiClient.delete(`/events/${id}`);
        const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
        const updatedTickets = userTickets.filter(ticket => ticket.eventId !== id);
        localStorage.setItem('userTickets', JSON.stringify(updatedTickets));
        setEvents(events.filter(event => event._id !== id && event.id !== id));
        toast.success('Event deleted');
        
        // Adjust current page if needed
        if (currentEvents.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err) {
        console.error('Error deleting event:', err);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleEventCreated = (newEvent) => {
    if (currentEvent) {
      // Update existing event
      setEvents(events.map(event => 
        (event._id || event.id) === (newEvent._id || newEvent.id) ? newEvent : event
      ));
    } else {
      // Add new event
      setEvents([newEvent, ...events]);
    }
    setCurrentEvent(null);
    setViewMode('list');
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const perPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 10, label: '10 per page' },
    { value: 15, label: '15 per page' },
    { value: 20, label: '20 per page' },
  ];

  return (
    <div className="organiser-container">
      {viewMode === 'list' ? (
        <>
          <header className="organiser-header-k discover-header">
            <button onClick={() => navigate(-1)} className="btn-back-k">
              <FaArrowLeft /> Back
            </button>
            {/* <br/>
            <br/> */}
            <h1>Event Organizer Dashboard</h1>
            <button 
              onClick={() => {
                setCurrentEvent(null);
                setViewMode('form');
              }} 
              className="btn-primary-k"
            >
              <FaPlus /> Create Event
            </button>
          </header>

          {/* Search Bar */}
          <div className="organizer-search-container">
              <div className="search-input-wrapper">
               
                <input
                type="text"
                placeholder="Search events by title, location, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="organizer-search-input"
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className="per-page-selector-k">
              {/* <span className="per-page-label">Rows per page</span> */}
              <CustomDropdown
                options={perPageOptions}
                value={eventsPerPage}
                onChange={(value) => {
                  setEventsPerPage(Number(value));
                  setCurrentPage(1);
                }}
                placeholder="Rows per page"
                className="w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="events-list-k">
              {Array(eventsPerPage).fill().map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="empty-state">
                  {searchTerm ? (
                    <>
                      <p>No events match your search criteria.</p>
                      <button onClick={clearSearch} className="btn-secondary">
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <p>No events created yet.</p>
                      <button 
                        onClick={() => setViewMode('form')} 
                        className="btn-primary"
                      >
                        <FaPlus /> Create Your First Event
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="results-info">
                    Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
                  </div>
                  <div className="events-list-kl">
                    {currentEvents.map(event => (
                      <div key={event._id || event.id} className="event-card">
                  <div className="event-image-k">
                    <LazyImage 
                      src={
                        event.imageName
                          ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${event.imageName}`
                          : event.image 
                      }
                      alt={event.title}
                      fallbackSrc={image4}
                      className="event-image"
                    />
                    <div className="image-overlay">
                      <span className="overlay-chip">
                        <FaCalendarAlt /> {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="overlay-chip">
                        <FaMapMarkerAlt /> {event.location}
                      </span>
                    </div>
                  </div>
                        
                        <div className="event-details">
                          <div className="event-labels">
                            <span className="pill pill-soft">{event.category || 'Uncategorized'}</span>
                            <span className={`pill pill-status ${event.status || 'active'}`}>
                              {event.status || 'active'}
                            </span>
                          </div>
                          <h3>{event.title}</h3>
                          <p className="event-meta">
                            <span><FaCalendarAlt /> {new Date(event.date).toLocaleDateString()}</span>
                            <span><FaMapMarkerAlt /> {event.location}</span>
                          </p>
                          
                          <div className="event-stats">
                            <span><FaTicketAlt /> ${event.ticketPrice}</span>
                            <span><FaUsers /> {event.attendees || event.ticketsSold || 0}/{event.capacity}</span>
                            <span>
                              {event.privacy === 'public' ? <FaEye /> : <FaEyeSlash />}
                              {event.privacy}
                            </span>
                          </div>
                          
                          <p className="event-description">
                            {event.description?.substring(0, 100)}...
                          </p>
                        </div>
                        
                        <div className="event-actions">
                          <button 
                            onClick={() => {
                              setCurrentEvent(event);
                              setViewMode('form');
                            }} 
                            className="btn-edit"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button 
                            onClick={() => deleteEvent(event._id)} 
                            className="btn-danger"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-controls">
                        <button 
                          onClick={goToPrevPage} 
                          disabled={currentPage === 1}
                          className="pagination-btn"
                        >
                          <FaChevronLeft />
                        </button>
                        
                        {getPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && goToPage(page)}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                            disabled={page === '...'}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button 
                          onClick={goToNextPage} 
                          disabled={currentPage === totalPages}
                          className="pagination-btn"
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <CreateEvent 
          existingEvent={currentEvent}
          onCancel={() => {
            setCurrentEvent(null);
            setViewMode('list');
          }}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  );
};

export default Organizer;
