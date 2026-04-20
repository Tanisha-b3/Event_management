import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaSearch,
  FaListUl,
  FaThLarge,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaBell,
  FaHeart,
  FaFilter,
  FaGoogle,
  FaMicrosoft,
  FaTimes
} from 'react-icons/fa';
import './Calender.css'; // Regular CSS import - NO named export needed
import { toast } from 'react-toastify';
import { fetchEvents } from '../store/slices/eventSlice';
import CategoryFilter from './category';
import { EVENT_CATEGORIES } from './constants';

// Utility Functions
const getMonthMatrix = (date, events) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const matrix = [];
  let week = Array(startDay).fill(null);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayEvents = events.filter(e => 
      new Date(e.date).toDateString() === dayDate.toDateString()
    );
    week.push({ day, date: dayDate, events: dayEvents });
    
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  
  if (week.length) {
    matrix.push([...week, ...Array(7 - week.length).fill(null)]);
  }
  
  return matrix;
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Category Colors Mapping
const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', 
  '#8b5cf6', '#eab308', '#f472b6', '#0ea5e9', '#f43f5e'
];

const getCategoryColor = (category) => {
  const index = EVENT_CATEGORIES.findIndex(
    cat => cat.toLowerCase() === category?.toLowerCase()
  );
  return index !== -1 ? CATEGORY_COLORS[index % CATEGORY_COLORS.length] : '#6366f1';
};

