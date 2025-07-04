import React from 'react';
import { FiGlobe, FiLock, FiEdit, FiTrash2 } from 'react-icons/fi';

const EventSettingsForm = ({
  selectedEvent,
  localEvents,
  setLocalEvents,
  setSelectedEvent,
  ticketTypes,
  editingTicket,
  setEditingTicket,
  handleTicketTypeChange,
  handleRemoveTicketType,
  newTicketType,
  setNewTicketType,
  handleAddTicketType,
  handlePrivacyChange,
  setShowDeleteModal,
  formatCurrency
}) => {
  return (
    <div className="settings-section">
      <h3>Event Settings</h3>
      <div className="settings-form">
        <div className="form-group">
          <label>Event Title</label>
          <input 
            type="text" 
            value={selectedEvent.title} 
            onChange={(e) => {
              const updatedEvents = localEvents.map(ev => 
                ev.id === selectedEvent.id ? {...ev, title: e.target.value} : ev
              );
              setLocalEvents(updatedEvents);
              setSelectedEvent(prev => ({...prev, title: e.target.value}));
              localStorage.setItem('events', JSON.stringify(updatedEvents));
            }}
          />
        </div>
        
        <div className="form-group">
          <label>Date & Time</label>
          <input 
            type="datetime-local" 
            value={selectedEvent.date} 
            onChange={(e) => {
              const updatedEvents = localEvents.map(ev => 
                ev.id === selectedEvent.id ? {...ev, date: e.target.value} : ev
              );
              setLocalEvents(updatedEvents);
              setSelectedEvent(prev => ({...prev, date: e.target.value}));
              localStorage.setItem('events', JSON.stringify(updatedEvents));
            }}
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input 
            type="text" 
            value={selectedEvent.location} 
            onChange={(e) => {
              const updatedEvents = localEvents.map(ev => 
                ev.id === selectedEvent.id ? {...ev, location: e.target.value} : ev
              );
              setLocalEvents(updatedEvents);
              setSelectedEvent(prev => ({...prev, location: e.target.value}));
              localStorage.setItem('events', JSON.stringify(updatedEvents));
            }}
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={selectedEvent.description}
            onChange={(e) => {
              const updatedEvents = localEvents.map(ev => 
                ev.id === selectedEvent.id ? {...ev, description: e.target.value} : ev
              );
              setLocalEvents(updatedEvents);
              setSelectedEvent(prev => ({...prev, description: e.target.value}));
              localStorage.setItem('events', JSON.stringify(updatedEvents));
            }}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Event Privacy</label>
          <div className="privacy-options">
            <button
              className={`privacy-option ${selectedEvent.privacy === 'public' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('public')}
            >
              <FiGlobe /> Public (Visible to everyone)
            </button>
            <button
              className={`privacy-option ${selectedEvent.privacy === 'private' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('private')}
            >
              <FiLock /> Private (Only visible to invited guests)
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label>Ticket Types</label>
          <div className="ticket-types-editor">
            {ticketTypes.map(ticket => (
              <div key={ticket.id} className="ticket-type-card">
                {editingTicket === ticket.id ? (
                  <div className="ticket-edit-form">
                    <input
                      type="text"
                      value={ticket.type}
                      onChange={(e) => handleTicketTypeChange(ticket.id, 'type', e.target.value)}
                      placeholder="Ticket name"
                    />
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => handleTicketTypeChange(ticket.id, 'price', e.target.value)}
                      min="0"
                      placeholder="Price"
                    />
                    <input
                      type="number"
                      value={ticket.total}
                      onChange={(e) => handleTicketTypeChange(ticket.id, 'total', e.target.value)}
                      min="1"
                      placeholder="Quantity"
                    />
                    <button 
                      className="save-ticket-btn"
                      onClick={() => setEditingTicket(null)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="ticket-type-display">
                    <div>
                      <strong>{ticket.type}</strong>
                      <span>{formatCurrency(ticket.price)}</span>
                      <span>{ticket.sold}/{ticket.total} sold</span>
                    </div>
                    <div className="ticket-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingTicket(ticket.id)}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleRemoveTicketType(ticket.id)}
                        disabled={ticket.sold > 0}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="add-ticket-type">
              <h4>Add New Ticket Type</h4>
              <div className="ticket-inputs">
                <input
                  type="text"
                  placeholder="Ticket name"
                  value={newTicketType.name}
                  onChange={(e) => setNewTicketType({...newTicketType, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newTicketType.price}
                  onChange={(e) => setNewTicketType({...newTicketType, price: e.target.value})}
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newTicketType.quantity}
                  onChange={(e) => setNewTicketType({...newTicketType, quantity: e.target.value})}
                  min="1"
                />
                <button 
                  className="add-ticket-btn"
                  onClick={handleAddTicketType}
                  disabled={!newTicketType.name || newTicketType.price <= 0 || newTicketType.quantity <= 0}
                >
                  Add Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn-primary">Save All Changes</button>
          <button 
            className="btn-danger" 
            onClick={() => setShowDeleteModal(true)}
          >
            <FiTrash2 className="icon" /> Delete Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSettingsForm;