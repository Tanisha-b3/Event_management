import React, { useEffect, useState } from 'react';
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaTrash } from 'react-icons/fa'
import './tickets.css'
import Header from '../../pages/header.jsx';
import Footer from '../../pages/footer.jsx';
import { useNavigate } from 'react-router-dom';
 
const MyTickets = () => {
    const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
    setTickets(userTickets);
    setIsLoading(false);
  }, []);

  const cancelTicket = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      const updatedTickets = tickets.filter(ticket => ticket.bookingId !== bookingId);
      localStorage.setItem('userTickets', JSON.stringify(updatedTickets));
      setTickets(updatedTickets);
      
    }
  };

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="my-tickets-container">
      <Header />
      <button 
                    className="btn-back"
                    onClick={() => navigate('/dashboard')}
                  >
                    <FaArrowLeft /> Back to Dashboard
                  </button>
      <main className="my-tickets-main">
        <h1>My Tickets</h1>
        
        {tickets.length === 0 ? (
          <div className="no-tickets">
            <p>You haven't booked any tickets yet.</p>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket, index) => (
              <div key={index} className="ticket-card">
                <div className="ticket-header">
                  <FaTicketAlt className="ticket-icon" />
                  <h2>Details</h2>
                  <button 
                    className="btn-cancel"
                    onClick={() => cancelTicket(ticket.bookingId)}
                  >
                    <FaTrash /> Cancel
                  </button>
                </div>
                
                <div className="ticket-details">
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <span>{new Date(ticket.eventDate).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <FaMapMarkerAlt />
                    <span>{ticket.eventLocation}</span>
                  </div>
                  <div className="detail-item">
                    <span>Ticket Type: {ticket.ticketType}</span>
                  </div>
                  <div className="detail-item">
                    <span>Quantity: {ticket.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <span>Total: ${(ticket.price * ticket.quantity).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Booking ID: {ticket.bookingId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTickets;