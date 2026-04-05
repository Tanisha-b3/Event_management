import React, { useEffect, useState } from 'react';
import { 
  FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaTrash, 
  FaArrowLeft, FaReceipt, FaDollarSign, FaHashtag, FaClock 
} from 'react-icons/fa';
import './tickets.css';
import Header from '../../pages/header.jsx';
import Footer from '../../pages/footer.jsx';
import { useNavigate } from 'react-router-dom';

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load tickets from localStorage
    const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
    setTickets(userTickets);
    setIsLoading(false);
  }, []);

  const cancelTicket = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      const updatedTickets = tickets.filter(ticket => ticket.bookingId !== bookingId);
      localStorage.setItem('userTickets', JSON.stringify(updatedTickets));
      setTickets(updatedTickets);
      
      // Optional: Show success message
      alert('Ticket cancelled successfully!');
    }
  };

  if (isLoading) {
    return (
      <div className="my-tickets-container">
        <Header />
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your tickets...</p>
        </div>
        <Footer />
      </div>
    );
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
            <FaTicketAlt style={{ fontSize: '4rem', color: 'var(--primary-300)', marginBottom: '1rem' }} />
            <p>You haven't booked any tickets yet.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/discover')}
            >
              Discover Events
            </button>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket, index) => (
              <div key={ticket.bookingId || index} className="ticket-card">
                <div className="ticket-header">
                  <FaTicketAlt className="ticket-icon" />
                  <h2>{ticket.eventTitle || 'Ticket Details'}</h2>
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
                    <span>{new Date(ticket.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <FaClock />
                    <span>{new Date(ticket.eventDate).toLocaleTimeString()}</span>
                  </div>
                  <div className="detail-item">
                    <FaMapMarkerAlt />
                    <span>{ticket.eventLocation}</span>
                  </div>
                  <div className="detail-item">
                    <FaReceipt />
                    <span>Type: {ticket.ticketType}</span>
                  </div>
                  <div className="detail-item">
                    <FaTicketAlt />
                    <span>Qty: {ticket.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <FaDollarSign />
                    <span>Total: ${(ticket.price * ticket.quantity).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <FaHashtag />
                    <span>ID: {ticket.bookingId?.slice(-8).toUpperCase()}</span>
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