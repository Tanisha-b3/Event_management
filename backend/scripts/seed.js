require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Events');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Aborting seed.');
  process.exit(1);
}

const seedUsers = [
  { name: 'Admin User', email: 'admin@example.com', password: 'AdminPass123!', role: 'admin' },
  { name: 'Organiser User', email: 'organiser@example.com', password: 'OrganiserPass123!', role: 'organiser' },
  { name: 'Booker User', email: 'booker@example.com', password: 'BookerPass123!', role: 'booker' }
];

const now = new Date();
const daysFromNow = (d) => {
  const copy = new Date(now);
  copy.setDate(copy.getDate() + d);
  return copy.toISOString();
};

const seedEvents = [
  {
    title: 'Tech Innovators Summit',
    description: 'A one-day summit covering AI, cloud, and modern dev practices.',
    date: daysFromNow(14),
    location: 'San Francisco, CA',
    category: 'Technology',
    capacity: 250,
    ticketPrice: 199,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d'
  },
  {
    title: 'Music Under the Stars',
    description: 'Open-air evening concert featuring indie and jazz artists.',
    date: daysFromNow(21),
    location: 'Austin, TX',
    category: 'Music',
    capacity: 500,
    ticketPrice: 75,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063'
  },
  {
    title: 'Culinary Fiesta',
    description: 'Food trucks, chef demos, and tasting sessions from around the globe.',
    date: daysFromNow(30),
    location: 'Portland, OR',
    category: 'Food',
    capacity: 400,
    ticketPrice: 55,
    status: 'upcoming',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
  },
  {
    title: 'Founders & Funders Meetup',
    description: 'An evening meetup for founders to connect with investors and peers.',
    date: daysFromNow(10),
    location: 'New York, NY',
    category: 'Business',
    capacity: 150,
    ticketPrice: 120,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85'
  },
  {
    title: 'Hands-on React Workshop',
    description: 'Full-day workshop building production-ready React apps.',
    date: daysFromNow(18),
    location: 'Remote / Online',
    category: 'Workshop',
    capacity: 120,
    ticketPrice: 149,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c'
  },
  {
    title: 'Holiday Lights Festival',
    description: 'Family-friendly holiday market, music, and lights.',
    date: daysFromNow(45),
    location: 'Denver, CO',
    category: 'Holiday',
    capacity: 800,
    ticketPrice: 35,
    status: 'upcoming',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef'
  },
  {
    title: 'AI for Healthcare Conference',
    description: 'Deep dive into AI applications, safety, and compliance in healthcare.',
    date: daysFromNow(27),
    location: 'Boston, MA',
    category: 'Conference',
    capacity: 350,
    ticketPrice: 249,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528'
  },
  {
    title: 'Community Startup Meetup',
    description: 'Founder meet-and-greet with lightning talks and investor Q&A.',
    date: daysFromNow(12),
    location: 'Berlin, Germany',
    category: 'Meetup',
    capacity: 180,
    ticketPrice: 40,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a'
  },
  {
    title: 'Summer Jazz Festival',
    description: 'Outdoor jazz performances with local and international artists.',
    date: daysFromNow(60),
    location: 'New Orleans, LA',
    category: 'Festival',
    capacity: 1200,
    ticketPrice: 95,
    status: 'upcoming',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee'
  },
  {
    title: 'Executive Leadership Workshop',
    description: 'Hands-on leadership coaching and strategic planning sessions.',
    date: daysFromNow(35),
    location: 'London, UK',
    category: 'Workshop',
    capacity: 120,
    ticketPrice: 320,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d'
  },
  {
    title: 'Gourmet Street Food Fiesta',
    description: 'Regional food trucks, tasting lanes, and chef showdowns.',
    date: daysFromNow(25),
    location: 'Chicago, IL',
    category: 'Food',
    capacity: 600,
    ticketPrice: 45,
    status: 'active',
    organizer: 'Event Pro',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
  }
];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User already exists: ${userData.email} (role: ${existing.role})`);
        continue;
      }

      const created = await User.create(userData);
      console.log(`Created user ${created.email} with role ${created.role}`);
    }

    for (const eventData of seedEvents) {
      const existingEvent = await Event.findOne({ title: eventData.title });
      if (existingEvent) {
        console.log(`Event already exists: ${eventData.title}`);
        continue;
      }
      const createdEvent = await Event.create(eventData);
      console.log(`Created event ${createdEvent.title} on ${createdEvent.date.toISOString()}`);
    }
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
