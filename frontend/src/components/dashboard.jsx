import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiCalendar, FiUsers, FiDollarSign, FiEdit, 
  FiMail, FiBarChart2, FiSettings, FiPause, FiPlay, FiTrash2,
  FiDownload, FiSend, FiMessageSquare, FiLock, FiGlobe, FiEye, FiEyeOff
} from 'react-icons/fi';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import { EVENTS, LOCATION_OPTIONS } from './constants';
import './Dashboard.css';
import Location from '../components/featuresd/Location.jsx';
import CategoryFilter from './category.jsx';
import EventCarousel from './featuresd/features.jsx';
import { Attendees, tickets, messages } from './constants';
import ManageEvent from './dashboardC/ManageEvent.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [localEvents, setLocalEvents] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [salesData, setSalesData] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [newTicketType, setNewTicketType] = useState({
    name: '',
    price: 0,
    quantity: 0
  });

  const [attendees, setAttendees] = useState(Attendees);
  const [ticketTypes, setTicketTypes] = useState(tickets);
  const messageTemplates = messages;
  const [activeCategory, setActiveCategory] = useState('all');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');

  // Memoized filtered events for better performance
 // Update your filteredEvents useMemo to properly handle categories
const filteredEvents = useMemo(() => {
  return localEvents.filter(event => {
    // Search filter
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Location filter
    const matchesLocation = 
      locationSearchTerm === '' ||
      event.location.toLowerCase().includes(locationSearchTerm.toLowerCase());
    
    // Category filter - FIXED: Properly compare category
    const matchesCategory = activeCategory === 'all' || 
      event.category.toLowerCase() === activeCategory.toLowerCase();
    
    // Status filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.date);
    
    if (filterType === 'upcoming') {
      return matchesSearch && matchesCategory && matchesLocation && 
             eventDate > today && event.status === 'upcoming';
    } else if (filterType === 'active') {
      return matchesSearch && matchesCategory && matchesLocation && 
             eventDate >= today && event.status === 'active';
    } else if (filterType === 'past') {
      return matchesSearch && matchesCategory && matchesLocation && 
             eventDate < today && event.status === 'completed';
    }
    
    return matchesSearch && matchesCategory && matchesLocation;
  });
}, [localEvents, searchTerm, locationSearchTerm, activeCategory, filterType]);

  // Generate sample sales data
  useEffect(() => {
    if (selectedEvent) {
      const generatedSales = [];
      const days = 14;
      const baseDate = new Date(selectedEvent.date);
      baseDate.setDate(baseDate.getDate() - days);
      
      for (let i = 0; i < days; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        
        generatedSales.push({
          date: date.toISOString().split('T')[0],
          tickets: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 1000) + 200
        });
      }
      setSalesData(generatedSales);

      if (selectedEvent.ticketTypes) {
        setTicketTypes(selectedEvent.ticketTypes);
      }
    }
  }, [selectedEvent]);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setTimeout(() => {
          const combinedEvents = EVENTS.map(event => ({
            ...event,
            status: event.status || 'active',
            attendees: event.attendees || 0,
            ticketsSold: event.ticketsSold || 0,
            revenue: event.revenue || 0,
            capacity: event.capacity || 100,
            privacy: event.privacy || 'public',
            ticketTypes: event.ticketTypes || [
              { id: 1, type: 'General Admission', price: 50, sold: 0, total: 100 }
            ]
          }));
          
          // Remove duplicates
          const uniqueEvents = combinedEvents.reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) {
              return [...acc, current];
            }
            return acc;
          }, []);
          
          setEvents(uniqueEvents);
          setLocalEvents(uniqueEvents);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching events:', error);
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Save to localStorage whenever localEvents changes
  useEffect(() => {
    if (localEvents.length > 0) {
      localStorage.setItem('events', JSON.stringify(localEvents));
    }
  }, [localEvents]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleManageEvent = (event) => {
    setSelectedEvent(event);
    setActiveTab('manage');
  };

  const toggleEventStatus = useCallback(() => {
    if (!selectedEvent) return;
    
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        const newStatus = ev.status === 'active' ? 'paused' : 'active';
        return { ...ev, status: newStatus };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    setSelectedEvent(prev => prev ? {
      ...prev,
      status: prev.status === 'active' ? 'paused' : 'active'
    } : null);
  }, [selectedEvent, localEvents]);

  const handleDeleteEvent = useCallback(() => {
    if (!selectedEvent) return;
    
    const updatedEvents = localEvents.filter(ev => ev.id !== selectedEvent.id);
    setLocalEvents(updatedEvents);
    setSelectedEvent(null);
    setActiveTab('events');
    setShowDeleteModal(false);
  }, [selectedEvent, localEvents]);

  const handleSendMessage = () => {
    const recipientCount = recipientType === 'all' 
      ? attendees.length 
      : attendees.filter(a => 
          recipientType === 'checked-in' ? a.status === 'Checked In' : a.status === 'Not Checked In'
        ).length;
    
    // In a real app, you would send this to an API
    alert(`Message sent to ${recipientCount} ${recipientType} attendees:\n\n${messageContent}`);
    setMessageContent('');
  };

  const handleExportAttendees = () => {
    const csvContent = [
      ['Name', 'Email', 'Ticket Type', 'Status'],
      ...filteredAttendees.map(a => [a.name, a.email, a.ticketType, a.status])
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedEvent?.title || 'event'}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUseTemplate = (template) => {
    setMessageContent(template.content);
  };

  const filteredAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      const matchesSearch = 
        attendee.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        attendee.email.toLowerCase().includes(attendeeSearch.toLowerCase());
      
      if (recipientType === 'checked-in') {
        return matchesSearch && attendee.status === 'Checked In';
      } else if (recipientType === 'not-checked-in') {
        return matchesSearch && attendee.status === 'Not Checked In';
      }
      return matchesSearch;
    });
  }, [attendees, attendeeSearch, recipientType]);

  const handlePrivacyChange = (privacy) => {
    if (!selectedEvent) return;
    
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        return { ...ev, privacy };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    setSelectedEvent(prev => prev ? { ...prev, privacy } : null);
  };

  const handleTicketTypeChange = (id, field, value) => {
    const updatedTicketTypes = ticketTypes.map(ticket => {
      if (ticket.id === id) {
        return { ...ticket, [field]: field === 'price' || field === 'total' ? Number(value) : value };
      }
      return ticket;
    });
    setTicketTypes(updatedTicketTypes);
    
    if (selectedEvent) {
      const updatedEvents = localEvents.map(ev => {
        if (ev.id === selectedEvent.id) {
          return { ...ev, ticketTypes: updatedTicketTypes };
        }
        return ev;
      });
      setLocalEvents(updatedEvents);
    }
  };

  const handleAddTicketType = () => {
    if (newTicketType.name && newTicketType.price > 0 && newTicketType.quantity > 0) {
      const newTicket = {
        id: Date.now(),
        type: newTicketType.name,
        price: newTicketType.price,
        total: newTicketType.quantity,
        sold: 0
      };
      
      const updatedTicketTypes = [...ticketTypes, newTicket];
      setTicketTypes(updatedTicketTypes);
      
      if (selectedEvent) {
        const updatedEvents = localEvents.map(ev => {
          if (ev.id === selectedEvent.id) {
            return { ...ev, ticketTypes: updatedTicketTypes };
          }
          return ev;
        });
        setLocalEvents(updatedEvents);
      }
      
      setNewTicketType({ name: '', price: 0, quantity: 0 });
    }
  };

  const handleRemoveTicketType = (id) => {
    const updatedTicketTypes = ticketTypes.filter(ticket => ticket.id !== id);
    setTicketTypes(updatedTicketTypes);
    
    if (selectedEvent) {
      const updatedEvents = localEvents.map(ev => {
        if (ev.id === selectedEvent.id) {
          return { ...ev, ticketTypes: updatedTicketTypes };
        }
        return ev;
      });
      setLocalEvents(updatedEvents);
    }
  };

  const totalRevenue = ticketTypes.reduce((sum, ticket) => sum + (ticket.price * ticket.sold), 0);
  const totalTicketsSold = ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0);
  const totalTicketsAvailable = ticketTypes.reduce((sum, ticket) => sum + ticket.total, 0);

