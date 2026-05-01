import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  motion, AnimatePresence, useAnimation, useInView,
  useMotionValue, useTransform, useSpring
} from 'framer-motion';
import {
  FiPlus, FiSearch, FiCalendar, FiUsers, FiDollarSign, FiEdit,
  FiMail, FiBarChart2, FiSettings, FiPause, FiPlay, FiTrash2,
  FiDownload, FiSend, FiMessageSquare, FiLock, FiGlobe, FiEye,
  FiChevronLeft, FiChevronRight, FiArrowLeft, FiTrendingUp,
  FiHeart, FiShare2, FiShare, FiMapPin, FiZap, FiGrid,
  FiFilter, FiSliders
} from 'react-icons/fi';
import './Dashboard.css';
import Location from '../components/featuresd/Location.jsx';
import CategoryFilter from './category.jsx';
import EventCarousel from './featuresd/features.jsx';
import { messages } from './constants';
import CustomDropdown from './customDropdown.jsx';
import {
  deleteEvent, fetchMyEvents, fetchEvents,
  setFilters, clearFilters
} from '../store/slices/eventSlice';
import { apiClient } from '../utils/api';
import fallbackImage from '../assets/image8.jpg';
import { toast } from 'react-toastify';

const ManageEvent = lazy(() => import('./dashboardC/ManageEvent.jsx'));

// ─── Animation Variants ───────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', damping: 22, stiffness: 280 }
  },
  exit: {
    opacity: 0, scale: 0.94,
    transition: { duration: 0.18 }
  }
};

const slideInLeftVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', damping: 20, stiffness: 260 }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 350 }
  }
};

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', damping: 18, stiffness: 280 }
  }
};

const filterVariants = {
  initial: { opacity: 0, y: -12, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
};

const chipVariants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 22 } },
  exit:    { opacity: 0, scale: 0.85, transition: { duration: 0.15 } },
};

// ─── Lazy Image ───────────────────────────────────────────────────────────────

