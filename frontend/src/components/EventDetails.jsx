import  React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, fetchMyEvents } from '../store/slices/eventSlice';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheck, 
  FiUsers,
  FiShoppingCart,
  FiHeart,
  FiShare2,
  FiEdit,
  FiX
} from 'react-icons/fi';
import './EventDetails.css';
import Header from '../pages/header.jsx';
import { apiClient } from '../utils/api';
import { addToCartAsync, removeBookedItems } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import image2 from '../assets/image3.jpg';
import { addFavorite, removeFavorite } from '../store/slices/favoritesSlice';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  
  // Set theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);
  
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const role = user?.role || (() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr).role : 'booker';
    } catch { return 'booker'; }
  })();
  
  const { currentEvent, loading: eventLoading, error: eventError } = useSelector((state) => state.events);
  const { items: cartItems } = useSelector((state) => state.cart);
  const favorites = useSelector((state) => state.favorites?.items || []);
  
  const [ticketCount, setTicketCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState('general');

  // Get user role from localStorage as fallback
  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData.role || 'booker';
      }
    } catch (e) {
      console.error('Error getting user role:', e);
    }
    return 'booker';
  };

  const userRole = getUserRole();

  const initialEvent = state?.event || {
    id,
    title: 'Event Not Found',
    date: 'N/A',
    time: 'N/A',
    location: 'N/A',
    description: 'The event you are looking for does not exist or has been removed.',
    ticketPrice: 0,
    organizer: 'N/A',
    capacity: 0,
    category: 'N/A',
    image: image2,
    attendees: 0,
    ticketsSold: 0,
    status: 'cancelled',
    ticketTypes: []
  };

  // Redux-based event detail loading
  useEffect(() => {
    if (state?.event) {
      dispatch({ type: 'events/setCurrentEvent', payload: { ...state.event, id: state.event._id || state.event.id || id } });
    } else {
      dispatch(fetchEventById(id));
    }
    // Refresh my events if user is organizer
    if (userRole === 'organiser' || userRole === 'admin') {
      dispatch(fetchMyEvents());
    }
    // eslint-disable-next-line
  }, [id, state, dispatch]);

  const eventDetail = currentEvent || initialEvent;
  const isLoading = eventLoading;
  const loadError = eventError;

  console.log('EventDetail:', eventDetail, 'Loading:', isLoading, 'Error:', loadError);
  const isLiked = useMemo(() => {
    return favorites.some(fav => fav.eventId === (eventDetail._id || eventDetail.id));
  }, [favorites, eventDetail]);

