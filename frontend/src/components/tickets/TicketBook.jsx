import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTicketAlt, FaUser, FaCreditCard, FaCheck, FaArrowLeft, FaChevronLeft} from 'react-icons/fa';
import './BookTicket.css';
import Header from '../../pages/header';
import Footer from '../../pages/footer';

const BookTicket = () => {
  const location = useLocation();
  const event = location.state?.event;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    selectedTickets: event.tickets.map(ticket => ({
      type: ticket.type,
      price: ticket.price,
      quantity: 0
    }))
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  //  const navigate = useNavigate();
  const handleTicketChange = (index, value) => {
    const updatedTickets = [...formData.selectedTickets];
    updatedTickets[index].quantity = parseInt(value) || 0;
    setFormData({ ...formData, selectedTickets: updatedTickets });
  };

  const calculateTotal = () => {
    return formData.selectedTickets.reduce(
      (sum, ticket) => sum + (ticket.price * ticket.quantity), 0
    ).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create ticket records
    const tickets = formData.selectedTickets
      .filter(ticket => ticket.quantity > 0)
      .map(ticket => ({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        ticketType: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        bookingDate: new Date().toISOString(),
        bookingId: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
    
    if (tickets.length === 0) {
      alert('Please select at least one ticket');
      return;
    }
    
    // Save to localStorage
    const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
    localStorage.setItem('userTickets', JSON.stringify([...userTickets, ...tickets]));
    
    // Update event tickets quantity
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const updatedEvents = events.map(ev => {
      if (ev.id === event.id) {
        const updatedTickets = ev.tickets.map(ticket => {
          const bookedTicket = formData.selectedTickets.find(t => t.type === ticket.type);
          if (bookedTicket) {
            return {
              ...ticket,
              quantity: ticket.quantity - bookedTicket.quantity
            };
          }
          return ticket;
        });
        
        return {
          ...ev,
          tickets: updatedTickets,
          ticketsSold: ev.ticketsSold + formData.selectedTickets.reduce(
            (sum, ticket) => sum + ticket.quantity, 0),
          revenue: ev.revenue + parseFloat(calculateTotal())
        };
      }
      return ev;
    });
    
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    setIsSuccess(true);
  };

  if (!event) {
    return <div>Event not found</div>;
  }

  if (isSuccess) {
    return (
      <div className="booking-success">
        <Header />
        <main className="success-container">
          <div className="success-card">
            <FaCheck className="success-icon" />
            <h2>Booking Confirmed!</h2>
            <p>Your tickets have been booked successfully.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/my-tickets')}
            >
              View My Tickets
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (<>
    <div className="booking-container">
      <Header />
      <button className="btn-back" onClick={() => navigate('/dashboard')} >
                    <FaChevronLeft /> Back to Dashboard
                  </button>
      <main className="booking-main">
        <h1>Book Tickets: {event.title}</h1>
        
        <div className="booking-details">
          <div className="event-info">
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="ticket-selection">
              <h2><FaTicketAlt /> Available Tickets</h2>
              
              {event.tickets.map((ticket, index) => (
                <div key={index} className="ticket-option">
                  <div className="ticket-info">
                    <h3>{ticket.type}</h3>
                    <p>${ticket.price.toFixed(2)} each</p>
                    <p>{ticket.quantity} available</p>
                  </div>
                  <div className="ticket-quantity">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      min="0"
                      max={ticket.quantity}
                      value={formData.selectedTickets[index].quantity}
                      onChange={(e) => handleTicketChange(index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="booking-summary">
              <h3>Total: ${calculateTotal()}</h3>
            </div>
            
            <div className="attendee-info">
              <h2><FaUser /> Attendee Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="payment-info">
              <h2><FaCreditCard /> Payment Information</h2>
              {/* In a real app, you would integrate with a payment gateway here */}
              <div className="mock-payment">
                <p>Payment processing would appear here in a real application</p>
              </div>
            </div>
            
            <button type="submit" className="btn-primary">
              Confirm Booking
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
};

export default BookTicket;