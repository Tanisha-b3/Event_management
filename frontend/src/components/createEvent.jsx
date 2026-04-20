import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../utils/api';
import './createEvent.css';
import { FaImage, FaArrowLeft, FaMagic } from 'react-icons/fa';
import { getUserRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from './utils';
import { createEvent as createEventAction, updateEvent as updateEventAction, generateEventDescription } from '../store/slices/eventSlice';
import CustomDropdown from './customDropdown';

const CATEGORY_OPTIONS = [
  { value: 'Technology', label: 'Technology', icon: '💻' },
  { value: 'Music', label: 'Music', icon: '🎵' },
  { value: 'Food', label: 'Food', icon: '🍔' },
  { value: 'Business', label: 'Business', icon: '💼' },
  { value: 'Holiday', label: 'Holiday', icon: '🎉' },
  { value: 'Sports', label: 'Sports', icon: '⚽' },
  { value: 'Conference', label: 'Conference', icon: '🎤' },
  { value: 'Workshop', label: 'Workshop', icon: '🔧' },
  { value: 'Meetup', label: 'Meetup', icon: '👥' },
  { value: 'Festival', label: 'Festival', icon: '🎪' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Art', label: 'Art', icon: '🎨' },
  { value: 'Health', label: 'Health', icon: '🏥' },
  { value: 'Gaming', label: 'Gaming', icon: '🎮' },
  { value: 'Literature', label: 'Literature', icon: '📖' },
  { value: 'Fundraiser', label: 'Fundraiser', icon: '🤝' }
];

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public - Everyone can see', icon: '🌍' },
  { value: 'private', label: 'Private - Invite only', icon: '🔒' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active - Published', icon: '✅' },
  { value: 'draft', label: 'Draft - Not published', icon: '📝' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌' },
  { value: 'pending', label: 'Pending Approval', icon: '⏳' },
  { value: 'completed', label: 'Completed', icon: '🎯' },
  { value: 'soldout', label: 'Sold Out', icon: '🔥' }
];

// Full initial state matching Events model
const INITIAL_STATE = {
  title: '',
  description: '',
  date: '',
  time: '10:00 AM - 5:00 PM',
  location: '',
  category: '',
  ticketPrice: 0,
  capacity: 100,
  status: 'pending',
  privacy: 'public',
  imageUrl: '',
  fileName: '',
  views: 0,
  attendees: 0,
  ticketsSold: 0,
  revenue: 0,
  rejectionReason: ''
};

const CreateEvent = ({ existingEvent, onCancel, onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { loading: eventLoading, error: eventError, generatedDescription } = useSelector((state) => state.events);

  const role = getUserRole();
  const [eventData, setEventData] = useState(INITIAL_STATE);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

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
        description: existingEvent.description || '',
        category: existingEvent.category || CATEGORY_OPTIONS[0].value,
        ticketPrice: existingEvent.ticketPrice || 0,
        capacity: existingEvent.capacity || 0,
        privacy: existingEvent.privacy || 'public',
        status: existingEvent.status || 'active',
        imageUrl: existingEvent.imageUrl || '',
        fileName: existingEvent.fileName || ''
      });
      
      if (existingEvent.imageUrl) {
        setImagePreview(existingEvent.imageUrl);
      }
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
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post('/events/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Image upload response:', response.data);
      if (response.data.success) {
        return {
          imageUrl: response.data.imageUrl,
          fileName: response.data.fileName
        };
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        handleError('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        handleError('Only JPG, PNG, GIF, and WEBP files are allowed');
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(selectedFile);
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(previewUrl);
    }
  };

  const handleGenerateDescription = async () => {
    if (!eventData.title || !eventData.category || !eventData.date || !eventData.location) {
      handleError('Please fill in title, category, date, and location first');
      return;
    }
    
    setGeneratingDesc(true);
    try {
      const result = await dispatch(generateEventDescription({
        title: eventData.title,
        category: eventData.category,
        date: eventData.date,
        location: eventData.location,
        time: eventData.time,
        ticketPrice: eventData.ticketPrice,
        capacity: eventData.capacity
      })).unwrap();
      
      if (result.description) {
        setEventData(prev => ({ ...prev, description: result.description }));
        handleSuccess('Description generated!');
      }
    } catch (err) {
      handleError(err || 'Failed to generate description');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Validation
    const errors = {};
    if (!eventData.title.trim()) errors.title = 'Title is required';
    if (!eventData.date) errors.date = 'Date is required';
    if (!eventData.time) errors.time = 'Time is required';
    if (!eventData.location.trim()) errors.location = 'Location is required';
    if (!eventData.category) errors.category = 'Category is required';
    if (!eventData.capacity || eventData.capacity < 1) errors.capacity = 'Valid capacity is required';

    // Prevent creating events in the past
    if (eventData.date && eventData.time) {
      const eventDateTime = new Date(`${eventData.date}T${eventData.time}:00`);
      const now = new Date();
      if (eventDateTime < now) {
        errors.date = 'Event date and time must be in the future';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      handleError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const dateTime = new Date(`${eventData.date}T${eventData.time}:00`).toISOString();

      let imageUrl = eventData.imageUrl;
      let fileName = eventData.fileName;

      if (file) {
        setUploadingImage(true);
        try {
          const imageResult = await uploadImage(file);
          imageUrl = imageResult.imageUrl;
          fileName = imageResult.fileName;
          setUploadingImage(false);
        } catch (uploadError) {
          setUploadingImage(false);
          handleError(uploadError.message);
          setIsSubmitting(false);
          return;
        }
      }

      const dataToSend = {
        title: eventData.title.trim(),
        date: dateTime,
        location: eventData.location.trim(),
        description: eventData.description || '',
        category: eventData.category,
        ticketPrice: Number(eventData.ticketPrice),
        capacity: Number(eventData.capacity),
        privacy: eventData.privacy,
        status: eventData.status,
        imageName: fileName || '',
        image: imageUrl || '',
        time: eventData.time || '10:00 AM - 5:00 PM',
        organizerId: user?._id || user?.id
      };

      console.log('Sending event data:', dataToSend);

      let response;
      if (existingEvent) {
        response = await apiClient.put(`/events/${existingEvent._id}`, dataToSend);
        handleSuccess('Event updated successfully!');
      } else {
        response = await apiClient.post('/events', dataToSend);
        if (role === 'admin') {
          handleSuccess('Event published successfully!');
        } else {
          handleSuccess('Event submitted! Waiting for admin approval.');
        }
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      // Reset form fields after successful submission
      setEventData(INITIAL_STATE);
      setImagePreview(null);
      setFile(null);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      console.error('Error saving event:', err);

      if (err.response?.data?.errors) {
        if (Array.isArray(err.response.data.errors)) {
          setFieldErrors({ general: err.response.data.errors.join(', ') });
        } else {
          setFieldErrors(err.response.data.errors);
        }
        handleError(err.response.data.message || 'Validation error');
      } else {
        handleError(err.response?.data?.message || "Failed to save event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <>
      <div className="create-event-form">
        <button className="btn-back-k" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h2>{existingEvent ? 'Edit Event' : 'Create New Event'}</h2>
        
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              className={fieldErrors.title ? 'error' : ''}
              disabled={isSubmitting || uploadingImage}
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                name="date"
                value={eventData.date}
                onChange={handleChange}
                className={fieldErrors.date ? 'error' : ''}
                disabled={isSubmitting || uploadingImage}
              />
              {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                id="time"
                type="time"
                name="time"
                value={eventData.time}
                onChange={handleChange}
                className={fieldErrors.time ? 'error' : ''}
                disabled={isSubmitting || uploadingImage}
              />
              {fieldErrors.time && <span className="field-error">{fieldErrors.time}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              type="text"
              name="location"
              value={eventData.location}
              onChange={handleChange}
              placeholder="Enter event location"
              className={fieldErrors.location ? 'error' : ''}
              disabled={isSubmitting || uploadingImage}
            />
            {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
          </div>

           <div className="form-group">
            <label htmlFor="category">Category *</label>
            <CustomDropdown
              options={CATEGORY_OPTIONS}
              value={eventData.category}
              onChange={(value) => {
                setEventData(prev => ({ ...prev, category: value }));
                if (fieldErrors.category) {
                  setFieldErrors(prev => ({ ...prev, category: '' }));
                }
              }}
              placeholder="Select a category"
              label={null}
              withIcons={true}
              searchable={true}
              size="md"
              variant="default"
              clearable={false}
              error={fieldErrors.category}
              disabled={isSubmitting || uploadingImage}
              className="w-full"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
              <button
                type="button"
                className="btn-ai-generate"
                onClick={handleGenerateDescription}
                disabled={generatingDesc || !eventData.title || !eventData.category || !eventData.date || !eventData.location}
                title="Generate with AI"
              >
                <FaMagic className={generatingDesc ? 'spinning' : ''} />
                {generatingDesc ? ' Generating...' : ' AI Generate'}
              </button>
            </label>
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              placeholder="Describe your event or use AI to generate..."
              rows="5"
              disabled={isSubmitting || uploadingImage}
            />
          </div>

         

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticketPrice">Ticket Price ($)</label>
              <input
                id="ticketPrice"
                type="number"
                name="ticketPrice"
                value={eventData.ticketPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={isSubmitting || uploadingImage}
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Capacity *</label>
              <input
                id="capacity"
                type="number"
                name="capacity"
                value={eventData.capacity}
                onChange={handleChange}
                min="1"
                max="10000"
                disabled={isSubmitting || uploadingImage}
              />
              {fieldErrors.capacity && <span className="field-error">{fieldErrors.capacity}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="privacy">Privacy</label>
              <CustomDropdown
                options={PRIVACY_OPTIONS}
                value={eventData.privacy}
                onChange={(value) => setEventData(prev => ({ ...prev, privacy: value }))}
                placeholder="Select privacy setting"
                label={null}
                withIcons={true}
                size="md"
                variant="default"
                clearable={false}
                disabled={isSubmitting || uploadingImage}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <CustomDropdown
                options={STATUS_OPTIONS}
                value={eventData.status}
                onChange={(value) => setEventData(prev => ({ ...prev, status: value }))}
                placeholder="Select status"
                label={null}
                withIcons={true}
                size="md"
                variant="default"
                clearable={false}
                disabled={isSubmitting || uploadingImage}
                className="w-full"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Event Image</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isSubmitting || uploadingImage}
              />
              <button
                type="button"
                className="upload-button"
                onClick={() => document.getElementById('image-upload').click()}
                disabled={isSubmitting || uploadingImage}
              >
                <FaImage /> Choose Image
              </button>
              <small className="upload-hint">JPG, PNG, GIF, WEBP (max 5MB)</small>
            </div>
            
            {uploadingImage && (
              <div className="uploading-status">
                <span>Uploading image...</span>
              </div>
            )}
            
            {imagePreview && (
              <div className="image-preview">
                <img 
                  src={imagePreview} 
                  alt="Event preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '150px', 
                    marginTop: '10px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }} 
                />
                {file && !uploadingImage && (
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => {
                      if (imagePreview && imagePreview.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreview);
                      }
                      setFile(null);
                      setImagePreview(eventData.imageUrl || null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-cancel"
              disabled={isSubmitting || uploadingImage}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || uploadingImage}
              className="btn-submit"
            >
              {uploadingImage ? (
                <>📤 Uploading Image...</>
              ) : isSubmitting ? (
                <>💾 Saving...</>
              ) : (
                <>{existingEvent ? '✏️ Update Event' : '✨ Create Event'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateEvent;