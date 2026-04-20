import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Stack, Collapse, IconButton, Tooltip, Button } from '@mui/material';
import { Close, Insights } from '@mui/icons-material';
import Sidebar from './components/Sidebar.jsx';
import Login from './components/login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/dashboard.jsx';
import CreateEvent from './components/createEvent.jsx';
import DiscoverEvents from './components/discoverEvents.jsx';
import EventDetails from './components/EventDetails.jsx';
import Profile from './components/Profile.jsx';
import MyTickets from './components/tickets/tickets.jsx';
import BookTicket from './components/tickets/TicketBook.jsx';
import OrganizerDashboard from './components/Messages/Organiser.jsx';
import OrganizerStatsDashboard from './components/OrganizerDashboard.jsx';
import TrendingEvents from './components/TrendingEvents.jsx';
import SwipeCards from './components/SwipeCards.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Header from './pages/header.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import socketService from './utils/socketService.js';
import CartDrawer from './components/CartDrawer.jsx';
import Footer from './pages/footer.jsx';
import EventStatsWidget from './components/EventStatsWidget.jsx';
const SavedEventsList = React.memo(React.lazy(() => import('./components/SavedEventsList.jsx')));
import OrganizerQuickActions from './components/OrganizerQuickActions.jsx';
import MobileActionBar from './components/MobileActionBar.jsx';
import AdminTickets from './components/AdminTickets.jsx';
import AdminEventApproval from './components/AdminEventApproval.jsx';
import Settings from './components/Settings.jsx';
import OrderHistory from './components/OrderHistory.jsx';
import EventAnalytics from './components/EventAnalytics.jsx';
import SearchResults from './components/SearchResults.jsx';
import CalendarViewModern from './components/CalendarViewModern.jsx';
import Messages from './components/Messages.jsx';
import HelpSupport from './components/HelpSupport.jsx';
import EventLanding from './components/EventLanding.jsx';
import { fetchFavorites, clearFavorites, removeFavorite } from './store/slices/favoritesSlice.js';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || user?.data?.role;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};


