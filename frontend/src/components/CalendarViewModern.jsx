import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaChevronLeft, FaChevronRight, FaCalendarAlt, FaSearch, FaListUl, FaThLarge, FaUser, FaMapMarkerAlt, FaClock, FaShare, FaBell, FaHeart, FaFilter, FaGoogle, FaMicrosoft
} from 'react-icons/fa';
import './Calender.css';
import { toast } from 'react-toastify';
import { fetchEvents } from '../store/slices/eventSlice';
import CategoryFilter from './category';
import { EVENT_CATEGORIES } from './constants';

// Utility functions
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
    const dayEvents = events.filter(e => new Date(e.date).toDateString() === dayDate.toDateString());
    week.push({ day, date: dayDate, events: dayEvents });
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length) matrix.push([...week, ...Array(7 - week.length).fill(null)]);
  return matrix;
};


const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



// Map static EVENT_CATEGORIES to objects with id, label, color
const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#eab308', '#f472b6', '#0ea5e9', '#f43f5e', '#a3e635', '#f87171', '#facc15', '#14b8a6'
];
const eventCategories = [
  { id: 'all', label: 'All', color: '#6366f1' },
  ...EVENT_CATEGORIES.map((cat, i) => ({ id: cat.toLowerCase(), label: cat, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
];

function CalendarViewModern() {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector(state => state.events);
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('month');
  const [search, setSearch] = useState('');
  // filter stores the category id (e.g., 'all', 'Music', ...)
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [rsvp, setRsvp] = useState({});
  const [showTooltip, setShowTooltip] = useState(null);
  const [showOrganizer, setShowOrganizer] = useState(null);

  // Fetch events - fetch all events from Redux store
  const fetchAllEvents = () => {
    dispatch(fetchEvents({}));
  };

  // Fetch events on mount
  useEffect(() => {
    fetchAllEvents();
  }, [dispatch]);

  // Refetch when month changes to get relevant events
  useEffect(() => {
    fetchAllEvents();
  }, [current.getMonth(), current.getFullYear()]);

  // Get events from Redux state
  const allEvents = events || [];
  
  // Filter events locally based on search and category
  let filteredEvents = allEvents;
  if (filter !== 'all') {
    filteredEvents = filteredEvents.filter(e => 
      e.category?.toLowerCase() === filter.toLowerCase()
    );
  }
  if (search) {
    filteredEvents = filteredEvents.filter(e => 
      e.title?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Also filter to only show active events
  filteredEvents = filteredEvents.filter(e => 
    e.status === 'active' || e.status === 'upcoming' || !e.status
  );

  const matrix = getMonthMatrix(current, filteredEvents);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePrev = () => {
    setCurrent(prev => {
      const newDate = view === 'month'
        ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        : new Date(prev.setDate(prev.getDate() - 7));
      return newDate;
    });
  };
  const handleNext = () => {
    setCurrent(prev => {
      const newDate = view === 'month'
        ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        : new Date(prev.setDate(prev.getDate() + 7));
      return newDate;
    });
  };
  const handleToday = () => {
    setCurrent(new Date());
    setSelected(null);
    fetchAllEvents();
  };

  // RSVP
  const handleRsvp = (eventId) => {
    setRsvp(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    toast.success('RSVP status updated!');
  };

  // Export
  const handleExport = (event, type) => {
    let url = '';
    const start = new Date(event.date).toISOString().replace(/-|:|\..+/g, '');
    const end = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\..+/g, '');
    if (type === 'google') {
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
    } else if (type === 'outlook') {
      url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(event.description || '')}&startdt=${event.date}&enddt=${event.date}&location=${encodeURIComponent(event.location || '')}`;
    }
    window.open(url, '_blank');
  };

  // Reminder
  const handleRemind = (event) => {
    toast.info(`Reminder set for "${event.title}"!`);
  };

  return (
    <div className="calendar-modern-root">
      <div className="calendar-modern-toolbar">
        <div className="calendar-modern-title">
          <FaCalendarAlt />
          <span>Event Calendar</span>
        </div>
        <div className="calendar-modern-controls">
          <button onClick={handlePrev} aria-label="Previous" className="calendar-modern-nav-btn">- </button>
          <button onClick={handleToday} className="calendar-modern-today-btn">Today</button>
          <button onClick={handleNext} aria-label="Next" className="calendar-modern-nav-btn">+ </button>
        </div>
        <div className="calendar-modern-view-switch">
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}><FaThLarge /></button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}><FaListUl /></button>
        </div>
        <div className="calendar-modern-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search events"
          />
        </div>
        <button className="calendar-modern-filter-btn" onClick={() => setShowFilters(v => !v)} aria-label="Show filters">
          <FaFilter />
        </button>
      </div>
      {showFilters && (
        <div style={{ marginBottom: 16 }}>
          <CategoryFilter activeCategory={filter} setActiveCategory={setFilter} />
        </div>
      )}
      <div className="calendar-modern-main">
        {view === 'month' && (
          <div className="calendar-modern-month-view">
            <div className="calendar-modern-weekdays">
              {weekDays.map(day => <div key={day} className="calendar-modern-weekday">{day}</div>)}
            </div>
            {matrix.map((week, i) => (
              <div key={i} className="calendar-modern-week">
                {week.map((cell, j) => {
                  if (!cell) return <div key={j} className="calendar-modern-day empty" />;
                  const isToday = cell.date.toDateString() === today.toDateString();
                  const isSelected = selected && cell.date.toDateString() === selected.toDateString();
                  return (
                    <div
                      key={j}
                      className={`calendar-modern-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelected(cell.date)}
                      tabIndex={0}
                      aria-label={`Day ${cell.day}${cell.events.length ? ', has events' : ''}`}
                      onMouseEnter={() => setShowTooltip(cell.date)}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <span className="calendar-modern-day-number">{cell.day}</span>
                      {cell.events.length > 0 && (
                        <div className="calendar-modern-event-dots">
                          {cell.events.slice(0, 3).map((ev, idx) => (
                            <span 
                              key={idx} 
                              className="calendar-modern-event-dot" 
                              style={{ 
                                background: eventCategories.find(c => c.id === (ev.category || 'all').toLowerCase())?.color || '#6366f1',
                                marginLeft: idx > 0 ? '2px' : 0
                              }} 
                            />
                          ))}
                          {cell.events.length > 3 && (
                            <span className="calendar-modern-more-dot">+{cell.events.length - 3}</span>
                          )}
                        </div>
                      )}
                      {/* Tooltip for events on hover */}
                      {showTooltip && showTooltip.toDateString() === cell.date.toDateString() && cell.events.length > 0 && (
                        <div className="calendar-modern-tooltip">
                          {cell.events.map(ev => (
                            <div key={ev._id} className="calendar-modern-tooltip-event">
                              <span className="tooltip-title">{ev.title}</span>
                              <span className="tooltip-time"><FaClock /> {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        {view === 'week' && (
          <div className="calendar-modern-week-view">
            <div className="calendar-modern-weekdays">
              {weekDays.map(day => <div key={day} className="calendar-modern-weekday">{day}</div>)}
            </div>
            <div className="calendar-modern-week">
              {matrix[(current.getDate() - 1 - current.getDay()) / 7 | 0]?.map((cell, j) => {
                if (!cell) return <div key={j} className="calendar-modern-day empty" />;
                const isToday = cell.date.toDateString() === today.toDateString();
                const isSelected = selected && cell.date.toDateString() === selected.toDateString();
                return (
                  <div
                    key={j}
                    className={`calendar-modern-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelected(cell.date)}
                    tabIndex={0}
                    aria-label={`Day ${cell.day}${cell.events.length ? ', has events' : ''}`}
                  >
                    <span className="calendar-modern-day-number">{cell.day}</span>
                    {cell.events.length > 0 && (
                      <span className="calendar-modern-event-dot" style={{ background: eventCategories.find(c => c.id === (cell.events[0]?.category || 'all'))?.color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {selected && (
          <div className="calendar-modern-events-panel" role="dialog" aria-modal="true">
            <h3>Events on {selected.toLocaleDateString()}</h3>
            <button className="calendar-modern-close-btn" onClick={() => setSelected(null)} aria-label="Close events">×</button>
            <div className="calendar-modern-events-list">
              {filteredEvents.filter(e => new Date(e.date).toDateString() === selected.toDateString()).length === 0 && (
                <div className="calendar-modern-no-events">No events for this day.</div>
              )}
              {filteredEvents.filter(e => new Date(e.date).toDateString() === selected.toDateString()).map(event => (
                <div key={event._id} className="calendar-modern-event-card">
                  <div className="calendar-modern-event-title">{event.title}</div>
                  <div className="calendar-modern-event-meta">
                    <span><FaClock /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {event.location && <span><FaMapMarkerAlt /> {event.location}</span>}
                  </div>
                  {event.description && <div className="calendar-modern-event-desc">{event.description}</div>}
                  <div className="calendar-modern-event-actions">
                    <button className={`calendar-modern-action-btn${rsvp[event._id] ? ' active' : ''}`} onClick={() => handleRsvp(event._id)} aria-label="RSVP">
                      <FaHeart /> {rsvp[event._id] ? 'Joined' : 'RSVP'}
                    </button>
                    <button className="calendar-modern-action-btn" onClick={() => handleExport(event, 'google')} aria-label="Export to Google Calendar">
                      <FaGoogle /> Google
                    </button>
                    <button className="calendar-modern-action-btn" onClick={() => handleExport(event, 'outlook')} aria-label="Export to Outlook">
                      <FaMicrosoft /> Outlook
                    </button>
                    <button className="calendar-modern-action-btn" onClick={() => handleRemind(event)} aria-label="Remind">
                      <FaBell /> Remind
                    </button>
                    {/* Organizer popover */}
                    <button className="calendar-modern-action-btn" onMouseEnter={() => setShowOrganizer(event._id)} onMouseLeave={() => setShowOrganizer(null)} aria-label="Show organizer">
                      <FaUser />
                      {showOrganizer === event._id && event.organizer && (
                        <div className="calendar-modern-organizer-popover">
                          <strong>{event.organizer.name}</strong><br />
                          <span>{event.organizer.email}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Loading state */}
        {loading && (
          <div className="calendar-modern-empty-state">
            <div className="cal-loading-spinner" />
            <p>Loading events...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className="calendar-modern-empty-state">
            <p style={{ color: '#ef4444' }}>Error loading events: {error}</p>
            <button onClick={fetchAllEvents} className="calendar-modern-today-btn">
              Retry
            </button>
          </div>
        )}
        
        {/* Empty state UI */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="calendar-modern-empty-state">
            <FaCalendarAlt size={48} />
            <p>No events found. Try adjusting your filters or search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarViewModern;
