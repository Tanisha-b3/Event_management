import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './createEvent.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaUsers, FaLock } from 'react-icons/fa';
import Header from '../pages/header';
import Footer from '../pages/footer';

const CreateEvent = ({ existingEvent, onCancel, onSuccess }) => {
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
  }, [existingEvent]);

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
      // Combine date and time into a single ISO string
      const dateTime = new Date(`${eventData.date}T${eventData.time}:00`).toISOString();
      
      const eventPayload = {
        ...eventData,
        date: dateTime
      };

      let response;
      if (existingEvent) {
        // Update existing event
        response = await axios.put(
          `http://localhost:5000/api/events/${existingEvent._id}`,
          eventPayload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } else {
        // Create new event
        response = await axios.post(
          'http://localhost:5000/api/events',
          eventPayload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      onSuccess(response.data);
    } catch (err) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to save event');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

    <div className="create-event-form1">
      <h2>{existingEvent ? 'Edit Event' : 'Create New Event'}</h2>
      {error && <div className="error-message">{error}</div>}

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
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </div>

        <div className="form-group3">
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

        <div className="form-group3">
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

        <div className="form-group3">
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

        <div className="form-group3">
          <label>Description:</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
          />
          {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
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
            <option value="Holiday">Holiday</option>
          </select>
          {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
        </div>

        <div className="form-group3">
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
          {fieldErrors.capacity && <span className="field-error">{fieldErrors.capacity}</span>}
        </div>

        <div className="form-group3">
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

        <div className="form-group3">
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

        <div className="form-group3">
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