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
    selectedTickets: []
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [errors, setErrors] = useState({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [processingBooking, setProcessingBooking] = useState(false);
  const [bookedEvents, setBookedEvents] = useState([]);

  // Helper function to normalize event data (fix duplicate/nested structure)
  const normalizeEventData = (eventData) => {

    // console.log('Normalizing event data:', eventData);
    if (!eventData) return null;
    
    // If event has nested structure, extract the proper data
    const normalized = {};
    
    // Get the innermost event data if it's nested
    let sourceData = eventData;
    while (sourceData._id && sourceData._id !== sourceData.id && sourceData.id !== sourceData._id) {
      if (sourceData.event) {
        sourceData = sourceData.event;
      } else if (sourceData.data) {
        sourceData = sourceData.data;
      } else {
        break;
      }
    }
    
    // Extract properties from source
    normalized._id = sourceData._id || sourceData.id;
    normalized.id = sourceData.id || sourceData._id;
    normalized.title = sourceData.title || '';
    normalized.location = sourceData.location || '';
    normalized.category = sourceData.category || '';
    normalized.capacity = sourceData.capacity || 0;
    normalized.imageName = sourceData.imageName || '';
    normalized.imageName =  sourceData.imageName || '';
    normalized.image = sourceData.image || '';
    normalized.tickets = sourceData.tickets || [];
    
    // Handle date properly
    if (sourceData.date) {
      normalized.date = sourceData.date;
      normalized.formattedDate = new Date(sourceData.date).toLocaleDateString();
    } else {
      normalized.date = null;
      normalized.formattedDate = 'Date TBD';
    }
    
    return normalized;
  };

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      setErrors(prev => ({ ...prev, submit: error }));
      setProcessingBooking(false);
      dispatch(resetBookingStatus());
    }
  }, [error, dispatch]);

  // Initialize tickets from cart items or event prop
  useEffect(() => {
    if (fromCart && cartItems && cartItems.length > 0) {
      const groupedByEvent = cartItems.reduce((acc, item) => {
        console.log('Processing cart item:', item);
        if (!acc[item.eventId]) {
          acc[item.eventId] = {
            event: {
              _id: item.eventId,
              id: item.eventId,
              title: item.eventName,
              date: item.eventDate,
              location: item.eventLocation,
              image: item.eventImage,
              tickets: []
            },
            items: []
          };
        }
        acc[item.eventId].items.push(item);
        acc[item.eventId].event.tickets.push({
          type: item.ticketType,
          price: item.price,
          quantity: item.availableQuantity || 100,
          originalQuantity: item.quantity
        });
        return acc;
      }, {});
      
      const eventsList = Object.values(groupedByEvent);
      if (eventsList.length > 0) {
        const firstEvent = eventsList[0];
        const selectedTickets = firstEvent.event.tickets.map(ticket => {
          const cartItem = firstEvent.items.find(item => item.ticketType === ticket.type);
          return {
            type: ticket.type,
            price: ticket.price,
            quantity: cartItem ? cartItem.quantity : 0,
            maxQuantity: ticket.quantity
          };
        });
        
        setFormData(prev => ({
          ...prev,
          selectedTickets
        }));
        setAllBookings(eventsList);
      }
    } else if (event) {
      const normalizedEvent = normalizeEventData(event);
      if (normalizedEvent && normalizedEvent.tickets) {
        setFormData(prev => ({
          ...prev,
          selectedTickets: normalizedEvent.tickets.map(ticket => ({
            type: ticket.type,
            price: ticket.price,
            quantity: 0,
            maxQuantity: ticket.quantity
          }))
        }));
      }
    }
  }, [event, cartItems, fromCart]);

  const handleTicketChange = (index, value) => {
    const quantity = parseInt(value) || 0;
    const maxQuantity = formData.selectedTickets[index]?.maxQuantity;
    
    if (quantity <= maxQuantity && quantity >= 0) {
      const updatedTickets = [...formData.selectedTickets];
      updatedTickets[index].quantity = quantity;
      setFormData({ ...formData, selectedTickets: updatedTickets });
      
      if (errors.tickets) {
        const newErrors = { ...errors };
        delete newErrors.tickets;
        setErrors(newErrors);
      }
    }
  };

  const calculateTotal = () => {
    return formData.selectedTickets.reduce(
      (sum, ticket) => sum + (ticket.price * ticket.quantity), 0
    ).toFixed(2);
  };

  const calculateTotalTickets = () => {
    return formData.selectedTickets.reduce(
      (sum, ticket) => sum + ticket.quantity, 0
    );
  };

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
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

   else if (!/^\d{10}$/.test(formData.phone)) {
  newErrors.phone = 'Phone number must be exactly 10 digits';
}
    
    const totalTickets = calculateTotalTickets();
    if (totalTickets === 0) {
      newErrors.tickets = 'Please select at least one ticket';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      if (fromCart && allBookings.length > 0) {
        const allTicketPromises = [];
        const bookedEventsList = [];
        const cartItemIdsToRemove = [];
        
        for (const booking of allBookings) {
          const eventBookings = [];
          
          for (const ticket of booking.event.tickets) {
            const cartItem = booking.items.find(item => item.ticketType === ticket.type);
            const quantity = cartItem?.quantity || 0;
            if (quantity > 0) {
              const ticketData = {
                eventId: booking.event._id,
                eventName: booking.event.title,
                eventDate: booking.event.date,
                eventLocation: booking.event.location,
                ticketType: ticket.type,
                quantity: quantity,
                price: ticket.price,
              };
              const promise = dispatch(bookTicket(ticketData)).unwrap();
              allTicketPromises.push(promise);
              eventBookings.push({ ticketType: ticket.type, quantity, price: ticket.price });
              
              const cartItemFound = booking.items.find(item => item.ticketType === ticket.type);
              if (cartItemFound) {
                cartItemIdsToRemove.push(cartItemFound.id);
              }
            }
          }
          
          if (eventBookings.length > 0) {
            bookedEventsList.push({
              eventName: booking.event.title,
              bookings: eventBookings
            });
          }
        }
        
        if (allTicketPromises.length > 0) {
          const results = await Promise.all(allTicketPromises);
          const allBookingIds = results.map(r => r.ticket?.bookingId).filter(id => id).join(', ');
          setBookingId(allBookingIds);
          setBookedEvents(bookedEventsList);
          setIsSuccess(true);
          
          if (cartItemIdsToRemove.length > 0) {
            dispatch(removeBookedItems(cartItemIdsToRemove));
          } else {
            dispatch(clearCartLocal());
          }
          
          try {
            await apiClient.delete('/cart/clear');
          } catch (e) {
            console.log('Cart already cleared on server');
          }
          
          dispatch(fetchCart({ page: 1, limit: 10 }));
          toast.success(`${allTicketPromises.length} ticket(s) booked successfully!`);
        } else {
          toast.error('No tickets selected for booking');
          setProcessingBooking(false);
        }
        
      } else if (event) {
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
          const allBookingIds = results.map(r => r.ticket?.bookingId).filter(id => id).join(', ');
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

  const getCurrentEvent = () => {
    if (fromCart && allBookings.length > 0) {
      return allBookings[currentEventIndex].event;
    }
    return normalizeEventData(event);
  };

  const currentEvent = getCurrentEvent();
  console.log('Current Event Data:', currentEvent);

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

  if (isSuccess) {
    return (
      <div className="booking-success">
        <main className="success-container">
          <div className="success-card">
            <div className="success-icon-wrapper">
              <FaCheck className="success-icon" />
            </div>
            <h2>Booking Confirmed! 🎉</h2>
            <p>Your tickets have been booked successfully.</p>
            <div className="booking-info">
              <p><strong>Booking ID(s):</strong> {bookingId}</p>
              {bookedEvents.map((bookedEvent, idx) => (
                <div key={idx} className="booked-event-details">
                  <p><strong>Event:</strong> {bookedEvent.eventName}</p>
                  {bookedEvent.bookings.map((booking, bidx) => (
                    <p key={bidx}>
                      <strong>Tickets:</strong> {booking.quantity} x {booking.ticketType} @ ${booking.price}
                    </p>
                  ))}
                </div>
              ))}
              <p><strong>Total Amount:</strong> ${calculateTotal()}</p>
            </div>
            <div className="success-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/my-tickets')}
              >
                View My Tickets
              </button>
              <button 
                className="btn-secondary-k"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <main className="booking-main">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <FaChevronLeft /> Back to Dashboard
        </button>
        
        <div className="booking-header-k">
          <h1>Book Your Tickets</h1>
          <p className="booking-subtitle">
            {fromCart && allBookings.length > 1 
              ? `Event ${currentEventIndex + 1} of ${allBookings.length}: ${currentEvent?.title}`
              : `Secure your spot for ${currentEvent?.title}`
            }
          </p>
        </div>
        
        {errors.submit && (
          <div className="error-message submit-error">
            {errors.submit}
          </div>
        )}
        
        <div className="booking-details">
          <div className="event-summary">
            {/* <div className="event-image-k">
              {/* <img 
                src={currentEvent?.image ? `${import.meta.vite.env.VITE_API_URL}/images/${currentEvent.image}` : currentEvent.image} 
                alt={currentEvent?.title || 'Event Image'} 
              /> */}
            {/* </div> */}
            <div className="event-info">
              <h2>{currentEvent?.title}</h2>
              <div className="event-meta">
                <span>
                  <FaCalendarAlt /> 
                  {currentEvent?.formattedDate || (currentEvent?.date ? new Date(currentEvent.date).toLocaleDateString() : 'Date TBD')}
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
            <div className="ticket-selection-section">
              <h3><FaTicketAlt /> Select Tickets</h3>
              {errors.tickets && <div className="error-message">{errors.tickets}</div>}
              
              <div className="ticket-types">
                {formData.selectedTickets?.map((ticket, index) => (
                  <div key={index} className={`ticket-option ${ticket.quantity > 0 ? 'selected' : ''}`}>
                    <div className="ticket-info">
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
                        >
                          -
                        </button>
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
                          disabled={ticket.quantity === ticket.maxQuantity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="booking-summary">
              <div className="summary-details">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Tickets:</span>
                  <span>{calculateTotalTickets()}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>
            
            <div className="attendee-info-section">
              <h3><FaUser /> Attendee Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    className={errors.name ? 'error' : ''}
                    disabled={isAuthenticated && user?.name}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email"
                    className={errors.email ? 'error' : ''}
                    disabled={isAuthenticated && user?.email}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
  type="tel"
  maxLength={10}
  pattern="[0-9]{10}"
  value={formData.phone}
  onChange={(e) => {
    // Only allow digits and max 10
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
            
            <div className="payment-section">
              <h3><FaCreditCard /> Payment Information</h3>
              <div className="payment-methods">
                <div className="payment-demo">
                  <p>💳 Demo Mode - No actual payment will be processed</p>
                  <p className="demo-note">This is a demonstration. In production, integrate with Stripe, PayPal, or other payment gateways.</p>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-confirm"
              disabled={bookingStatus === 'loading' || processingBooking}
            >
              {bookingStatus === 'loading' || processingBooking ? (
                <>Processing... <span className="spinner-small"></span></>
              ) : (
                fromCart && allBookings.length > 1 && currentEventIndex + 1 < allBookings.length
                  ? `Confirm & Continue • $${calculateTotal()}`
                  : `Confirm Booking • $${calculateTotal()}`
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookTicket;