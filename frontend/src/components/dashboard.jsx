import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiPlus, FiSearch, FiCalendar, FiUsers, FiDollarSign, FiEdit, 
  FiMail, FiBarChart2, FiSettings, FiPause, FiPlay, FiTrash2,
  FiDownload, FiSend, FiMessageSquare, FiLock, FiGlobe, FiEye, FiEyeOff,
  FiChevronLeft, FiChevronRight, FiArrowLeft
} from 'react-icons/fi';
import './Dashboard.css';
import Location from '../components/featuresd/Location.jsx';
import CategoryFilter from './category.jsx';
import EventCarousel from './featuresd/features.jsx';
import { messages } from './constants';
import CustomDropdown from './customDropdown.jsx';
import { 
  deleteEvent, 
  fetchMyEvents, 
  fetchEvents,
  setFilters,
  clearFilters 
} from '../store/slices/eventSlice';
import fallbackImage from '../assets/image8.jpg';
import { toast } from 'react-toastify';

// Lazy load heavy components
const ManageEvent = lazy(() => import('./dashboardC/ManageEvent.jsx'));

// Lazy loading image component with Intersection Observer
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
    setImageSrc(fallbackSrc || fallbackImage);
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
          <div className="loading-spinner-small"></div>
        </div>
      )}
    </div>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Skeleton loader for event cards