const renderEventsTab = () => (
  <div className="events-grid">
    {filteredEvents.map(event => (
      <div className="event-card" key={event.id}>
       <div className="event-header">
  
  {/* LEFT SIDE */}
  <div className="left">
    <span className={`event-status ${event.status}`}>
      {event.status.toUpperCase()}
    </span>

   
  </div>

  {/* RIGHT SIDE */}
  <div className="right">
    <span className="event-date">
      <FiCalendar className="icon" />
      {formatDate(event.date)}
    </span>
    <br/>
  </div>

</div>
        
        <h3 className="event-title">{event.title}</h3>
             <span className="event">
      Category: {event.category}
    </span>

        <p className="event-location">{event.location}</p>
        
        <div className="event-stats">
          <div className="stat-item">
            <FiUsers className="icon" />
            <span>{event.attendees || 0}/{event.capacity || 100}</span>
          </div>
          <div className="stat-item">
            <FiDollarSign className="icon" />
            <span>{formatCurrency(event.revenue || 0)}</span>
          </div>
        </div>
        
        <div className="event-t">
          <div className="event-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              Event Details
            </button>
          </div>
          <div className="event-actions">
            <button
              className="btn-secondary"
              onClick={() => handleManageEvent(event)}
            >
              Manage Event
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <br />
        <br/>
        <EventCarousel 
          events={EVENTS.filter(event => event.status === 'active').slice(0, 6)} 
        />
        
        {activeTab === 'events' && (
          <>
            <div className="dashboard-controls">
              <div className='search'>
                <div className="search-container">
                 
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <Location 
                  className='search-location'
                  onSearch={setLocationSearchTerm}
                  placeholder="Search by city..."
                  events={localEvents}
                />
              </div>
              
              <div className="filter-buttons">
                <button 
                  className={`btn-filter ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All Events
                </button>
                <button 
                  className={`btn-filter ${filterType === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setFilterType('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  className={`btn-filter ${filterType === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterType('active')}
                >
                  Active
                </button>
                <button 
                  className={`btn-filter ${filterType === 'past' ? 'active' : ''}`}
                  onClick={() => setFilterType('past')}
                >
                  Past
                </button>
              </div>
            </div>
            
            <CategoryFilter 
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
            
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <h3>No events found</h3>
                <p>Try adjusting your search or create a new event</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/create-event')}
                >
                  <FiPlus className="icon" />
                  Create Your First Event
                </button>
              </div>
            ) : (
              renderEventsTab()
            )}
          </>
        )}
        
        {activeTab !== 'events' && selectedEvent && (
          <ManageEvent
            selectedEvent={selectedEvent}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            toggleEventStatus={toggleEventStatus}
            formatCurrency={formatCurrency}
            attendeeSearch={attendeeSearch}
            setAttendeeSearch={setAttendeeSearch}
            handleExportAttendees={handleExportAttendees}
            filteredAttendees={filteredAttendees}
            setMessageContent={setMessageContent}
            messageTemplates={messageTemplates}
            handleUseTemplate={handleUseTemplate}
            messageContent={messageContent}
            recipientType={recipientType}
            setRecipientType={setRecipientType}
            handleSendMessage={handleSendMessage}
            totalRevenue={totalRevenue}
            totalTicketsSold={totalTicketsSold}
            totalTicketsAvailable={totalTicketsAvailable}
            salesData={salesData}
            ticketTypes={ticketTypes}
            editingTicket={editingTicket}
            setEditingTicket={setEditingTicket}
            handleTicketTypeChange={handleTicketTypeChange}
            handleRemoveTicketType={handleRemoveTicketType}
            newTicketType={newTicketType}
            setNewTicketType={setNewTicketType}
            handleAddTicketType={handleAddTicketType}
            handlePrivacyChange={handlePrivacyChange}
            setShowDeleteModal={setShowDeleteModal}
            localEvents={localEvents}
            setLocalEvents={setLocalEvents}
            setSelectedEvent={setSelectedEvent}
          />
        )}

        {showDeleteModal && selectedEvent && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Event</h3>
              <p>Are you sure you want to permanently delete "{selectedEvent.title}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDeleteEvent}
                >
                  Yes, Delete Event
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

export default Dashboard;