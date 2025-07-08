import React from 'react';
import {
  FiUsers,
  FiDollarSign,
  FiMail,
  FiSettings,
  FiPause,
  FiPlay,
  FiEdit,
  FiBarChart2,
  FiDownload,
  FiMessageSquare,
  FiSend
} from 'react-icons/fi';

import EventSettingsForm from './EventSettingsForm'; // adjust path if needed

const ManageEvent = ({
  selectedEvent,
  activeTab,
  setActiveTab,
  toggleEventStatus,
  formatCurrency,
  attendeeSearch,
  setAttendeeSearch,
  filteredAttendees,
  setMessageContent,
  messageTemplates,
  handleUseTemplate,
  messageContent,
  recipientType,
  setRecipientType,
  handleSendMessage,
  totalRevenue,
  totalTicketsSold,
  totalTicketsAvailable,
  salesData,
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
  localEvents,
  setLocalEvents,
  setSelectedEvent
}) => {
  if (!selectedEvent) return null;

  return (
    <div className="manage-event-container">
      <div className="manage-header">
        <h2>{selectedEvent.title}</h2>
        <button className="btn-back" onClick={() => setActiveTab('events')}>
          Back to All Events
        </button>
      </div>

      <div className="manage-tabs">
        <button
          className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'attendees' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          <FiUsers className="icon" /> Attendees
        </button>
        <button
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FiDollarSign className="icon" /> Sales
        </button>
        <button
          className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <FiMail className="icon" /> Communications
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FiSettings className="icon" /> Settings
        </button>
      </div>

      <div className="manage-content">
        {activeTab === 'manage' && (
          <div className="overview-section">
            <div className="overview-stats">
              <div className="stat-card">
                <h3>Attendance</h3>
                <div className="stat-value">
                  {selectedEvent.attendees}/{selectedEvent.capacity}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(selectedEvent.attendees / selectedEvent.capacity) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="stat-card">
                <h3>Revenue</h3>
                <div className="stat-value">
                  {formatCurrency(selectedEvent.revenue)}
                </div>
                <div className="stat-subtext">
                  from {selectedEvent.ticketsSold} tickets
                </div>
              </div>

              <div className="stat-card">
                <h3>Event Status</h3>
                <div className="stat-value">
                  {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                </div>
                <button className="btn-small" onClick={toggleEventStatus}>
                  {selectedEvent.status === 'active' ? (
                    <>
                      <FiPause className="icon" /> Pause Sales
                    </>
                  ) : (
                    <>
                      <FiPlay className="icon" /> Activate
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="quick-actions">
              <button className="btn-action" onClick={() => setActiveTab('messages')}>
                <FiMail className="icon" /> Email Attendees
              </button>
              <button className="btn-action" onClick={() => setActiveTab('settings')}>
                <FiEdit className="icon" /> Edit Event Details
              </button>
              <button className="btn-action">
                <FiBarChart2 className="icon" /> View Analytics
              </button>
            </div>
          </div>
        )}

        {activeTab === 'attendees' && (
          <div className="attendees-section">
            <h3>Attendee List</h3>
            <div className="search-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search attendees..."
                  className="search-input"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="attendee-table">
              <div className="table-header">
                <div className="header-item">Name</div>
                <div className="header-item">Email</div>
                <div className="header-item">Ticket Type</div>
                <div className="header-item">Status</div>
                <div className="header-item">Actions</div>
              </div>

              {filteredAttendees.map((attendee) => (
                <div className="table-row" key={attendee.id}>
                  <div className="row-item">{attendee.name}</div>
                  <div className="row-item">{attendee.email}</div>
                  <div className="row-item">{attendee.ticketType}</div>
                  <div className="row-item">
                    <span
                      className={`status-${attendee.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {attendee.status}
                    </span>
                  </div>
                  <div className="row-item">
                    <button
                      className="btn-small"
                      onClick={() => {
                        setMessageContent(`Message for ${attendee.name}:\n\n`);
                        setActiveTab('messages');
                      }}
                    >
                      <FiMessageSquare className="icon" /> Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="sales-section">
            <h3>Ticket Sales</h3>
            <div className="sales-stats">
              <div className="stat-card">
                <h4>Total Revenue</h4>
                <div className="stat-value-large">{formatCurrency(totalRevenue)}</div>
              </div>
              <div className="stat-card">
                <h4>Tickets Sold</h4>
                <div className="stat-value-large">{totalTicketsSold}</div>
              </div>
              <div className="stat-card">
                <h4>Remaining</h4>
                <div className="stat-value-large">
                  {totalTicketsAvailable - totalTicketsSold}
                </div>
              </div>
            </div>

            <div className="sales-chart">
              <h4>Sales Over Time</h4>
              <div className="chart-container">
                {salesData.map((day, index) => (
                  <div key={index} className="chart-bar-container">
                    <div
                      className="chart-bar"
                      style={{ height: `${(day.tickets / 20) * 100}%` }}
                      title={`${day.date}: ${day.tickets} tickets (${formatCurrency(
                        day.revenue
                      )})`}
                    ></div>
                    <div className="chart-label">{day.date.split('-')[2]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ticket-types">
              <h4>Ticket Types</h4>
              {ticketTypes.map((ticket, index) => (
                <div className="ticket-card" key={index}>
                  <div className="ticket-info">
                    <h5>{ticket.type}</h5>
                    <p>{formatCurrency(ticket.price)} per ticket</p>
                  </div>
                  <div className="ticket-stats">
                    <div>Sold: {ticket.sold}/{ticket.total}</div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(ticket.sold / ticket.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-section">
            <h3>Communications</h3>
            <div className="message-templates">
              <h4>Quick Templates</h4>
              <div className="templates-grid">
                {messageTemplates.map((template) => (
                  <div className="template-card" key={template.id}>
                    <h5>{template.title}</h5>
                    <p>{template.content.substring(0, 60)}...</p>
                    <button
                      className="btn-small"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="new-message">
              <h4>New Message</h4>
              <textarea
                placeholder="Compose your message to attendees..."
                className="message-input"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows="6"
              ></textarea>
              <div className="message-options">
                <select
                  className="recipient-select"
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                >
                  <option value="all">All Attendees</option>
                  <option value="checked-in">Checked In</option>
                  <option value="not-checked-in">Not Checked In</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                >
                  <FiSend className="icon" /> Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <EventSettingsForm
            selectedEvent={selectedEvent}
            localEvents={localEvents}
            setLocalEvents={setLocalEvents}
            setSelectedEvent={setSelectedEvent}
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
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
};

export default ManageEvent;
