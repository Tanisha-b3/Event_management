import React, { useEffect, useMemo, useState } from 'react';
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
import { apiClient } from '../../utils/api';
import './ManageEvent.css';
import { toast } from 'react-toastify';

const ManageEvent = ({
  selectedEvent,
  activeTab,
  setActiveTab,
  toggleEventStatus,
  formatCurrency,
  attendeeSearch,
  setAttendeeSearch,
  setMessageContent,
  messageTemplates,
  handleUseTemplate,
  messageContent,
  recipientType,
  setRecipientType,
  handleSendMessage,
  totalRevenue,
  totalTicketsSold,
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
  setLocalEvents,
  setSelectedEvent
}) => {
  const [ticketsData, setTicketsData] = useState([]);
  const [derivedTicketTypes, setDerivedTicketTypes] = useState(ticketTypes || []);
  const [attendeesError, setAttendeesError] = useState('');

  useEffect(() => {
    if (!selectedEvent) return;
    const fetchTickets = async () => {
      try {
        const { data } = await apiClient.get(`/events/${selectedEvent.id}/attendees`);
        const attendees = data?.attendees || [];
        setTicketsData(attendees);

        // Aggregate sold counts per type
        const soldByType = attendees.reduce((acc, t) => {
          const qty = t.quantity || 1;
          const type = t.ticketType || 'General Admission';
          acc[type] = (acc[type] || 0) + qty;
          return acc;
        }, {});

        const baseTypes = (selectedEvent.ticketTypes || []).map(tt => ({
          ...tt,
          sold: soldByType[tt.type] ?? tt.sold ?? 0
        }));

        const extraTypes = Object.entries(soldByType)
          .filter(([type]) => !baseTypes.find(bt => bt.type === type))
          .map(([type, sold]) => ({ id: type, type, price: 0, total: selectedEvent.capacity || 0, sold }));

        const merged = [...baseTypes, ...extraTypes];
        setDerivedTicketTypes(merged.length ? merged : baseTypes);
      } catch (err) {
        console.error('Failed to fetch attendees/tickets', err);
        setTicketsData([]);
        setDerivedTicketTypes(selectedEvent?.ticketTypes || []);
        setAttendeesError('Failed to load attendees');
        toast.error('Failed to load attendees');
      }
    };

    fetchTickets();
  }, [selectedEvent]);

  const capacity = selectedEvent?.capacity || 0;

  const ticketsSoldComputed = useMemo(
    () => ticketsData.reduce((sum, t) => sum + (t.quantity || 1), 0),
    [ticketsData]
  );

  const revenueComputed = useMemo(
    () => ticketsData.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 1), 0),
    [ticketsData]
  );

  const inferredTicketsSold = ticketsSoldComputed || totalTicketsSold || selectedEvent?.ticketsSold || 0;
  const attendanceCount = Math.max(selectedEvent.attendees || 0, inferredTicketsSold);
  const revenueDisplay = revenueComputed || totalRevenue || selectedEvent?.revenue || 0;
  const attendancePct = capacity > 0 ? Math.min((attendanceCount / capacity) * 100, 100) : 0;

  const ticketTypesForDisplay = useMemo(() => {
    return derivedTicketTypes.length ? derivedTicketTypes : (ticketTypes || []);
  }, [derivedTicketTypes, ticketTypes]);

  const totalRevenueDisplay = revenueDisplay;
  const totalTicketsSoldDisplay = inferredTicketsSold;
  const totalTicketsAvailableDisplay = capacity;

  const salesDataComputed = useMemo(() => {
    if (!ticketsData.length) return salesData || [];
    const grouped = ticketsData.reduce((acc, t) => {
      const date = (t.createdAt ? new Date(t.createdAt) : new Date()).toISOString().split('T')[0];
      const qty = t.quantity || 1;
      const rev = (t.price || 0) * qty;
      if (!acc[date]) acc[date] = { date, tickets: 0, revenue: 0 };
      acc[date].tickets += qty;
      acc[date].revenue += rev;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [ticketsData, salesData]);

  const maxTicketsForChart = useMemo(() => {
    if (!salesDataComputed.length) return 1;
    return Math.max(...salesDataComputed.map((d) => d.tickets || 0), 1);
  }, [salesDataComputed]);

  const displayedAttendees = useMemo(() => {
    const search = attendeeSearch.toLowerCase();
    return ticketsData
      .map(t => ({
        id: t.bookingId || t._id || `${t.eventId}-${t.userId}-${t.createdAt}`,
        name: t.userName || t.userEmail || 'Attendee',
        email: t.userEmail || 'N/A',
        ticketType: t.ticketType || 'General Admission',
        status: t.status || 'Confirmed'
      }))
      .filter(att => {
        const matches = att.name.toLowerCase().includes(search) || att.email.toLowerCase().includes(search) || att.ticketType.toLowerCase().includes(search);
        if (!matches) return false;
        if (recipientType === 'checked-in') return att.status.toLowerCase() === 'checked in';
        if (recipientType === 'not-checked-in') return att.status.toLowerCase() === 'not checked in';
        return true;
      });
  }, [ticketsData, attendeeSearch, recipientType]);

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
                  {attendanceCount}/{capacity || 0}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${attendancePct}%` }}
                  ></div>
                </div>
              </div>

              <div className="stat-card">
                <h3>Revenue</h3>
                <div className="stat-value">
                  {formatCurrency(revenueDisplay)}
                </div>
                <div className="stat-subtext">
                  from {inferredTicketsSold} tickets
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
              {attendeesError && <p className="muted">{attendeesError}</p>}
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

               {displayedAttendees.length === 0 && !attendeesError && (
                 <div className="table-row empty">
                   <div className="row-item">No attendees found yet.</div>
                 </div>
               )}

               {displayedAttendees.map((attendee) => (
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
                 <div className="stat-value-large">{formatCurrency(totalRevenueDisplay)}</div>
              </div>
              <div className="stat-card">
                <h4>Tickets Sold</h4>
                <div className="stat-value-large">{totalTicketsSoldDisplay}</div>
              </div>
              <div className="stat-card">
                <h4>Remaining</h4>
                <div className="stat-value-large">
                  {Math.max(totalTicketsAvailableDisplay - totalTicketsSoldDisplay, 0)}
                </div>
              </div>
            </div>

            <div className="sales-chart">
              <h4>Sales Over Time</h4>
              <div className="chart-container">
                 {salesDataComputed.length === 0 && (
                   <div className="chart-label">No sales data yet.</div>
                 )}
                 {salesDataComputed.map((day, index) => (
                   <div key={index} className="chart-bar-container">
                     <div
                       className="chart-bar"
                       style={{ height: `${Math.min((day.tickets / maxTicketsForChart) * 100, 100)}%` }}
                       title={`${day.date}: ${day.tickets} tickets (${formatCurrency(
                         day.revenue
                       )})`}
                     ></div>
                     <div className="chart-label">{day.date.slice(5)}</div>
                   </div>
                 ))}
               </div>
            </div>
            <div className="ticket-types">
              <h4>Ticket Types</h4>
              {ticketTypesForDisplay.length === 0 && (
                <div className="ticket-card">No ticket types available.</div>
              )}
              {ticketTypesForDisplay.map((ticket, index) => (
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
                        style={{ width: `${ticket.total ? Math.min((ticket.sold / ticket.total) * 100, 100) : 0}%` }}
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
            <br/>
            <div className="message-templates">
              <h4>Quick Templates</h4>
              <br/>
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
            setSelectedEvent={setSelectedEvent}
            setLocalEvents={setLocalEvents}
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
