import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './adminEvent.css';
import { getPendingEvents, approveEvent, rejectEvent } from './constants';
import { getUserRole } from '../utils/auth';
import { toast } from 'react-toastify';

const AdminEventApproval = () => {
  const navigate = useNavigate();
  const { mode: reduxMode } = useSelector((state) => state.theme);
  const isDark = reduxMode === 'dark' || localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const role = getUserRole();

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPendingEvents();
  }, [page, role]);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const result = await getPendingEvents(page, 10);
      setPendingEvents(result.events || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotal(result.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching pending events:', err);
      toast.error('Failed to load pending events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    setActionLoading(true);
    try {
      await approveEvent(eventId);
      toast.success('Event approved successfully!');
      fetchPendingEvents();
    } catch (err) {
      console.error('Error approving event:', err);
      toast.error('Failed to approve event');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (event) => {
    setSelectedEvent(event);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await rejectEvent(selectedEvent._id, rejectReason);
      toast.success('Event rejected');
      setRejectDialogOpen(false);
      fetchPendingEvents();
    } catch (err) {
      console.error('Error rejecting event:', err);
      toast.error('Failed to reject event');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    return gradients[index % gradients.length];
  };

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className={`admin-event-approval ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <div className="approval-container">
        {/* Header Section */}
        <div className="header-section fade-in">
          <div className="header-left">
            <button className="btn-back-k" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="header-title">Pending Event Approvals</h1>
              <p className="header-subtitle">Review and manage event submissions from organizers</p>
            </div>
          </div>
          <button 
            className="refresh-button"
            onClick={fetchPendingEvents}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="stats-grid zoom-in">
          <div className="stat-card stat-card-warning">
            <div>
              <p className="stat-label">Pending Events</p>
              <p className="stat-value">{total}</p>
            </div>
            <div className="stat-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              </svg>
            </div>
          </div>
          
          <div className="stat-card stat-card-primary">
            <div>
              <p className="stat-label">Total Events</p>
              <p className="stat-value">124</p>
            </div>
            <div className="stat-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          
          <div className="stat-card stat-card-success">
            <div>
              <p className="stat-label">Approval Rate</p>
              <p className="stat-value">78%</p>
            </div>
            <div className="stat-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8 10 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
          
          <div className="stat-card stat-card-info">
            <div>
              <p className="stat-label">Avg Response</p>
              <p className="stat-value">2.4h</p>
            </div>
            <div className="stat-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="info-alert fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Review and approve or reject events submitted by organizers. Approved events will be visible to the public.</span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : pendingEvents.length === 0 ? (
          <div className="empty-state fade-in">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>No Pending Events</h3>
            <p>All events have been reviewed. Check back later for new submissions.</p>
          </div>
        ) : (
          <>
            {/* Events Grid */}
            <div className="events-grid">
              {pendingEvents.map((event, index) => (
                <div 
                  key={event._id} 
                  className={`event-card ${hoveredCard === event._id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredCard(event._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Image Section */}
                  {event.imageUrl ? (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="event-image"
                    />
                  ) : (
                    <div 
                      className="event-image-placeholder"
                      style={{ background: getRandomGradient(index) }}
                    >
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  )}

                  <div className="event-content">
                    {/* Header with title and status */}
                    <div className="event-header">
                      <h3 className="event-title">{event.title}</h3>
                      <span className="status-badge status-pending">PENDING</span>
                    </div>

                    {/* Organizer info */}
                    <div className="organizer-info">
                      <div className="organizer-avatar">
                        {event.organizer?.charAt(0)?.toUpperCase() || 'O'}
                      </div>
                      <span className="organizer-name">{event.organizer || 'Unknown Organizer'}</span>
                    </div>

                    <hr className="divider" />

                    {/* Event details */}
                    <div className="event-details">
                      <div className="detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{formatDate(event.date)} • {formatTime(event.date)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          <span>${event.ticketPrice?.toLocaleString() || 0}</span>
                        </div>
                        
                        <div className="detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span>{event.capacity?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>

                    <hr className="divider" />

                    {/* Description */}
                    <p className="event-description">
                      {event.description || 'No description provided'}
                    </p>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button 
                        className="btn-approve"
                        onClick={() => handleApprove(event._id)}
                        disabled={actionLoading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => openRejectDialog(event)}
                        disabled={actionLoading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                {[...Array(Math.min(totalPages, 7)).keys()].map(i => {
                  let pageNum = i + 1;
                  if (totalPages > 7) {
                    if (page > 4 && page < totalPages - 3) {
                      if (i === 0) pageNum = 1;
                      else if (i === 1) pageNum = '...';
                      else if (i === 2) pageNum = page - 1;
                      else if (i === 3) pageNum = page;
                      else if (i === 4) pageNum = page + 1;
                      else if (i === 5) pageNum = '...';
                      else if (i === 6) pageNum = totalPages;
                    } else if (page <= 4) {
                      if (i === 5) pageNum = '...';
                      else if (i === 6) pageNum = totalPages;
                    } else {
                      if (i === 0) pageNum = 1;
                      else if (i === 1) pageNum = '...';
                      else if (i === 6) pageNum = totalPages;
                    }
                  }
                  return (
                    <button
                      key={i}
                      className={`page-btn ${page === pageNum ? 'active' : ''}`}
                      onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
                      disabled={typeof pageNum !== 'number'}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Reject Dialog */}
        {rejectDialogOpen && (
          <div className="modal-overlay" onClick={() => setRejectDialogOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Event</h3>
                <button className="modal-close" onClick={() => setRejectDialogOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  You are about to reject <strong>"{selectedEvent?.title}"</strong>
                </div>
                
                <label className="form-label">Please provide a reason for the organizer:</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this event is being rejected..."
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-outline" 
                  onClick={() => setRejectDialogOpen(false)} 
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger" 
                  onClick={handleReject} 
                  disabled={actionLoading || !rejectReason.trim()}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventApproval;