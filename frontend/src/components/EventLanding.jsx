import React, { useState, useEffect } from 'react';
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
  FaShareAlt
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
  Music: '🎵',
  Conference: '🎤',
  Entertainment: '🎬',
  Holiday: '🎉',
  Meetup: '👥',
  Sports: '⚽',
  Business: '💼',
  Food: '🍔',
  Technology: '💻',
  Festival: '🎪',
  Education: '📚',
  Art: '🎨',
  Workshop: '🔧'
};

const EventLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { events, loading } = useSelector((state) => state.events);
  const [heroText, setHeroText] = useState(0);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const handleOpenLogin = () => {
    setShowLoginDialog(true);
  };

  const handleCloseLogin = () => {
    setShowLoginDialog(false);
  };

  const handleOpenRegister = () => {
    setShowRegisterDialog(true);
  };

  const handleCloseRegister = () => {
    setShowRegisterDialog(false);
  };

  const handleSwitchToRegister = () => {
    setShowLoginDialog(false);
    setShowRegisterDialog(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterDialog(false);
    setShowLoginDialog(true);
  };

  const heroTexts = [
    'Discover Amazing Events',
    'Find Your Next Experience',
    'Create Unforgettable Memories'
  ];

  useEffect(() => {
    dispatch(fetchEvents({ limit: 6, status: 'active' }));
  }, [dispatch]);

  useEffect(() => {
    if (events && events.length > 0) {
      setFeaturedEvents(events.slice(0, 6));
    }
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroText((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroTexts.length]);

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || '📌';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const featured = [
    {
      id: 1,
      title: 'Tech Summit 2026',
      category: 'Technology',
      date: '2026-05-15',
      location: 'San Francisco, CA',
      image: image10,
      attendees: 5000
    },
    {
      id: 2,
      title: 'Music Festival',
      category: 'Music',
      date: '2026-06-20',
      location: 'Austin, TX',
      image: image4,
      attendees: 15000
    },
    {
      id: 3,
      title: 'Food & Wine Expo',
      category: 'Food',
      date: '2026-07-10',
      location: 'New York, NY',
      image: image3,
      attendees: 3000
    },
    {
      id: 4,
      title: 'Art Gallery Opening',
      category: 'Art',
      date: '2026-08-05',
      location: 'Los Angeles, CA',
      image: image8,
      attendees: 800
    }
  ];

  const stats = [
    { value: '50K+', label: 'Events' },
    { value: '1M+', label: 'Attendees' },
    { value: '10K+', label: 'Organizers' },
    { value: '99%', label: 'Satisfaction' }
  ];

  const features = [
    {
      icon: <FaSearch />,
      title: 'Discover Events',
      description: 'Find events that match your interests from thousands of options'
    },
    {
      icon: <FaTicketAlt />,
      title: 'Easy Booking',
      description: 'Book tickets instantly with secure payment processing'
    },
    {
      icon: <FaCalendarAlt />,
      title: 'Event Calendar',
      description: 'Never miss an event with smart reminders'
    },
    {
      icon: <FaUsers />,
      title: 'Community',
      description: 'Connect with fellow event enthusiasts'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Event Attendee',
      text: 'EventPro made it so easy to find and book tickets for my favorite concerts. Love the experience!'
    },
    {
      name: 'Michael Chen',
      role: 'Event Organizer',
      text: 'As an organizer, the platform has all the tools I need to manage events professionally.'
    },
    {
      name: 'Emily Davis',
      role: 'Brand Manager',
      text: 'We\'ve seen amazing results from sponsoring events through EventPro. Highly recommended!'
    }
  ];

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span className="logo-icon">EP</span>
          <span className="logo-text">EventPro</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#events">Events</a>
          <a href="#testimonials">Testimonials</a>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-login" onClick={handleOpenLogin}>
        Login
      </button>
      
      
          <button className="btn-register" onClick={handleOpenRegister}>
        Get Started
      </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <FaStar /> Trusted by 50,000+ event enthusiasts
          </div>
          <h1 className="hero-title">
            Your Gateway to
            <span className="hero-title-dynamic">
              <span key={heroText}>{heroTexts[heroText]}</span>
            </span>
          </h1>
          <p className="hero-subtitle">
            Discover, book, and experience amazing events near you.
            Join millions of people finding their next unforgettable moment.
          </p>
          <div className="hero-actions">
            <button className="btn-primary-lg" onClick={handleOpenLogin}>
              <FaPlay /> Start Exploring
            </button>
            <button className="btn-secondary-lg" onClick={handleOpenRegister}>
              Browse Events <FaArrowRight />
            </button>
          </div>
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="hero-stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card card-1">
              <img src={image10} alt="Event" />
              <div className="card-overlay">
                <span>Tech Summit</span>
                <FaCalendarAlt />
              </div>
            </div>
            <div className="hero-card card-2">
              <img src={image4} alt="Event" />
              <div className="card-overlay">
                <span>Music Fest</span>
                <FaCalendarAlt />
              </div>
            </div>
            <div className="hero-card card-3">
              <img src={image3} alt="Event" />
              <div className="card-overlay">
                <span>Food Expo</span>
                <FaCalendarAlt />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features" id="features">
        <div className="section-header">
          <span className="section-tag">Why EventPro</span>
          <h2>Everything You Need for Events</h2>
          <p>Powerful features to enhance your event experience</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="landing-events" id="events">
        <div className="section-header">
          <span className="section-tag">Popular Events</span>
          <h2>Trending Events</h2>
          <p>Don't miss these popular events</p>
        </div>
        <div className="events-grid">
          {featured.map((event, index) => (
            <div key={event.id} className="event-card-landing" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="event-card-image">
                <img src={event.image} alt={event.title} />
                <div className="event-card-badges">
                  <span className="category-badge">
                    {getCategoryIcon(event.category)} {event.category}
                  </span>
                  <span className="hot-badge">
                    <FaFire /> Trending
                  </span>
                </div>
              </div>
              <div className="event-card-content">
                <h3>{event.title}</h3>
                <div className="event-meta-landing">
                  <span><FaCalendarAlt /> {formatDate(event.date)}</span>
                  <span><FaMapMarkerAlt /> {event.location}</span>
                </div>
                <div className="event-card-footer">
                  <span className="attendees">
                    <FaUsers /> {event.attendees.toLocaleString()}+ going
                  </span>
                  <button className="btn-icon">
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="section-cta">
          <button className="btn-outline" onClick={handleOpenLogin}>
            View All Events <FaChevronRight />
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-testimonials" id="testimonials">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2>What People Say</h2>
          <p>Hear from our community</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="testimonial-quote">
                <FaQuoteLeft />
              </div>
              <p>"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.name.charAt(0)}</div>
                <div>
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-content">
          <h2>Ready to Explore Events?</h2>
          <p>Join millions of people discovering amazing events every day</p>
          <div className="cta-buttons">
            <button className="btn-primary-lg" onClick={handleOpenRegister}>
              Create Free Account
            </button>
            <button className="btn-secondary-lg" onClick={handleOpenLogin}>
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand-k">
            <div className="footer-logo">
              <span className="logo-icon">EP</span>
              <span className="logo-text">EventPro</span>
            </div>
            <p>Your gateway to amazing events</p>
            <div className="footer-social">
              <a href="#"><FaInstagram /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaFacebook /></a>
              <a href="#"><FaLinkedin /></a>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#">Blog</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 EventPro. All rights reserved.</p>
        </div>
      </footer>  
      <LoginDialog 
        isOpen={showLoginDialog}
        onClose={handleCloseLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />
        <RegisterDialog
        isOpen={showRegisterDialog}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default EventLanding;