const AppLayout = ({ isAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart?.items?.length || 0);
  const savedEvents = useSelector((state) => state.favorites?.items || state.saved?.items || []);
  const favoritesPagination = useSelector((state) => state.favorites?.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
  const favoritesLoading = useSelector((state) => state.favorites?.loading);

  // Local state for favorites pagination
  const [favPage, setFavPage] = useState(1);
  const [favPerPage, setFavPerPage] = useState(12);

  // Load railOpen state from localStorage with default as false (closed)
  const [railOpen, setRailOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('enhancementsPanelOpen');
      // Only return true if user explicitly set it to true, otherwise false
      return saved === 'true';
    } catch {
      return false; // Default to closed on refresh
    }
  });

  // Save railOpen state to localStorage whenever it changes
  const handleRailToggle = useCallback(() => {
    setRailOpen((prev) => {
      const newState = !prev;
      localStorage.setItem('enhancementsPanelOpen', newState);
      return newState;
    });
  }, []);

  // Debounced fetch for favorites
  const favDebounceTimeout = useRef();
  useEffect(() => {
    if (isAuthenticated) {
      if (favDebounceTimeout.current) clearTimeout(favDebounceTimeout.current);
      favDebounceTimeout.current = setTimeout(() => {
        dispatch(fetchFavorites({ page: favPage, limit: favPerPage }));
      }, 300);
    }
    return () => {
      if (favDebounceTimeout.current) clearTimeout(favDebounceTimeout.current);
    };
  }, [isAuthenticated, favPage, favPerPage, dispatch]);

  const userRole = useSelector((state) => state.auth?.user?.role || 'booker');
  const [actionValue, setActionValue] = useState('search');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    } else {
      dispatch(clearFavorites());
    }
  }, [isAuthenticated, dispatch]);

  // Always scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Only show enhancements on specific routes
  const showEnhancements = isAuthenticated && 
    ['/dashboard', '/discover', '/organizer', '/profile', '/my-tickets'].includes(location.pathname);

  // Reset railOpen to false when navigating away from enhancement routes
  useEffect(() => {
    if (!showEnhancements && railOpen) {
      // Optionally close panel when leaving enhancement routes
      // setRailOpen(false);
      // localStorage.setItem('enhancementsPanelOpen', 'false');
    }
  }, [showEnhancements]);

  const handleViewSaved = useCallback((event) => {
    if (event?._id) {
      navigate(`/event/${event._id}`);
    } else if (event?.id) {
      navigate(`/event/${event.id}`);
    } else {
      navigate('/discover');
    }
  }, [navigate]);

  const handleRemoveSaved = useCallback(async (event) => {
    const id = event?.eventId || event?._id || event?.id;
    if (!id) return;
    try {
      await dispatch(removeFavorite(id)).unwrap();
    } catch {
      // silently ignore
    }
  }, [dispatch]);

  const handleExplore = useCallback(() => navigate('/discover'), [navigate]);
  const handlePageChange = useCallback((page) => setFavPage(page), []);
  const handlePerPageChange = useCallback((limit) => { setFavPerPage(limit); setFavPage(1); }, []);

  return (
    <>
      {isAuthenticated && <Header />}
      <Sidebar />
      <Routes>
        <Route path="/book-event/:eventId" element={<BookTicket />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        
        {/* Public Routes */}
        <Route path="/" element={<EventLanding />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/organizer-stats" element={<OrganizerStatsDashboard />} />
        <Route path="/trending" element={<TrendingEvents limit={10} key="trending" />} />
        <Route path="/swipe" element={<SwipeCards />} />
        
        {/* Private Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <PrivateRoute>
              <CreateEvent />
            </PrivateRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <PrivateRoute>
              <DiscoverEvents />
            </PrivateRoute>
          }
        />
        <Route
          path="/event/:id"
          element={
            <PrivateRoute>
              <EventDetails />
            </PrivateRoute>
          }
        />
        <Route 
          path="/book-event" 
          element={
            <PrivateRoute>
              <BookTicket />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/order-history" 
          element={
            <PrivateRoute>
              <OrderHistory />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <PrivateRoute>
              <EventAnalytics />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/search" 
          element={
            <PrivateRoute>
              <SearchResults />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/calendar" 
          element={
            <PrivateRoute>
              <CalendarViewModern />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/help" 
          element={
            <PrivateRoute>
              <HelpSupport />
            </PrivateRoute>
          } 
        />
        
        {/* Admin/Organiser Routes */}
        <Route 
          path="/admin-tickets" 
          element={
            <PrivateRoute>
              <AdminTickets />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin-events" 
          element={
            <PrivateRoute>
              <AdminEventApproval />
            </PrivateRoute>
          } 
        />
      </Routes>

      {/* Global Components */}
      <CartDrawer />
      {isAuthenticated && <Footer />}

      {isAuthenticated && (
        <MobileActionBar
          value={actionValue}
          onChange={(val) => {
            setActionValue(val);
            if (val === 'home') navigate('/dashboard');
            if (val === 'discover') navigate('/discover');
            if (val === 'tickets') navigate('/my-tickets');
            if (val === 'calendar') navigate('/calendar');
            if (val === 'more') navigate('/profile');
          }}
          onSearch={() => navigate('/discover')}
          onFilter={() => navigate('/discover')}
          onCart={() => navigate('/my-tickets')}
          onProfile={() => navigate('/profile')}
          onHome={() => navigate('/dashboard')}
          cartCount={cartCount}
          filterActive={location.pathname === '/dashboard'}
        />
      )}

      {/* Enhancements Panel - Only show if user has opened it before */}
      {showEnhancements && (
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 88, md: 32 },
            width: { xs: 'min(92vw, 520px)', md: 420 },
            zIndex: 1200,
          }}
        >
          <Stack spacing={1} alignItems="flex-end">
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleRailToggle}
              startIcon={railOpen ? <Close /> : <Insights />}
              sx={{ 
                boxShadow: 4, 
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s'
                }
              }}
            >
              {railOpen ? 'Hide widgets' : 'Show widgets'}
            </Button>
            <Collapse in={railOpen} unmountOnExit>
              <Box
                sx={{
                  maxHeight: { xs: '70vh', md: '60vh' },
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'divider',
                    borderRadius: 3,
                  },
                }}
              >
                <Stack spacing={2} sx={{ pb: 1 }}>
                  {['organiser', 'organizer', 'admin'].includes(userRole) && <EventStatsWidget />}
                  {['organiser', 'organizer', 'admin'].includes(userRole) && <OrganizerQuickActions />}
                  {['booker', 'organiser', 'organizer', 'admin'].includes(userRole) && (
                    <Suspense fallback={<div style={{padding: 24, textAlign: 'center'}}>Loading saved events...</div>}>
                      <SavedEventsList
                        savedEvents={savedEvents}
                        loading={favoritesLoading}
                        pagination={favoritesPagination}
                        onView={handleViewSaved}
                        onRemove={handleRemoveSaved}
                        onExplore={handleExplore}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                      />
                    </Suspense>
                  )}
                </Stack>
              </Box>
            </Collapse>
          </Stack>
        </Box>
      )}
    </>
  );
};

const App = () => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect();
      socketService.reconnectWithAuth(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppLayout isAuthenticated={isAuthenticated} />
      </BrowserRouter>
      
      {/* Toast Container with higher z-index */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 999999 }}
        toastStyle={{ zIndex: 999999 }}
      />
    </GoogleOAuthProvider>
  );
};

export default App;