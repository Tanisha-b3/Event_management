import React, { useEffect, useState } from 'react';
import { FiGlobe, FiLock, FiEdit, FiTrash2 } from 'react-icons/fi';
import { apiClient } from '../../utils/api';
import { getUserRole } from '../../utils/auth';
import { toast } from 'react-toastify';
import CustomDropdown from '../customDropdown.jsx';
import './EventSettingsForm.css';

const EventSettingsForm = ({
  selectedEvent,
  setSelectedEvent,
  setLocalEvents,
  ticketTypes,
  handlePrivacyChange,
  setShowDeleteModal,
}) => {
  const role = getUserRole();
  const canEdit = role === 'admin' || role === 'organiser';

  const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: selectedEvent.title || '',
    date: toDateTimeLocal(selectedEvent.date),
    location: selectedEvent.location || '',
    description: selectedEvent.description || '',
    category: selectedEvent.category || '',
  });

  useEffect(() => {
    setFormData({
      title: selectedEvent.title || '',
      date: toDateTimeLocal(selectedEvent.date),
      location: selectedEvent.location || '',
      description: selectedEvent.description || '',
      category: selectedEvent.category || '',
    });
  }, [selectedEvent]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSelectedEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    const normalizedDate = formData.date ? new Date(formData.date).toISOString() : selectedEvent.date;
    const payload = {
      title: formData.title,
      date: normalizedDate,
      location: formData.location,
      description: formData.description,
      category: formData.category || selectedEvent.category,
      privacy: selectedEvent.privacy,
      ticketTypes
    };

    try {
      const { data } = await apiClient.put(`/events/${selectedEvent.id}`, payload);
      const updated = data?.data || data;
      setSelectedEvent(prev => ({ ...prev, ...updated, id: updated?._id || prev.id }));
      if (setLocalEvents) {
        setLocalEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? { ...ev, ...updated, id: updated?._id || ev.id } : ev));
      }
      toast.success('Event updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to update event';
      toast.error(message);
    }
  };

  return (
    <div className="settings-section">
      <h3>Event Settings</h3>
      <div className="settings-form">
        <div className="form-group">
          <label>Event Title</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={(e) => updateField('title', e.target.value)}
            disabled={!canEdit}
          />
        </div>
        
        <div className="form-group">
          <label>Date & Time</label>
          <input 
            type="datetime-local" 
            value={formData.date} 
            onChange={(e) => updateField('date', e.target.value)}
            disabled={!canEdit}
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input 
            type="text" 
            value={formData.location} 
            onChange={(e) => updateField('location', e.target.value)}
            disabled={!canEdit}
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            disabled={!canEdit}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Category</label>
          <CustomDropdown
            value={formData.category}
            onChange={(val) => updateField('category', val)}
            options={[
              { value: 'Technology', label: 'Technology' },
              { value: 'Music', label: 'Music' },
              { value: 'Food', label: 'Food' },
              { value: 'Business', label: 'Business' },
              { value: 'Holiday', label: 'Holiday' },
              { value: 'Sports', label: 'Sports' },
              { value: 'Conference', label: 'Conference' },
              { value: 'Workshop', label: 'Workshop' },
              { value: 'Meetup', label: 'Meetup' },
              { value: 'Festival', label: 'Festival' },
              { value: 'Education', label: 'Education' },
              { value: 'Art', label: 'Art' },
              { value: 'Health', label: 'Health' },
              { value: 'Gaming', label: 'Gaming' },
              { value: 'Literature', label: 'Literature' },
              { value: 'Fundraiser', label: 'Fundraiser' },
            ]}
            placeholder="Select a category"
            disabled={!canEdit}
          />
        </div>
        
        <div className="form-group">
          <label>Event Privacy</label>
          <div className="privacy-options">
            <button
              className={`privacy-option ${selectedEvent.privacy === 'public' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('public')}
              disabled={!canEdit}
            >
              <FiGlobe /> Public (Visible to everyone)
            </button>
            <button
              className={`privacy-option ${selectedEvent.privacy === 'private' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('private')}
              disabled={!canEdit}
            >
              <FiLock /> Private (Only visible to invited guests)
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave} disabled={!canEdit}>Save All Changes</button>
          <button 
            className="btn-danger" 
            onClick={() => setShowDeleteModal(true)}
            disabled={!canEdit}
          >
            <FiTrash2 className="icon" /> Delete Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSettingsForm;
