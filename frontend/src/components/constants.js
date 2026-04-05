import { apiClient } from '../utils/api';
let backendEvents = [];

try {
  const { data } = await apiClient.get('/events');
  backendEvents = data;
} catch (err) {
  console.error('Failed to load events from API:', err);
}

const eventsWithIds = backendEvents.map((event) => ({
  ...event,
  id: event._id || event.id,
}));

export const EVENTS = [...eventsWithIds];

export const EVENT_CATEGORIES = [
  'Technology', 'Music', 'Food', 'Business', 'Sports',
  'Entertainment', 'Education', 'Art', 'Health', 'Gaming',
  'Literature', 'Festival', 'Workshop', 'Fundraiser'
];

export const EVENT_STATUSES = ['active', 'upcoming', 'completed', 'cancelled'];

export const LOCATION_OPTIONS = [
  'All',
  ...new Set(backendEvents.map(event => event.location))
];

export const Attendees = [
  { id: 1, name: 'John Doe', email: 'john@example.com', ticketType: 'VIP Pass', status: 'Checked In' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', ticketType: 'General Admission', status: 'Not Checked In' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', ticketType: 'VIP Pass', status: 'Checked In' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', ticketType: 'Early Bird', status: 'Checked In' },
  { id: 5, name: 'David Brown', email: 'david@example.com', ticketType: 'General Admission', status: 'Not Checked In' },
];

export const tickets = [
  { id: 1, type: 'VIP Pass', price: 100, sold: 45, total: 50 },
  { id: 2, type: 'General Admission', price: 50, sold: 120, total: 150 },
  { id: 3, type: 'Early Bird', price: 35, sold: 80, total: 100 }
];
  
export const messages = [
  { id: 1, title: 'Event Reminder', content: 'Dear attendee,\n\nThis is a reminder about our upcoming event...' },
  { id: 2, title: 'Thank You', content: 'Dear attendee,\n\nThank you for attending our event...' },
  { id: 3, title: 'Feedback Request', content: 'Dear attendee,\n\nWe would love your feedback about...' }
]; 
