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
  return copy;
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
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
    time: '10:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 199, quantity: 200, available: 200 },
      { name: 'VIP', price: 299, quantity: 50, available: 50 }
    ]
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
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
    time: '6:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 75, quantity: 400, available: 400 },
      { name: 'VIP', price: 120, quantity: 100, available: 100 }
    ]
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
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
    time: '6:00 PM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 120, quantity: 150, available: 150 }
    ]
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
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 149, quantity: 120, available: 120 }
    ]
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
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
    time: '4:00 PM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 35, quantity: 800, available: 800 }
    ]
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
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528',
    time: '9:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 249, quantity: 300, available: 300 },
      { name: 'VIP', price: 399, quantity: 50, available: 50 }
    ]
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
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a',
    time: '7:00 PM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 40, quantity: 180, available: 180 }
    ]
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
    image: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee',
    time: '12:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 95, quantity: 1000, available: 1000 },
      { name: 'VIP', price: 195, quantity: 200, available: 200 }
    ]
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
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 320, quantity: 120, available: 120 }
    ]
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
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    time: '11:00 AM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 45, quantity: 600, available: 600 }
    ]
  },
  {
    title: 'City Marathon 2026',
    description: 'Annual 26.2-mile marathon through downtown with live bands and cheering stations.',
    date: daysFromNow(40),
    location: 'Los Angeles, CA',
    category: 'Sports',
    capacity: 5000,
    ticketPrice: 85,
    status: 'upcoming',
    organizer: 'LA Sports Commission',
    image: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38',
    time: '7:00 AM - 2:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Runner Registration', price: 85, quantity: 4500, available: 4500 },
      { name: 'VIP Package', price: 150, quantity: 500, available: 500 }
    ]
  },
  {
    title: 'Beach Volleyball Tournament',
    description: 'Amateur and pro divisions compete in this weekend beach volleyball event.',
    date: daysFromNow(20),
    location: 'Miami, FL',
    category: 'Sports',
    capacity: 300,
    ticketPrice: 25,
    status: 'active',
    organizer: 'Miami Beach Sports',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1',
    time: '9:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Spectator', price: 25, quantity: 300, available: 300 }
    ]
  },
  {
    title: 'Comedy Night Live',
    description: 'Stand-up comedy showcase featuring rising comedians and headliners.',
    date: daysFromNow(8),
    location: 'Las Vegas, NV',
    category: 'Entertainment',
    capacity: 450,
    ticketPrice: 65,
    status: 'active',
    organizer: 'Vegas Entertainment',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca',
    time: '8:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 65, quantity: 400, available: 400 },
      { name: 'VIP Front Row', price: 120, quantity: 50, available: 50 }
    ]
  },
  {
    title: 'Magic & Illusion Show',
    description: 'World-renowned magicians perform mind-bending illusions and tricks.',
    date: daysFromNow(15),
    location: 'Orlando, FL',
    category: 'Entertainment',
    capacity: 800,
    ticketPrice: 89,
    status: 'active',
    organizer: 'Orlando Magic Shows',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35',
    time: '7:00 PM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Standard', price: 89, quantity: 700, available: 700 },
      { name: 'Premium', price: 149, quantity: 100, available: 100 }
    ]
  },
  {
    title: 'Data Science Bootcamp',
    description: 'Intensive 2-day bootcamp covering Python, ML fundamentals, and real-world projects.',
    date: daysFromNow(22),
    location: 'Seattle, WA',
    category: 'Education',
    capacity: 80,
    ticketPrice: 299,
    status: 'active',
    organizer: 'Tech Academy',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Bootcamp Pass', price: 299, quantity: 80, available: 80 }
    ]
  },
  {
    title: 'Public Speaking Masterclass',
    description: 'Learn to captivate audiences with confidence and storytelling techniques.',
    date: daysFromNow(17),
    location: 'Atlanta, GA',
    category: 'Education',
    capacity: 60,
    ticketPrice: 175,
    status: 'active',
    organizer: 'Speak Pro Academy',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2',
    time: '10:00 AM - 4:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Masterclass Pass', price: 175, quantity: 60, available: 60 }
    ]
  },
  {
    title: 'Modern Art Exhibition',
    description: 'Curated exhibition featuring contemporary artists from around the world.',
    date: daysFromNow(28),
    location: 'San Diego, CA',
    category: 'Art',
    capacity: 200,
    ticketPrice: 30,
    status: 'upcoming',
    organizer: 'SD Art Gallery',
    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5',
    time: '10:00 AM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 30, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Street Art Walking Tour',
    description: 'Guided walking tour exploring murals, graffiti, and urban art installations.',
    date: daysFromNow(5),
    location: 'Brooklyn, NY',
    category: 'Art',
    capacity: 25,
    ticketPrice: 40,
    status: 'active',
    organizer: 'Brooklyn Art Tours',
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8',
    time: '2:00 PM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Tour Ticket', price: 40, quantity: 25, available: 25 }
    ]
  },
  {
    title: 'Wellness & Yoga Retreat',
    description: 'Weekend retreat with yoga sessions, meditation, and healthy cuisine.',
    date: daysFromNow(33),
    location: 'Sedona, AZ',
    category: 'Health',
    capacity: 50,
    ticketPrice: 450,
    status: 'upcoming',
    organizer: 'Sedona Wellness',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    time: '8:00 AM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Full Retreat', price: 450, quantity: 50, available: 50 }
    ]
  },
  {
    title: 'Mental Health Awareness Summit',
    description: 'Expert panels and workshops on mental wellness, stress management, and self-care.',
    date: daysFromNow(19),
    location: 'Phoenix, AZ',
    category: 'Health',
    capacity: 300,
    ticketPrice: 75,
    status: 'active',
    organizer: 'Mind Matters Foundation',
    image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Summit Pass', price: 75, quantity: 300, available: 300 }
    ]
  },
  {
    title: 'eSports Championship Finals',
    description: 'Watch top teams compete in League of Legends and Valorant championships.',
    date: daysFromNow(16),
    location: 'Dallas, TX',
    category: 'Gaming',
    capacity: 2000,
    ticketPrice: 55,
    status: 'active',
    organizer: 'GameOn Events',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
    time: '10:00 AM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Standard Pass', price: 55, quantity: 1800, available: 1800 },
      { name: 'VIP Pass', price: 150, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Retro Gaming Convention',
    description: 'Celebrate classic gaming with arcade machines, tournaments, and collector booths.',
    date: daysFromNow(38),
    location: 'Columbus, OH',
    category: 'Gaming',
    capacity: 1500,
    ticketPrice: 35,
    status: 'upcoming',
    organizer: 'Retro Gamers Club',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24',
    time: '11:00 AM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Weekend Pass', price: 35, quantity: 1500, available: 1500 }
    ]
  },
  {
    title: 'Authors & Readers Festival',
    description: 'Book signings, author panels, and literary discussions with bestselling writers.',
    date: daysFromNow(24),
    location: 'Philadelphia, PA',
    category: 'Literature',
    capacity: 400,
    ticketPrice: 45,
    status: 'active',
    organizer: 'Philly Book Fest',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
    time: '10:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Festival Pass', price: 45, quantity: 400, available: 400 }
    ]
  },
  {
    title: 'Poetry Slam Night',
    description: 'Open mic poetry slam with prizes for the best performers.',
    date: daysFromNow(7),
    location: 'Nashville, TN',
    category: 'Literature',
    capacity: 120,
    ticketPrice: 20,
    status: 'active',
    organizer: 'Nashville Poetry Society',
    image: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1',
    time: '7:00 PM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Entry', price: 20, quantity: 120, available: 120 }
    ]
  },
  {
    title: 'Charity Gala Night',
    description: 'Black-tie gala supporting children education programs with live auction.',
    date: daysFromNow(42),
    location: 'Washington, DC',
    category: 'Fundraiser',
    capacity: 250,
    ticketPrice: 350,
    status: 'upcoming',
    organizer: 'Hope Foundation',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf',
    time: '7:00 PM - 12:00 AM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Gala Ticket', price: 350, quantity: 250, available: 250 }
    ]
  },
  {
    title: '5K Run for a Cause',
    description: 'Fun run supporting local food banks with post-race celebration.',
    date: daysFromNow(11),
    location: 'Minneapolis, MN',
    category: 'Fundraiser',
    capacity: 1000,
    ticketPrice: 30,
    status: 'active',
    organizer: 'Hunger Free MN',
    image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d',
    time: '8:00 AM - 12:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Runner Registration', price: 30, quantity: 1000, available: 1000 }
    ]
  },
  {
    title: 'Blockchain & Web3 Summit',
    description: 'Explore decentralized technologies, NFTs, and the future of digital ownership.',
    date: daysFromNow(32),
    location: 'Miami, FL',
    category: 'Technology',
    capacity: 400,
    ticketPrice: 275,
    status: 'upcoming',
    organizer: 'Web3 Collective',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0',
    time: '9:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Summit Pass', price: 275, quantity: 350, available: 350 },
      { name: 'VIP Pass', price: 450, quantity: 50, available: 50 }
    ]
  },
  {
    title: 'Cybersecurity Conference',
    description: 'Learn from security experts about threats, defenses, and best practices.',
    date: daysFromNow(26),
    location: 'San Jose, CA',
    category: 'Technology',
    capacity: 500,
    ticketPrice: 225,
    status: 'active',
    organizer: 'SecureTech Events',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Conference Pass', price: 225, quantity: 450, available: 450 },
      { name: 'Workshop Pass', price: 325, quantity: 50, available: 50 }
    ]
  },
  {
    title: 'Electronic Music Festival',
    description: 'Three-day EDM festival with world-famous DJs and immersive light shows.',
    date: daysFromNow(55),
    location: 'Las Vegas, NV',
    category: 'Music',
    capacity: 10000,
    ticketPrice: 199,
    status: 'upcoming',
    organizer: 'Electric Events',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    time: '2:00 PM - 2:00 AM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: '3-Day Pass', price: 199, quantity: 8000, available: 8000 },
      { name: 'VIP 3-Day Pass', price: 399, quantity: 2000, available: 2000 }
    ]
  },
  {
    title: 'Acoustic Sessions Live',
    description: 'Intimate acoustic performances by singer-songwriters in a cozy venue.',
    date: daysFromNow(9),
    location: 'Nashville, TN',
    category: 'Music',
    capacity: 100,
    ticketPrice: 45,
    status: 'active',
    organizer: 'Nashville Acoustic',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    time: '8:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 45, quantity: 100, available: 100 }
    ]
  },
  {
    title: 'Women in Business Summit',
    description: 'Empowering female entrepreneurs with networking and mentorship opportunities.',
    date: daysFromNow(23),
    location: 'Houston, TX',
    category: 'Business',
    capacity: 300,
    ticketPrice: 150,
    status: 'active',
    organizer: 'WIB Network',
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Summit Pass', price: 150, quantity: 300, available: 300 }
    ]
  },
  {
    title: 'Real Estate Investment Forum',
    description: 'Learn strategies for building wealth through real estate from industry experts.',
    date: daysFromNow(29),
    location: 'Phoenix, AZ',
    category: 'Business',
    capacity: 200,
    ticketPrice: 195,
    status: 'active',
    organizer: 'REI Masters',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    time: '10:00 AM - 4:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Forum Pass', price: 195, quantity: 200, available: 200 }
    ]
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
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    time: '12:00 PM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Entry', price: 55, quantity: 400, available: 400 }
    ]
  }
];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing users and events');

    // Create users
    for (const userData of seedUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const created = await User.create(userData);
        console.log(`Created user ${created.email} with role ${created.role}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    // Create events
    for (const eventData of seedEvents) {
      const existingEvent = await Event.findOne({ title: eventData.title });
      if (!existingEvent) {
        const createdEvent = await Event.create(eventData);
        console.log(`Created event ${createdEvent.title} on ${createdEvent.date.toISOString()}`);
      } else {
        console.log(`Event already exists: ${eventData.title}`);
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

run();