import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheck, 
  FiUsers,
  FiPlus,
  FiMinus,
  FiShare2,
  FiHeart,
  FiShare
} from 'react-icons/fi';

import { Heart, Share2 } from "lucide-react";
import { EVENTS } from './constants';
import './EventDetails.css';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import image2 from '../assets/image4.jpg'
import { FaGrinHearts, FaSlideshare } from 'react-icons/fa';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [ticketCount, setTicketCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Find the event in the constants or use the passed state
  const event = state?.event || EVENTS.find(e => e.id === parseInt(id)||e.id.toString() === id) || {
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

  const handleBookTicket = () => {
    setIsBooking(true);
    
    // Simulate API call
    setTimeout(() => {
      // Create ticket object
      const ticket = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        eventImage: event.image,
        ticketType: 'General Admission',
        price: event.ticketPrice || 50,
        quantity: ticketCount,
        bookingDate: new Date().toISOString(),
        bookingId: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'confirmed'
      };

      // Save to user's tickets in localStorage
      const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
      localStorage.setItem('userTickets', JSON.stringify([...userTickets, ticket]));

      // Update event stats in localStorage (if using localStorage for events)
      const events = JSON.parse(localStorage.getItem('events')) || EVENTS;
      const updatedEvents = events.map(ev => {
        if (ev.id === event.id) {
          return {
            ...ev,
            ticketsSold: ev.ticketsSold + ticketCount,
            attendees: ev.attendees + ticketCount,
            revenue: (ev.revenue || 0) + (ticket.price * ticketCount)
          };
        }
        return ev;
      });
      localStorage.setItem('events', JSON.stringify(updatedEvents));

      setBookingSuccess(true);
      setIsBooking(false);
    }, 1500);
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
    return event.capacity - event.ticketsSold;
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
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

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
            <p>Your tickets for <strong>{event.title}</strong> have been successfully booked.</p>
            <div className="booking-details">
              <div className="detail-row">
                <span>Tickets</span>
                <strong>{ticketCount}</strong>
              </div>
              <div className="detail-row">
                <span>Total Paid</span>
                <strong>{formatCurrency((event.ticketPrice || 50) * ticketCount)}</strong>
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
            <img src={event.image} alt={event.title} className="event-image" />
            <span className={`event-status ${event.status}`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
            <span className="event-category">{event.category}</span>
          </div>
          <div className="event-header-content">
            <h1 className="event-title">{event.title}</h1>
            <p className="event-organizer">Organized by <strong>{event.organizer}</strong></p>
            
            <div className="event-meta">
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiCalendar className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">{formatDate(event.date)}</span>
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
                  <span className="meta-value">{event.location}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <FiDollarSign className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Price</span>
                  <span className="meta-value">{formatCurrency(event.ticketPrice || 50)} / ticket</span>
                </div>
              </div>
              <div className="meta-item highlight">
                <div className="meta-icon-wrapper">
                  <FiUsers className="meta-icon" />
                </div>
                <div className="meta-content">
                  <span className="meta-label">Availability</span>
                  <span className="meta-value">{getAvailableTickets()} of {event.capacity} seats</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="event-body">
          <div className="event-description-section">
            <h3>About the Event</h3>
            <p className="event-description">{event.description}</p>
          </div>

          <div className="event-stats-section">
            <h3>Event Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FiUsers /></div>
                <div className="stat-value">{event.attendees}</div>
                <div className="stat-label">Attendees</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiCheck /></div>
                <div className="stat-value">{event.ticketsSold}</div>
                <div className="stat-label">Tickets Sold</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiDollarSign /></div>
                <div className="stat-value">{formatCurrency(event.revenue || 0)}</div>
                <div className="stat-label">Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon progress">
                  <div 
                    className="progress-ring"
                    style={{ '--progress': `${Math.round((event.attendees / event.capacity) * 100)}%` }}
                  ></div>
                </div>
                <div className="stat-value">{Math.round((event.attendees / event.capacity) * 100)}%</div>
                <div className="stat-label">Capacity Filled</div>
              </div>
            </div>
          </div>

          <div className="event-actions">
            {event.status === 'active' || event.status === 'upcoming' ? (
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
                  <span className="total-price">{formatCurrency((event.ticketPrice || 50) * ticketCount)}</span>
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
                  {event.status === 'completed' ? '✓ Event Ended' : '✕ Event Cancelled'}
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