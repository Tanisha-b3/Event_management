const response = await fetch('http://localhost:5000/api/events');
if (!response.ok) {
  throw new Error('Network response was not ok');
}
const backendEvents = await response.json();


import image3 from '../assets/image3.jpg'
import image4 from '../assets/image4.jpg'
import image1 from '../assets/image10.jpg';
import image2 from '../assets/image8.jpg';
import image6 from '../assets/image3.jpg';
import image7 from '../assets/image4.jpg';

const images = [image1, image2, image3, image4,image6,image7]
const eventsWithImages = backendEvents.map((event, index) => ({
  ...event,
  id:event._id, 
  image: images[index % images.length],
}));

console.log(eventsWithImages);
// // const EVENTS1= [
//   { 
//     id: 2, 
//     title: 'Music Festival', 
//     date: '2025-07-20', 
//     location: 'New York', 
//     category: 'Music',
//     attendees: 1800,
//     capacity: 2500,
//     ticketsSold: 2100,
//     revenue: 420000,
//     status: 'active',
//     description: '3-day outdoor music festival with multiple stages',
//     image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 3, 
//     title: 'Food Expo', 
//     date: '2025-08-05', 
//     location: 'Chicago', 
//     category: 'Food',
//     attendees: 1200,
//     capacity: 2000,
//     ticketsSold: 1500,
//     revenue: 75000,
//     status: 'active',
//     description: 'International food and beverage exhibition',
//     image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 4, 
//     title: 'Startup Pitch Competition', 
//     date: '2025-09-12', 
//     location: 'Austin', 
//     category: 'Business',
//     attendees: 300,
//     capacity: 400,
//     ticketsSold: 380,
//     revenue: 19000,
//     status: 'active',
//     description: 'Early-stage startups compete for funding',
//     image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 5, 
//     title: 'Marathon', 
//     date: '2025-10-20', 
//     location: 'Boston', 
//     category: 'Sports',
//     attendees: 15000,
//     capacity: 20000,
//     ticketsSold: 18000,
//     revenue: 900000,
//     status: 'active',
//     description: 'Annual city marathon with professional runners',
//     image: image3
//   },
//   { 
//     id: 6, 
//     title: 'Film Festival', 
//     date: '2025-11-05', 
//     location: 'Los Angeles', 
//     category: 'Entertainment',
//     attendees: 2500,
//     capacity: 3000,
//     ticketsSold: 2800,
//     revenue: 140000,
//     status: 'active',
//     description: 'Premiere of independent films and documentaries',
//     image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 7, 
//     title: 'Science Fair', 
//     date: '2025-08-25', 
//     location: 'Seattle', 
//     category: 'Education',
//     attendees: 800,
//     capacity: 1000,
//     ticketsSold: 950,
//     revenue: 19000,
//     status: 'active',
//     description: 'Student science projects and innovations',
//     image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 8, 
//     title: 'Art Exhibition', 
//     date: '2025-09-18', 
//     location: 'Miami', 
//     category: 'Art',
//     attendees: 600,
//     capacity: 800,
//     ticketsSold: 750,
//     revenue: 37500,
//     status: 'active',
//     description: 'Contemporary art from emerging artists',
//     image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 9, 
//     title: 'Health & Wellness Retreat', 
//     date: '2025-10-10', 
//     location: 'Sedona', 
//     category: 'Health',
//     attendees: 150,
//     capacity: 200,
//     ticketsSold: 180,
//     revenue: 54000,
//     status: 'active',
//     description: 'Weekend retreat with yoga and meditation',
//     image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 10, 
//     title: 'Gaming Tournament', 
//     date: '2025-11-15', 
//     location: 'Las Vegas', 
//     category: 'Gaming',
//     attendees: 2000,
//     capacity: 2500,
//     ticketsSold: 2300,
//     revenue: 115000,
//     status: 'active',
//     description: 'National esports championship',
//     image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 11, 
//     title: 'Book Fair', 
//     date: '2025-12-05', 
//     location: 'Washington DC', 
//     category: 'Literature',
//     attendees: 3000,
//     capacity: 4000,
//     ticketsSold: 3500,
//     revenue: 70000,
//     status: 'upcoming',
//     description: 'Annual gathering of publishers and authors',
//     image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 12, 
//     title: 'Winter Music Festival', 
//     date: '2025-12-20', 
//     location: 'Denver', 
//     category: 'Music',
//     attendees: 0,
//     capacity: 3000,
//     ticketsSold: 1200,
//     revenue: 60000,
//     status: 'upcoming',
//     description: 'Holiday themed music performances',
//     image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 13, 
//     title: 'New Year Celebration', 
//     date: '2025-12-30', 
//     location: 'New York', 
//     category: 'Festival',
//     attendees: 0,
//     capacity: 10000,
//     ticketsSold: 8500,
//     revenue: 425000,
//     status: 'upcoming',
//     description: 'Times Square New Year Eve celebration',
//     image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 14, 
//     title: 'Photography Workshop', 
//     date: '2024-07-15', 
//     location: 'Portland', 
//     category: 'Workshop',
//     attendees: 45,
//     capacity: 50,
//     ticketsSold: 48,
//     revenue: 4800,
//     status: 'completed',
//     description: 'Advanced photography techniques masterclass',
//     image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
//   },
//   { 
//     id: 15, 
//     title: 'Charity Gala', 
//     date: '2024-09-30', 
//     location: 'Dallas', 
//     category: 'Fundraiser',
//     attendees: 500,
//     capacity: 600,
//     ticketsSold: 550,
//     revenue: 275000,
//     status: 'completed',
//     description: 'Annual fundraiser for children education',
//     image: image4
//   }
// ];
export const EVENTS = [...eventsWithImages]

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
// constants.js
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