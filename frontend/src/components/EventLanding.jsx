import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaUsers,
  FaTicketAlt,
  FaStar,
  FaArrowRight,
  FaChevronRight,
  FaFire,
  FaPlay,
  FaQuoteLeft,
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaCheckCircle,
  FaClock,
  FaHeart,
  FaShareAlt,
  FaBolt,
  FaGlobe,
  FaShieldAlt,
  FaMobileAlt,
  FaChartLine,
  FaBell,
  FaCamera,
  FaMusic,
  FaCode,
  FaPalette,
  FaUtensils,
  FaRunning,
  FaLaptop,
  FaGraduationCap,
  FaTrophy,
  FaRocket,
  FaRegStar,
  FaTag,
  FaPercent
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

/* ── Ticker Component ── */
const Ticker = () => {
  const items = [
    '🎵 Music Festival – Austin TX', '💻 Tech Summit – SF', '🍔 Food Expo – NYC',
    '🎨 Art Show – LA', '⚽ Sports Gala – Chicago', '🎤 Comedy Night – Miami',
    '🎪 Street Festival – Seattle', '🏃 Marathon – Boston', '🎬 Film Fest – Portland'
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

/* ── Floating Orbs Background ── */
const OrbsBg = () => (
  <div className="orbs-bg" aria-hidden="true">
    {[...Array(8)].map((_, i) => <div key={i} className={`orb orb-${i + 1}`} />)}
  </div>
);

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
  const [scrollY, setScrollY] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [activePricingTab, setActivePricingTab] = useState('monthly');

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setNavScrolled(window.scrollY > 60);
    };
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

  useEffect(() => {
    dispatch(fetchEvents({ limit: 6, status: 'active' }));
  }, [dispatch]);

  useEffect(() => {
    if (events?.length > 0) setFeaturedEvents(events.slice(0, 6));
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => setHeroText(p => (p + 1) % heroTexts.length), 3500);
    return () => clearInterval(interval);
  }, [heroTexts.length]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Data ──
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
    { icon: <FaUsers />, title: 'Social Hub', description: 'See which friends are going, coordinate plans, and make new connections.' },
    { icon: <FaMobileAlt />, title: 'Mobile First', description: 'Full-featured iOS & Android apps. Your event life, always in your pocket.' },
    { icon: <FaChartLine />, title: 'Live Analytics', description: 'Real-time crowd insights, trending events, and attendance heatmaps.' },
    { icon: <FaShieldAlt />, title: 'Secure & Trusted', description: 'Bank-level security for every transaction. Your data, fully protected.' },
    { icon: <FaBolt />, title: 'Instant Refunds', description: 'Hassle-free cancellations with automatic refund processing within 24 hours.' },
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Event Enthusiast', company: 'Designer @ Figma', text: 'EventPro made it so easy to find and book tickets for my favorite concerts. The discovery algorithm is genuinely impressive — it found events I didn\'t even know I wanted to attend.', avatar: 'S', rating: 5 },
    { name: 'Michael Chen', role: 'Event Organizer', company: 'CEO @ TechMeetups', text: 'Managing events of 5,000+ attendees used to be chaos. EventPro\'s organizer dashboard gave us everything — real-time capacity, ticket analytics, attendee messaging. Truly enterprise-grade.', avatar: 'M', rating: 5 },
    { name: 'Emily Davis', role: 'Brand Manager', company: 'Marketing @ Spotify', text: 'Our sponsored events saw 3x engagement vs other platforms. The targeting tools are phenomenal and the brand exposure is unmatched.', avatar: 'E', rating: 5 },
    { name: 'James Rodriguez', role: 'Concert-goer', company: 'Music Producer', text: 'Discovered underground artists and intimate venues I never would\'ve found otherwise. EventPro is genuinely life-changing for music fans.', avatar: 'J', rating: 5 },
    { name: 'Priya Nair', role: 'Tech Conference Host', company: 'CTO @ Vercel', text: 'The check-in flow is flawless. QR scanning, badge printing, live attendance counts — all from one screen. Our 2,000 attendee conference ran without a hitch.', avatar: 'P', rating: 5 },
    { name: 'Alex Kim', role: 'Startup Founder', company: 'Founder @ DevTalks', text: 'Grew our community from 50 to 12,000 members in 18 months, entirely through EventPro events. The platform is our growth engine.', avatar: 'A', rating: 5 },
  ];

  const pricingPlans = [
    {
      name: 'Explorer', icon: <FaRegStar />, color: '#64748b',
      monthly: 0, annual: 0,
      desc: 'Perfect for discovering events',
      features: ['Browse all public events', 'Save up to 10 events', 'Basic notifications', 'Standard support'],
      cta: 'Start Free'
    },
    {
      name: 'Pro', icon: <FaBolt />, color: '#f59e0b',
      monthly: 12, annual: 9,
      desc: 'For power event-goers', popular: true,
      features: ['Unlimited event saves', 'Early access tickets', 'Priority notifications', 'Group booking (10 seats)', 'Exclusive member deals', '24/7 priority support'],
      cta: 'Get Pro'
    },
    {
      name: 'Organizer', icon: <FaTrophy />, color: '#6366f1',
      monthly: 49, annual: 39,
      desc: 'Scale your events business',
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
        <div 
            className="app-title-container" 
          >
            <h1 className="app-title">EventPro</h1>
            <div className="app-badge">EP</div>
          </div>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#events">Events</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Reviews</a>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-login" onClick={handleOpenLogin}>Login</button>
          <button className="btn-register" onClick={handleOpenRegister}>
            <FaRocket /> Get Started
          </button>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className="ticker-container">
        <Ticker />
      </div>
<br/>
<br/>
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
            {['🎵 Music Festivals', '💻 Tech Conferences', '🍕 Food Events', '🏃 Marathons', '🎨 Art Shows'].map((t, i) => (
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
            <div>
              <strong>Ticket Confirmed!</strong>
              <span>Tech Summit 2026</span>
            </div>
          </div>
          <div className="hero-float-card float-card-2">
            <FaFire className="float-icon orange" />
            <div>
              <strong>Trending Now</strong>
              <span>2,340 views today</span>
            </div>
          </div>
          <div className="hero-float-card float-card-3">
            <FaUsers className="float-icon blue" />
            <div>
              <strong>+128 joined</strong>
              <span>in the last hour</span>
            </div>
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
            <div className="footer-logo">
              <span className="logo-icon">EP</span>
              <span className="logo-text">EventPro</span>
            </div>
            <p>Your gateway to extraordinary events, curated for every taste and occasion.</p>
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
          </div>
        </div>
      </footer>

      <LoginDialog isOpen={showLoginDialog} onClose={handleCloseLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterDialog isOpen={showRegisterDialog} onClose={handleCloseRegister} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
};

export default EventLanding;