const EventCardSkeleton = () => (
  <div className="event-card skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-header">
      <div className="skeleton-badge"></div>
      <div className="skeleton-date"></div>
    </div>
    <div className="skeleton-title"></div>
    <div className="skeleton-category"></div>
    <div className="skeleton-location"></div>
    <div className="skeleton-stats">
      <div className="skeleton-stat"></div>
      <div className="skeleton-stat"></div>
    </div>
    <div className="skeleton-actions">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Skeleton loader for events grid
const EventsGridSkeleton = ({ count = 9 }) => (
  <div className="events-grid">
    {Array(count).fill().map((_, index) => (
      <EventCardSkeleton key={index} />
    ))}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    events: reduxEvents, 
    myEvents, 
    loading: eventsLoading, 
    error: eventsError,
    filters,
    pagination: reduxPagination
  } = useSelector((state) => state.events);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [salesData, setSalesData] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [newTicketType, setNewTicketType] = useState({
    name: '',
    price: 0,
    quantity: 0
  });
  const [ticketTypes, setTicketTypes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('booker');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(12);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);

  const messageTemplates = messages;

  // Debounced search for better performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset category filter when switching to events tab
  useEffect(() => {
    if (activeTab === 'events') {
      setActiveCategory('all');
    }
  }, [activeTab]);

  // Get user role and ID from Redux or localStorage
  const currentUserId = useMemo(() => {
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData._id || userData.id;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
    return null;
  }, [user]);

  // Get user role
  useEffect(() => {
    let role = 'booker';
    if (user?.role) {
      role = user.role;
    } else {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          role = userData?.role || 'booker';
        }
      } catch (e) {
        console.error('Error getting role from localStorage:', e);
      }
    }
    setUserRole(role);
    
    // If user is organizer or admin, show toggle for "My Events" only
    if (role === 'organiser' || role === 'admin') {
      setShowMyEventsOnly(false);
    }
  }, [user]);

  // Check if user can manage an event
  const canManageEvent = useCallback((event) => {
    if (userRole === 'admin') return true;
    if (userRole === 'organiser') {
      const eventOwnerId = event.organizerId || event.createdBy;
      return eventOwnerId === currentUserId;
    }
    return false;
  }, [userRole, currentUserId]);

  // Fetch events using Redux when filters change
  useEffect(() => {
    const fetchEventsData = async () => {
      const isOrganiser = userRole === 'organiser' || userRole === 'admin';
      
      // Build filters object
      const filterParams = {
        page: currentPage,
        limit: eventsPerPage,
        category: activeCategory !== 'all' ? activeCategory : '',
        search: debouncedSearchTerm,
        location: locationSearchTerm,
        filterType: filterType !== 'all' ? filterType : '',
      };
      
      // Remove empty values
      Object.keys(filterParams).forEach(key => {
        if (!filterParams[key]) delete filterParams[key];
      });
      
      // console.log('Fetching events with params:', filterParams);
      
      dispatch(setFilters(filterParams));
      
      // For organizers, fetch their own events when "My Events" is selected
      if (isOrganiser && showMyEventsOnly) {
        await dispatch(fetchMyEvents());
      } else {
        // Fetch all events with current pagination
        await dispatch(fetchEvents(filterParams));
      }
    };
    
    fetchEventsData();
  }, [dispatch, currentPage, eventsPerPage, activeCategory, debouncedSearchTerm, locationSearchTerm, filterType, userRole, showMyEventsOnly]);

  // Get events from Redux based on view
  const currentEvents = useMemo(() => {
    // If showing my events only, use myEvents from Redux
   let events =
  showMyEventsOnly && (userRole === 'organiser' || userRole === 'admin')
    ? (myEvents || [])
    : (reduxEvents || []);
    
    // Ensure events have consistent structure
 return (events || [])
  .filter(e => e && (e._id || e.id)) // ✅ prevent crash
  .map(event => ({
      ...event,
      id: event._id || event.id,
      attendees: event.attendees || event.ticketsSold || 0,
      ticketsSold: event.ticketsSold || 0,
      revenue: event.revenue || 0,
      capacity: event.capacity || 100,
      status: event.status || 'active',
      privacy: event.privacy || 'public',
      ticketTypes: event.ticketTypes || [
        { id: 1, type: 'General Admission', price: event.ticketPrice || 50, sold: 0, total: event.capacity || 100 }
      ],
      canManage: canManageEvent(event)
    }));
  }, [reduxEvents, myEvents, showMyEventsOnly, userRole, canManageEvent]);

  const totalPages = showMyEventsOnly ? Math.ceil((myEvents?.length || 0) / eventsPerPage) : (reduxPagination?.pages || 1);
  const totalEvents = showMyEventsOnly ? (myEvents?.length || 0) : (reduxPagination?.total || 0);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, locationSearchTerm, activeCategory, filterType, eventsPerPage, showMyEventsOnly]);

  // Generate sample sales data for selected event
  useEffect(() => {
    if (selectedEvent) {
      const generatedSales = [];
      const days = 14;
      const baseDate = new Date(selectedEvent.date);
      baseDate.setDate(baseDate.getDate() - days);
      
      for (let i = 0; i < days; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        
        generatedSales.push({
          date: date.toISOString().split('T')[0],
          tickets: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 1000) + 200
        });
      }
      setSalesData(generatedSales);

      if (selectedEvent.ticketTypes && selectedEvent.ticketTypes.length) {
        setTicketTypes(selectedEvent.ticketTypes);
      } else {
        setTicketTypes([]);
      }
    }
  }, [selectedEvent]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDateStatus = (dateString, eventStatus) => {
    if (eventStatus === 'pending') return 'pending';
    if (eventStatus === 'rejected') return 'rejected';
    if (eventStatus === 'cancelled') return 'cancelled';
    if (eventStatus === 'completed') return 'completed';
    
    if (!dateString || dateString === 'N/A') return 'unknown';
    
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'near';
    if (diffDays <= 30) return 'upcoming';
    return 'future';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleManageEvent = (event) => {
    // Check if user can manage this event
    if (!canManageEvent(event)) {
      toast.error('You do not have permission to manage this event');
      return;
    }
    setSelectedEvent(event);
    setActiveTab('manage');
  };

  const toggleEventStatus = useCallback(() => {
    if (!selectedEvent) return;
    if (!canManageEvent(selectedEvent)) {
      toast.error('You do not have permission to modify this event');
      return;
    }
    toast.info('Status update will be implemented with backend API');
  }, [selectedEvent, canManageEvent]);

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
    
    if (!canManageEvent(selectedEvent)) {
      toast.error('You do not have permission to delete this event');
      setShowDeleteModal(false);
      return;
    }
    
    const eventId = selectedEvent._id || selectedEvent.id;
    
    try {
      await dispatch(deleteEvent(eventId)).unwrap();
      setSelectedEvent(null);
      setActiveTab('All events');
      setShowDeleteModal(false);
      toast.success('Event deleted successfully');
      
      // Refresh events list
      if (showMyEventsOnly) {
        await dispatch(fetchMyEvents());
      } else {
        const filterParams = {
          page: currentPage,
          limit: eventsPerPage,
          category: activeCategory !== 'all' ? activeCategory : '',
          search: debouncedSearchTerm,
          location: locationSearchTerm,
          filterType: filterType !== 'all' ? filterType : '',
        };
        
        Object.keys(filterParams).forEach(key => {
          if (!filterParams[key]) delete filterParams[key];
        });
        
        await dispatch(fetchEvents(filterParams));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      const message = error.message || 'Failed to delete event';
      toast.error(message);
      setShowDeleteModal(false);
    }
  }, [selectedEvent, dispatch, currentPage, eventsPerPage, activeCategory, debouncedSearchTerm, locationSearchTerm, filterType, showMyEventsOnly, canManageEvent]);

  const handleSendMessage = () => {
    toast.info('Attendee messaging not yet connected to backend.');
    setMessageContent('');
  };

  const handleExportAttendees = () => {
    toast.info('Attendee export is unavailable until attendee data is provided by the backend.');
  };

  const handleUseTemplate = (template) => {
    setMessageContent(template.content);
  };

  const filteredAttendees = useMemo(() => [], []);

  const handlePrivacyChange = (privacy) => {
    if (!selectedEvent) return;
    if (!canManageEvent(selectedEvent)) {
      toast.error('You do not have permission to modify this event');
      return;
    }
    toast.info('Privacy update will be implemented with backend API');
  };

  const handleTicketTypeChange = (id, field, value) => {
    const updatedTicketTypes = ticketTypes.map(ticket => {
      if (ticket.id === id) {
        return { ...ticket, [field]: field === 'price' || field === 'total' ? Number(value) : value };
      }
      return ticket;
    });
    setTicketTypes(updatedTicketTypes);
  };

  const handleAddTicketType = () => {
    if (newTicketType.name && newTicketType.price > 0 && newTicketType.quantity > 0) {
      const newTicket = {
        id: Date.now(),
        type: newTicketType.name,
        price: newTicketType.price,
        total: newTicketType.quantity,
        sold: 0
      };
      
      setTicketTypes([...ticketTypes, newTicket]);
      setNewTicketType({ name: '', price: 0, quantity: 0 });
      toast.success('Ticket type added');
    } else {
      toast.error('Please fill all ticket type fields');
    }
  };

  const handleRemoveTicketType = (id) => {
    setTicketTypes(ticketTypes.filter(ticket => ticket.id !== id));
    toast.success('Ticket type removed');
  };

  const totalRevenue = selectedEvent?.revenue ?? ticketTypes.reduce((sum, ticket) => sum + (ticket.price * ticket.sold), 0);
  const totalTicketsSold = selectedEvent?.ticketsSold ?? ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0);
  const totalTicketsAvailable = selectedEvent?.capacity ?? ticketTypes.reduce((sum, ticket) => sum + ticket.total, 0);

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

  

  const EventCard = ({ event }) => {
    const status = getDateStatus(event.date, event.status);
    let statusLabel = status.toUpperCase();
    if (status === 'pending') statusLabel = 'PENDING APPROVAL';
    if (status === 'cancelled') statusLabel = 'CANCELLED';
    if (status === 'completed') statusLabel = 'EVENT ENDED';
    if (status === 'expired') statusLabel = 'EXPIRED';
    
    const eventId = event._id || event.id;
    const userCanManage = canManageEvent(event);
    
    return (
      <div className="event-card" key={eventId}>
        <div className="event-card-image">
          <LazyImage 
            src={
              event.imageName
                ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${event.imageName}`
                : event.image
            }
            alt={event.title}
            fallbackSrc={fallbackImage}
            className="event-image"
          />
        </div>
        <div className="event-header">
          <div className="left">
            <span className={`event-status-k ${status}`}>
              {statusLabel}
            </span>
          </div>
          <div className="right">
            <span className="event-date">
              <FiCalendar className="icon" />
              {formatDate(event.date)}
            </span>
          </div>
        </div>
        <h3 className="event-title-kl">{event.title}</h3>
        <p className="event-location">{event.location}</p>
        <div className="event-stats">
          <div className="stat-item">
            <FiUsers className="icon" />
            <span>{event.attendees || 0}/{event.capacity || 100}</span>
          </div>
          <div className="stat-item">
            <FiDollarSign className="icon" />
            <span>{formatCurrency(event.revenue || 0)}</span>
          </div>
        </div>
        <div className="event-t">
          <div className="event-actions-k">
            <button
              className="btn-secondary-k"
              onClick={() => navigate(`/event/${eventId}`)}
            >
              Event Details
            </button>
          </div>
          <div className="event-actions-k">
            {userCanManage && (
              <button
                className="btn-secondary-k"
                onClick={() => handleManageEvent(event)}
              >
                Manage Event
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventsTab = () => {
    // Calculate paginated events for "My Events" view
    const paginatedEvents = showMyEventsOnly && (userRole === 'organiser' || userRole === 'admin')
      ? currentEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage)
      : currentEvents;

      

    return (
      <>
        <div className="events-grid-k">
          {paginatedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {(currentPage - 1) * eventsPerPage + 1} - {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
            </div>
            <div className="pagination-controls-kl">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || eventsLoading}
                className="pagination-btn"
              >
                <FiChevronLeft />
              </button>
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                  disabled={page === '...' || eventsLoading}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || eventsLoading}
                className="pagination-btn"
              >
                <FiChevronRight />
              </button>
            </div>
            <div className="pagination-per-page-k">
              <CustomDropdown
                value={eventsPerPage}
                onChange={(val) => {
                  setEventsPerPage(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 6, label: '6 per page' },
                  { value: 9, label: '9 per page' },
                  { value: 12, label: '12 per page' },
                  { value: 18, label: '18 per page' },
                  { value: 24, label: '24 per page' },
                ]}
                placeholder="Select per page"
                className="per-page-select-k"
              />
            </div>
          </div>
        )}
        
        {/* Loading indicator for pagination */}
        {eventsLoading && currentEvents.length > 0 && (
          <div className="pagination-loading">
            <div className="loading-spinner-small"></div>
            <span>Loading more events...</span>
          </div>
        )}
      </>
    );
  };

  // Show full page skeleton only on initial load
  if (eventsLoading && currentEvents.length === 0) {
    return (
      <div className="dashboard-container">
        <main className="dashboard-main">
          <EventsGridSkeleton count={eventsPerPage} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        <FiArrowLeft /> Back
      </button> */}
      <main className="dashboard-main">
        <EventCarousel 
          events={currentEvents.filter(event => event.status === 'active').slice(0, 6)} 
        />
        <br/>
        {activeTab === 'events' && (
          <>
            <div className="dashboard-controls w-full px-2 sm:px-4 dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
              <div className='search flex flex-col md:flex-row gap-4 mb-4 w-full'>
                <div className="w-full md:flex-1">
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="w-full md:flex-1">
                  <Location 
                    className="w-full"
                    onSearch={setLocationSearchTerm}
                    placeholder="Search by city..."
                    events={currentEvents}
                  />
                </div>
              </div>
              
              
              <div className="filter-buttons flex flex-wrap gap-2 ">
                <button 
                  className={`btn-filter px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filterType === 'all' 
                      ? 'active bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  All Events
                </button>
                <button 
                  className={`btn-filter px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filterType === 'upcoming' 
                      ? 'active bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterType('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  className={`btn-filter px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filterType === 'active' 
                      ? 'active bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterType('active')}
                >
                  Active
                </button>
                <button 
                  className={`btn-filter px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filterType === 'past' 
                      ? 'active bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterType('past')}
                >
                  Past
                </button>
              </div>
            </div>

            {/* Toggle for My Events vs All Events (for organizers/admins) */}
             {(userRole === 'organiser' || userRole === 'admin') && (
  <div className='event-t'>
    <button
      className={`btn-secondary-k toggle-btn ${!showMyEventsOnly ? 'active' : ''}`}
      onClick={() => setShowMyEventsOnly(false)}
    >
      All Events
    </button>

    <button
      className={`btn-secondary-k toggle-btn ${showMyEventsOnly ? 'active' : ''}`}
      onClick={() => setShowMyEventsOnly(true)}
    >
      My Events
    </button>
  </div>
)}
            
            <CategoryFilter 
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
            
            {currentEvents.length === 0 && !eventsLoading ? (
              <div className="empty-state">
                <h3>No events found</h3>
                <p>Try adjusting your search or create a new event</p>
                {(userRole === 'organiser' || userRole === 'admin') && (
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/create-event')}
                  >
                    <FiPlus className="icon" />
                    Create Your First Event
                  </button>
                )}
              </div>
            ) : (
              renderEventsTab()
            )}
          </>
        )}
        
        {activeTab !== 'events' && selectedEvent && (
          <Suspense fallback={<LoadingFallback />}>
            <ManageEvent
              selectedEvent={selectedEvent}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              toggleEventStatus={toggleEventStatus}
              formatCurrency={formatCurrency}
              attendeeSearch={attendeeSearch}
              setAttendeeSearch={setAttendeeSearch}
              handleExportAttendees={handleExportAttendees}
              filteredAttendees={filteredAttendees}
              setMessageContent={setMessageContent}
              messageTemplates={messageTemplates}
              handleUseTemplate={handleUseTemplate}
              messageContent={messageContent}
              recipientType={recipientType}
              setRecipientType={setRecipientType}
              handleSendMessage={handleSendMessage}
              totalRevenue={totalRevenue}
              totalTicketsSold={totalTicketsSold}
              totalTicketsAvailable={totalTicketsAvailable}
              salesData={salesData}
              ticketTypes={ticketTypes}
              editingTicket={editingTicket}
              setEditingTicket={setEditingTicket}
              handleTicketTypeChange={handleTicketTypeChange}
              handleRemoveTicketType={handleRemoveTicketType}
              newTicketType={newTicketType}
              setNewTicketType={setNewTicketType}
              handleAddTicketType={handleAddTicketType}
              handlePrivacyChange={handlePrivacyChange}
              setShowDeleteModal={setShowDeleteModal}
              localEvents={currentEvents}
              setLocalEvents={() => {}} // Handled by Redux
              setSelectedEvent={setSelectedEvent}
            />
          </Suspense>
        )}

        {showDeleteModal && selectedEvent && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Event</h3>
              <p>Are you sure you want to permanently delete "{selectedEvent.title}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="btn-secondary-k"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDeleteEvent}
                >
                  Yes, Delete Event
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;