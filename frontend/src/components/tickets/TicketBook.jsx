import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaTicketAlt, FaUser, FaCreditCard, FaCheck, FaChevronLeft, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { bookTicket, clearCart, resetBookingStatus } from "../../store/slices/TicketSlice";
import { clearCartLocal, removeBookedItems, fetchCart } from "../../store/slices/cartSlice";
import { apiClient } from "../../utils/api";
import './BookTicket.css';

const BookTicket = () => {
  const location = useLocation();
  const event = location.state?.event;
  const cartItems = location.state?.cartItems;
  const fromCart = location.state?.fromCart || false;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { bookingStatus, error } = useSelector((state) => state.tickets);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedTickets: [],
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [errors, setErrors] = useState({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [processingBooking, setProcessingBooking] = useState(false);
  const [bookedEvents, setBookedEvents] = useState([]);

  // Normalize event data (handle nested/duplicate structure)
  const normalizeEventData = (eventData) => {
    if (!eventData) return null;

    let sourceData = eventData;
    while (sourceData.event || sourceData.data) {
      if (sourceData.event) sourceData = sourceData.event;
      else if (sourceData.data) sourceData = sourceData.data;
      else break;
    }

    return {
      _id: sourceData._id || sourceData.id,
      id: sourceData.id || sourceData._id,
      title: sourceData.title || '',
      location: sourceData.location || '',
      category: sourceData.category || '',
      capacity: sourceData.capacity || 0,
      imageName: sourceData.imageName || '',
      image: sourceData.image || '',
      tickets: sourceData.tickets || [],
      date: sourceData.date || null,
      formattedDate: sourceData.date
        ? new Date(sourceData.date).toLocaleDateString()
        : 'Date TBD',
    };
  };

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Handle redux booking errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      setErrors(prev => ({ ...prev, submit: error }));
      setProcessingBooking(false);
      dispatch(resetBookingStatus());
    }
  }, [error, dispatch]);

  // Initialize tickets from cart or event prop
  useEffect(() => {
    if (fromCart && cartItems && cartItems.length > 0) {
      const groupedByEvent = cartItems.reduce((acc, item) => {
        const eventId = item.eventId?._id || item.eventId || item.event?._id || item.id;
        const eventTitle = item.eventName || item.event?.title;

        if (!acc[eventId]) {
          acc[eventId] = {
            event: {
              _id: eventId,
              id: eventId,
              title: eventTitle,
              date: item.eventDate || item.event?.date,
              location: item.eventLocation || item.event?.location,
              image: item.eventImage || item.event?.imageName,
              tickets: [],
            },
            items: [],
          };
        }
        acc[eventId].items.push(item);
        acc[eventId].event.tickets.push({
          type: item.ticketType,
          price: item.price,
          quantity: item.availableQuantity || 100,
          originalQuantity: item.quantity,
          eventTitle,
          eventDate: item.eventDate || item.event?.date,
          eventLocation: item.eventLocation || item.event?.location,
        });
        return acc;
      }, {});

      const eventsList = Object.values(groupedByEvent);
      if (eventsList.length > 0) {
        setAllBookings(eventsList);

        const allTickets = [];
        eventsList.forEach((booking) => {
          booking.event.tickets.forEach((ticket) => {
            const cartItem = booking.items.find(item => item.ticketType === ticket.type);
            allTickets.push({
              type: ticket.type,
              price: ticket.price,
              quantity: cartItem ? cartItem.quantity : ticket.originalQuantity || 0,
              maxQuantity: ticket.quantity,
              eventId: booking.event._id,
              cartItemId: cartItem?._id || cartItem?.id,
              eventTitle: ticket.eventTitle || booking.event.title,
              eventDate: ticket.eventDate || booking.event.date,
              eventLocation: ticket.eventLocation || booking.event.location,
            });
          });
        });

        setFormData(prev => ({ ...prev, selectedTickets: allTickets }));
      }
    } else if (event) {
      const normalizedEvent = normalizeEventData(event);
      if (normalizedEvent?.tickets) {
        setFormData(prev => ({
          ...prev,
          selectedTickets: normalizedEvent.tickets.map(ticket => ({
            type: ticket.type,
            price: ticket.price,
            quantity: 0,
            maxQuantity: ticket.quantity,
          })),
        }));
      }
    }
  }, [event, cartItems, fromCart]);

  const handleTicketChange = (index, value) => {
    const quantity = parseInt(value) || 0;
    const maxQuantity = formData.selectedTickets[index]?.maxQuantity;

    if (quantity < 0 || quantity > maxQuantity) return;

    const updatedTickets = [...formData.selectedTickets];
    updatedTickets[index] = { ...updatedTickets[index], quantity };
    setFormData(prev => ({ ...prev, selectedTickets: updatedTickets }));

    if (fromCart && allBookings.length > 0) {
      const ticket = updatedTickets[index];
      const updatedBookings = allBookings.map(booking => {
        if (booking.event._id !== ticket.eventId && booking.event.id !== ticket.eventId) return booking;
        return {
          ...booking,
          event: {
            ...booking.event,
            tickets: booking.event.tickets.map(t =>
              t.type === ticket.type ? { ...t, originalQuantity: quantity } : t
            ),
          },
          items: booking.items.map(item =>
            item.ticketType === ticket.type ? { ...item, quantity } : item
          ),
        };
      });
      setAllBookings(updatedBookings);
    }

    if (errors.tickets) {
      setErrors(prev => { const e = { ...prev }; delete e.tickets; return e; });
    }
  };

  const calculateTotal = () =>
    formData.selectedTickets
      .reduce((sum, t) => sum + t.price * t.quantity, 0)
      .toFixed(2);

  const calculateTotalTickets = () =>
    formData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Single, unified phone validation
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (calculateTotalTickets() === 0) {
      newErrors.tickets = 'Please select at least one ticket';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isAuthenticated) {
      toast.warning('Please login to complete your booking');
      navigate('/login', { state: { from: location.pathname, formData, cartItems, fromCart } });
      return;
    }

    const selectedTickets = formData.selectedTickets.filter(t => t.quantity > 0);
    if (selectedTickets.length === 0) {
      setErrors({ tickets: 'Please select at least one ticket' });
      return;
    }

    setProcessingBooking(true);

    try {
      if (fromCart) {
        // ── Cart flow ──────────────────────────────────────────────────────
        const ticketsByEvent = selectedTickets.reduce((acc, ticket) => {
          if (!acc[ticket.eventId]) {
            acc[ticket.eventId] = {
              eventName: ticket.eventTitle,
              eventDate: ticket.eventDate,
              eventLocation: ticket.eventLocation,
              tickets: [],
            };
          }
          acc[ticket.eventId].tickets.push(ticket);
          return acc;
        }, {});

        const allTicketPromises = [];
        const bookedEventsList = [];
        const cartItemIdsToRemove = [];

        for (const [eventId, eventData] of Object.entries(ticketsByEvent)) {
          const eventBookings = [];

          for (const ticket of eventData.tickets) {
            if (ticket.quantity > 0) {
              const ticketData = {
                eventId,
                eventName: eventData.eventName,
                eventDate: eventData.eventDate,
                eventLocation: eventData.eventLocation,
                ticketType: ticket.type,
                quantity: ticket.quantity,
                price: ticket.price,
              };
              allTicketPromises.push(dispatch(bookTicket(ticketData)).unwrap());
              eventBookings.push({ ticketType: ticket.type, quantity: ticket.quantity, price: ticket.price });

              // Collect cart item IDs to remove
              if (ticket.cartItemId) cartItemIdsToRemove.push(ticket.cartItemId);
            }
          }

          if (eventBookings.length > 0) {
            bookedEventsList.push({ eventName: eventData.eventName, bookings: eventBookings });
          }
        }

        if (allTicketPromises.length > 0) {
          const results = await Promise.all(allTicketPromises);
          const allBookingIds = results.map(r => r.ticket?.bookingId).filter(Boolean).join(', ');
          setBookingId(allBookingIds);
          setBookedEvents(bookedEventsList);
          setIsSuccess(true);

          if (cartItemIdsToRemove.length > 0) {
            dispatch(removeBookedItems(cartItemIdsToRemove));
          } else {
            dispatch(clearCartLocal());
          }

          try { await apiClient.delete('/cart/clear'); } catch (_) {}

          dispatch(fetchCart({ page: 1, limit: 10 }));
          toast.success(`${allTicketPromises.length} ticket(s) booked successfully!`);
        } else {
          toast.error('No tickets selected for booking');
          setProcessingBooking(false);
        }

      } else if (event) {
        // ── Single-event flow ──────────────────────────────────────────────
        const normalizedEvent = normalizeEventData(event);
        const bookingPromises = [];
        const eventBookings = [];

        for (const ticket of selectedTickets) {
          const ticketData = {
            eventId: normalizedEvent._id || normalizedEvent.id,
            eventName: normalizedEvent.title,
            eventDate: normalizedEvent.date,
            eventLocation: normalizedEvent.location,
            ticketType: ticket.type,
            quantity: ticket.quantity,
            price: ticket.price,
          };
          bookingPromises.push(dispatch(bookTicket(ticketData)).unwrap());
          eventBookings.push({ ticketType: ticket.type, quantity: ticket.quantity, price: ticket.price });
        }

        if (bookingPromises.length > 0) {
          const results = await Promise.all(bookingPromises);
          const allBookingIds = results.map(r => r.ticket?.bookingId).filter(Boolean).join(', ');
          setBookingId(allBookingIds);
          setBookedEvents([{ eventName: normalizedEvent.title, bookings: eventBookings }]);
          setIsSuccess(true);
          dispatch(clearCart());
          dispatch(fetchCart({ page: 1, limit: 10 }));
          toast.success(`${bookingPromises.length} ticket(s) booked successfully!`);
        } else {
          toast.error('No tickets selected for booking');
          setProcessingBooking(false);
        }

      } else {
        toast.error('No event data found');
        setProcessingBooking(false);
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.message || 'Booking failed. Please try again.');
      setProcessingBooking(false);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const getCurrentEvent = () => {
    if (fromCart && allBookings.length > 0) return allBookings[currentEventIndex].event;
    return normalizeEventData(event);
  };

  const currentEvent = getCurrentEvent();

  if (!currentEvent && !fromCart) {
    return (
      <div className="booking-error">
        <div className="error-card">
          <h2>Event Not Found</h2>
          <p>The event you're trying to book doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="booking-success-k">
        <main className="success-container">
          <div className="success-card">
            <div className="success-icon-wrapper">
              <FaCheck className="success-icon" />
            </div>
            <h2>Booking Confirmed! 🎉</h2>
            <p>Your tickets have been booked successfully.</p>
            <div className="booking-info">
              <p><strong>Booking ID(s):</strong> {bookingId}</p>
              {bookedEvents.map((be, idx) => (
                <div key={idx} className="booked-event-details">
                  <p><strong>Event:</strong> {be.eventName}</p>
                  {be.bookings.map((b, bidx) => (
                    <p key={bidx}>
                      <strong>Tickets:</strong> {b.quantity} × {b.ticketType} @ ${b.price}
                    </p>
                  ))}
                </div>
              ))}
              <p><strong>Total Amount:</strong> ${calculateTotal()}</p>
            </div>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => navigate('/my-tickets')}>
                View My Tickets
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="booking-container">
      <main className="booking-main">
        <button className="btn-back-k" onClick={() => navigate('/dashboard')}>
          <FaChevronLeft /> Back to Dashboard
        </button>

        <div className="booking-header-k">
          <h1>Book Your Tickets</h1>
          <p className="booking-subtitle">
            {fromCart && allBookings.length > 0
              ? `Booking for ${allBookings.length} event(s)`
              : `Secure your spot for ${currentEvent?.title}`}
          </p>
        </div>

        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}

        <div className="booking-details">
          <div className="event-summary">
            <div className="event-info">
              <h2>{currentEvent?.title}</h2>
              <div className="event-meta">
                <span>
                  <FaCalendarAlt />
                  {currentEvent?.formattedDate ||
                    (currentEvent?.date
                      ? new Date(currentEvent.date).toLocaleDateString()
                      : 'Date TBD')}
                </span>
                <span>
                  <FaMapMarkerAlt />
                  {currentEvent?.location || 'Location TBD'}
                </span>
              </div>
              {currentEvent?.category && (
                <span className="event-category">{currentEvent.category}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Ticket selection ── */}
            <div className="ticket-selection-section">
              <h3><FaTicketAlt /> Select Tickets</h3>
              {errors.tickets && <div className="error-message">{errors.tickets}</div>}

              <div className="ticket-types">
                {formData.selectedTickets?.map((ticket, index) => (
                  <div key={index} className={`ticket-option ${ticket.quantity > 0 ? 'selected' : ''}`}>
                    <div className="ticket-info">
                      {fromCart && ticket.eventTitle && (
                        <p className="ticket-event-name" style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                          {ticket.eventTitle}
                        </p>
                      )}
                      <h4>{ticket.type}</h4>
                      <p className="ticket-price">${ticket.price?.toFixed(2)}</p>
                      <p className="ticket-availability">{ticket.maxQuantity} tickets available</p>
                    </div>
                    <div className="ticket-quantity">
                      <label>Quantity:</label>
                      <div className="quantity-controls">
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() => handleTicketChange(index, ticket.quantity - 1)}
                          disabled={ticket.quantity === 0}
                        >-</button>
                        <input
                          type="number"
                          min="0"
                          max={ticket.maxQuantity}
                          value={ticket.quantity || 0}
                          onChange={(e) => handleTicketChange(index, e.target.value)}
                        />
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() => handleTicketChange(index, ticket.quantity + 1)}
                          disabled={ticket.quantity >= ticket.maxQuantity}
                        >+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Booking summary ── */}
            <div className="booking-summary">
              <div className="summary-details">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Tickets:</span><span>{calculateTotalTickets()}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span><span>${calculateTotal()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span><span>${calculateTotal()}</span>
                </div>
              </div>
            </div>

            {/* ── Attendee info ── */}
            <div className="attendee-info-section">
              <h3><FaUser /> Attendee Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className={errors.name ? 'error' : ''}
                    disabled={!!(isAuthenticated && user?.name)}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className={errors.email ? 'error' : ''}
                    disabled={!!(isAuthenticated && user?.email)}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: val });
                    }}
                    placeholder="Enter 10-digit phone number"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* ── Payment (demo) ── */}
            <div className="payment-section">
              <h3><FaCreditCard /> Payment Information</h3>
              <div className="payment-methods">
                <div className="payment-demo">
                  <p>💳 Demo Mode — No actual payment will be processed</p>
                  <p className="demo-note">
                    This is a demonstration. In production, integrate with Stripe, PayPal, or other payment gateways.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-confirm"
              disabled={bookingStatus === 'loading' || processingBooking}
            >
              {bookingStatus === 'loading' || processingBooking ? (
                <>Processing… <span className="spinner-small" /></>
              ) : (
                `Confirm Booking • $${calculateTotal()}`
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookTicket;