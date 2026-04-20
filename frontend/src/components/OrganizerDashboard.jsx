import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AttachMoney,
  ConfirmationNumber,
  TrendingUp,
  Event,
  Visibility,
  Favorite,
  Add,
} from '@mui/icons-material';
import { fetchOrganizerDashboard } from '../store/slices/eventSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
};
import './Organizer.css';

const StatCard = ({ icon, title, value, subtitle, color = 'primary' }) => {
  const getColorStyles = () => {
    switch(color) {
      case 'success':
        return { bg: 'odd__statBg--success', text: 'odd__statIcon--success' };
      case 'info':
        return { bg: 'odd__statBg--info', text: 'odd__statIcon--info' };
      case 'warning':
        return { bg: 'odd__statBg--warning', text: 'odd__statIcon--warning' };
      default:
        return { bg: 'odd__statBg--primary', text: 'odd__statIcon--primary' };
    }
  };

  const colorStyles = getColorStyles();

  return (
    <div className="odd__statCard">
      <div className="odd__statContent">
        <div className={`odd__statIconWrapper ${colorStyles.bg}`}>
          <div className={`odd__statIcon ${colorStyles.text}`}>
            {icon}
          </div>
        </div>
        <div className="odd__statInfo">
          <p className="odd__statTitle">{title}</p>
          <h5 className="odd__statValue">{value}</h5>
          {subtitle && (
            <p className="odd__statSubtitle">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="odd__chartEmpty">
        <p className="odd__chartEmptyText">No sales data available</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="odd__chartContainer">
      {data.slice(-14).map((day, idx) => {
        const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 160 : 0;
        return (
          <CustomTooltip key={idx} title={`${day.date}: $${day.revenue}`}>
            <div
              className="odd__chartBar"
              style={{ height: `${height}px` }}
            />
          </CustomTooltip>
        );
      })}
    </div>
  );
};

const CustomTooltip = ({ children, title }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="odd__tooltipWrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="odd__tooltipContent">
          {title}
        </div>
      )}
    </div>
  );
};

const OrganizerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard, loading } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchOrganizerDashboard());
  }, [dispatch]);

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const overview = dashboard?.overview || {};

  if (loading && !dashboard) {
    return (
      <div className="odd__skeletonContainer">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="odd__skeletonItem" />
        ))}
      </div>
    );
  }

  const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

return (
    <motion.div
      className="odd__dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="odd__header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h5 className="odd__title">Dashboard</h5>
        <motion.button
          className="odd__createBtn"
          onClick={() => navigate('/create-event')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Add className="odd__btnIcon" />
          Create Event
        </motion.button>
      </motion.div>

      <motion.div
        className="odd__statsGrid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="odd__statsGridItem" variants={itemVariants}>
          <StatCard
            icon={<Event />}
            title="Total Events"
            value={overview.totalEvents || 0}
            subtitle={`${overview.activeEvents || 0} active`}
            color="primary"
          />
        </motion.div>
        <motion.div className="odd__statsGridItem" variants={itemVariants}>
          <StatCard
            icon={<AttachMoney />}
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            subtitle={`${formatCurrency(overview.monthlyRevenue)} this month`}
            color="success"
          />
        </motion.div>
        <motion.div className="odd__statsGridItem" variants={itemVariants}>
          <StatCard
            icon={<ConfirmationNumber />}
            title="Tickets Sold"
            value={overview.totalTicketsSold || 0}
            subtitle={`${overview.monthlyTickets || 0} this month`}
            color="info"
          />
        </motion.div>
        <motion.div className="odd__statsGridItem" variants={itemVariants}>
          <StatCard
            icon={<TrendingUp />}
            title="Conversion Rate"
            value={`${overview.conversionRate || 0}%`}
            subtitle="of capacity"
            color="warning"
          />
        </motion.div>
      </motion.div>

      <div className="odd__chartCard">
        <div className="odd__chartCardContent">
          <h6 className="odd__chartTitle">Ticket Sales (Last 30 Days)</h6>
          <SalesChart data={dashboard?.salesGraph || []} />
        </div>
      </div>

      <div className="odd__eventsCard">
        <div className="odd__eventsCardContent">
          <h6 className="odd__eventsTitle">Recent Events</h6>
          {dashboard?.recentEvents?.length > 0 ? (
            <div className="odd__tableContainer">
              <table className="odd__table">
                <thead>
                  <tr className="odd__tableHeader">
                    <th className="odd__tableCell odd__tableCellLeft">Event</th>
                    <th className="odd__tableCell odd__tableCellLeft">Date</th>
                    <th className="odd__tableCell odd__tableCellCenter">Status</th>
                    <th className="odd__tableCell odd__tableCellCenter">Sold</th>
                    <th className="odd__tableCell odd__tableCellCenter">Revenue</th>
                    <th className="odd__tableCell odd__tableCellCenter">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentEvents.map((event) => (
                    <tr
                      key={event._id}
                      className="odd__tableRow"
                      onClick={() => navigate(`/event/${event._id}`)}
                    >
                      <td className="odd__tableCell odd__tableCellLeft">
                        <p className="odd__eventTitle">
                          {event.title}
                        </p>
                      </td>
                      <td className="odd__tableCell odd__tableCellLeft">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="odd__tableCell odd__tableCellCenter">
                        <span className={`odd__statusChip odd__statusChip--${event.status}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="odd__tableCell odd__tableCellCenter">
                        {event.ticketsSold || 0}
                      </td>
                      <td className="odd__tableCell odd__tableCellCenter">
                        {formatCurrency(event.revenue)}
                      </td>
                      <td className="odd__tableCell odd__tableCellCenter">
                        <div className="odd__viewsContainer">
                          <Visibility className="odd__viewsIcon" />
                          {event.views || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="odd__emptyState">
              <p className="odd__emptyText">No events yet</p>
              <button 
                className="odd__emptyBtn"
                onClick={() => navigate('/create-event')}
              >
                Create Your First Event
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OrganizerDashboard;