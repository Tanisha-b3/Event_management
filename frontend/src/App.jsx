import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/dashboard.jsx';
import CreateEvent from './components/createEvent.jsx';
import DiscoverEvents from './components/discoverEvents.jsx';
import EventDetails from './components/EventDetails.jsx';
import Profile from './components/Profile.jsx';
import MyTickets from './components/tickets/tickets.jsx';
import BookTicket from './components/tickets/TicketBook.jsx';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // In a real app, you might want to verify the token with your backend
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
        <Route path="/book-event/:eventId" element={<BookTicket />} />
        <Route path="/my-tickets" element={<MyTickets />} />
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
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

          {/* Private Routes */}
          <Route
            path="/dashboard"
            element={
             
                <Dashboard />
            }
          />
          <Route
            path="/create-event"
            element={
             
                <CreateEvent />
              
            }
          />
          <Route
            path="/discover"
            element={
                <DiscoverEvents />
             
            }
          />
          <Route
            path="/event/:id"
            element={
              // <PrivateRoute>
                <EventDetails />
              // </PrivateRoute>
            }
          />
<Route path='profile' element={<Profile />} />
        </Routes>
      </BrowserRouter>
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
      />
    </>
  );
};

export default App;