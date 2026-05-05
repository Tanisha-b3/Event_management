import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Events.js';

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
  },
  {
    title: 'Startup Pitch Night',
    description: 'Watch emerging startups pitch to top VCs and angel investors.',
    date: daysFromNow(3),
    location: 'San Francisco, CA',
    category: 'Business',
    capacity: 200,
    ticketPrice: 25,
    status: 'active',
    organizer: 'SF Founders',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd',
    time: '6:00 PM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 25, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Indie Film Festival',
    description: 'Three-day showcase of independent films from emerging filmmakers.',
    date: daysFromNow(31),
    location: 'Austin, TX',
    category: 'Entertainment',
    capacity: 350,
    ticketPrice: 60,
    status: 'upcoming',
    organizer: 'Austin Indie Films',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
    time: '10:00 AM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Day Pass', price: 35, quantity: 150, available: 150 },
      { name: 'Festival Pass', price: 60, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Photography Masterclass',
    description: 'Learn professional photography techniques from award-winning photographers.',
    date: daysFromNow(13),
    location: 'New York, NY',
    category: 'Education',
    capacity: 40,
    ticketPrice: 199,
    status: 'active',
    organizer: 'Photo Academy',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e',
    time: '10:00 AM - 4:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Masterclass', price: 199, quantity: 40, available: 40 }
    ]
  },
  {
    title: 'Wine & Cheese Tasting',
    description: 'Premium wine pairing with artisanal cheeses from local producers.',
    date: daysFromNow(6),
    location: 'Napa Valley, CA',
    category: 'Food',
    capacity: 60,
    ticketPrice: 85,
    status: 'active',
    organizer: 'Napa Valley Wines',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
    time: '2:00 PM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Tasting Pass', price: 85, quantity: 60, available: 60 }
    ]
  },
  {
    title: 'Dog Show Championship',
    description: 'Annual purebred dog show with competitions and demonstrations.',
    date: daysFromNow(36),
    location: 'Orlando, FL',
    category: 'Sports',
    capacity: 800,
    ticketPrice: 30,
    status: 'upcoming',
    organizer: 'AKC Florida',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
    time: '9:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 30, quantity: 800, available: 800 }
    ]
  },
  {
    title: 'VR Gaming Expo',
    description: 'Experience the latest in virtual reality gaming and technology.',
    date: daysFromNow(27),
    location: 'Los Angeles, CA',
    category: 'Gaming',
    capacity: 600,
    ticketPrice: 45,
    status: 'active',
    organizer: 'VR Events Inc',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac',
    time: '11:00 AM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Expo Pass', price: 45, quantity: 600, available: 600 }
    ]
  },
  {
    title: 'Fashion Week Preview',
    description: 'Exclusive runway show featuring emerging designers and trends.',
    date: daysFromNow(41),
    location: 'Miami, FL',
    category: 'Art',
    capacity: 250,
    ticketPrice: 150,
    status: 'upcoming',
    organizer: 'Miami Fashion Week',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae',
    time: '7:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Runway Show', price: 150, quantity: 250, available: 250 }
    ]
  },
  {
    title: 'Sustainability Conference',
    description: 'Learn about green initiatives, renewable energy, and eco-friendly practices.',
    date: daysFromNow(34),
    location: 'Denver, CO',
    category: 'Conference',
    capacity: 400,
    ticketPrice: 175,
    status: 'upcoming',
    organizer: 'Green Future Org',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e',
    time: '9:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Conference Pass', price: 175, quantity: 400, available: 400 }
    ]
  },
  {
    title: 'Latin Dance Night',
    description: 'Salsa, bachata, and merengue dancing with live DJ and lessons.',
    date: daysFromNow(4),
    location: 'Los Angeles, CA',
    category: 'Music',
    capacity: 300,
    ticketPrice: 20,
    status: 'active',
    organizer: 'LA Dance Crew',
    image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e',
    time: '9:00 PM - 2:00 AM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Entry', price: 20, quantity: 300, available: 300 }
    ]
  },
  {
    title: 'Robot Competition',
    description: 'Watch student-built robots compete in exciting challenges.',
    date: daysFromNow(48),
    location: 'Boston, MA',
    category: 'Technology',
    capacity: 500,
    ticketPrice: 25,
    status: 'upcoming',
    organizer: 'RoboLeague',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    time: '10:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Spectator', price: 25, quantity: 500, available: 500 }
    ]
  },
  {
    title: 'Open Mic Comedy',
    description: 'Laugh with up-and-coming comedians at this weekly open mic.',
    date: daysFromNow(2),
    location: 'Chicago, IL',
    category: 'Entertainment',
    capacity: 150,
    ticketPrice: 15,
    status: 'active',
    organizer: 'Windy City Comedy',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260',
    time: '8:00 PM - 11:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Entry', price: 15, quantity: 150, available: 150 }
    ]
  },
  {
    title: 'Farmers Market Festival',
    description: 'Fresh local produce, crafts, and family activities every weekend.',
    date: daysFromNow(8),
    location: 'Seattle, WA',
    category: 'Food',
    capacity: 1000,
    ticketPrice: 0,
    status: 'active',
    organizer: 'Seattle Markets',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9',
    time: '9:00 AM - 3:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Free Entry', price: 0, quantity: 1000, available: 1000 }
    ]
  },
  {
    title: 'Tech Job Fair',
    description: 'Connect with top tech companies hiring for open positions.',
    date: daysFromNow(37),
    location: 'San Jose, CA',
    category: 'Business',
    capacity: 800,
    ticketPrice: 0,
    status: 'upcoming',
    organizer: 'Tech Careers Hub',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    time: '10:00 AM - 4:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Free Admission', price: 0, quantity: 800, available: 800 }
    ]
  },
  {
    title: 'Kayaking Adventure',
    description: 'Guided kayaking tour through scenic waterways and nature reserves.',
    date: daysFromNow(12),
    location: 'Miami, FL',
    category: 'Sports',
    capacity: 30,
    ticketPrice: 65,
    status: 'active',
    organizer: 'Miami Outdoor Adventures',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
    time: '8:00 AM - 12:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Tour', price: 65, quantity: 30, available: 30 }
    ]
  },
  {
    title: 'Board Game Marathon',
    description: '24-hour board game marathon with tournaments and prizes.',
    date: daysFromNow(44),
    location: 'Columbus, OH',
    category: 'Gaming',
    capacity: 200,
    ticketPrice: 20,
    status: 'upcoming',
    organizer: 'Board Game Geeks',
    image: 'https://images.unsplash.com/photo-1610890716271-e2fe045a6003',
    time: '12:00 PM - 12:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Marathon Pass', price: 20, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Pottery Workshop',
    description: 'Hands-on pottery making with professional ceramic artists.',
    date: daysFromNow(9),
    location: 'Portland, OR',
    category: 'Art',
    capacity: 20,
    ticketPrice: 75,
    status: 'active',
    organizer: 'Portland Arts Studio',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
    time: '2:00 PM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Workshop', price: 75, quantity: 20, available: 20 }
    ]
  },
  {
    title: 'Meditation Retreat',
    description: 'Peaceful meditation weekend with guided sessions and nature walks.',
    date: daysFromNow(52),
    location: 'Asheville, NC',
    category: 'Health',
    capacity: 40,
    ticketPrice: 250,
    status: 'upcoming',
    organizer: 'Zen Retreats',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    time: '8:00 AM - 5:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Retreat Pass', price: 250, quantity: 40, available: 40 }
    ]
  },
  {
    title: 'Science Fair 2026',
    description: 'Student projects showcasing innovative science and technology.',
    date: daysFromNow(39),
    location: 'Washington, DC',
    category: 'Education',
    capacity: 600,
    ticketPrice: 10,
    status: 'upcoming',
    organizer: 'Science Foundation',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d',
    time: '9:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 10, quantity: 600, available: 600 }
    ]
  },
  {
    title: 'Racing Championship',
    description: 'Professional auto racing with high-speed action and entertainment.',
    date: daysFromNow(53),
    location: 'Las Vegas, NV',
    category: 'Sports',
    capacity: 5000,
    ticketPrice: 100,
    status: 'upcoming',
    organizer: 'Vegas Racing League',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
    time: '12:00 PM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'General Admission', price: 100, quantity: 4000, available: 4000 },
      { name: 'Pit Pass', price: 200, quantity: 1000, available: 1000 }
    ]
  },
  {
    title: 'Live Podcast Recording',
    description: 'Watch your favorite podcast recorded live with audience interaction.',
    date: daysFromNow(5),
    location: 'Brooklyn, NY',
    category: 'Entertainment',
    capacity: 200,
    ticketPrice: 30,
    status: 'active',
    organizer: 'Podcast Live NYC',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618',
    time: '7:00 PM - 10:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Live Recording', price: 30, quantity: 200, available: 200 }
    ]
  },
  {
    title: 'Craft Beer Festival',
    description: 'Sample over 100 craft beers from local and international breweries.',
    date: daysFromNow(21),
    location: 'Denver, CO',
    category: 'Food',
    capacity: 700,
    ticketPrice: 50,
    status: 'active',
    organizer: 'Denver Beer Fest',
    image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7',
    time: '2:00 PM - 8:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Tasting Pass', price: 50, quantity: 700, available: 700 }
    ]
  },
  {
    title: 'Mountain Climbing Workshop',
    description: 'Learn essential climbing skills from expert mountaineers.',
    date: daysFromNow(46),
    location: 'Boulder, CO',
    category: 'Sports',
    capacity: 25,
    ticketPrice: 180,
    status: 'upcoming',
    organizer: 'Rocky Mountain Climbers',
    image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
    time: '6:00 AM - 6:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Workshop', price: 180, quantity: 25, available: 25 }
    ]
  },
  {
    title: 'Anime Convention',
    description: 'Meet voice actors, cosplay contest, and exclusive merch.',
    date: daysFromNow(57),
    location: 'Atlanta, GA',
    category: 'Entertainment',
    capacity: 3000,
    ticketPrice: 45,
    status: 'upcoming',
    organizer: 'AnimeFest Southeast',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f',
    time: '10:00 AM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Day Pass', price: 45, quantity: 2000, available: 2000 },
      { name: 'Weekend Pass', price: 80, quantity: 1000, available: 1000 }
    ]
  },
  {
    title: 'Jazz Brunch Live',
    description: 'Smooth jazz with gourmet brunch in an elegant setting.',
    date: daysFromNow(7),
    location: 'New Orleans, LA',
    category: 'Music',
    capacity: 120,
    ticketPrice: 55,
    status: 'active',
    organizer: 'NOLA Jazz Club',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f',
    time: '11:00 AM - 2:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Brunch + Show', price: 55, quantity: 120, available: 120 }
    ]
  },
  {
    title: 'Digital Marketing Workshop',
    description: 'Master SEO, social media, and content marketing strategies.',
    date: daysFromNow(14),
    location: 'Austin, TX',
    category: 'Education',
    capacity: 50,
    ticketPrice: 125,
    status: 'active',
    organizer: 'Digital Pro Academy',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    time: '9:00 AM - 4:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Workshop Pass', price: 125, quantity: 50, available: 50 }
    ]
  },
  {
    title: 'Drone Racing League',
    description: 'High-speed drone races with First Person View streaming.',
    date: daysFromNow(26),
    location: 'Dallas, TX',
    category: 'Gaming',
    capacity: 400,
    ticketPrice: 35,
    status: 'active',
    organizer: 'Drone Sports League',
    image: 'https://images.unsplash.com/photo-1506947411487-a56738267384',
    time: '2:00 PM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Spectator Pass', price: 35, quantity: 400, available: 400 }
    ]
  },
  {
    title: 'Silent Disco Party',
    description: 'Dance to three DJs simultaneously with wireless headphones.',
    date: daysFromNow(4),
    location: 'San Diego, CA',
    category: 'Music',
    capacity: 500,
    ticketPrice: 25,
    status: 'active',
    organizer: 'SD Party Crew',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    time: '9:00 PM - 2:00 AM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Entry', price: 25, quantity: 500, available: 500 }
    ]
  },
  {
    title: 'Sustainable Fashion Show',
    description: 'Eco-friendly clothing designs from sustainable brands.',
    date: daysFromNow(33),
    location: 'San Francisco, CA',
    category: 'Art',
    capacity: 250,
    ticketPrice: 40,
    status: 'upcoming',
    organizer: 'Green Fashion Week',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f',
    time: '6:00 PM - 9:00 PM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Show Entry', price: 40, quantity: 250, available: 250 }
    ]
  },
  {
    title: 'Night Sky Telescope Viewing',
    description: 'Guided stargazing with professional telescopes and astronomers.',
    date: daysFromNow(10),
    location: 'Sedona, AZ',
    category: 'Education',
    capacity: 40,
    ticketPrice: 45,
    status: 'active',
    organizer: 'Desert Astronomy Club',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a',
    time: '9:00 PM - 12:00 AM',
    imageName: '',
    views: Math.floor(Math.random() * 1000),
    ticketTypes: [
      { name: 'Stargazing Pass', price: 45, quantity: 40, available: 40 }
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

    // Clear and create events fresh
    await Event.deleteMany({});
    console.log('Cleared all events');
    
    for (const eventData of seedEvents) {
      const createdEvent = await Event.create(eventData);
      console.log(`Created event ${createdEvent.title} on ${createdEvent.date.toISOString()}`);
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