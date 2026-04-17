import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaArrowLeft, FaDownload, FaCalendar, FaMapMarkerAlt, FaTicketAlt, FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import { fetchOrders } from '../store/slices/ordersSlice';
import { downloadTicketPDF } from './tickets/downloadTicketPDF';
import './OrderHistory.css';

function OrderHistory() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.orders);
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchOrders(token));
    }
  }, [dispatch, token]);

  const filteredOrders = orders.filter(order => {
    const isCancelled = order.isCancelled === true;
    const isUpcoming = new Date(order.eventDate) > new Date();
    
    const matchesFilter = filter === 'all' || 
      (filter === 'completed' && !isCancelled) ||
      (filter === 'cancelled' && isCancelled) ||
      (filter === 'upcoming' && isUpcoming);
    
    const matchesSearch = order.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (order) => {
    if (order.isCancelled) {
      return 'status-cancelled';
    }
    if (new Date(order.eventDate) > new Date()) {
      return 'status-upcoming';
    }
    return 'status-completed';
  };

  const getStatusLabel = (order) => {
    if (order.isCancelled) {
      return 'Cancelled';
    }
    if (new Date(order.eventDate) > new Date()) {
      return 'Upcoming';
    }
    return 'Completed';
  };

  // Download handler for ticket PDF
  const handleDownloadTicket = (order) => {
    const ticket = {
      eventName: order.eventName,
      eventDate: order.eventDate,
      eventLocation: order.eventLocation,
      ticketType: order.ticketType,
      quantity: order.quantity,
      price: order.price,
      bookingId: order.bookingId || order._id,
    };
    downloadTicketPDF(ticket, `ticket-${ticket.bookingId}.pdf`);
  };

  return (
    <div className="order-history-container">
      <div className="order-history-wrapper">
        <div className="order-history-header">
          <button 
            onClick={() => navigate(-1)}
            className="order-history-back-btn"
          >
            <FaArrowLeft className="text-sm" />
            <span>Back</span>
          </button>
          <h1 className="order-history-title">
            Order History
          </h1>
        </div>

        <div className="order-history-card">
          <div className="order-history-filters">
            <div className="order-history-search">
              <FaSearch className="order-history-search-icon" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="order-history-search-input"
              />
            </div>
            <div className="order-history-filter-group">
              <FaFilter className="order-history-filter-icon" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="order-history-filter-select"
              >
                <option value="all">All Orders</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="order-history-loading">
              <div className="order-history-spinner"></div>
            </div>
          ) : error ? (
            <div className="order-history-empty">
              <p className="order-history-empty-text">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="order-history-empty">
              <FaTicketAlt className="order-history-empty-icon" />
              <p className="order-history-empty-text">No orders found</p>
            </div>
          ) : (
            <div className="order-history-list">
              {filteredOrders.map((order) => (
                <div 
                  key={order._id || order.bookingId}
                  className="order-history-item"
                >
                  <div className="order-history-item-main">
                    <div className="order-history-item-content">
                      <div className="order-history-item-header">
                        <h3 className="order-history-item-title">
                          {order.eventName || 'Event'}
                        </h3>
                        <span className={`order-history-status-badge ${getStatusColor(order)}`}>
                          {getStatusLabel(order)}
                        </span>
                      </div>
                      <div className="order-history-item-details">
                        <span className="order-history-item-detail">
                          <FaCalendar className="text-xs" />
                          {formatDate(order.eventDate)}
                        </span>
                        <span className="order-history-item-detail">
                          <FaMapMarkerAlt className="text-xs" />
                          {order.eventLocation || 'Location TBD'}
                        </span>
                        <span className="order-history-item-detail">
                          <FaTicketAlt className="text-xs" />
                          {order.ticketType || 'General'}
                        </span>
                      </div>
                      <div className="order-history-item-id">
                        Order ID: {order.bookingId || order._id}
                      </div>
                    </div>
                    <div className="order-history-item-actions">
                      <div className="order-history-item-price">
                        <p className="order-history-item-amount">
                          ${(order.price * order.quantity) || 0}
                        </p>
                        <p className="order-history-item-date">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/tickets/${order._id}`)}
                        className="order-history-action-btn"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {!order.isCancelled && (
                        <button
                          className="order-history-action-btn"
                          title="Download Ticket"
                          onClick={() => handleDownloadTicket(order)}
                        >
                          <FaDownload />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
