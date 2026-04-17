import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaHeadphones, 
  FaQuestionCircle, 
  FaEnvelope, 
  FaPhone, 
  FaCommentDots, 
  FaChevronDown, 
  FaChevronUp, 
  FaExternalLinkAlt, 
  FaTwitter, 
  FaFacebook, 
  FaInstagram,
  FaSearch,
  FaTicketAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaLaptopCode,
  FaClock,
  FaCheckCircle,
  FaPaperPlane,
  FaTimes,
  FaStar,
  FaShieldAlt,
  FaRobot
} from 'react-icons/fa';
import './HelpSupport.css';

function HelpSupport() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const faqs = [
    {
      category: 'Tickets & Booking',
      icon: FaTicketAlt,
      questions: [
        { q: 'How do I book tickets for an event?', a: 'Browse events, select your preferred event, choose ticket type and quantity, then proceed to checkout.' },
        { q: 'Can I cancel my ticket booking?', a: 'Yes, you can cancel your booking up to 24 hours before the event starts. Go to My Tickets > Select Ticket > Cancel.' },
        { q: 'How do I get my ticket after booking?', a: 'Your ticket will be sent to your email and can also be accessed from My Tickets section in your profile.' },
        { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, PayPal, and Google Pay for ticket purchases.' },
      ]
    },
    {
      category: 'Account & Profile',
      icon: FaUserCircle,
      questions: [
        { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your inbox.' },
        { q: 'How do I update my profile information?', a: 'Go to Profile > Edit Profile to update your name, bio, phone, location, and avatar.' },
        { q: 'How do I delete my account?', a: 'Go to Settings > Privacy > Delete Account. Note: This action is irreversible.' },
        { q: 'Can I change my email address?', a: 'Contact our support team to change your email address associated with your account.' },
      ]
    },
    {
      category: 'Events & Organizers',
      icon: FaCalendarAlt,
      questions: [
        { q: 'How do I create an event as an organizer?', a: 'Go to Dashboard > Create Event and fill in the event details including title, date, location, and ticket information.' },
        { q: 'How do I become an event organizer?', a: 'Contact admin to request organizer access. You\'ll need to verify your identity and agree to terms.' },
        { q: 'Can I edit my event after publishing?', a: 'Yes, go to your event in Dashboard and select Edit to modify details. Major changes may require re-approval.' },
        { q: 'How do I view my event analytics?', a: 'Organizers can view analytics from Dashboard > Analytics or from the event management page.' },
      ]
    },
    {
      category: 'Technical Issues',
      icon: FaLaptopCode,
      questions: [
        { q: 'Why is the app not loading?', a: 'Try clearing your browser cache, ensure your internet connection is stable, or try a different browser.' },
        { q: 'The payment failed, what should I do?', a: 'Check your payment details, ensure sufficient funds, and try again. If issue persists, contact your bank or our support.' },
        { q: 'I\'m not receiving email notifications', a: 'Check your spam folder, ensure your email is correct in profile, and verify notification settings are enabled.' },
        { q: 'How do I report a bug?', a: 'Contact our support team with details about the issue including screenshots and your browser/device information.' },
      ]
    },
  ];

  const quickActions = [
    { id: 'booking', title: 'Booking Issues', icon: FaTicketAlt, color: '#6366f1' },
    { id: 'payment', title: 'Payment Problems', icon: FaShieldAlt, color: '#10b981' },
    { id: 'account', title: 'Account Access', icon: FaUserCircle, color: '#f59e0b' },
    { id: 'refund', title: 'Refund Request', icon: FaClock, color: '#ef4444' },
  ];

  const filteredFAQs = searchTerm 
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;

  const handleSubmitContact = (e) => {
    e.preventDefault();
    toast.success('Your message has been sent! We\'ll get back to you soon.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setShowContactForm(false);
  };

  const handleQuickAction = (action) => {
    setSelectedQuickAction(action);
    toast.info(`${action.title} support request initiated. A support agent will assist you shortly.`);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { type: 'user', message: chatInput, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        message: 'Thanks for your message! Our support team will respond shortly. In the meantime, you might find the answer in our FAQ section.', 
        time: new Date().toLocaleTimeString() 
      }]);
    }, 1000);
    setChatInput('');
  };

  return (
    <div className="help-support-container">
      <div className="help-support-wrapper">
        {/* Header Section */}
        <div className="help-header">
          <div className="help-header-content">
            <button onClick={() => navigate(-1)} className="back-button">
              <FaArrowLeft />
              <span>Back</span>
            </button>
            <div className="header-title">
              <FaHeadphones className="header-icon" />
              <h1>Help & Support</h1>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <FaStar className="badge-icon" />
              <span>24/7 Support Available</span>
            </div>
            <h2>How can we help you today?</h2>
            <p>Get instant answers to your questions or connect with our support team</p>
            
            <div className="search-container-r">
              {/* <FaSearch className="search-icon" /> */}
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="clear-search">
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          <div className="hero-decoration"></div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-k">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="action-card"
                style={{ '--action-color': action.color }}
                aria-label={action.title}
              >
                <div className="action-icon-k">
                  <action.icon />
                </div>
                <div className="action-content">
                  <h4>{action.title}</h4>
                  <p>Get immediate assistance</p>
                </div>
                <FaChevronDown className="action-arrow" />
              </button>
            ))}
          </div>
        </div>
        {/* Support Channels */}
        <div className="support-channels mt-10">
          <br/>
          <h3>Support Channels</h3>
           <br/>
          <div className="channels-grid mt-20">
              <button onClick={() => setShowChat(true)} className="channel-card live-chat" aria-label="Live Chat Support">
              <div className="channel-icon">
                <FaCommentDots />
                {/* <span className="live-badge">Live</span> */}
              </div>
              <h4>Live Chat</h4>
              <p>Chat with our support team</p>
              <span className="channel-status">Available 24/7</span>
            </button>
            
            <button onClick={() => setShowContactForm(true)} className="channel-card email" aria-label="Email Support">
              <div className="channel-icon">
                <FaEnvelope />
              </div>
              <h4>Email Support</h4>
              <p>Get detailed responses</p>
              <span className="channel-status">Response within 24h</span>
            </button>
            
            <button onClick={() => toast.info('Call us at +1 (555) 123-4567')} className="channel-card phone" aria-label="Phone Support">
              <div className="channel-icon">
                <FaPhone />
              </div>
              <h4>Phone Support</h4>
              <p>Speak to a representative</p>
              <span className="channel-status">Mon-Fri, 9AM-6PM</span>
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-header">
            <h3>Frequently Asked Questions</h3>
            <p>Find quick answers to common questions</p>
          </div>
          
          <div className="faq-grid">
            {filteredFAQs.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <button
                  onClick={() => setActiveCategory(activeCategory === catIndex ? null : catIndex)}
                  className="category-header"
                  aria-expanded={activeCategory === catIndex}
                  aria-controls={`faq-cat-${catIndex}`}
                  tabIndex={0}
                >
                  <div className="category-title">
                    <category.icon className="category-icon" />
                    <span>{category.category}</span>
                  </div>
                  {activeCategory === catIndex ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                <div
                  className={`category-questions ${activeCategory === catIndex ? 'active' : ''}`}
                  id={`faq-cat-${catIndex}`}
                  aria-hidden={activeCategory !== catIndex}
                >
                  {category.questions.map((item, qIndex) => (
                    <div key={qIndex} className="question-item">
                      <div className="question">
                        <FaQuestionCircle className="question-icon" />
                        <p>{item.q}</p>
                      </div>
                      <div className="answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="still-need-help">
          <div className="help-card">
            <FaRobot className="help-icon" />
            <h3>Still need help?</h3>
            <p>Our support team is ready to assist you with any issues</p>
            <button onClick={() => setShowContactForm(true)} className="contact-button" aria-label="Contact Support">
              Contact Support
              <FaPaperPlane />
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="social-links">
          <p>Follow us for updates and support</p>
          <div className="social-icons">
            <a href="#" className="social-icon twitter">
              <FaTwitter />
            </a>
            <a href="#" className="social-icon facebook">
              <FaFacebook />
            </a>
            <a href="#" className="social-icon instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="modal-overlay" onClick={() => setShowContactForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Support</h3>
              <button onClick={() => setShowContactForm(false)} className="modal-close" aria-label="Close Contact Form">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmitContact} className="contact-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                  placeholder="What is this regarding?"
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                  rows={5}
                  placeholder="Please provide details about your issue..."
                />
              </div>
              <button type="submit" className="submit-button" aria-label="Send Message">
                <FaPaperPlane />
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="chat-modal">
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-info">
                <FaCommentDots />
                <div>
                  <h4>Live Support Chat</h4>
                  <span>Typically replies in a few minutes</span>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="chat-close" aria-label="Close Chat">
                <FaTimes />
              </button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.type}`}>
                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="chat-welcome">
                  <FaCommentDots />
                  <p>Hello! 👋 How can we help you today?</p>
                </div>
              )}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type your message..."
                className="chat-input"
              />
              <button onClick={handleSendChat} className="chat-send" aria-label="Send Chat Message">
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpSupport;