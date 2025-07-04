import React, { useState } from 'react';
import axios from 'axios';
import './createEvent.css'
import Header from '../pages/header';
import Footer from '../pages/footer';

const CreateEvent = () => {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time:'',
    location: '',
    description: '',
    category: '',
    ticketPrice: 0,
    capacity: 0,
    attendees:0,
    privacy:'public',
    status:'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: name === 'ticketPrice' || name === 'capacity' 
        ? Number(value) 
        : value
    }));
  };
  const handleSubmit = async (e) => {
  try {
      const response = await axios.post('http://localhost:5000/api/events', eventData);
      
      setSuccess(true);
      // Reset form on success
      setEventData({
        title: '',
        date: '',
        time:'',
        location: '',
        description: '',
        category: '',
        ticketPrice: 0,
        capacity: 0,
        attendees:0,
        privacy:'',
        status:'',

      });
      
    } catch (err) {
      if (err.response?.data?.errors) {
        // Server-side validation errors
        setFieldErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to create event');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
    <Header />
    <div className="create-event-form1">
      <h2>Create New Event</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Event created successfully!</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group3">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group3">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            />
        </div>
        <div className='form-group3'>
          <label>Time</label>
          <input type='time' name='time' value={eventData.time} onChange={handleChange}/>
        </div>

        <div className="form-group3">
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            required
          />
        </div>
           <div className="form-group3">
          <label>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={eventData.capacity}
            onChange={handleChange}
            required
          />
        </div>
        

        <div className="form-group3">
          <label>Description:</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group3">
          <label>Category:</label>
          <select
            name="category"
            value={eventData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Technology">Technology</option>
            <option value="Music">Music</option>
            <option value="Food">Food</option>
            <option value="Business">Business</option>
            <option value="Holidays">Holiday</option>
            {/* Add other categories */}
          </select>
        </div>

        <div className="form-group3">
          <label>Ticket Price ($):</label>
          <input
            type="number"
            name="ticketPrice"
            value={eventData.ticketPrice}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group3">
          <label>Capacity:</label>
          <input
            type="number"
            name="capacity"
            value={eventData.capacity}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
  <div className="form-group3">
          <label>Attendees:</label>
          <input
            type="number"
            name="Attendees"
            value={eventData.attendees}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
          <div className="form-group3">
          <label>Privacy</label>
          <input
            type="text"
            name="Privacy"
            value={eventData.privacy}
            onChange={handleChange}
            min="public"
            required
          />
        </div>
          <div className="form-group3">
          <label>Status:</label>
          <input
            type="text"
            name="Status"
            value={eventData.status}
            onChange={handleChange}
            min="active"
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
    <Footer />
    </>
  );
};

export default CreateEvent;