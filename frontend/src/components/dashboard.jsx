import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiCalendar, FiUsers, FiDollarSign, FiEdit, 
  FiMail, FiBarChart2, FiSettings, FiPause, FiPlay, FiTrash2,
  FiDownload, FiSend, FiMessageSquare, FiLock, FiGlobe, FiEye, FiEyeOff
} from 'react-icons/fi';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import { EVENTS} from './constants';
import './Dashboard.css';
import Location from '../components/featuresd/Location.jsx';
import { LOCATION_OPTIONS } from './constants';
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

  // Sample data initialization
  const [attendees, setAttendees] = useState(Attendees);

  const [ticketTypes, setTicketTypes] = useState(tickets);

  const messageTemplates = messages;

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

      // Set ticket types for selected event
      if (selectedEvent.ticketTypes) {
        setTicketTypes(selectedEvent.ticketTypes);
      }
    }
  }, [selectedEvent]);

  useEffect(() => {
    const fetchEvents = async () => {
      
        setTimeout(() => {
          const combinedEvents = [
            ...EVENTS.map(event => ({
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
            }))
          ];
          console.log(combinedEvents);
          
          const uniqueEvents = combinedEvents.reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            return x ? acc : [...acc, current];
          }, []);
          
          setEvents(uniqueEvents);
          setLocalEvents(uniqueEvents);
          setIsLoading(false);
        }, 800);
      };
    
    fetchEvents();
  }, []);
const [activeCategory, setActiveCategory] = useState('all');

const [locationSearchTerm, setLocationSearchTerm] = useState('');

// Update your filteredEvents function
const filteredEvents = localEvents.filter(event => {
  const matchesSearch = 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesLocation = 
    locationSearchTerm === '' ||
    event.location.toLowerCase().includes(locationSearchTerm.toLowerCase());
  
  const matchesCategory = activeCategory === 'all' || 
    event.category.toLowerCase() === activeCategory.toLowerCase();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  
  if (filterType === 'upcoming') {
    return matchesSearch && matchesCategory && matchesLocation && eventDate > today;
  } else if (filterType === 'active') {
    return matchesSearch && matchesCategory && matchesLocation && eventDate >= today && event.status === 'active';
  } else if (filterType === 'past') {
    return matchesSearch && matchesCategory && matchesLocation && eventDate < today;
  }
  return matchesSearch && matchesCategory && matchesLocation;
});


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

  const toggleEventStatus = () => {
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        const newStatus = ev.status === 'active' ? 'paused' : 'active';
        return { ...ev, status: newStatus };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    setSelectedEvent(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'paused' : 'active'
    }));
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  const handleDeleteEvent = () => {
  
    const updatedEvents = localEvents.filter(ev => ev.id !== selectedEvent.id);
    setLocalEvents(updatedEvents);
    setSelectedEvent(null);
    setActiveTab('events');
    setShowDeleteModal(false);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  const handleSendMessage = () => {
    const recipientCount = recipientType === 'all' 
      ? attendees.length 
      : attendees.filter(a => 
          recipientType === 'checked-in' ? a.status === 'Checked In' : a.status === 'Not Checked In'
        ).length;
    
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
    link.setAttribute('download', `${selectedEvent.title}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseTemplate = (template) => {
    setMessageContent(template.content);
  };

  const filteredAttendees = attendees.filter(attendee => {
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

  const handlePrivacyChange = (privacy) => {
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        return { ...ev, privacy };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    setSelectedEvent(prev => ({ ...prev, privacy }));
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  const handleTicketTypeChange = (id, field, value) => {
    const updatedTicketTypes = ticketTypes.map(ticket => {
      if (ticket.id === id) {
        return { ...ticket, [field]: field === 'price' || field === 'total' ? Number(value) : value };
      }
      return ticket;
    });
    setTicketTypes(updatedTicketTypes);
    
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        return { ...ev, ticketTypes: updatedTicketTypes };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
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
      
      const updatedEvents = localEvents.map(ev => {
        if (ev.id === selectedEvent.id) {
          return { ...ev, ticketTypes: updatedTicketTypes };
        }
        return ev;
      });
      setLocalEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      
      setNewTicketType({ name: '', price: 0, quantity: 0 });
    }
  };

  const handleRemoveTicketType = (id) => {
    const updatedTicketTypes = ticketTypes.filter(ticket => ticket.id !== id);
    setTicketTypes(updatedTicketTypes);
    
    const updatedEvents = localEvents.map(ev => {
      if (ev.id === selectedEvent.id) {
        return { ...ev, ticketTypes: updatedTicketTypes };
      }
      return ev;
    });
    setLocalEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  const totalRevenue = ticketTypes.reduce((sum, ticket) => sum + (ticket.price * ticket.sold), 0);
  const totalTicketsSold = ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0);
  const totalTicketsAvailable = ticketTypes.reduce((sum, ticket) => sum + ticket.total, 0);

  const renderEventsTab = () => (
    <div className="events-grid2">
      {filteredEvents.map(event => (
        <div className="event-card2" key={event.id}>
          <div className="event-header2">
            <span className={`event-status2 ${event.status}`}>
              {event.status}
            </span>
            <span className="event-category2">{event.category}</span>
            <span className="event-date2">
              <FiCalendar className="icon" />
              {formatDate(event.date)}
            </span>
            {event.privacy === 'private' && (
              <span className="event-privacy">
                <FiLock size={14} />
              </span>
            )}
          </div>
          
          <h3 className="event-title2">{event.title}</h3>
          <p className="event-location2">{event.location}</p>
          
          <div className="event-stats2">
            <div className="stat-item1">
              <FiUsers className="icon" />
              <span>{event.attendees}/{event.capacity}</span>
            </div>
            <div className="stat-item1">
              <FiDollarSign className="icon" />
              <span>{formatCurrency(event.revenue)}</span>
            </div>
          </div>
          <div className='event1-t'>
          <div className='event-actions3'>
             <button
      className="btn-secondary1"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      EventDetails
    </button>
     </div>
          
          <div className="event-actions2">
            <button
              className="btn-secondary1"
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
    <div className="dashboard-container3">
    <Header />
      <main className="dashboard-main4">
      <br />
      <br/>
<EventCarousel 
  events={EVENTS.filter(event => event.status === 'active').slice(0, 6)} />
        {activeTab === 'events' && (
          <>
            <div className="dashboard-controls4">
            <div className='search-1'>
              <div className="search-container3">
                {/* <FiSearch className="search-icon" /> */}
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                /></div>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <Location className='class1'
    onSearch={setLocationSearchTerm}
    placeholder="Search by city..."
    events={localEvents}
  />

  </div>
              <div className="filter-buttons3">     
                <button 
                  className={`btn-filter ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All
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
        
        {activeTab !== 'events' && (
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


        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Event</h3>
              <p>Are you sure you want to permanently delete "{selectedEvent?.title}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  No, Keep Event
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