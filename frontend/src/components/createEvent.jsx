import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import './createEvent.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaUsers, FaLock } from 'react-icons/fa';
import Header from '../pages/header';
import Footer from '../pages/footer';
import { getUserRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from './utils';

const CreateEvent = ({ existingEvent, onCancel, onSuccess }) => {
  const navigate = useNavigate();
  const role = getUserRole();
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: '',
    ticketPrice: 0,
    capacity: 0,
    privacy: 'public',
    status: 'active',
    imageUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Populate form if editing existing event
  useEffect(() => {
    if (role !== 'admin' && role !== 'organiser') {
      navigate('/');
      return;
    }

    if (existingEvent) {
      const eventDate = new Date(existingEvent.date);
      const formattedDate = eventDate.toISOString().split('T')[0];
      const formattedTime = eventDate.toTimeString().substring(0, 5);
      
      setEventData({
        title: existingEvent.title,
        date: formattedDate,
        time: formattedTime,
        location: existingEvent.location,
        description: existingEvent.description,
        category: existingEvent.category,
        ticketPrice: existingEvent.ticketPrice,
        capacity: existingEvent.capacity,
        privacy: existingEvent.privacy,
        status: existingEvent.status,
        imageUrl: existingEvent.imageUrl || ''
      });
    }
  }, [existingEvent, navigate, role]);

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
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);
  setFieldErrors({});

  try {
    // Validate required fields
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location || !eventData.category) {
      handleError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const dateTime = new Date(
      `${eventData.date}T${eventData.time}:00`
    ).toISOString();

    const eventPayload = {
      ...eventData,
      date: dateTime,
    };

    console.log('Sending event data:', eventPayload);

    let response;

    if (existingEvent) {
      response = await apiClient.put(`/events/${existingEvent._id}`,
        eventPayload
      );
      handleSuccess(response.data.message || 'Event updated successfully!');
    } else {
      response = await apiClient.post('/events',
        eventPayload
      );
      handleSuccess(response.data.message || 'Event created successfully!');
    }

    // ✅ SUCCESS
    console.log('Event saved:', response.data);
    onSuccess?.(response.data);
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);

  } catch (err) {
    console.error('Error saving event:', err);
    
    if (err.response?.data?.errors) {
      setFieldErrors(err.response.data.errors);
      handleError(err.response.data.message || 'Validation error');
    } else if (err.response?.data?.message) {
      const errorMsg = err.response.data.message;
      setError(errorMsg);
      handleError(errorMsg);
    } else if (err.message === 'Network Error') {
      const msg = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
      setError(msg);
      handleError(msg);
    } else {
      const msg = "Failed to save event. Please try again.";
      setError(msg);
      handleError(msg);
    }
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <>
      <Header />

    <div className="create-event-form">
      <h2>{existingEvent ? 'Edit Event' : 'Create New Event'}</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </div>

        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            required
          />
          {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
        </div>

        <div className="form-group">
          <label>Time:</label>
          <input
            type="time"
            name="time"
            value={eventData.time}
            onChange={handleChange}
            required
          />
          {fieldErrors.time && <span className="field-error">{fieldErrors.time}</span>}
        </div>

        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            required
          />
          {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
          />
          {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
        </div>

        <div className="form-group">
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
            <option value="Holiday">Holiday</option>
          </select>
          {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
        </div>

        <div className="form-group">
          <label>Ticket Price ($):</label>
          <input
            type="number"
            name="ticketPrice"
            value={eventData.ticketPrice}
            onChange={handleChange}
            min="1"
            required
          />
          {fieldErrors.ticketPrice && <span className="field-error">{fieldErrors.ticketPrice}</span>}
        </div>

        <div className="form-group">
          <label>Capacity:</label>
          <input
            type="number"
            name="capacity"
            value={eventData.capacity}
            onChange={handleChange}
            min="1"
            required
          />
          {fieldErrors.capacity && <span className="field-error">{fieldErrors.capacity}</span>}
        </div>

        <div className="form-group">
          <label>Privacy:</label>
          <select
            name="privacy"
            value={eventData.privacy}
            onChange={handleChange}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status:</label>
          <select
            name="status"
            value={eventData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Image URL:</label>
          <input
            type="text"
            name="imageUrl"
            value={eventData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-submit"
          >
            {isSubmitting ? 'Saving...' : existingEvent ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
    <Footer />
    </>
  );
};

export default CreateEvent;