function CalendarViewModern() {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector(state => state.events);
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState({});
  const [tooltipDate, setTooltipDate] = useState(null);
  const [showOrganizerFor, setShowOrganizerFor] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch events
  useEffect(() => {
    dispatch(fetchEvents({}));
  }, [dispatch, currentDate.getMonth(), currentDate.getFullYear()]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events || [];
    
    if (activeCategory !== 'all') {
      result = result.filter(e => 
        e.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    if (searchTerm) {
      result = result.filter(e => 
        e.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result.filter(e => 
      e.status === 'active' || e.status === 'upcoming' || !e.status
    );
  }, [events, activeCategory, searchTerm]);

  const monthMatrix = getMonthMatrix(currentDate, filteredEvents);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Event Actions
  const handleRSVP = (eventId) => {
    setRsvpStatus(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    toast.success(rsvpStatus[eventId] ? 'RSVP cancelled' : 'Successfully joined event!');
  };

  const handleExport = (event, type) => {
    const startDate = new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0];
    const endDate = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000)
      .toISOString().replace(/[-:]/g, '').split('.')[0];
    
    let url = '';
    if (type === 'google') {
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
    } else if (type === 'outlook') {
      url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(event.description || '')}&startdt=${event.date}&enddt=${event.date}&location=${encodeURIComponent(event.location || '')}`;
    }
    
    window.open(url, '_blank');
    toast.info(`Exporting "${event.title}" to ${type} calendar`);
  };

  const handleReminder = (event) => {
    toast.success(`Reminder set for "${event.title}"`);
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => 
      new Date(e.date).toDateString() === selectedDate.toDateString()
    );
  }, [filteredEvents, selectedDate]);

  return (
    <div className="calendar-modern-root">
      {/* Toolbar */}
      <div className="calendar-modern-toolbar">
        <div className="calendar-modern-title">
          <FaCalendarAlt />
          <span>Event Calendar</span>
        </div>
        
        <div className="calendar-modern-controls">
          <button onClick={handlePrevMonth} className="calendar-modern-nav-btn">
            <FaChevronLeft />
          </button>
          <button onClick={handleToday} className="calendar-modern-today-btn">
            Today
          </button>
          <button onClick={handleNextMonth} className="calendar-modern-nav-btn">
            <FaChevronRight />
          </button>
        </div>
        
        <div className="calendar-modern-view-switch">
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => setView('month')}
          >
            <FaThLarge />
          </button>
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => setView('week')}
          >
            <FaListUl />
          </button>
        </div>
        
        <div className="calendar-modern-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search events"
          />
        </div>
        
        <button 
          className="calendar-modern-filter-btn" 
          onClick={() => setShowCategoryFilter(prev => !prev)}
        >
          <FaFilter /> Filter
        </button>
      </div>
      
      {/* Category Filter */}
      {showCategoryFilter && (
        <div className="category-filter-container">
          <div 
            className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </div>
          {EVENT_CATEGORIES.map(category => (
            <div
              key={category}
              className={`category-chip ${activeCategory === category.toLowerCase() ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.toLowerCase())}
            >
              {category}
            </div>
          ))}
        </div>
      )}
      
      {/* Main Calendar View */}
      <div className="calendar-modern-main">
        {view === 'month' && (
          <>
            <div className="calendar-modern-weekdays">
              {weekDays.map(day => (
                <div key={day} className="calendar-modern-weekday">{day}</div>
              ))}
            </div>
            
            {monthMatrix.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-modern-week">
                {week.map((cell, cellIndex) => {
                  if (!cell) {
                    return <div key={cellIndex} className="calendar-modern-day empty" />;
                  }
                  
                  const isToday = cell.date.toDateString() === today.toDateString();
                  const isSelected = selectedDate && 
                    cell.date.toDateString() === selectedDate.toDateString();
                  
                  return (
                    <div
                      key={cellIndex}
                      className={`calendar-modern-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(cell.date)}
                      onMouseEnter={() => !isMobile && setTooltipDate(cell.date)}
                      onMouseLeave={() => setTooltipDate(null)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="calendar-modern-day-number">{cell.day}</span>
                      
                      {cell.events.length > 0 && (
                        <div className="calendar-modern-event-dots">
                          {cell.events.slice(0, 3).map((event, idx) => (
                            <span
                              key={event._id || idx}
                              className="calendar-modern-event-dot"
                              style={{ background: getCategoryColor(event.category) }}
                            />
                          ))}
                          {cell.events.length > 3 && (
                            <span className="calendar-modern-more-dot">+{cell.events.length - 3}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Tooltip for desktop */}
                      {!isMobile && tooltipDate && 
                       tooltipDate.toDateString() === cell.date.toDateString() && 
                       cell.events.length > 0 && (
                        <div className="calendar-modern-tooltip">
                          {cell.events.map(event => (
                            <div key={event._id} className="calendar-modern-tooltip-event">
                              <span className="tooltip-title">{event.title}</span>
                              <span className="tooltip-time">
                                <FaClock /> 
                                {new Date(event.date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
        
        {view === 'week' && (
          <div className="calendar-modern-empty-state">
            <p>Week view coming soon! Switch to month view for full calendar.</p>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="calendar-modern-empty-state">
            <div className="cal-loading-spinner" />
            <p>Loading events...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="calendar-modern-empty-state">
            <p style={{ color: '#ef4444' }}>Error: {error}</p>
            <button onClick={() => dispatch(fetchEvents({}))} className="calendar-modern-today-btn">
              Retry
            </button>
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && !selectedDate && (
          <div className="calendar-modern-empty-state">
            <FaCalendarAlt size={48} />
            <p>No events found. Try adjusting your filters or search.</p>
          </div>
        )}
      </div>
      
      {/* Events Panel Modal */}
      {selectedDate && (
        <div className="calendar-modern-events-panel" role="dialog" aria-modal="true">
          <h3>Events on {selectedDate.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h3>
          
          <button 
            className="calendar-modern-close-btn" 
            onClick={() => setSelectedDate(null)}
            aria-label="Close events panel"
          >
x
          </button>
          
          <div className="calendar-modern-events-list">
            {selectedDateEvents.length === 0 && (
              <div className="calendar-modern-no-events">
                No events scheduled for this day.
              </div>
            )}
            
            {selectedDateEvents.map(event => (
              <div key={event._id} className="calendar-modern-event-card">
                <div className="calendar-modern-event-title">{event.title}</div>
                
                <div className="calendar-modern-event-meta">
                  <span>
                    <FaClock /> 
                    {new Date(event.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {event.location && (
                    <span><FaMapMarkerAlt /> {event.location}</span>
                  )}
                </div>
                
                {event.description && (
                  <div className="calendar-modern-event-desc">{event.description}</div>
                )}
                
                <div className="calendar-modern-event-actions">
                  <button 
                    className={`calendar-modern-action-btn ${rsvpStatus[event._id] ? 'active' : ''}`}
                    onClick={() => handleRSVP(event._id)}
                  >
                    <FaHeart /> {rsvpStatus[event._id] ? 'Joined' : 'RSVP'}
                  </button>
                  
                  <button 
                    className="calendar-modern-action-btn"
                    onClick={() => handleExport(event, 'google')}
                  >
                    <FaGoogle /> Google
                  </button>
                  
                  <button 
                    className="calendar-modern-action-btn"
                    onClick={() => handleExport(event, 'outlook')}
                  >
                    <FaMicrosoft /> Outlook
                  </button>
                  
                  <button 
                    className="calendar-modern-action-btn"
                    onClick={() => handleReminder(event)}
                  >
                    <FaBell /> Remind
                  </button>
                  
                  {event.organizer && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        className="calendar-modern-action-btn"
                        onMouseEnter={() => setShowOrganizerFor(event._id)}
                        onMouseLeave={() => setShowOrganizerFor(null)}
                      >
                        <FaUser /> Organizer
                      </button>
                      
                      {showOrganizerFor === event._id && (
                        <div className="calendar-modern-organizer-popover">
                          <strong>{event.organizer.name}</strong>
                          <br />
                          <span>{event.organizer.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarViewModern;