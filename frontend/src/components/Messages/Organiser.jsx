import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTicketAlt,
  FaArrowLeft,
  FaUsers,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import CreateEvent from '../createEvent.jsx';
import './organizer.css';
import axios from 'axios';
import image4 from '../../assets/image4.jpg'
const Organizer = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [isLoading, setIsLoading] = useState(false);

  // Load events from API
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setEvents(response.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:5000/api/events/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
         const updatedTickets = userTickets.filter(ticket => ticket.eventId !== id);
         localStorage.setItem('userTickets', JSON.stringify(updatedTickets));
        setEvents(events.filter(event => event._id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const handleEventCreated = (newEvent) => {
    if (currentEvent) {
      // Update existing event
      setEvents(events.map(event => 
        event._id === newEvent._id ? newEvent : event
      ));
    } else {
      // Add new event
      setEvents([...events, newEvent]);
    }
    setCurrentEvent(null);
    setViewMode('list');
  };
  console.log(events)

  return (
    <div className="organiser-container">
      {viewMode === 'list' ? (
        <>
          <header className="organiser-header">
            <button onClick={() => navigate(-1)} className="btn-back">
              <FaArrowLeft /> Back
            </button>
            <h1>Event Organizer Dashboard</h1>
            <button 
              onClick={() => {
                setCurrentEvent(null);
                setViewMode('form');
              }} 
              className="btn-primary"
            >
              <FaPlus /> Create Event
            </button>
          </header>

          {isLoading ? (
            <div className="loading">Loading events...</div>
          ) : (
            <div className="events-list">
              {events.length === 0 ? (
                <div className="empty-state">
                  <p>No events created yet.</p>
                  <button 
                    onClick={() => setViewMode('form')} 
                    className="btn-primary"
                  >
                    <FaPlus /> Create Your First Event
                  </button>
                </div>
              ) : (
                events.map(event => (
                  <div key={event._id} className="event-card">
                    <div className="event-image">
                      {event.image ? (
                        <img src={event.image} alt={event.title} />
                      ) : (
                        <img src={image4}></img>
                      )}
                    </div>
                    
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p className="event-meta">
                        <span><FaCalendarAlt /> {new Date(event.date).toLocaleDateString()}</span>
                        <span><FaMapMarkerAlt /> {event.location}</span>
                      </p>
                      
                      <div className="event-stats">
                        <span><FaTicketAlt /> ${event.ticketPrice}</span>
                        <span><FaUsers /> {event.attendees.length}/{event.capacity}</span>
                        <span>
                          {event.privacy === 'public' ? <FaEye /> : <FaEyeSlash />}
                          {event.privacy}
                        </span>
                      </div>
                      
                      <p className="event-description">
                        {event.description.substring(0, 100)}...
                      </p>
                    </div>
                    
                    <div className="event-actions">
                      <button 
                        onClick={() => {
                          setCurrentEvent(event);
                          setViewMode('form');
                        }} 
                        className="btn-edit"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        onClick={() => deleteEvent(event._id)} 
                        className="btn-danger"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <CreateEvent 
          existingEvent={currentEvent}
          onCancel={() => {
            setCurrentEvent(null);
            setViewMode('list');
          }}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  );
};

export default Organizer;