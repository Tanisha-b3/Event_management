import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheck, 
  FiUsers,
} from 'react-icons/fi';

// import { Heart, Share2 } from "lucide-react";
import { getEvents as fetchEvents } from './constants';
import './EventDetails.css';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import image2 from '../assets/image4.jpg'
// import { FaGrinHearts, FaSlideshare } from 'react-icons/fa';
import { apiClient } from '../utils/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [ticketCount, setTicketCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(!state?.event);
  const [loadError, setLoadError] = useState('');

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
    status: 'cancelled'
  };

  const [eventDetail, setEventDetail] = useState(initialEvent);

  // Load event details if not provided via navigation state
  useEffect(() => {
    if (state?.event) {
      // Ensure id is normalized
      setEventDetail({ ...state.event, id: state.event._id || state.event.id || id });
      setIsLoading(false);
      return;
    }

    const loadEvent = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        // Prefer the dedicated endpoint for a single event
        const { data } = await apiClient.get(`/events/${id}`);
        setEventDetail({ ...data, id: data._id || data.id || id });
      } catch (err) {
        try {
          // Fallback: fetch list and pick by id
          const all = await fetchEvents();
          const found = all.find(
            (e) => e._id === id || e.id === id || e.id?.toString() === id
          );
          if (found) {
            setEventDetail({ ...found, id: found._id || found.id || id });
          } else {
            setLoadError('Event not found');
          }
        } catch (err2) {
          console.error('Failed to load event details:', err2);
          setLoadError('Unable to load event details right now.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id, state]);

  const handleBookTicket = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to book tickets.');
      navigate('/login');
      return;
    }

    const role = (JSON.parse(localStorage.getItem('user') || '{}').role) || 'booker';
    if (!['booker', 'organiser', 'admin'].includes(role)) {
      alert('Your account is not allowed to book tickets.');
      return;
    }

    const available = getAvailableTickets();
    if (available <= 0 || ticketCount > available) {
      alert('Not enough tickets available for this event.');
      return;
    }
    setIsBooking(true);
    try {
      const payload = {
        eventId: eventDetail._id || eventDetail.id,
        eventName: eventDetail.title,
        eventDate: eventDetail.date,
        eventLocation: eventDetail.location,
        ticketType: 'General Admission',
        quantity: ticketCount,
        price: eventDetail.ticketPrice || 50
      };

      const { data } = await apiClient.post('/tickets', payload);

      const ticket = {
        ...data.ticket,
        eventTitle: eventDetail.title,
        eventImage: eventDetail.image
      };

      // Persist tickets locally for My Tickets page
      const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
      localStorage.setItem('userTickets', JSON.stringify([...userTickets, ticket]));

      // Reflect updated event metrics from backend
      if (data.event) {
        setEventDetail(prev => ({ ...prev, ...data.event, id: data.event._id || prev.id }));
      }

      setBookingSuccess(true);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Booking failed. Please try again.';
      alert(message);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAvailableTickets = () => {
    const available = (eventDetail.capacity || 0) - (eventDetail.ticketsSold || 0);
    return Math.max(available, 0);
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
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="event-details-page">
        <Header />
        <div className="event-details-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading event details...</p>
          {loadError && <p style={{ color: 'var(--danger-600, #dc2626)' }}>{loadError}</p>}
        </div>
        <Footer />
      </div>
    );
  }

  if (loadError && eventDetail.title === 'Event Not Found') {
    return (
      <div className="event-details-page">
        <Header />
        <div className="event-details-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <h2>Event not found</h2>
          <p>{loadError}</p>
          <button className="back-button" onClick={() => navigate('/discover')}>
            <FiArrowLeft /> Back to Discover
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="event-details-page">
        <Header />
        <div className="event-details-container">
          <div className="booking-success">
            <div className="success-icon-wrapper">
              <FiCheck className="success-icon" />
            </div>
            <h2>Booking Confirmed!</h2>
            <p>Your tickets for <strong>{eventDetail.title}</strong> have been successfully booked.</p>
            <div className="booking-details">
              <div className="detail-row">
                <span>Tickets</span>
                <strong>{ticketCount}</strong>
              </div>
              <div className="detail-row">
                <span>Total Paid</span>
                 <strong>{formatCurrency((eventDetail.ticketPrice || 50) * ticketCount)}</strong>
              </div>
            </div>
            <div className="action-buttons">
              <button 
                className="view-tickets-button"
                onClick={() => navigate('/my-tickets')}
              >
                <FiCheck /> View My Tickets
              </button>
              <button 
                className="back-to-events-button"
                onClick={() => navigate('/discover')}
              >
                <FiArrowLeft /> Browse More Events
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="event-details-page">
      <Header />
      <div className="event-details-container">
        <div className="event-details-nav">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
       <div className="event-actions-top">
  <button 
    className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
    onClick={() => setIsLiked(!isLiked)}
  >
    ❤️
  </button>

  <button className="action-btn share-btn" onClick={handleShare}>
   🔗
  </button>
</div>
        </div>

        <div className="event-header">
          <div className="event-image-container">
            <img src={eventDetail.image} alt={eventDetail.title} className="event-image" />
          <span className={`event-status ${eventDetail.status}`}>
            {eventDetail.status.charAt(0).toUpperCase() + eventDetail.status.slice(1)}
          </span>
          <span className="event-category">{eventDetail.category}</span>
        </div>
        <div className="event-header-content">
          <h1 className="event-title">{eventDetail.title}</h1>
          <p className="event-organizer">Organized by <strong>{eventDetail.organizer}</strong></p>
            
            <div className="event-meta">
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiCalendar className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">{formatDate(eventDetail.date)}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiClock className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Time</span>
                  <span className="meta-value">10:00 AM - 5:00 PM</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiMapPin className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{eventDetail.location}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiDollarSign className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Price</span>
                  <span className="meta-value">{formatCurrency(eventDetail.ticketPrice || 50)} / ticket</span>
                </div>
              </div>
              <div className="meta-item highlight">
                <div className="meta-icon-wrapper">
                  <FiUsers className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Availability</span>
                  <span className="meta-value">{getAvailableTickets()} of {eventDetail.capacity} seats</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="event-body">
          <div className="event-description-section">
            <h3>About the Event</h3>
            <p className="event-description">{eventDetail.description}</p>
          </div>

          <div className="event-stats-section">
            <h3>Event Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FiUsers /></div>
                <div className="stat-value">{eventDetail.attendees}</div>
                <div className="stat-label">Attendees</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiCheck /></div>
                <div className="stat-value">{eventDetail.ticketsSold}</div>
                <div className="stat-label">Tickets Sold</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiDollarSign /></div>
                <div className="stat-value">{formatCurrency(eventDetail.revenue || 0)}</div>
                <div className="stat-label">Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon progress">
                  <div 
                    className="progress-ring"
                    style={{ '--progress': `${eventDetail.capacity ? Math.round(((eventDetail.attendees || 0) / eventDetail.capacity) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="stat-value">{eventDetail.capacity ? Math.round(((eventDetail.attendees || 0) / eventDetail.capacity) * 100) : 0}%</div>
                <div className="stat-label">Capacity Filled</div>
              </div>
            </div>
          </div>

          <div className="event-actions">
            {eventDetail.status === 'active' || eventDetail.status === 'upcoming' ? (
              <div className="booking-section">
                <h3>Book Your Tickets</h3>
                <div className="ticket-selector">
                  <button 
                    className="quantity-button" 
                    onClick={() => handleTicketCountChange(-1)}
                    disabled={ticketCount <= 1}
                  >
                   -
                  </button>
                  <span className="ticket-count">{ticketCount}</span>
                  <button 
                    className="quantity-button" 
                    onClick={() => handleTicketCountChange(1)}
                    disabled={ticketCount >= getAvailableTickets()}
                  >
                   +
                  </button>
                </div>
                <div className="booking-total">
                  <span>Total:</span>
                  <span className="total-price">{formatCurrency((eventDetail.ticketPrice || 50) * ticketCount)}</span>
                </div>
                <button 
                  className={`book-button ${isBooking ? 'loading' : ''}`} 
                  onClick={handleBookTicket}
                  disabled={isBooking || getAvailableTickets() === 0}
                >
                  {isBooking ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>Book Now</>
                  )}
                </button>
                {getAvailableTickets() === 0 && (
                  <p className="sold-out-message">🎫 This event is sold out!</p>
                )}
              </div>
            ) : (
              <div className="booking-section disabled-booking">
                <button className="book-button disabled" disabled>
                   {eventDetail.status === 'completed' ? '✓ Event Ended' : '✕ Event Cancelled'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetails;
