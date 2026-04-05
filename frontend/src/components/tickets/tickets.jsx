import React, { useEffect, useState } from 'react';
import { 
  FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaTrash, 
  FaArrowLeft, FaReceipt, FaDollarSign, FaHashtag, FaClock 
} from 'react-icons/fa';
import './tickets.css';
import Header from '../../pages/header.jsx';
import Footer from '../../pages/footer.jsx';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/api';

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [error, setError] = useState('');
  const [ticketToCancel, setTicketToCancel] = useState(null);

  const loadTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/tickets');
      const serverTickets = data?.tickets || [];
      setTickets(serverTickets);
      localStorage.setItem('userTickets', JSON.stringify(serverTickets));
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Unable to load tickets right now.';
      setError(message);

      // Fallback to any locally cached tickets so the page still shows something.
      const cachedTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
      setTickets(cachedTickets);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const cancelTicket = async (ticket) => {
    const reference = ticket.bookingId || ticket._id;
    if (!reference) return;

    setCancellingId(reference);
    try {
      if (ticket._id) {
        await apiClient.delete(`/tickets/${ticket._id}`);
      }

      const updatedTickets = tickets.filter(
        (item) => item._id !== ticket._id && item.bookingId !== ticket.bookingId
      );

      setTickets(updatedTickets);
      localStorage.setItem('userTickets', JSON.stringify(updatedTickets));
      alert('Ticket cancelled successfully!');
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Unable to cancel this ticket. Please try again.';
      alert(message);
    } finally {
      setCancellingId('');
      setTicketToCancel(null);
    }
  };

  const openCancelModal = (ticket) => {
    setTicketToCancel(ticket);
  };

  const closeCancelModal = () => {
    setTicketToCancel(null);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString();
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
      <br/>
      <br/>
      <main className="my-tickets-main">
        <h1>My Tickets</h1>

        {error && (
          <div className="no-tickets" style={{ padding: '1rem', marginTop: 0 }}>
            <p style={{ margin: 0, color: 'var(--neutral-700)' }}>{error}</p>
          </div>
        )}
        
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
            {tickets.map((ticket, index) => {
              const key = ticket._id || ticket.bookingId || index;
              const title = ticket.eventTitle || ticket.eventName || 'Ticket Details';
              const location = ticket.eventLocation || ticket.location || '—';

              return (
                <div key={key} className="ticket-card">
                  <div className="ticket-header">
                    <FaTicketAlt className="ticket-icon" />
                    <h2 title={title}>{title}</h2>
                    <button 
                      className="btn-cancel"
                      onClick={() => openCancelModal(ticket)}
                      disabled={cancellingId === key}
                    >
                      <FaTrash /> {cancellingId === key ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                  
                  <div className="ticket-details">
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>{formatDate(ticket.eventDate)}</span>
                    </div>
                    <div className="detail-item">
                      <FaClock />
                      <span>{formatTime(ticket.eventDate)}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span title={location}>{location}</span>
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
              );
            })}
          </div>
        )}

        {ticketToCancel && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h3>Cancel this ticket?</h3>
              <p>This will remove the booking and free the seats.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeCancelModal} disabled={!!cancellingId}>Keep Ticket</button>
                <button 
                  className="btn-danger"
                  onClick={() => cancelTicket(ticketToCancel)}
                  disabled={!!cancellingId}
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTickets;