const getAvailableTickets = () => {
  if (eventDetail.ticketTypes?.length > 0) {
    const totalCapacity = eventDetail.ticketTypes.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    return Math.max(
      totalCapacity - (eventDetail.ticketsSold || 0),
      0
    );
  }

  return Math.max(
    (eventDetail.capacity || 0) - (eventDetail.ticketsSold || 0),
    0
  );
};

  const getTicketPrice = () => {
    if (eventDetail.ticketTypes && eventDetail.ticketTypes.length > 0) {
      const selectedTicket = eventDetail.ticketTypes.find(t => t.type === selectedTicketType);
      return selectedTicket?.price || eventDetail.ticketTypes[0]?.price || eventDetail.ticketPrice || 50;
    }
    return eventDetail.ticketPrice || 50;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate('/login', { state: { from: `/event/${id}` } });
      return;
    }

    const available = getAvailableTickets();
    if (available <= 0 || ticketCount > available) {
      toast.error('Not enough tickets available for this event.');
      return;
    }

    setIsBooking(true);
    try {
      const payload = {
        eventId: eventDetail._id || eventDetail.id,
        eventName: eventDetail.title,
        eventDate: eventDetail.date,
        eventLocation: eventDetail.location,
        ticketType: selectedTicketType,
        quantity: ticketCount,
        price: getTicketPrice()
      };

      // Add to cart via Redux
      await dispatch(addToCartAsync(payload)).unwrap();
      
      toast.success(`${ticketCount} ticket(s) added to cart!`);
      
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to add to cart. Please try again.';
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleToggleFavorite = async () => {
    const eventId = eventDetail._id || eventDetail.id;
    
    if (!isAuthenticated) {
      toast.error('Please login to save events');
      navigate('/login', { state: { from: `/event/${id}` } });
      return;
    }

    if (!eventId || eventDetail.title === 'Event Not Found') {
      toast.error('Event not ready to save yet.');
      return;
    }

    try {
      if (isLiked) {
        await dispatch(removeFavorite(eventId)).unwrap();
        toast.success('Removed from saved');
      } else {
        await dispatch(addFavorite({ eventId, eventData: eventDetail })).unwrap();
        toast.success('Saved to your list');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Unable to update saved events');
    }
  };


  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prefer eventDetail.time, fallback to extracting from date
  const formatTime = () => {
    if (eventDetail.time && eventDetail.time !== 'N/A') return eventDetail.time;
    if (!eventDetail.date || eventDetail.date === 'N/A') return 'N/A';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(eventDetail.date).toLocaleTimeString(undefined, options);
  };

  const handleTicketCountChange = (change) => {
    const newCount = ticketCount + change;
    if (newCount > 0 && newCount <= getAvailableTickets()) {
      setTicketCount(newCount);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: eventDetail.title,
        text: `Check out this event: ${eventDetail.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.info('Link copied to clipboard!');
    }
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

  const handleEditEvent = () => {
    navigate('/organizer', { state: { editEvent: eventDetail } });
  };

  if (isLoading) {
    return (
      <div className="evd-page">
        <div className="evd-container evd-loading-state">
          <div className="evd-spinner" />
          <p className="evd-loading-text">Loading event details...</p>
          {loadError && <p className="evd-error-text">{loadError}</p>}
        </div>
      </div>
    );
  }

  if (loadError && eventDetail.title === 'Event Not Found') {
    return (
      <div className="evd-page">
        <div className="evd-container evd-error-state">
          <h2 className="evd-error-title">Event not found</h2>
          <p className="evd-error-message">{loadError}</p>
          <button className="evd-back-btn evd-back-btn-large" onClick={() => navigate('/discover')}>
            <FiArrowLeft /> Back to Discover
          </button>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="evd-page">
        <div className="evd-container">
          <div className="evd-success-card">
            <div className="evd-success-icon">
              <FiCheck className="evd-success-icon-svg" />
            </div>
            <h2 className="evd-success-title">Booking Confirmed!</h2>
            <p className="evd-success-message">Your tickets for <strong>{eventDetail.title}</strong> have been successfully booked.</p>
            <div className="evd-success-details">
              <div className="evd-success-row">
                <span className="evd-success-label">Tickets</span>
                <strong className="evd-success-value">{ticketCount}</strong>
              </div>
              <div className="evd-success-row">
                <span className="evd-success-label">Total Paid</span>
                <strong className="evd-success-value">{formatCurrency(getTicketPrice() * ticketCount)}</strong>
              </div>
            </div>
            <div className="evd-success-actions">
              <button 
                className="evd-primary-btn"
                onClick={() => navigate('/my-tickets')}
              >
                <FiCheck /> View My Tickets
              </button>
              <button 
                className="evd-secondary-btn"
                onClick={() => navigate('/discover')}
              >
                <FiArrowLeft /> Browse More Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEventOwner = userRole === 'admin' || 
    eventDetail?.organizerId === user?._id || 
    eventDetail?.createdBy === user?._id;

  return (
    <div className="evd-page">
      <div className="evd-container">
        <div className="evd-nav">
          <button className="evd-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
          <div className="evd-action-buttons">
            {isEventOwner && (
              <button 
                className="evd-action-btn evd-edit-btn"
                onClick={handleEditEvent}
                aria-label="Edit event"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            )}

            <button 
              className={`evd-action-btn evd-like-btn ${isLiked ? 'evd-liked' : ''}`}
              onClick={handleToggleFavorite}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Unsave event' : 'Save event'}
            >
              <i className={`fa-heart ${isLiked ? 'fa-solid' : 'fa-regular'}`}></i>
            </button>

            <button 
              className="evd-action-btn evd-share-btn" 
              onClick={handleShare}
            >
              <i className="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>

        <div className="evd-header">
          <div className="evd-image-wrapper">
            <img 
              src={eventDetail.imageName ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${eventDetail.imageName}` : (eventDetail.image || image2)} 
              alt={eventDetail.title}
              className="evd-image" 
              onError={(e) => {
                e.target.src = image2;
              }}
            />
            <span className={`evd-status-badge evd-status-${getDateStatus(eventDetail.date, eventDetail.status)}`}>
              {eventDetail.status === 'pending' ? 'PENDING APPROVAL' : getDateStatus(eventDetail.date, eventDetail.status).toUpperCase()}
            </span>
            <span className="evd-category-badge">{eventDetail.category}</span>
          </div>
          <div className="evd-header-content">
            <h1 className="evd-title">{eventDetail.title}</h1>
            <p className="evd-organizer">Organized by <strong>{eventDetail.organizer || 'Event Organizer'}</strong></p>
            
            <div className="evd-meta-grid">
              <div className="evd-meta-item">
                <div className="evd-meta-icon">
                  <FiCalendar />
                </div>
                <div className="evd-meta-info">
                  <span className="evd-meta-label">Date</span>
                  <span className="evd-meta-value">{formatDate(eventDetail.date)}</span>
                </div>
              </div>
              <div className="evd-meta-item">
                <div className="evd-meta-icon">
                  <FiClock />
                </div>
                <div className="evd-meta-info">
                  <span className="evd-meta-label">Time</span>
                  <span className="evd-meta-value">{formatTime()}</span>
                </div>
              </div>
              <div className="evd-meta-item">
                <div className="evd-meta-icon">
                  <FiMapPin />
                </div>
                <div className="evd-meta-info">
                  <span className="evd-meta-label">Location</span>
                  <span className="evd-meta-value">{eventDetail.location}</span>
                </div>
              </div>
              <div className="evd-meta-item">
                <div className="evd-meta-icon">
                  <FiDollarSign />
                </div>
                <div className="evd-meta-info">
                  <span className="evd-meta-label">Price</span>
                  <span className="evd-meta-value">{formatCurrency(getTicketPrice())} / ticket</span>
                </div>
              </div>
              <div className="evd-meta-item evd-meta-highlight">
                <div className="evd-meta-icon">
                  <FiUsers />
                </div>
                <div className="evd-meta-info">
                  <span className="evd-meta-label">Availability</span>
                  <span className="evd-meta-value">{typeof eventDetail.availableTickets === 'number' ? eventDetail.availableTickets : getAvailableTickets()} of {eventDetail.capacity || 0} seats</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="evd-body">
          <div className="evd-description-section">
            <h3 className="evd-section-title">About the Event</h3>
            <p className="evd-description">{eventDetail.description}</p>
          </div>

          {eventDetail.ticketTypes && eventDetail.ticketTypes.length > 0 && (
            <div className="evd-ticket-section">
              <h3 className="evd-section-title">Ticket Types</h3>
              <div className="evd-ticket-grid">
                {eventDetail.ticketTypes.map((ticket, index) => {
                  const total = ticket.total || ticket.quantity || 0;
                  const sold = ticket.sold || 0;
                  const available = Math.max(0, total - sold);
                  return (
                    <div 
                      key={index} 
                      className={`evd-ticket-card ${selectedTicketType === ticket.type ? 'evd-ticket-selected' : ''}`}
                      onClick={() => setSelectedTicketType(ticket.type)}
                    >
                      <h4 className="evd-ticket-name">{ticket.name || ticket.type}</h4>
                      <p className="evd-ticket-price">{formatCurrency(ticket.price)}</p>
                      <p className="evd-ticket-availability">
                        {available} tickets available
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="evd-stats-section">
            <h3 className="evd-section-title">Event Statistics</h3>
            <div className="evd-stats-grid">
              <div className="evd-stat-card">
                <div className="evd-stat-icon"><FiUsers /></div>
                <div className="evd-stat-value">{eventDetail.attendees || 0}</div>
                <div className="evd-stat-label">Attendees</div>
              </div>
              <div className="evd-stat-card">
                <div className="evd-stat-icon"><FiCheck /></div>
                <div className="evd-stat-value">{eventDetail.ticketsSold || 0}</div>
                <div className="evd-stat-label">Tickets Sold</div>
              </div>
              <div className="evd-stat-card">
                <div className="evd-stat-icon"><FiDollarSign /></div>
                <div className="evd-stat-value">{formatCurrency(eventDetail.revenue || 0)}</div>
                <div className="evd-stat-label">Revenue</div>
              </div>
              <div className="evd-stat-card">
                <div className="evd-stat-icon evd-progress-ring">
                  <div 
                    className="evd-progress"
                    style={{ 
                      '--evd-progress': `${eventDetail.capacity ? Math.round(((eventDetail.attendees || 0) / eventDetail.capacity) * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="evd-stat-value">{eventDetail.capacity ? Math.round(((eventDetail.attendees || 0) / eventDetail.capacity) * 100) : 0}%</div>
                <div className="evd-stat-label">Capacity Filled</div>
              </div>
            </div>
          </div>

          <div className="evd-booking-section">
            {(eventDetail.status === 'active' || eventDetail.status === 'upcoming') && getDateStatus(eventDetail.date, eventDetail.status) !== 'expired' ? (
              <div className="evd-booking-card">
                <h3 className="evd-section-title">Book Your Tickets</h3>

                <div className="evd-ticket-selector">
                  <button 
                    className="evd-qty-btn" 
                    onClick={() => handleTicketCountChange(-1)}
                    disabled={ticketCount <= 1}
                  >
                    -
                  </button>
                  <span className="evd-qty-count">{ticketCount}</span>
                  <button 
                    className="evd-qty-btn" 
                    onClick={() => handleTicketCountChange(1)}
                    disabled={ticketCount >= getAvailableTickets()}
                  >
                    +
                  </button>
                </div>

                <div className="evd-total-row">
                  <span className="evd-total-label">Total:</span>
                  <span className="evd-total-price">
                    {formatCurrency(getTicketPrice() * ticketCount)}
                  </span>
                </div>

                <button 
                  className="evd-book-btn"
                  onClick={handleAddToCart}
                  disabled={getAvailableTickets() === 0 || isBooking}
                >
                  <FiShoppingCart /> {isBooking ? 'Processing...' : 'Add to Cart'}
                </button>

                {getAvailableTickets() === 0 && (
                  <p className="evd-soldout-msg">🎫 This event is sold out!</p>
                )}
              </div>
            ) : eventDetail.status === 'pending' ? (
              <div className="evd-booking-card evd-booking-disabled">
                <button className="evd-book-btn evd-book-disabled" disabled>
                  ⏳ Pending Approval
                </button>
              </div>
            ) : getDateStatus(eventDetail.date, eventDetail.status) === 'expired' ? (
              <div className="evd-booking-card evd-booking-disabled">
                <button className="evd-book-btn evd-book-disabled" disabled>
                  ⏰ Event Expired
                </button>
              </div>
            ) : eventDetail.status === 'cancelled' ? (
              <div className="evd-booking-card evd-booking-disabled">
                <button className="evd-book-btn evd-book-disabled" disabled>
                  ✕ Event Cancelled
                </button>
              </div>
            ) : eventDetail.status === 'completed' ? (
              <div className="evd-booking-card evd-booking-disabled">
                <button className="evd-book-btn evd-book-disabled" disabled>
                  ✓ Event Ended
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;