import { apiClient } from '../utils/api';

// Fetch events with pagination
export const getEvents = async (page = 1, limit = 12, myEvents = false, category = null, search = null, location = null, filterType = 'all') => {
  console.log('getEvents called - page:', page, 'limit:', limit, 'myEvents:', myEvents, 'category:', category, 'filterType:', filterType);
  try {
    const params = { page, limit, myEvents };
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (location && location !== 'all') params.location = location;
    if (filterType && filterType !== 'all') params.filterType = filterType;
    
    const { data } = await apiClient.get('/events', { params });
    console.log('getEvents response - events count:', data.events?.length);
    // data: { events, pagination }
    return {
      events: (data.events || []).map(event => ({
        ...event,
        id: event._id || event.id,
      })),
      pagination: data.pagination || { page, limit, total: 0, pages: 1 }
    };
  } catch (err) {
    console.error('Failed to load events from API:', err);
    return {
      events: [],
      pagination: { page, limit, total: 0, pages: 1 }
    };
  }
};

// ✅ Static constants (no API here)
export const EVENT_CATEGORIES = [
  'Technology', 'Music', 'Food', 'Business', 'Sports',
  'Entertainment', 'Education', 'Art', 'Health', 'Gaming',
  'Literature', 'Festival', 'Workshop', 'Fundraiser'
];

export const EVENT_STATUSES = ['active', 'upcoming', 'completed', 'cancelled'];

// ✅ Dynamic locations (from fetched events)
export const getLocations = (events) => [
  'All',
  ...new Set(events.map(event => event.location))
];

export const Attendees = [
  { id: 1, name: 'John Doe', email: 'john@example.com', ticketType: 'VIP Pass', status: 'Checked In' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', ticketType: 'General Admission', status: 'Not Checked In' },
];

export const tickets = [
  { id: 1, type: 'VIP Pass', price: 100, sold: 45, total: 50 },
];

export const messages = [ 
  { id: 1, title: 'Event Reminder', content: 'Dear attendee,\n\nThis is a reminder about our upcoming event...' }, 
  { id: 2, title: 'Thank You', content: 'Dear attendee,\n\nThank you for attending our event...' }, { id: 3, title: 'Feedback Request', content: 'Dear attendee,\n\nWe would love your feedback about...' } ];

// Fetch pending events for admin approval
export const getPendingEvents = async (page = 1, limit = 10) => {
  try {
    const { data } = await apiClient.get('/events/pending', { params: { page, limit } });
    return {
      events: (data.events || []).map(event => ({
        ...event,
        id: event._id || event.id,
      })),
      pagination: data.pagination || { page, limit, total: 0, pages: 1 }
    };
  } catch (err) {
    console.error('Failed to load pending events:', err);
    return { events: [], pagination: { page, limit, total: 0, pages: 1 } };
  }
};

// Approve an event
export const approveEvent = async (eventId) => {
  const { data } = await apiClient.put(`/events/${eventId}/approve`);
  return data;
};

// Reject an event
export const rejectEvent = async (eventId, reason) => {
  const { data } = await apiClient.put(`/events/${eventId}/reject`, { rejectionReason: reason });
  return data;
};