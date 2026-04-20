import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllTicketsAdmin,
  adminBookTicket,
  adminCancelTicket
} from '../store/slices/TicketSlice';
import { fetchEvents } from '../store/slices/eventSlice';
import './adminTickets.css';
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';
import CustomDropdown from './customDropdown';
import { FaArrowLeft } from 'react-icons/fa';

const AdminTickets = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userRole = useSelector((state) => state.auth.user?.role);
  const { allTickets, loading, error, adminPagination, adminBookingStatus, adminCancellationStatus } = useSelector((state) => state.tickets);
  const totalPages = adminPagination?.pages || 1;
  const { events } = useSelector((state) => state.events);
  
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  
  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingTicket, setCancellingTicket] = useState(null);
  
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  
  const [newBooking, setNewBooking] = useState({
    userEmail: '',
    userName: '',
    eventId: '',
    quantity: 1,
    ticketType: 'General Admission',
    price: ''
  });
  
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  

    const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  // Memoized event options to prevent unnecessary re-renders
  const eventOptions = useMemo(() => {
    return events.map(event => ({
      value: event._id,
      label: `${event.title} - ${formatDate(event.date)}`
    }));
  }, [events]);
  
  const handleOpenCancelDialog = (ticket) => {
    setCancellingTicket(ticket);
    setCancelReason('');
    setCancelDialogOpen(true);
  };
  
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancellingTicket(null);
    setCancelReason('');
  };
  
  // Debounced user search to prevent excessive API calls
  const fetchUsers = useCallback(async (email) => {
    if (!email || email.length < 2) {
      setUsers([]);
      setShowUserDropdown(false);
      return;
    }
    setUsersLoading(true);
    try {
      const { data } = await apiClient.get('/users/search', { params: { q: email } });
      setUsers(data.users || []);
      setShowUserDropdown(data.users && data.users.length > 0);
    } catch (err) {
      console.error('Error searching users:', err);
      setShowUserDropdown(false);
    } finally {
      setUsersLoading(false);
    }
  }, []);
  
  const handleSelectUser = (user) => {
    setNewBooking({
      ...newBooking,
      userEmail: user.email,
      userName: user.name || ''
    });
    setShowUserDropdown(false);
    setUsers([]);
  };
  
  const handleBookTicket = async () => {
    if (!newBooking.userEmail || !newBooking.eventId || !newBooking.quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const ticketData = {
      userEmail: newBooking.userEmail,
      userName: newBooking.userName,
      eventId: newBooking.eventId,
      ticketType: newBooking.ticketType,
      quantity: parseInt(newBooking.quantity),
      price: parseFloat(newBooking.price) || undefined
    };
    
    const result = await dispatch(adminBookTicket(ticketData));
    if (adminBookTicket.fulfilled.match(result)) {
      toast.success('Ticket booked successfully!');
      setBookDialogOpen(false);
      setNewBooking({
        userEmail: '',
        userName: '',
        eventId: '',
        quantity: 1,
        ticketType: 'General Admission',
        price: ''
      });
      // Refresh tickets
      dispatch(fetchAllTicketsAdmin({ page, limit: 20, eventId: selectedEvent || null }));
    } else {
      toast.error(result.payload || 'Failed to book ticket');
    }
  };
  
  const handleCancelTicket = async () => {
    const result = await dispatch(adminCancelTicket({ ticketId: cancellingTicket._id, reason: cancelReason }));
    if (adminCancelTicket.fulfilled.match(result)) {
      toast.success('Ticket cancelled and user notified');
      handleCloseCancelDialog();
      // Refresh tickets
      dispatch(fetchAllTicketsAdmin({ page, limit: 20, eventId: selectedEvent || null }));
    } else {
      toast.error(result.payload || 'Failed to cancel ticket');
    }
  };
  

  
  // Memoized stats to prevent recalculation on every render
  const stats = useMemo(() => {
    const totalTickets = allTickets.length;
    const activeTickets = allTickets.filter(t => !t.isCancelled).length;
    const cancelledTickets = allTickets.filter(t => t.isCancelled).length;
    const totalRevenue = allTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    return { totalTickets, activeTickets, cancelledTickets, totalRevenue };
  }, [allTickets]);
  
  // Fetch data with proper dependencies
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'organiser') {
      dispatch(fetchAllTicketsAdmin({ page, limit: 20, eventId: selectedEvent || null }));
      dispatch(fetchEvents({ page: 1, limit: 100 }));
    }
  }, [dispatch, userRole, page, selectedEvent]);
  
  if (userRole !== 'admin' && userRole !== 'organiser') {
    return (
      <div className={`admin-tickets ${isDark ? 'dark-theme' : 'light-theme'}`}>
        <div className="access-denied">
          <div className="access-denied-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Access Denied</h3>
            <p>Admin/Organiser only.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`admin-tickets ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <div className="admin-container">
        {/* Back Button */}
        <button className="btn-back-k" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
       
        {/* Main Content Card */}
        <div className="main-card">
          {/* Header Section */}
          <div className="card-header">
            <div className="header-left-k">
              <h1 className="header-title-k">Ticket Management</h1>
              <p className="header-subtitle-k">Manage and monitor all ticket bookings</p>
            </div>
            <button className="btn-primary-k" onClick={() => setBookDialogOpen(true)}>
              + Book Ticket
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card-primary">
              <div className="stat-info">
                <span className="stat-label">Total Tickets</span>
                <span className="stat-value">{stats.totalTickets}</span>
              </div>
              <div className="stat-icon">🎫</div>
            </div>
            
            <div className="stat-card stat-card-success">
              <div className="stat-info">
                <span className="stat-label">Active Tickets</span>
                <span className="stat-value">{stats.activeTickets}</span>
              </div>
              <div className="stat-icon">✓</div>
            </div>
            
            <div className="stat-card stat-card-error">
              <div className="stat-info">
                <span className="stat-label">Cancelled</span>
                <span className="stat-value">{stats.cancelledTickets}</span>
              </div>
              <div className="stat-icon">✗</div>
            </div>
            
            <div className="stat-card stat-card-warning">
              <div className="stat-info">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value">{formatPrice(stats.totalRevenue)}</span>
              </div>
              <div className="stat-icon">💰</div>
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="filter-section">
            <div className="tabs-k">
              <button 
                className={`tab-k ${tabValue === 0 ? 'active' : ''}`}
                onClick={() => setTabValue(0)}
              >
                All Tickets
              </button>
              <button 
                className={`tab-k ${tabValue === 1 ? 'active' : ''}`}
                onClick={() => setTabValue(1)}
              >
                By Event
              </button>
            </div>
            
            {tabValue === 1 && (
              <div className="filter-controls">
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <CustomDropdown
                    value={selectedEvent}
                    onChange={(val) => {
                      setSelectedEvent(val);
                      setPage(1);
                    }}
                    options={[
                      { value: '', label: 'All Events' },
                      ...eventOptions
                    ]}
                    placeholder="Filter by Event"
                    searchable
                    size="md"
                    style={{ width: '100%' }}
                  />
                </div>
                <button className="btn-outline" onClick={() => dispatch(fetchAllTicketsAdmin({ page: 1, limit: 20, eventId: selectedEvent || null }))}>
                  Apply Filter
                </button>
              </div>
            )}
          </div>
          
          {/* Tickets Table */}
          <div className="table-section">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : allTickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No tickets found</h3>
                <p>{selectedEvent ? 'Try changing your filter criteria' : 'Book your first ticket to get started'}</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>User</th>
                        <th>Event</th>
                        <th>Ticket Type</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTickets.map((ticket) => (
                        <tr key={ticket._id} className="ticket-row">
                          <td className="booking-id">{ticket.bookingId}</td>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar-k">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <div>
                                <div className="user-name-k">{ticket.userName}</div>
                                <div className="user-email-k">{ticket.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="event-name">{ticket.eventName}</td>
                          <td>
                            <span className="ticket-type-badge">{ticket.ticketType}</span>
                          </td>
                          <td className="text-center quantity">x{ticket.quantity}</td>
                          <td className="text-right price">{formatPrice(ticket.price * ticket.quantity)}</td>
                          <td className="date">{formatDate(ticket.createdAt)}</td>
                          <td>
                            {ticket.isCancelled ? (
                              <span className="status-badge status-cancelled">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Cancelled
                              </span>
                            ) : (
                              <span className="status-badge status-active">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Active
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {!ticket.isCancelled && (
                              <button 
                                className="delete-btn"
                                onClick={() => handleOpenCancelDialog(ticket)}
                                title="Cancel Ticket"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      ‹
                    </button>
                    {[...Array(Math.min(totalPages, 7)).keys()].map(i => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                        if (i === 6) pageNum = totalPages;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      if (pageNum > totalPages) return null;
                      if (i === 5 && pageNum < totalPages - 1 && totalPages > 7) {
                        return <span key="ellipsis" className="page-ellipsis">...</span>;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${page === pageNum ? 'active' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button 
                      className="page-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Cancel Ticket Modal */}
        {cancelDialogOpen && (
          <div className="modal-overlay" onClick={handleCloseCancelDialog}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Cancel Ticket</h3>
                <button className="modal-close" onClick={handleCloseCancelDialog}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  You are about to cancel ticket <strong>{cancellingTicket?.bookingId}</strong>
                </div>
                <label className="form-label">Cancellation Reason</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Explain why this ticket is being cancelled..."
                />
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={handleCloseCancelDialog} disabled={adminCancellationStatus === 'loading'}>
                  Cancel
                </button>
                <button 
                  className="btn-danger" 
                  onClick={handleCancelTicket} 
                  disabled={adminCancellationStatus === 'loading' || !cancelReason.trim()}
                >
                  {adminCancellationStatus === 'loading' ? 'Processing...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Book Ticket Modal */}
        {bookDialogOpen && (
          <div className="modal-overlay" onClick={() => setBookDialogOpen(false)}>
            <div className="modal-content-k modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Book Ticket for User</h3>
                  <p className="modal-subtitle">Create a ticket on behalf of a user</p>
                </div>
                <button className="modal-close" onClick={() => setBookDialogOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">User Email *</label>
                  <div className="user-search-container">
                    <input
                      type="email"
                      className="form-input"
                      value={newBooking.userEmail}
                      onChange={(e) => {
                        setNewBooking({ ...newBooking, userEmail: e.target.value });
                        fetchUsers(e.target.value);
                      }}
                      placeholder="Search user by email..."
                    />
                    {showUserDropdown && (
                      <div className="user-dropdown">
                        {usersLoading ? (
                          <div className="dropdown-loading">Searching...</div>
                        ) : (
                          users.map(user => (
                            <div 
                              key={user._id} 
                              className="user-dropdown-item"
                              onClick={() => handleSelectUser(user)}
                            >
                              <div className="user-dropdown-avatar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <div>
                                <div className="user-dropdown-name">{user.name || user.email}</div>
                                <div className="user-dropdown-email">{user.email}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">User Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newBooking.userName}
                    onChange={(e) => setNewBooking({ ...newBooking, userName: e.target.value })}
                    placeholder="User name (optional)"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Event *</label>
                  <CustomDropdown
                    value={newBooking.eventId}
                    onChange={(val) => setNewBooking({ ...newBooking, eventId: val })}
                    options={eventOptions}
                    placeholder="Select event"
                    searchable
                    size="md"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newBooking.quantity}
                      onChange={(e) => setNewBooking({ ...newBooking, quantity: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Ticket Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBooking.ticketType}
                      onChange={(e) => setNewBooking({ ...newBooking, ticketType: e.target.value })}
                      placeholder="General Admission"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Price (optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newBooking.price}
                    onChange={(e) => setNewBooking({ ...newBooking, price: e.target.value })}
                    placeholder="Leave empty to use event default"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setBookDialogOpen(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary-k" 
                  onClick={handleBookTicket} 
                  disabled={adminBookingStatus === 'loading'}
                >
                  {adminBookingStatus === 'loading' ? 'Booking...' : 'Book Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;