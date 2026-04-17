import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaArrowLeft, FaChartLine, FaTicketAlt, FaDollarSign, FaEye, FaChartBar } from 'react-icons/fa';
import { fetchMyEvents, fetchEventAnalytics, setSelectedEvent, setPeriod } from '../store/slices/analyticsSlice';
import CustomDropdown from './customDropdown';
import './EventAnalytics.css';

function EventAnalytics() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { events, selectedEvent, analytics, loading, analyticsLoading, error, period } = useSelector((state) => state.analytics);

  useEffect(() => {
    if (token) {
      dispatch(fetchMyEvents(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (selectedEvent && token) {
      dispatch(fetchEventAnalytics({ eventId: selectedEvent._id, token, period }));
    }
  }, [dispatch, selectedEvent, token, period]);

  const handleEventChange = (eventId) => {
    const event = events.find(ev => ev._id === eventId);
    dispatch(setSelectedEvent(event));
  };

  const handlePeriodChange = (newPeriod) => {
    dispatch(setPeriod(newPeriod));
  };

  const stats = [
    { 
      label: 'Total Tickets', 
      value: analytics?.totalTickets || 0, 
      icon: FaTicketAlt, 
      color: 'bg-blue-500'
    },
    { 
      label: 'Sold', 
      value: analytics?.soldTickets || 0, 
      icon: FaChartLine, 
      color: 'bg-green-500'
    },
    { 
      label: 'Revenue', 
      value: `$${analytics?.revenue?.toLocaleString() || 0}`, 
      icon: FaDollarSign, 
      color: 'bg-purple-500'
    },
    { 
      label: 'Views', 
      value: analytics?.views?.toLocaleString() || 0, 
      icon: FaEye, 
      color: 'bg-orange-500'
    },
  ];

  if (user?.role !== 'organiser' && user?.role !== 'admin') {
    return (
      <div className="analytics-access-denied">
        <div className="analytics-access-content">
          <FaChartBar className="analytics-access-icon" />
          <h2 className="analytics-access-title">Access Denied</h2>
          <p className="analytics-access-text">Only organizers can view analytics</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="analytics-access-btn"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-wrapper">
        <div className="analytics-header">
          <div className="analytics-header-left">
            <button 
              onClick={() => navigate(-1)}
              className="analytics-back-btn"
            >
              <FaArrowLeft className="text-sm" />
              <span>Back</span>
            </button>
            <h1 className="analytics-title">
              Event Analytics
            </h1>
          </div>
          <CustomDropdown
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
            value={period}
            onChange={handlePeriodChange}
            placeholder="Select period"
            size="sm"
          />
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="analytics-spinner"></div>
          </div>
        ) : (
          <>
            <div className="analytics-event-select-container">
              <div className="analytics-event-select">
                <CustomDropdown
                  options={events.map(event => ({
                    value: event._id,
                    label: event.title,
                  }))}
                  value={selectedEvent?._id || ''}
                  onChange={handleEventChange}
                  placeholder="Select event"
                  label="Select Event"
                  searchable
                />
              </div>
            </div>

            {selectedEvent && (
              <>
                {analyticsLoading ? (
                  <div className="analytics-loading">
                    <div className="analytics-spinner"></div>
                  </div>
                ) : error ? (
                  <div className="analytics-error">
                    <p>{error}</p>
                  </div>
                ) : (
                <>
                <div className="analytics-stats-grid">
                  {stats.map((stat, index) => (
                    <div key={index} className="analytics-stat-card">
                      <div className="analytics-stat-header">
                        <div className={`analytics-stat-icon ${stat.color} bg-opacity-10`}>
                          <stat.icon className={`text-xl ${stat.color.replace('bg-', 'text-')}`} />
                        </div>
                      </div>
                      <p className="analytics-stat-value">{stat.value}</p>
                      <p className="analytics-stat-label">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3 className="analytics-card-title">
                      Ticket Sales by Type
                    </h3>
                    <div className="analytics-progress-list">
                      {analytics?.ticketsByType?.map((item, index) => (
                        <div key={index} className="analytics-progress-item">
                          <div className="analytics-progress-header">
                            <span>{item.type}</span>
                            <span>
                              {item.sold} / {item.total}
                            </span>
                          </div>
                          <div className="analytics-progress-bar">
                            <div 
                              className="analytics-progress-fill"
                              style={{ width: `${(item.sold / item.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3 className="analytics-card-title">
                      Sales Overview
                    </h3>
                    <div className="analytics-chart-placeholder">
                      <div className="analytics-chart-content">
                        <FaChartBar className="analytics-chart-icon" />
                        <p className="analytics-chart-text">Sales chart visualization</p>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3 className="analytics-card-title">
                      Attendee Demographics
                    </h3>
                    <div className="analytics-demographics-list">
                      <div className="analytics-demo-item">
                        <span>Total Attendees</span>
                        <span>
                          {analytics?.attendees || 0}
                        </span>
                      </div>
                      <div className="analytics-demo-item">
                        <span>Check-in Rate</span>
                        <span>
                          {analytics?.soldTickets && analytics?.attendees 
                            ? Math.round((analytics.attendees / analytics.soldTickets) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3 className="analytics-card-title">
                      Quick Actions
                    </h3>
                    <div className="analytics-actions-grid">
                      <button 
                        onClick={() => navigate(`/organizer`)}
                        className="analytics-action-btn edit-event"
                      >
                        Edit Event
                      </button>
                      <button 
                        onClick={() => navigate(`/admin-tickets`)}
                        className="analytics-action-btn view-tickets"
                      >
                        View Tickets
                      </button>
                      <button className="analytics-action-btn export-report">
                        Export Report
                      </button>
                      <button className="analytics-action-btn share-stats">
                        Share Stats
                      </button>
                    </div>
                  </div>
                </div>
                </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventAnalytics;
