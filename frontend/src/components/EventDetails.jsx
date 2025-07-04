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
  FiMinus
} from 'react-icons/fi';
import { EVENTS } from './constants';
import './EventDetails.css';
import image2 from '../assets/image4.jpg'

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [ticketCount, setTicketCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  if (bookingSuccess) {
    return (
      <div className="event-details-container">
        <div className="booking-success">
          <FiCheck className="success-icon" />
          <h2>Booking Confirmed!</h2>
          <p>Your tickets for {event.title} have been successfully booked.</p>
          <div className="booking-details">
            <p><strong>Tickets:</strong> {ticketCount}</p>
            <p><strong>Total:</strong> {formatCurrency((event.ticketPrice || 50) * ticketCount)}</p>
          </div>
          <div className="action-buttons">
            <button 
              className="view-tickets-button"
              onClick={() => navigate('/my-tickets')}
            >
              View My Tickets
            </button>
            <button 
              className="back-to-events-button"
              onClick={() => navigate('/events')}
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back to Events
      </button>

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
          <p className="event-organizer">Organized by: {event.organizer}</p>
          
          <div className="event-meta">
            <div className="meta-item">
              <FiCalendar className="meta-icon" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="meta-item">
              <FiClock className="meta-icon" />
              <span>10:00 AM - 5:00 PM</span>
            </div>
            <div className="meta-item">
              <FiMapPin className="meta-icon" />
              <span>{event.location}</span>
            </div>
            <div className="meta-item">
              <FiDollarSign className="meta-icon" />
              <span>{formatCurrency(event.ticketPrice || 50)} per ticket</span>
            </div>
            <div className="meta-item">
              <FiUsers className="meta-icon" />
              <span>{getAvailableTickets()} of {event.capacity} seats available</span>
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
              <div className="stat-value">{event.attendees}</div>
              <div className="stat-label">Attendees</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{event.ticketsSold}</div>
              <div className="stat-label">Tickets Sold</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(event.revenue || 0)}</div>
              <div className="stat-label">Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round((event.attendees / event.capacity) * 100)}%</div>
              <div className="stat-label">Capacity Filled</div>
            </div>
          </div>
        </div>

        <div className="event-actions">
          {event.status === 'active' || event.status === 'upcoming' ? (
            <div className="booking-section">
              <div className="ticket-selector">
                <button 
                  className="quantity-button" 
                  onClick={() => handleTicketCountChange(-1)}
                  disabled={ticketCount <= 1}
                >
                  <FiMinus />
                </button>
                <span className="ticket-count">{ticketCount}</span>
                <button 
                  className="quantity-button" 
                  onClick={() => handleTicketCountChange(1)}
                  disabled={ticketCount >= getAvailableTickets()}
                >
                  <FiPlus />
                </button>
              </div>
              <button 
                className={`book-button ${isBooking ? 'loading' : ''}`} 
                onClick={handleBookTicket}
                disabled={isBooking || getAvailableTickets() === 0}
              >
                {isBooking ? 'Processing...' : `Book Now - ${formatCurrency((event.ticketPrice || 50) * ticketCount)}`}
              </button>
              {getAvailableTickets() === 0 && (
                <p className="sold-out-message">This event is sold out!</p>
              )}
            </div>
          ) : (
            <button className="book-button disabled" disabled>
              {event.status === 'completed' ? 'Event Ended' : 'Event Cancelled'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;