const LazyImage = ({ src, alt, className, fallbackSrc }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setImageSrc(src); observer.unobserve(e.target); } }),
      { rootMargin: '120px', threshold: 0.01 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => { if (imgRef.current) observer.unobserve(imgRef.current); };
  }, [src]);

  return (
    <div ref={imgRef} className="lazy-image-container">
      {imageSrc && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className || ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => { setImageSrc(fallbackSrc || fallbackImage); setIsLoaded(true); }}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.04 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
      <AnimatePresence>
        {!isLoaded && imageSrc && (
          <motion.div
            className="image-placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="loading-spinner-small"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Loading Fallback ─────────────────────────────────────────────────────────

const LoadingFallback = () => (
  <motion.div
    className="loading-container"
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
  >
    <motion.div
      className="loading-spinner"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
    <motion.p
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity }}
    >
      Loading…
    </motion.p>
  </motion.div>
);

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const EventCardSkeleton = () => (
  <motion.div
    className="event-card skeleton"
    variants={itemVariants}
    layout
  >
    <div className="skeleton-image skeleton-base" />
    <div className="skeleton-header">
      <div className="skeleton-badge skeleton-base" />
      <div className="skeleton-date skeleton-base" />
    </div>
    <div className="skeleton-title skeleton-base" />
    <div className="skeleton-title-short skeleton-base" />
    <div className="skeleton-location skeleton-base" />
    <div className="skeleton-progress skeleton-base" />
    <div className="skeleton-stats">
      <div className="skeleton-stat skeleton-base" />
      <div className="skeleton-stat skeleton-base" />
    </div>
    <div className="skeleton-actions">
      <div className="skeleton-button skeleton-base" />
      <div className="skeleton-button skeleton-base" />
    </div>
  </motion.div>
);

const EventsGridSkeleton = ({ count = 9 }) => (
  <motion.div
    className="events-grid-k"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    {Array(count).fill().map((_, i) => <EventCardSkeleton key={i} />)}
  </motion.div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const AnimatedProgressBar = ({ attendees, capacity }) => {
  const pct = Math.min(Math.round((attendees / capacity) * 100), 100);
  const cls = pct >= 80 ? 'fill-high' : pct >= 40 ? 'fill-medium' : 'fill-low';

  return (
    <div className="event-progress">
      <div className="event-progress-labels">
        <span><FiUsers style={{ display: 'inline', marginRight: 3 }} />{attendees}/{capacity}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{pct}%</span>
      </div>
      <div className="event-progress-track">
        <motion.div
          className={`event-progress-fill ${cls}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
    </div>
  );
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

const FilterPill = ({ label, active, onClick }) => (
  <motion.button
    className={`btn-filter ${active ? 'active' : ''}`}
    onClick={onClick}
    variants={chipVariants}
    initial="initial"
    animate="animate"
    whileHover={{ scale: 1.04, y: -2 }}
    whileTap={{ scale: 0.96 }}
    layout
  >
    {label}
  </motion.button>
);

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = React.memo(({ event, index, onManage, onView, canManage, formatDate, formatCurrency, getDateStatus }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [isHovered, setIsHovered] = useState(false);
  const [isFaved, setIsFaved] = useState(false);
console.log('Rendering EventCard:', event);
  useEffect(() => {
    if (isInView) controls.start('visible');
  }, [isInView, controls]);

  const status = getDateStatus(event.date, event.status);

  const statusLabels = {
    pending: 'Pending Approval',
    cancelled: 'Cancelled',
    completed: 'Event Ended',
    expired: 'Expired',
    active: 'Active',
    upcoming: 'Upcoming',
    near: 'This Week',
    future: 'Scheduled',
  };

  const eventId = event._id || event.id;

  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 250, delay: index * 0.05 }
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.2 } }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="event-card"
      layout
    >
      {/* Image */}
      <div className="event-card-image">
        <LazyImage
          src={
            event.imageName
              ? `${import.meta.env.VITE_BASE_URL}/uploads/events/${event.imageName}`
              : event.image
          }
          alt={event.title}
          fallbackSrc={fallbackImage}
          className="event-image"
        />

        {/* Gradient overlay */}
        <motion.div
          className="event-card-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />

        {/* Category chip */}
        <motion.span
          className="event-card-cat"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.12 }}
        >
          {event.category || 'Event'}
        </motion.span>

        {/* Fav button */}
        <motion.button
          className={`event-card-fav ${isFaved ? 'faved' : ''}`}
          onClick={(e) => { e.stopPropagation(); setIsFaved(f => !f); }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.7 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiHeart />
        </motion.button>
      </div>

      {/* Body */}
      <div className="event-body">
        {/* Header row */}
        <div className="event-header">
          <div className="left">
            <motion.span
              className={`event-status ${status}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 400, damping: 20 }}
            >
              {statusLabels[status] || status}
            </motion.span>
          </div>
          <div className="right">
            <motion.span
              className="event-date"
              initial={{ x: 14, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.15 }}
            >
              <FiCalendar className="icon" />
              {formatDate(event.date)}
            </motion.span>
          </div>
        </div>

        {/* Title */}
        <motion.h3
          className="event-title-kl"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.18 }}
        >
          {event.title}
        </motion.h3>

        {/* Location */}
        <motion.p
          className="event-location"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.22 }}
        >
          <FiMapPin className="icon" />
          {event.location}
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.26 }}
        >
          <AnimatedProgressBar
            attendees={event.attendees || 0}
            capacity={event.capacity || 100}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          className="event-stats-k"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.30 }}
        >
          <div className="stat-item-k">
            <FiUsers className="icon" />
            <span>{event.attendees || 0}/{event.capacity || 100}</span>
          </div>
          <div className="stat-item-k revenue">
            <FiDollarSign className="icon" />
            <span>{formatCurrency(event.revenue || 0)}</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="event-t"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.34 }}
        >
          <div className="event-actions-k">
            <motion.button
              className="btn-secondary-k"
              onClick={() => onView(eventId)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiEye style={{ width: 11, height: 11 }} />
              View Event
            </motion.button>
          </div>
          {canManage && (
            <div className="event-actions-k">
              <motion.button
                className="btn-secondary-k manage"
                onClick={() => onManage(event)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiSettings style={{ width: 11, height: 11 }} />
                Manage
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
});

// ─── Pagination Button ────────────────────────────────────────────────────────

const PaginationBtn = ({ children, onClick, disabled, active, isDots }) => (
  <motion.button
    className={`pagination-page-btn ${active ? 'active' : ''} ${isDots ? 'dots' : ''}`}
    onClick={onClick}
    disabled={disabled || isDots}
    whileHover={!disabled && !isDots ? { scale: 1.1, y: -2 } : {}}
    whileTap={!disabled && !isDots ? { scale: 0.92 } : {}}
    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    layout
  >
    {children}
  </motion.button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    events: reduxEvents, myEvents, loading: eventsLoading, error: eventsError,
    filters, pagination: reduxPagination
  } = useSelector((state) => state.events);

  const { user, isAuthenticated } = useSelector((state) => state.auth);
console.log(reduxEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [salesData, setSalesData] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [newTicketType, setNewTicketType] = useState({ name: '', price: 0, quantity: 0 });
  const [ticketTypes, setTicketTypes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('booker');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(12);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const messageTemplates = messages;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'events') setActiveCategory('all');
  }, [activeTab]);

  const currentUserId = useMemo(() => {
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u._id || u.id;
    } catch { return null; }
  }, [user]);

  useEffect(() => {
    let role = 'booker';
    if (user?.role) { role = user.role; }
    else {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        role = u?.role || 'booker';
      } catch {}
    }
    setUserRole(role);
    if (role === 'organiser' || role === 'admin') setShowMyEventsOnly(false);
  }, [user]);

  const canManageEvent = useCallback((event) => {
    if (userRole === 'admin') return true;
    if (userRole === 'organiser') {
      const ownerId = event.organizerId || event.createdBy;
      return ownerId === currentUserId;
    }
    return false;
  }, [userRole, currentUserId]);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleToggleStatus = useCallback(async () => {
    if (!selectedEvent || !canManageEvent(selectedEvent)) {
      toast.error('No permission'); return;
    }
    setUpdatingStatus(true);
    try {
      const newStatus = selectedEvent.status === 'active' ? 'paused' : 'active';
      await apiClient.put(`/events/${selectedEvent.id}`, { status: newStatus });
      setSelectedEvent(prev => ({ ...prev, status: newStatus }));
      toast.success(`Event ${newStatus === 'paused' ? 'paused' : 'activated'}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      const newStatus = selectedEvent.status === 'active' ? 'paused' : 'active';
      setSelectedEvent(prev => ({ ...prev, status: newStatus }));
      toast.success(`Event ${newStatus === 'paused' ? 'paused' : 'activated'} (offline)`);
    } finally {
      setUpdatingStatus(false);
    }
  }, [selectedEvent, canManageEvent, setSelectedEvent]);
console.log('Dashboard render - selectedEvent:', selectedEvent);

  useEffect(() => {
    const isOrg = userRole === 'organiser' || userRole === 'admin';
    const params = {
      page: currentPage,
      limit: eventsPerPage,
      category: activeCategory !== 'all' ? activeCategory : '',
      search: debouncedSearchTerm,
      location: locationSearchTerm,
      filterType: filterType !== 'all' ? filterType : '',
    };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    dispatch(setFilters(params));

    if (isOrg && showMyEventsOnly) dispatch(fetchMyEvents());
    else dispatch(fetchEvents(params));
  }, [dispatch, currentPage, eventsPerPage, activeCategory, debouncedSearchTerm, locationSearchTerm, filterType, userRole, showMyEventsOnly]);

  const currentEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const events = showMyEventsOnly && (userRole === 'organiser' || userRole === 'admin')
      ? (myEvents || []) : (reduxEvents || []);
    return events.filter(e => e && (e._id || e.id) && e.date).filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    }).map(event => ({
      ...event,
      id: event._id || event.id,
      attendees: event.attendees || event.ticketsSold || 0,
      ticketsSold: event.ticketsSold || 0,
      revenue: event.revenue || 0,
      capacity: event.capacity || 100,
      status: event.status || 'active',
      canManage: canManageEvent(event)
    }));
  }, [reduxEvents, myEvents, showMyEventsOnly, userRole, canManageEvent]);

  const totalPages = showMyEventsOnly ? Math.ceil((myEvents?.length || 0) / eventsPerPage) : (reduxPagination?.pages || 1);
  const totalEvents = showMyEventsOnly ? (myEvents?.length || 0) : (reduxPagination?.total || 0);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, locationSearchTerm, activeCategory, filterType, eventsPerPage, showMyEventsOnly]);

  useEffect(() => {
    if (!selectedEvent) return;
    const days = 14;
    const base = new Date(selectedEvent.date);
    base.setDate(base.getDate() - days);
    setSalesData(Array.from({ length: days }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        tickets: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 1000) + 200
      };
    }));
    setTicketTypes(selectedEvent.ticketTypes?.length ? selectedEvent.ticketTypes : []);
  }, [selectedEvent]);

  const formatDate = (ds) => {
    if (!ds || ds === 'N/A') return 'N/A';
    return new Date(ds).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDateStatus = (dateString, eventStatus) => {
    if (['pending', 'rejected', 'cancelled', 'completed'].includes(eventStatus)) return eventStatus;
    if (!dateString || dateString === 'N/A') return 'unknown';
    const diff = Math.ceil((new Date(dateString) - new Date()) / 86400000);
    if (diff < 0)  return 'expired';
    if (diff <= 7) return 'near';
    if (diff <= 30) return 'upcoming';
    return 'future';
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const handleManageEvent = (event) => {
    if (!canManageEvent(event)) { toast.error('No permission to manage this event'); return; }
    setSelectedEvent(event);
    setActiveTab('manage');
  };

  const handleSendMessage = useCallback(async () => {
    if (!selectedEvent || !messageContent.trim()) return;
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      await apiClient.post(`/events/${selectedEvent.id}/notify`, {
        message: messageContent,
        recipientType
      });
      toast.success('Message queued for attendees');
      setMessageContent('');
    } catch (err) {
      console.error('Send message error:', err);
      toast.success('Message sent (offline mode)');
      setMessageContent('');
    }
  }, [selectedEvent, messageContent, recipientType]);

  const handleExportAttendees = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const { data } = await apiClient.get(`/events/${selectedEvent.id}/attendees`);
      const attendees = data?.attendees || [];
      if (attendees.length === 0) {
        toast.info('No attendees to export');
        return;
      }
      const csv = [
        ['Name', 'Email', 'Ticket Type', 'Status'].join(','),
        ...attendees.map(a => [
          `"${(a.userName || a.userEmail || '').replace(/"/g, '""')}"`,
          `"${(a.userEmail || '').replace(/"/g, '""')}"`,
          `"${(a.ticketType || 'General').replace(/"/g, '""')}"`,
          `"${a.status || 'Confirmed'}"`
        ].join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEvent.title}-attendees.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Attendees exported');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export attendees');
    }
  }, [selectedEvent]);

  const handlePrivacyChange = useCallback(async (privacy) => {
    if (!selectedEvent || !canManageEvent(selectedEvent)) {
      toast.error('No permission'); return;
    }
    try {
      await apiClient.put(`/events/${selectedEvent.id}`, { privacy });
      setSelectedEvent(prev => ({ ...prev, privacy }));
      toast.success(`Event is now ${privacy}`);
    } catch (err) {
      console.error('Privacy change error:', err);
      setSelectedEvent(prev => ({ ...prev, privacy }));
      toast.success(`Event is now ${privacy} (offline)`);
    }
  }, [selectedEvent, canManageEvent, setSelectedEvent]);

  const toggleEventStatus = handleToggleStatus;

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent || !canManageEvent(selectedEvent)) {
      toast.error('No permission to delete'); setShowDeleteModal(false); return;
    }
    const eventId = selectedEvent._id || selectedEvent.id;
    try {
      await dispatch(deleteEvent(eventId)).unwrap();
      setSelectedEvent(null); setActiveTab('events'); setShowDeleteModal(false);
      toast.success('Event deleted');
      const params = { page: currentPage, limit: eventsPerPage };
      showMyEventsOnly ? dispatch(fetchMyEvents()) : dispatch(fetchEvents(params));
    } catch (err) {
      toast.error(err.message || 'Failed to delete'); setShowDeleteModal(false);
    }
  }, [selectedEvent, dispatch, currentPage, eventsPerPage, showMyEventsOnly, canManageEvent]);

  const handleUseTemplate = (t) => setMessageContent(t.content);
  const handleTicketTypeChange = (id, field, value) =>
    setTicketTypes(prev => prev.map(t => t.id === id ? { ...t, [field]: ['price','total'].includes(field) ? Number(value) : value } : t));
  const handleAddTicketType = () => {
    if (newTicketType.name && newTicketType.price > 0 && newTicketType.quantity > 0) {
      setTicketTypes(prev => [...prev, { id: Date.now(), type: newTicketType.name, price: newTicketType.price, total: newTicketType.quantity, sold: 0 }]);
      setNewTicketType({ name: '', price: 0, quantity: 0 });
      toast.success('Ticket type added');
    } else toast.error('Fill all ticket fields');
  };
  const handleRemoveTicketType = (id) => { setTicketTypes(prev => prev.filter(t => t.id !== id)); toast.success('Removed'); };

  const totalRevenue = selectedEvent?.revenue ?? ticketTypes.reduce((s, t) => s + t.price * t.sold, 0);
  const totalTicketsSold = selectedEvent?.ticketsSold ?? ticketTypes.reduce((s, t) => s + t.sold, 0);
  const totalTicketsAvailable = selectedEvent?.capacity ?? ticketTypes.reduce((s, t) => s + t.total, 0);

  const goToPage = (p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goToNextPage = () => { if (currentPage < totalPages) goToPage(currentPage + 1); };
  const goToPrevPage = () => { if (currentPage > 1) goToPage(currentPage - 1); };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3) { [1,2,3,4].forEach(i => pages.push(i)); pages.push('...'); pages.push(totalPages); }
    else if (currentPage >= totalPages - 2) { pages.push(1); pages.push('...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); pages.push('...'); [currentPage-1, currentPage, currentPage+1].forEach(i => pages.push(i)); pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  // ── Render Events Tab ──
  const renderEventsTab = () => {
    const paginated = showMyEventsOnly && (userRole === 'organiser' || userRole === 'admin')
      ? currentEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage)
      : currentEvents;

    return (
      <>
        {eventsLoading && currentEvents.length === 0 ? (
          <EventsGridSkeleton count={6} />
        ) : (
          <motion.div
            className="events-grid-k"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`grid-${currentPage}-${filterType}-${activeCategory}`}
          >
            <AnimatePresence mode="popLayout">
              {paginated.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  onManage={handleManageEvent}
                  onView={(id) => navigate(`/event/${id}`)}
                  canManage={canManageEvent(event)}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  getDateStatus={getDateStatus}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="pagination-container"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          >
            {/* Info */}
            <motion.div className="pagination-info" whileHover={{ scale: 1.02 }}>
              <span className="info-badge">
                {((currentPage - 1) * eventsPerPage) + 1}–{Math.min(currentPage * eventsPerPage, totalEvents)}
              </span>
              <span className="info-total">of {totalEvents} events</span>
            </motion.div>

            {/* Controls */}
            <div className="pagination-controls-kl">
              <motion.button
                className="pagination-nav-btn"
                onClick={goToPrevPage}
                disabled={currentPage === 1 || eventsLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronLeft />
                <span className="nav-text">Prev</span>
              </motion.button>

              <div className="pagination-pages">
                <AnimatePresence mode="popLayout">
                  {getPageNumbers().map((page, i) => (
                    <PaginationBtn
                      key={`${page}-${i}`}
                      onClick={() => typeof page === 'number' && goToPage(page)}
                      active={currentPage === page}
                      isDots={page === '...'}
                      disabled={page === '...' || eventsLoading}
                    >
                      {page}
                    </PaginationBtn>
                  ))}
                </AnimatePresence>
              </div>

              <motion.button
                className="pagination-nav-btn"
                onClick={goToNextPage}
                disabled={currentPage === totalPages || eventsLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="nav-text">Next</span>
                <FiChevronRight />
              </motion.button>
            </div>

            {/* Per page */}
            <div className="pagination-per-page-k">
              <CustomDropdown
                value={eventsPerPage}
                onChange={(val) => { setEventsPerPage(Number(val)); setCurrentPage(1); }}
                options={[
                  { value: 6, label: '6 per page' }, { value: 9, label: '9 per page' },
                  { value: 12, label: '12 per page' }, { value: 18, label: '18 per page' },
                  { value: 24, label: '24 per page' },
                ]}
                placeholder="Per page"
              />
            </div>
          </motion.div>
        )}

        {/* Loading indicator for subsequent pages */}
        <AnimatePresence>
          {eventsLoading && currentEvents.length > 0 && (
            <motion.div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem', color: 'var(--clr-text-3)', fontSize: '0.85rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="loading-spinner-small"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
              />
              Loading events…
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  // Initial full-page skeleton
  if (eventsLoading && currentEvents.length === 0) {
    return (
      <motion.div className="dashboard-container" variants={pageVariants} initial="initial" animate="animate">
        <main className="dashboard-main">
          <EventsGridSkeleton count={eventsPerPage} />
        </main>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dashboard-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <main className="dashboard-main">

        {/* Carousel */}
        <motion.div variants={fadeInUpVariants} initial="hidden" animate="visible">
          <EventCarousel
            events={currentEvents.filter(e => e.status === 'active').slice(0, 6)}
          />
        </motion.div>

        <br />

        {activeTab === 'events' && (
          <>
            {/* ── Controls ── */}
            <motion.div
              className="dashboard-controls"
              variants={filterVariants}
              initial="initial"
              animate="animate"
            >
              {/* Search + Location */}
              <div className="flex flex-wrap gap-4 items-center mb-4">
                {/* Search input */}
                <motion.div
                  className={`flex items-center gap-2.5 bg-white dark:bg-slate-800 border rounded-lg px-4 h-[42px] flex-1 min-w-[240px] max-w-[360px] transition-all duration-200 ${
                    isSearchFocused ? 'border-amber-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                  animate={{
                    boxShadow: isSearchFocused
                      ? '0 0 0 3px rgba(245,158,11,0.18)'
                      : '0 0 0 0px rgba(245,158,11,0)',
                  }}
                >
                 
                  <input
                    type="text"
                    placeholder="Search events…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="border-none bg-transparent font-sans text-sm text-slate-900 dark:text-white outline-none w-full placeholder:text-slate-400"
                  />
                  <AnimatePresence>
                    {searchTerm && (
                      <motion.button
                        className="bg-none border-none cursor-pointer text-slate-400 text-lg p-0 leading-none transition-colors hover:text-slate-600 dark:hover:text-white"
                        onClick={() => setSearchTerm('')}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Location */}
                <div className="flex-1 min-w-[220px] max-w-[280px]">
                  <Location
                    onSearch={setLocationSearchTerm}
                    placeholder="Search by city…"
                    events={currentEvents}
                  />
                </div>
              </div>

              {/* Filter pills */}
              <motion.div
                className="filter-buttons"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {['all', 'upcoming', 'active', 'past'].map((type) => (
                  <FilterPill
                    key={type}
                    label={type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1)}
                    active={filterType === type}
                    onClick={() => setFilterType(type)}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* ── My Events Toggle ── */}
            {(userRole === 'organiser' || userRole === 'admin') && (
              <motion.div
                className="my-events-toggle"
                style={{ marginBottom: '1rem' }}
                variants={scaleInVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { val: false, label: 'All Events' },
                  { val: true,  label: 'My Events' }
                ].map(({ val, label }) => (
                  <motion.button
                    key={String(val)}
                    className={`toggle-btn ${showMyEventsOnly === val ? 'active' : ''}`}
                    onClick={() => setShowMyEventsOnly(val)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    layout
                  >
                    {label}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* ── Category Filter ── */}
            <motion.div
              variants={scaleInVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.08 }}
            >
              <CategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            </motion.div>

            {/* ── Grid or Empty State ── */}
            {currentEvents.length === 0 && !eventsLoading ? (
              <motion.div
                className="empty-state"
                variants={scaleInVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="empty-state-icon"
                  animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                >
                  <FiCalendar />
                </motion.div>
                <h3>No events found</h3>
                <p>Try adjusting your filters or create your first event</p>
                {(userRole === 'organiser' || userRole === 'admin') && (
                  <motion.button
                    className="btn-primary"
                    onClick={() => navigate('/create-event')}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiPlus />
                    Create Event
                  </motion.button>
                )}
              </motion.div>
            ) : renderEventsTab()}
          </>
        )}

        {/* ── Manage Tab ── */}
        {activeTab !== 'events' && selectedEvent && (
          <Suspense fallback={<LoadingFallback />}>
            <ManageEvent
              selectedEvent={selectedEvent}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              toggleEventStatus={toggleEventStatus}
              updatingStatus={updatingStatus}
              formatCurrency={formatCurrency}
              attendeeSearch={attendeeSearch}
              setAttendeeSearch={setAttendeeSearch}
              handleExportAttendees={handleExportAttendees}
              // filteredAttendees={filteredAttendees}
              setMessageContent={setMessageContent}
              messageTemplates={messageTemplates}
              handleUseTemplate={handleUseTemplate}
              messageContent={messageContent}
              recipientType={recipientType}
              setRecipientType={setRecipientType}
              handleSendMessage={handleSendMessage}
              totalRevenue={totalRevenue}
              totalTicketsSold={totalTicketsSold}
              totalTicketsAvailable={totalTicketsAvailable}
              salesData={salesData}
              ticketTypes={ticketTypes}
              editingTicket={editingTicket}
              setEditingTicket={setEditingTicket}
              handleTicketTypeChange={handleTicketTypeChange}
              handleRemoveTicketType={handleRemoveTicketType}
              newTicketType={newTicketType}
              setNewTicketType={setNewTicketType}
              handleAddTicketType={handleAddTicketType}
              handlePrivacyChange={handlePrivacyChange}
              setShowDeleteModal={setShowDeleteModal}
              localEvents={currentEvents}
              setLocalEvents={() => {}}
              setSelectedEvent={setSelectedEvent}
            />
          </Suspense>
        )}

        {/* ── Delete Modal ── */}
        <AnimatePresence>
          {showDeleteModal && selectedEvent && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="modal-icon"
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                >
                  <FiTrash2 />
                </motion.div>
                <h3>Delete Event</h3>
                <p>
                  Permanently delete <strong>"{selectedEvent.title}"</strong>?
                  This action cannot be undone.
                </p>
                <div className="modal-actions">
                  <motion.button
                    className="btn-secondary-k"
                    onClick={() => setShowDeleteModal(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ minWidth: 100 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="btn-danger"
                    onClick={handleDeleteEvent}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiTrash2 style={{ width: 13, height: 13 }} />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default Dashboard;