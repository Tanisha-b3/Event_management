import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaUsers, FaTicketAlt, FaStar,
  FaArrowRight, FaChevronRight, FaFire, FaPlay, FaQuoteLeft, FaInstagram,
  FaTwitter, FaFacebook, FaLinkedin, FaCheckCircle, FaClock, FaHeart,
  FaShareAlt, FaBolt, FaGlobe, FaShieldAlt, FaMobileAlt, FaChartLine,
  FaBell, FaCamera, FaMusic, FaCode, FaPalette, FaUtensils, FaRunning,
  FaLaptop, FaGraduationCap, FaTrophy, FaRocket, FaRegStar, FaTag,
  FaPercent, FaLock, FaWifi, FaHeadphones, FaThumbsUp, FaEye, FaApple,
  FaAndroid, FaChevronDown, FaEnvelope, FaVideo, FaMicrophone,
  FaMapPin, FaGlobeAmericas
} from 'react-icons/fa';
import { fetchEvents } from '../store/slices/eventSlice';
import './EventLanding.css';
import image10 from "../assets/image10.jpg";
import image3 from "../assets/image3.jpg";
import image4 from "../assets/image4.jpg";
import image8 from "../assets/image8.jpg";
import loginImage from "../assets/loginImage.jpg";
import LoginDialog from './loginDialog';
import RegisterDialog from './RegisterDialog';

const CATEGORY_ICONS = {
  Music: '🎵', Conference: '🎤', Entertainment: '🎬', Holiday: '🎉',
  Meetup: '👥', Sports: '⚽', Business: '💼', Food: '🍔',
  Technology: '💻', Festival: '🎪', Education: '📚', Art: '🎨', Workshop: '🔧'
};

/* ── Animated Counter ── */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Scroll Reveal Hook ── */
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
};

/* ── Ticker ── */
const Ticker = () => {
  const items = [
    '🎵 Music Festival – Austin TX', '💻 Tech Summit – SF', '🍔 Food Expo – NYC',
    '🎨 Art Show – LA', '⚽ Sports Gala – Chicago', '🎤 Comedy Night – Miami',
    '🎪 Street Festival – Seattle', '🏃 Marathon – Boston', '🎬 Film Fest – Portland',
    '🍷 Wine Tasting – Napa', '🎸 Rock Concert – Nashville', '🤖 AI Summit – Austin'
  ];
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="ticker-item">{item}<span className="ticker-sep">◆</span></span>
        ))}
      </div>
    </div>
  );
};

/* ── Floating Orbs ── */
const OrbsBg = () => (
  <div className="orbs-bg" aria-hidden="true">
    {[...Array(8)].map((_, i) => <div key={i} className={`orb orb-${i + 1}`} />)}
  </div>
);

/* ── FAQ Item ── */
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {question}
        <FaChevronRight className="faq-chevron" />
      </button>
      <div className="faq-answer">{answer}</div>
    </div>
  );
};

/* ── Main Component ── */
const EventLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { events, loading } = useSelector((state) => state.events);

  const [heroText, setHeroText] = useState(0);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [navScrolled, setNavScrolled] = useState(false);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [activePricingTab, setActivePricingTab] = useState('monthly');
  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const [emailValue, setEmailValue] = useState('');

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleOpenLogin = () => setShowLoginDialog(true);
  const handleCloseLogin = () => setShowLoginDialog(false);
  const handleOpenRegister = () => setShowRegisterDialog(true);
  const handleCloseRegister = () => setShowRegisterDialog(false);
  const handleSwitchToRegister = () => { setShowLoginDialog(false); setShowRegisterDialog(true); };
  const handleSwitchToLogin = () => { setShowRegisterDialog(false); setShowLoginDialog(true); };
  const toggleLike = (id) => {
    setLikedEvents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const heroTexts = ['Discover Amazing Events', 'Find Your Next Experience', 'Create Unforgettable Memories', 'Connect With Your Tribe'];

  useEffect(() => { dispatch(fetchEvents({ limit: 6, status: 'active' })); }, [dispatch]);
  useEffect(() => { if (events?.length > 0) setFeaturedEvents(events.slice(0, 6)); }, [events]);
  useEffect(() => {
    const interval = setInterval(() => setHeroText(p => (p + 1) % heroTexts.length), 3500);
    return () => clearInterval(interval);
  }, [heroTexts.length]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── DATA ──
  const featured = [
    { id: 1, title: 'Tech Summit 2026', category: 'Technology', date: '2026-05-15', location: 'San Francisco, CA', image: image10, attendees: 5000, price: 199, rating: 4.9 },
    { id: 2, title: 'Music Festival', category: 'Music', date: '2026-06-20', location: 'Austin, TX', image: image4, attendees: 15000, price: 89, rating: 4.8 },
    { id: 3, title: 'Food & Wine Expo', category: 'Food', date: '2026-07-10', location: 'New York, NY', image: image3, attendees: 3000, price: 65, rating: 4.7 },
    { id: 4, title: 'Art Gallery Opening', category: 'Art', date: '2026-08-05', location: 'Los Angeles, CA', image: image8, attendees: 800, price: 45, rating: 4.9 },
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Events Hosted' },
    { value: 1200000, suffix: '+', label: 'Happy Attendees' },
    { value: 10000, suffix: '+', label: 'Organizers' },
    { value: 99, suffix: '%', label: 'Satisfaction Rate' }
  ];

  const categories = [
    { label: 'All', icon: <FaGlobe /> },
    { label: 'Music', icon: <FaMusic /> },
    { label: 'Technology', icon: <FaCode /> },
    { label: 'Art', icon: <FaPalette /> },
    { label: 'Food', icon: <FaUtensils /> },
    { label: 'Sports', icon: <FaRunning /> },
    { label: 'Business', icon: <FaLaptop /> },
    { label: 'Education', icon: <FaGraduationCap /> },
  ];

  const features = [
    { icon: <FaSearch />, title: 'Smart Discovery', description: 'AI-powered recommendations that learn your preferences and surface events you\'ll actually love.' },
    { icon: <FaTicketAlt />, title: 'Instant Booking', description: 'Zero friction ticket purchasing with encrypted payments and instant confirmation.' },
    { icon: <FaBell />, title: 'Smart Reminders', description: 'Never miss a moment with intelligent event reminders sent at just the right time.' },
    { icon: <FaUsers />, title: 'Social Hub', description: 'See which friends are going, coordinate plans, and make new connections at every event.' },
    { icon: <FaMobileAlt />, title: 'Mobile First', description: 'Full-featured iOS & Android apps. Your entire event life, always in your pocket.' },
    { icon: <FaChartLine />, title: 'Live Analytics', description: 'Real-time crowd insights, trending events, and attendance heatmaps for organizers.' },
    { icon: <FaShieldAlt />, title: 'Secure & Trusted', description: 'Bank-level security for every transaction. Your data is fully encrypted and protected.' },
    { icon: <FaBolt />, title: 'Instant Refunds', description: 'Hassle-free cancellations with automatic refund processing within 24 hours.' },
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Event Enthusiast', company: 'Designer @ Figma', text: 'EventPro made it so easy to find and book tickets for my favorite concerts. The discovery algorithm is genuinely impressive — it found events I didn\'t even know I wanted to attend.', avatar: 'S', rating: 5 },
    { name: 'Michael Chen', role: 'Event Organizer', company: 'CEO @ TechMeetups', text: 'Managing events of 5,000+ attendees used to be chaos. EventPro\'s organizer dashboard gave us everything — real-time capacity, ticket analytics, attendee messaging. Truly enterprise-grade.', avatar: 'M', rating: 5 },
    { name: 'Emily Davis', role: 'Brand Manager', company: 'Marketing @ Spotify', text: 'Our sponsored events saw 3x engagement vs other platforms. The targeting tools are phenomenal and the brand exposure across EventPro\'s network is simply unmatched.', avatar: 'E', rating: 5 },
    { name: 'James Rodriguez', role: 'Concert-goer', company: 'Music Producer', text: 'Discovered underground artists and intimate venues I never would\'ve found otherwise. EventPro is genuinely life-changing for music fans who want something different.', avatar: 'J', rating: 5 },
    { name: 'Priya Nair', role: 'Tech Conference Host', company: 'CTO @ Vercel', text: 'The check-in flow is flawless. QR scanning, badge printing, live attendance counts — all from one screen. Our 2,000 attendee conference ran without a single hitch.', avatar: 'P', rating: 5 },
    { name: 'Alex Kim', role: 'Startup Founder', company: 'Founder @ DevTalks', text: 'Grew our community from 50 to 12,000 members in 18 months, entirely through EventPro events. The platform is absolutely our growth engine.', avatar: 'A', rating: 5 },
  ];

  const pricingPlans = [
    {
      name: 'Explorer', icon: <FaRegStar />, color: '#64748b',
      monthly: 0, annual: 0, desc: 'Perfect for discovering events',
      features: ['Browse all public events', 'Save up to 10 events', 'Basic notifications', 'Standard support'],
      cta: 'Start Free'
    },
    {
      name: 'Pro', icon: <FaBolt />, color: '#f59e0b',
      monthly: 12, annual: 9, desc: 'For power event-goers', popular: true,
      features: ['Unlimited event saves', 'Early access tickets', 'Priority notifications', 'Group booking (10 seats)', 'Exclusive member deals', '24/7 priority support'],
      cta: 'Get Pro'
    },
    {
      name: 'Organizer', icon: <FaTrophy />, color: '#6366f1',
      monthly: 49, annual: 39, desc: 'Scale your events business',
      features: ['Unlimited event creation', 'Advanced analytics dashboard', 'Custom branded pages', 'API access', 'Dedicated account manager', 'White-label options', 'Team seats (5 users)'],
      cta: 'Start Organizing'
    }
  ];

  const upcomingHighlights = [
    { title: 'Coachella Valley Music', date: 'Apr 11–20', location: 'Indio, CA', category: 'Music', sold: 94, image: image4 },
    { title: 'AI & Future Summit', date: 'May 3', location: 'San Jose, CA', category: 'Tech', sold: 78, image: image10 },
    { title: 'NYC Restaurant Week', date: 'Jun 15–30', location: 'New York, NY', category: 'Food', sold: 61, image: image3 },
    { title: 'Contemporary Art Basel', date: 'Jul 8–12', location: 'Miami, FL', category: 'Art', sold: 45, image: image8 },
  ];

  const howItWorks = [
    { step: '01', title: 'Create Your Profile', desc: 'Tell us your interests and location. Takes 60 seconds. No spam, ever.', icon: <FaUsers /> },
    { step: '02', title: 'Discover Events', desc: 'Browse curated picks or search thousands of events near you and worldwide.', icon: <FaSearch /> },
    { step: '03', title: 'Book Instantly', desc: 'Secure your spot with one tap. Tickets delivered to your phone instantly.', icon: <FaTicketAlt /> },
    { step: '04', title: 'Experience & Share', desc: 'Attend, connect with people, capture memories, and discover your next event.', icon: <FaCamera /> },
  ];

  const brands = ['Spotify', 'Airbnb', 'Google', 'Stripe', 'Shopify', 'Notion', 'Figma', 'Vercel'];

  // ── NEW DATA ──
  const liveEvents = [
    { title: 'Global Dev Summit', location: 'San Francisco + Online', viewers: '12,430', bg: 'linear-gradient(135deg,#2563eb,#7c3aed)', icon: '💻' },
    { title: 'Jazz Night Live', location: 'New Orleans, LA', viewers: '8,912', bg: 'linear-gradient(135deg,#db2777,#ea580c)', icon: '🎷' },
    { title: 'Startup Pitch Finals', location: 'New York, NY', viewers: '5,287', bg: 'linear-gradient(135deg,#059669,#2563eb)', icon: '🚀' },
    { title: 'Food & Culture Expo', location: 'Chicago, IL', viewers: '4,103', bg: 'linear-gradient(135deg,#ea580c,#d97706)', icon: '🍜' },
    { title: 'AI Art Exhibition', location: 'Los Angeles + Virtual', viewers: '9,651', bg: 'linear-gradient(135deg,#7c3aed,#db2777)', icon: '🎨' },
    { title: 'Wellness Weekend', location: 'Sedona, AZ', viewers: '3,440', bg: 'linear-gradient(135deg,#059669,#0891b2)', icon: '🧘' },
  ];

  const cities = [
    { name: 'New York', country: 'USA', flag: '🇺🇸', count: '4,200+ events', x: '22%', y: '28%' },
    { name: 'London', country: 'UK', flag: '🇬🇧', count: '3,800+ events', x: '42%', y: '20%' },
    { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', count: '2,900+ events', x: '78%', y: '32%' },
    { name: 'Sydney', country: 'Australia', flag: '🇦🇺', count: '1,600+ events', x: '82%', y: '72%' },
    { name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', count: '2,100+ events', x: '30%', y: '65%' },
    { name: 'Mumbai', country: 'India', flag: '🇮🇳', count: '1,900+ events', x: '64%', y: '42%' },
  ];

  const appPerks = [
    { icon: <FaBell />, text: 'Instant ticket alerts & real-time updates' },
    { icon: <FaWifi />, text: 'Offline ticket access — no signal needed' },
    { icon: <FaCamera />, text: 'Share memories & event highlights instantly' },
    { icon: <FaHeadphones />, text: 'Exclusive in-app audio content & artist interviews' },
  ];

  const partners = [
    { logo: '🎵', name: 'SoundCloud', desc: 'Music streaming & artist discovery platform' },
    { logo: '🏨', name: 'Marriott', desc: 'Preferred hotel partner for event travelers' },
    { logo: '🚗', name: 'Uber', desc: 'Seamless rides to & from every event' },
    { logo: '🍕', name: 'DoorDash', desc: 'Pre-event meals & exclusive food deals' },
    { logo: '📸', name: 'Canva', desc: 'Design event posters & promo materials' },
    { logo: '💳', name: 'Stripe', desc: 'Secure, instant payment processing' },
    { logo: '📧', name: 'Mailchimp', desc: 'Event email marketing & audience tools' },
    { logo: '☁️', name: 'AWS', desc: 'Cloud infrastructure powering EventPro' },
  ];

  const faqs = [
    { question: 'How do I get my tickets after booking?', answer: 'Your tickets are delivered instantly via email and also available in your EventPro app under "My Tickets". They include a QR code for easy check-in — no printing required.' },
    { question: 'Can I get a refund if I can\'t attend?', answer: 'Yes! Our flexible refund policy allows you to request a full refund up to 48 hours before the event starts. Refunds are processed automatically within 24 hours to your original payment method.' },
    { question: 'How do I create and host my own event?', answer: 'Simply create a free Organizer account, click "Create Event", and fill in your event details. You can go live in under 10 minutes. We handle ticket sales, check-in, and payments.' },
    { question: 'Is EventPro available in my country?', answer: 'EventPro currently operates in 40+ countries across North America, Europe, Asia-Pacific, and Latin America. We\'re expanding rapidly — sign up to get notified when we launch in your region.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay, and select cryptocurrencies. All transactions are SSL encrypted and secure.' },
    { question: 'Is there a fee for free events?', answer: 'No! For free events, EventPro charges zero fees — for organizers and attendees alike. For paid events, we charge a small service fee (typically 2–5%) which is displayed clearly at checkout.' },
  ];

  // Scroll reveal refs
  const [statsRef, statsVisible] = useScrollReveal();
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [howRef, howVisible] = useScrollReveal();
  const [pricingRef, pricingVisible] = useScrollReveal();

  return (
    <div className="landing-container">
      <OrbsBg />

      {/* ── NAV ── */}
      <nav className={`landing-nav ${navScrolled ? 'nav-scrolled' : ''}`}>
        <div className="app-title-container-k">
          <h1 className="app-title-k">EventPro</h1>
          <div className="app-badge-k">EP</div>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#events">Events</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Reviews</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-login" onClick={handleOpenLogin}>Login</button>
          <button className="btn-register" onClick={handleOpenRegister}>
            <FaRocket /> Get Started
          </button>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className="ticker-container"><Ticker /></div>
      <br /><br />

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <FaStar className="badge-icon" /> Trusted by 1.2M+ event enthusiasts
          </div>
          <h1 className="hero-title">
            Your Gateway to<br />
            <span className="hero-title-dynamic">
              <span key={heroText} className="hero-text-slide">{heroTexts[heroText]}</span>
            </span>
          </h1>
          <p className="hero-subtitle">
            Discover, book, and experience extraordinary events near you.
            From underground concerts to global tech summits — your next
            unforgettable moment starts here.
          </p>
          <div className="hero-search">
            <div className="search-input-wrap">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Search events, artists, venues..." className="hero-search-input" />
            </div>
            <button className="hero-search-btn" onClick={handleOpenLogin}>
              Explore Now <FaArrowRight />
            </button>
          </div>
          <div className="hero-tags">
            {['🎵 Music Festivals', '💻 Tech Conferences', '🍕 Food Events', '🏃 Marathons', '🎨 Art Shows', '🎤 Comedy Nights'].map((t, i) => (
              <span key={i} className="hero-tag">{t}</span>
            ))}
          </div>
          <div className="hero-actions">
            <button className="btn-primary-lg" onClick={handleOpenLogin}>
              <FaPlay /> Start Exploring
            </button>
            <button className="btn-secondary-lg" onClick={handleOpenRegister}>
              Host an Event <FaArrowRight />
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card card-1">
              <img src={image10} alt="Tech Summit" />
              <div className="card-overlay">
                <div className="card-info">
                  <span className="card-label">Tech Summit</span>
                  <span className="card-date"><FaCalendarAlt /> May 15</span>
                </div>
                <div className="card-badge-live">LIVE</div>
              </div>
            </div>
            <div className="hero-card card-2">
              <img src={image4} alt="Music Fest" />
              <div className="card-overlay">
                <div className="card-info">
                  <span className="card-label">Music Fest</span>
                  <span className="card-date"><FaCalendarAlt /> Jun 20</span>
                </div>
                <div className="card-attendees"><FaUsers /> 15K going</div>
              </div>
            </div>
            <div className="hero-card card-3">
              <img src={image3} alt="Food Expo" />
              <div className="card-overlay">
                <div className="card-info">
                  <span className="card-label">Food Expo</span>
                  <span className="card-date"><FaCalendarAlt /> Jul 10</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-float-card float-card-1">
            <FaCheckCircle className="float-icon green" />
            <div><strong>Ticket Confirmed!</strong><span>Tech Summit 2026</span></div>
          </div>
          <div className="hero-float-card float-card-2">
            <FaFire className="float-icon orange" />
            <div><strong>Trending Now</strong><span>2,340 views today</span></div>
          </div>
          <div className="hero-float-card float-card-3">
            <FaUsers className="float-icon blue" />
            <div><strong>+128 joined</strong><span>in the last hour</span></div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="landing-stats" ref={statsRef}>
        <div className={`stats-inner ${statsVisible ? 'visible' : ''}`}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card-k" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="stat-value">
                {statsVisible ? <Counter end={s.value} suffix={s.suffix} /> : '0'}
              </span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BRANDS ── */}
      <section className="trust-section">
        <p className="trust-label">Trusted by teams at</p>
        <div className="trust-logos">
          {brands.map((b, i) => <span key={i} className="trust-logo">{b}</span>)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-features" id="features" ref={featuresRef}>
        <div className="section-header-k">
          <span className="section-tag"><FaBolt /> Why EventPro</span>
          <h2>Everything You Need,<br /><em>Nothing You Don't</em></h2>
          <p>A complete platform built for event discovery, booking, and community</p>
        </div>
        <div className={`features-grid ${featuresVisible ? 'visible' : ''}`}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <div className="feature-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY FILTER + EVENTS ── */}
      <section className="landing-events" id="events">
        <div className="section-header-k">
          <span className="section-tag"><FaFire /> Hot Right Now</span>
          <h2>Events You'll <em>Actually Love</em></h2>
          <p>Curated, trending, and happening near you</p>
        </div>
        <div className="category-filter">
          {categories.map((cat, i) => (
            <button key={i} className={`cat-pill ${activeCategory === cat.label ? 'active' : ''}`} onClick={() => setActiveCategory(cat.label)}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <div className="events-grid">
          {featured.map((event, i) => (
            <div key={event.id} className="event-card-landing" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="event-card-image">
                <img src={event.image} alt={event.title} />
                <div className="event-card-badges">
                  <span className="category-badge">{CATEGORY_ICONS[event.category]} {event.category}</span>
                  <span className="hot-badge"><FaFire /> Trending</span>
                </div>
                <button className={`like-btn ${likedEvents.has(event.id) ? 'liked' : ''}`} onClick={() => toggleLike(event.id)}>
                  <FaHeart />
                </button>
                <div className="event-price-tag">${event.price}</div>
              </div>
              <div className="event-card-content">
                <div className="event-rating">
                  {[...Array(5)].map((_, j) => <FaStar key={j} className={j < Math.floor(event.rating) ? 'star-filled' : 'star-empty'} />)}
                  <span>{event.rating}</span>
                </div>
                <h3>{event.title}</h3>
                <div className="event-meta-landing">
                  <span><FaCalendarAlt /> {formatDate(event.date)}</span>
                  <span><FaMapMarkerAlt /> {event.location}</span>
                </div>
                <div className="event-card-footer">
                  <span className="attendees"><FaUsers /> {event.attendees.toLocaleString()}+ going</span>
                  <button className="btn-icon" onClick={handleOpenLogin}><FaArrowRight /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="section-cta">
          <button className="btn-outline" onClick={handleOpenLogin}>View All Events <FaChevronRight /></button>
        </div>
      </section>

      {/* ── UPCOMING HIGHLIGHTS ── */}
      <section className="upcoming-section">
        <div className="section-header-k">
          <span className="section-tag"><FaClock /> Coming Soon</span>
          <h2>Don't Miss These<br /><em>Upcoming Events</em></h2>
        </div>
        <div className="upcoming-grid">
          {upcomingHighlights.map((event, i) => (
            <div key={i} className="upcoming-card" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="upcoming-img">
                <img src={event.image} alt={event.title} />
                <div className="upcoming-overlay">
                  <span className="upcoming-category">{event.category}</span>
                </div>
              </div>
              <div className="upcoming-content">
                <h4>{event.title}</h4>
                <div className="upcoming-meta">
                  <span><FaCalendarAlt /> {event.date}</span>
                  <span><FaMapMarkerAlt /> {event.location}</span>
                </div>
                <div className="sold-bar">
                  <div className="sold-bar-inner" style={{ width: `${event.sold}%` }} />
                </div>
                <div className="sold-label">
                  <span>{event.sold}% sold</span>
                  <span className={event.sold > 80 ? 'selling-fast' : ''}>{event.sold > 80 ? '🔥 Selling fast!' : 'Available'}</span>
                </div>
                <button className="upcoming-btn" onClick={handleOpenLogin}>Get Tickets</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 🔴 LIVE NOW SECTION ── */}
      <section className="live-section">
        <div className="live-inner">
          <div className="live-header">
            <h2>Happening <em>Right Now</em></h2>
            <div className="live-badge-now">
              <span className="live-dot" />
              LIVE EVENTS
            </div>
          </div>
          <div className="live-grid">
            {liveEvents.map((ev, i) => (
              <div key={i} className="live-card">
                <div className="live-card-icon" style={{ background: ev.bg }}>
                  <span style={{ fontSize: '1.4rem' }}>{ev.icon}</span>
                </div>
                <div className="live-card-body">
                  <h4>{ev.title}</h4>
                  <p><FaMapMarkerAlt style={{ marginRight: '0.3rem', fontSize: '0.7rem' }} />{ev.location}</p>
                  <div className="live-card-meta">
                    <div className="live-viewers">
                      <span className="live-viewers-dot" />
                      {ev.viewers} watching
                    </div>
                    <button className="live-join-btn" onClick={handleOpenLogin}>Join Live</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" id="how" ref={howRef}>
        <div className="section-header-k">
          <span className="section-tag">Simple Process</span>
          <h2>Go from Zero to<br /><em>Unforgettable</em></h2>
          <p>Four steps to your next incredible experience</p>
        </div>
        <div className={`how-grid ${howVisible ? 'visible' : ''}`}>
          {howItWorks.map((step, i) => (
            <div key={i} className="how-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="how-step-num">{step.step}</div>
              <div className="how-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {i < howItWorks.length - 1 && <div className="how-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── 🌍 CITY SPOTLIGHT ── */}
      <section className="city-section">
        <div className="city-inner">
          <div className="city-layout">
            <div className="city-content-left">
              <div className="section-header-k">
                <span className="section-tag"><FaGlobeAmericas /> Global Reach</span>
                <h2>Events in Every<br /><em>Corner of the World</em></h2>
                <p>From Mumbai to Manhattan, EventPro connects you with extraordinary experiences worldwide.</p>
              </div>
              <div className="city-list">
                {cities.map((city, i) => (
                  <div key={i} className={`city-item ${activeCityIdx === i ? 'active' : ''}`} onClick={() => setActiveCityIdx(i)}>
                    <div className="city-item-left">
                      <span className="city-flag">{city.flag}</span>
                      <div>
                        <div className="city-name">{city.name}</div>
                        <div className="city-country">{city.country}</div>
                      </div>
                    </div>
                    <span className="city-count">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="city-visual">
              <div className="city-map-grid" />
              <div className="city-dots-container">
                {cities.map((city, i) => (
                  <div key={i} className="city-dot" style={{ left: city.x, top: city.y }}>
                    <div className="city-dot-ring" style={{ background: activeCityIdx === i ? '#f59e0b' : '#6366f1' }} onClick={() => setActiveCityIdx(i)} />
                    {activeCityIdx === i && <div className="city-dot-label">{city.name} • {city.count}</div>}
                  </div>
                ))}
              </div>
              <div className="city-map-label">
                <strong>{cities[activeCityIdx].flag} {cities[activeCityIdx].name}</strong>
                <span>{cities[activeCityIdx].count}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="landing-testimonials" id="testimonials">
        <div className="section-header-k">
          <span className="section-tag"><FaHeart /> Real Reviews</span>
          <h2>Loved by Millions,<br /><em>Trusted by All</em></h2>
          <p>See what our community has to say</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="testimonial-stars">
                {[...Array(t.rating)].map((_, j) => <FaStar key={j} />)}
              </div>
              <div className="testimonial-quote"><FaQuoteLeft /></div>
              <p>"{t.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.avatar}</div>
                <div>
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                  <span className="author-company">{t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing-section" id="pricing" ref={pricingRef}>
        <div className="section-header-k">
          <span className="section-tag"><FaTag /> Pricing</span>
          <h2>Simple, <em>Transparent</em> Plans</h2>
          <p>No hidden fees. Cancel anytime.</p>
        </div>
        <div className="pricing-toggle">
          <button className={activePricingTab === 'monthly' ? 'active' : ''} onClick={() => setActivePricingTab('monthly')}>Monthly</button>
          <button className={activePricingTab === 'annual' ? 'active' : ''} onClick={() => setActivePricingTab('annual')}>
            Annual <span className="save-badge"><FaPercent /> Save 25%</span>
          </button>
        </div>
        <div className={`pricing-grid ${pricingVisible ? 'visible' : ''}`}>
          {pricingPlans.map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.popular ? 'popular' : ''}`} style={{ animationDelay: `${i * 0.15}s` }}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <div className="pricing-icon" style={{ color: plan.color }}>{plan.icon}</div>
              <h3>{plan.name}</h3>
              <p className="pricing-desc">{plan.desc}</p>
              <div className="pricing-price">
                <span className="price-currency">$</span>
                <span className="price-num">{plan[activePricingTab]}</span>
                <span className="price-period">/{activePricingTab === 'monthly' ? 'mo' : 'mo (billed annually)'}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feat, j) => (
                  <li key={j}><FaCheckCircle className="check-icon" /> {feat}</li>
                ))}
              </ul>
              <button className={`pricing-cta ${plan.popular ? 'cta-popular' : ''}`} onClick={handleOpenRegister}>
                {plan.cta} <FaArrowRight />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 📱 APP DOWNLOAD ── */}
      <section className="app-section">
        <div className="app-inner">
          <div className="app-content">
            <span className="section-tag" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}><FaMobileAlt /> Mobile App</span>
            <h2>Your Events.<br /><em>Always in Your Pocket.</em></h2>
            <p>Download the EventPro app and get instant ticket access, real-time updates, and a curated feed of events wherever you are.</p>
            <div className="app-perks">
              {appPerks.map((perk, i) => (
                <div key={i} className="app-perk">
                  <div className="app-perk-icon">{perk.icon}</div>
                  <span>{perk.text}</span>
                </div>
              ))}
            </div>
            <div className="app-store-btns">
              <button className="app-store-btn" onClick={handleOpenRegister}>
                <FaApple className="app-store-icon" />
                <div className="app-store-text">
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </div>
              </button>
              <button className="app-store-btn" onClick={handleOpenRegister}>
                <FaAndroid className="app-store-icon" />
                <div className="app-store-text">
                  <small>Get it on</small>
                  <strong>Google Play</strong>
                </div>
              </button>
            </div>
          </div>
          <div className="app-visual">
            <div className="app-phone-glow" />
            <div className="app-phone">
              <div className="app-phone-screen">
                <div className="phone-notif">
                  <strong>🎟 Ticket Confirmed!</strong>
                  Tech Summit 2026 · May 15 · SF
                </div>
                <div className="phone-card-mini">
                  <img src={image4} alt="event" />
                  <div className="phone-card-mini-label">🎵 Music Festival — Austin TX</div>
                </div>
                <div className="phone-card-mini">
                  <img src={image3} alt="event" />
                  <div className="phone-card-mini-label">🍔 Food Expo — NYC</div>
                </div>
                <div className="phone-notif">
                  <strong>🔥 Selling Fast!</strong>
                  Coachella 2026 — 94% sold
                </div>
              </div>
            </div>
            <div className="app-float-rating">
              <div className="app-float-rating-stars">
                {[...Array(5)].map((_, i) => <FaStar key={i} />)}
              </div>
              <strong>4.9 / 5.0</strong>
              <span>120K+ reviews</span>
            </div>
            <div className="app-float-dl">
              <strong><FaArrowRight /> 2M+ Downloads</strong>
              <span>iOS & Android</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 🤝 PARTNERS ── */}
      <section className="partner-section">
        <div className="section-header-k">
          <span className="section-tag"><FaThumbsUp /> Partners</span>
          <h2>Powered by the <em>Best in the Business</em></h2>
          <p>We partner with world-class brands to give you a seamless experience</p>
        </div>
        <div className="partner-grid">
          {partners.map((p, i) => (
            <div key={i} className="partner-card">
              <div className="partner-logo">{p.logo}</div>
              <div className="partner-name">{p.name}</div>
              <div className="partner-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ❓ FAQ ── */}
      <section className="faq-section" id="faq">
        <div className="section-header-k">
          <span className="section-tag">FAQ</span>
          <h2>Got Questions?<br /><em>We've Got Answers.</em></h2>
          <p>Everything you need to know about EventPro</p>
        </div>
        <div className="faq-inner">
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 📧 NEWSLETTER ── */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <span className="section-tag" style={{ marginBottom: '1.25rem', display: 'inline-flex' }}><FaEnvelope /> Newsletter</span>
          <h2>Get the Best Events<br />Delivered to Your Inbox</h2>
          <p>Join 400,000+ subscribers who get weekly curated event picks, exclusive early access deals, and insider guides — never spam.</p>
          <div className="newsletter-form">
            <input
              type="email"
              className="newsletter-input"
              placeholder="Enter your email address..."
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
            />
            <button className="newsletter-btn">Subscribe</button>
          </div>
          <p className="newsletter-note">
            <FaLock style={{ fontSize: '0.7rem' }} /> No spam ever. Unsubscribe anytime. Your privacy is protected.
          </p>
          <div className="newsletter-categories">
            {['🎵 Music', '💻 Tech', '🎨 Art', '🍔 Food', '⚽ Sports', '🎓 Education', '💼 Business'].map((cat, i) => (
              <span key={i} className="newsletter-chip">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="cta-bg-lines" aria-hidden="true" />
        <div className="cta-content">
          <span className="cta-tag"><FaRocket /> Join 1.2M+ members</span>
          <h2>Ready to Experience<br />Something <em>Extraordinary?</em></h2>
          <p>Create your free account and discover events that will change your life.</p>
          <div className="cta-buttons">
            <button className="btn-primary-lg cta-main" onClick={handleOpenRegister}>
              <FaRocket /> Create Free Account
            </button>
            <button className="btn-secondary-lg" onClick={handleOpenLogin}>
              Log In <FaArrowRight />
            </button>
          </div>
          <div className="cta-trust">
            <span><FaShieldAlt /> No credit card required</span>
            <span><FaCheckCircle /> Free forever plan</span>
            <span><FaBolt /> Set up in 60 seconds</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand-k">
            <div className="footer-logo-k">
              <span className="logo-icon">EP</span>
              <span className="logo-text">EventPro</span>
            </div>
            <p>Your gateway to extraordinary events, curated for every taste and occasion. Discover. Book. Experience.</p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Press Kit</a>
              <a href="#">Blog</a>
              <a href="#">Roadmap</a>
            </div>
            <div>
              <h4>Discover</h4>
              <a href="#">Browse Events</a>
              <a href="#">Categories</a>
              <a href="#">Trending</a>
              <a href="#">Near Me</a>
              <a href="#">Online Events</a>
            </div>
            <div>
              <h4>Organizers</h4>
              <a href="#">Create Event</a>
              <a href="#">Pricing</a>
              <a href="#">Analytics</a>
              <a href="#">API Docs</a>
              <a href="#">Integrations</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Status Page</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 EventPro. All rights reserved. Made with <FaHeart className="footer-heart" /> for event lovers.</p>
          <div className="footer-badges">
            <span className="footer-badge">🔒 SSL Secured</span>
            <span className="footer-badge">✅ SOC 2 Compliant</span>
            <span className="footer-badge">🌍 GDPR Ready</span>
            <span className="footer-badge">🏆 Award Winning</span>
          </div>
        </div>
      </footer>

      <LoginDialog isOpen={showLoginDialog} onClose={handleCloseLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterDialog isOpen={showRegisterDialog} onClose={handleCloseRegister} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
};

export default EventLanding;