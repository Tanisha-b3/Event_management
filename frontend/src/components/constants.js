import { apiClient } from '../utils/api';

// ✅ Fetch function
export const getEvents = async () => {
  try {
    const { data } = await apiClient.get('/events');

    return data.map((event) => ({
      ...event,
      id: event._id || event.id,
    }));
  } catch (err) {
    console.error('Failed to load events from API:', err);
    return [];
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