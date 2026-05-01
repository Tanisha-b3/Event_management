import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaTrash, 
  FaArrowLeft, FaReceipt, FaDollarSign, FaHashtag, FaClock, 
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import './tickets.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomDropdown from '../customDropdown.jsx';
import {
  fetchUserTickets,
  cancelTicket,
  selectUserTickets,
  selectTicketPagination,
  selectTicketsLoading,
  selectTicketError,
  selectCancellationStatus,
  resetCancellationStatus,
  clearTicketError
} from "../../store/slices/TicketSlice.js";

const MyTickets = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  // Redux selectors
  const tickets = useSelector(selectUserTickets);
  const pagination = useSelector(selectTicketPagination);
  const isLoading = useSelector(selectTicketsLoading);
  const error = useSelector(selectTicketError);
  const cancellationStatus = useSelector(selectCancellationStatus);
  
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  const debounceTimeout = useRef();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load tickets with pagination
  const loadTickets = useCallback(async (page = 1, limit = 10) => {
    try {
      await dispatch(fetchUserTickets({ page, limit })).unwrap();
    } catch (err) {
      // Error is already handled in the slice
      console.error('Failed to load tickets:', err);
    }
  }, [dispatch]);

  // Debounced fetch for tickets
  useEffect(() => {
    if (isAuthenticated) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        loadTickets(currentPage, ticketsPerPage);
      }, 200);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [isAuthenticated, currentPage, ticketsPerPage, loadTickets]);

  // Reset cancellation status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetCancellationStatus());
      dispatch(clearTicketError());
    };
  }, [dispatch]);

  // Show toast for cancellation status
  useEffect(() => {
    if (cancellationStatus === 'succeeded') {
      toast.success('Ticket cancelled successfully!');
      dispatch(resetCancellationStatus());
    } else if (cancellationStatus === 'failed') {
      toast.error(error || 'Failed to cancel ticket');
      dispatch(resetCancellationStatus());
    }
  }, [cancellationStatus, error, dispatch]);

  // Pagination controls
  const goToNextPage = useCallback(() => {
    if (currentPage < pagination.pages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, pagination.pages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleCancelTicket = async (ticket) => {
    if (!ticket._id) {
      toast.error('Invalid ticket ID');
      return;
    }

    try {
      await dispatch(cancelTicket(ticket._id)).unwrap();
      setTicketToCancel(null);
    } catch (err) {
      // Error is handled by the slice and toast above
      console.error('Cancel failed:', err);
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
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isTicketExpired = (eventDate) => {
    if (!eventDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(0, 0, 0, 0);
    return eventDateTime < now;
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (isLoading && tickets.length === 0) {
    return (
      <div className="my-tickets-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-tickets-container ${isDark ? 'dark-mode' : ''}`}>
      <button 
        className={`btn-back ${isDark ? 'dark' : ''}`}
        onClick={() => navigate("/discover")}
      >
        <FaArrowLeft /> Back 
      </button>
 
      <main className={`my-tickets-main discover-header ${isDark ? 'dark' : ''}`}>
        <h1 className={isDark ? 'text-white' : ''}>My Tickets</h1>

        {error && tickets.length === 0 && (
          <div className="no-tickets">
            <FaTicketAlt className="no-tickets-icon" />
            <p>{error}</p>
            <button 
              className="btn-primary"
              onClick={() => loadTickets(currentPage, ticketsPerPage)}
            >
              Try Again
            </button>
          </div>
        )}
        
        {tickets.length === 0 && !isLoading && !error ? (
          <div className="no-tickets">
            <FaTicketAlt className="no-tickets-icon" />
            <p>You haven't booked any tickets yet.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/discover')}
            >
              Discover Events
            </button>
          </div>
        ) : (
          <>
            <div className="tickets-list">
              {tickets.map((ticket, index) => {
                const key = ticket._id || ticket.bookingId || index;
                const title = ticket.eventTitle || ticket.eventName || 'Ticket Details';
                const location = ticket.eventLocation || ticket.location || '—';
                const isCancelling = cancellationStatus === 'loading' && ticketToCancel?._id === ticket._id;
                const isExpired = isTicketExpired(ticket.eventDate);

                return (
                  <div key={key} className={`ticket-card ${isExpired ? 'ticket-expired' : ''}`}>
                    <div className="ticket-header">
                      <FaTicketAlt className="ticket-icon" />
                      <h2 title={title}>{title.length > 50 ? `${title.substring(0, 50)}...` : title}</h2>
                      {!isExpired && !ticket.isCancelled && (
                        <button 
                          className="btn-cancel"
                          onClick={() => openCancelModal(ticket)}
                          disabled={isCancelling}
                        >
                          <FaTrash /> {isCancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
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
                        <span title={location}>{location.length > 30 ? `${location.substring(0, 30)}...` : location}</span>
                      </div>
                      <div className="detail-item">
                        <FaReceipt />
                        <span>Type: {ticket.ticketType || 'General Admission'}</span>
                      </div>
                      <div className="detail-item">
                        <FaTicketAlt />
                        <span>Qty: {ticket.quantity}</span>
                      </div>
                      <div className="detail-item">
                        <FaDollarSign />
                        <span>Total: ${((ticket.price || 0) * (ticket.quantity || 0)).toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <FaHashtag />
                        <span>ID: {ticket.bookingId?.slice(-8).toUpperCase() || ticket._id?.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                    
                    {/* Show cancelled badge if ticket is cancelled */}
                    {ticket.isCancelled && (
                      <div className="ticket-cancelled-badge">
                        Cancelled
                      </div>
                    )}
                    
                    {/* Show expired badge if event has passed */}
                    {isExpired && !ticket.isCancelled && (
                      <div className="ticket-expired-badge">
                        Expired
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                </div>
                <div className="pagination-controls">
                  <button 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1 || isLoading} 
                    className="pagination-btn"
                  >
                    <FaChevronLeft/>
                  </button>
                  
                  {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                      if (i === 6) pageNum = '...';
                    } else if (currentPage >= pagination.pages - 3) {
                      pageNum = pagination.pages - 6 + i;
                      if (i === 0) pageNum = '...';
                    } else {
                      const startPage = currentPage - 3;
                      pageNum = startPage + i;
                      if (i === 0) pageNum = '...';
                      if (i === 6) pageNum = '...';
                    }
                    
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === pagination.pages || isLoading} 
                    className="pagination-btn"
                  >
                    <FaChevronRight />
                  </button>
                  
                  <CustomDropdown
                    value={ticketsPerPage}
                    onChange={(val) => {
                      setTicketsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 5, label: '5 per page' },
                      { value: 10, label: '10 per page' },
                      { value: 15, label: '15 per page' },
                      { value: 20, label: '20 per page' },
                      { value: 30, label: '30 per page' },
                      { value: 50, label: '50 per page' },
                    ]}
                    placeholder="Select per page"
                    className="per-page-select"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Cancel Confirmation Modal */}
        {ticketToCancel && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeCancelModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>Cancel this ticket?</h3>
              <p>This action cannot be undone. You will lose your seat and no refund will be issued.</p>
              <div className="ticket-info-preview">
                <strong>{ticketToCancel.eventName || ticketToCancel.eventTitle}</strong>
                <span>{ticketToCancel.quantity} ticket(s) - ${((ticketToCancel.price || 0) * (ticketToCancel.quantity || 0)).toFixed(2)}</span>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-secondary-k" 
                  onClick={closeCancelModal} 
                  disabled={cancellationStatus === 'loading'}
                >
                  Keep Ticket
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleCancelTicket(ticketToCancel)}
                  disabled={cancellationStatus === 'loading'}
                >
                  {cancellationStatus === 'loading' ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTickets;