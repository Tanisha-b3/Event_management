import React from 'react';
import { useSelector } from 'react-redux';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
  alpha,
  LinearProgress,
} from '@mui/material';
import { Favorite, FavoriteBorder, OpenInNew, Place, Delete, Event } from '@mui/icons-material';
import CustomDropdown from './customDropdown.jsx';
import './SavedEvents.css'; // Import custom CSS

const fallbackEvents = [
  {
    id: 'preview-1',
    title: 'Sunset Acoustic Sessions',
    date: 'Fri, Apr 24 · 7:00 PM',
    location: 'Riverside Amphitheater',
    cover: '/placeholder-event.jpg',
    tag: 'Music',
  },
  {
    id: 'preview-2',
    title: 'Creative Makers Market',
    date: 'Sat, May 3 · 10:00 AM',
    location: 'Downtown Arts District',
    cover: '/placeholder-event.jpg',
    tag: 'Marketplace',
  },
];

const normalizeEvent = (event) => {
  if (!event) return null;

  const rawDate = event.date || event.eventDate || event.startDate;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date TBD';

  return {
    id: event._id || event.id || event.eventId || event.slug || event.title,
    title: event.title || event.eventName || event.name || 'Untitled event',
    date: formattedDate,
    location: event.location || event.venue || event.city || 'Online / TBA',
    cover: event.cover || event.image || event.eventImage || event.banner,
    tag: event.category || event.tag || event.type,
    raw: event,
  };
};

const SavedEventsList = ({
  title = 'Saved events',
  description = 'Quick access to your liked events',
  savedEvents = [],
  onView,
  onRemove,
  onExplore,
  dense = false,
  loading = false,
  pagination = { page: 1, limit: 12, total: 0, pages: 1 },
  onPageChange,
  onPerPageChange,
}) => {
  const themeMode = useSelector(state => state.theme?.mode || 'light');
  const normalized = (savedEvents || []).map(normalizeEvent).filter(Boolean);
  const items = normalized.length ? normalized : fallbackEvents;
  const isEmpty = !normalized.length;

  const handleRemove = (event, e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(event);
    }
  };

  const handleView = (event, e) => {
    if (e) e.stopPropagation();
    if (onView) {
      onView(event);
    }
  };

  return (
    <div className={`saved-events-wrapper ${themeMode}`}>
      <Paper
        variant="outlined"
        className={`saved-events-paper ${themeMode}`}
        elevation={0}
      >
        <div className="saved-events-header">
          <div className="header-text">
            <Typography variant="h6" className="header-title">
              {title}
            </Typography>
            <Typography variant="body2" className="header-description">
              {description}
            </Typography>
          </div>
          <div className="header-icon-wrapper">
            <Favorite className="header-icon" />
          </div>
        </div>

        {loading && (
          <div className="loading-progress">
            <LinearProgress />
          </div>
        )}

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <FavoriteBorder className="empty-icon" />
            </div>
            <Typography variant="h6" className="empty-title">
              No saved events yet
            </Typography>
            <Typography variant="body2" className="empty-description">
              Tap the heart icon on any event to save it here for quick access.
            </Typography>
            <Button 
              variant="contained" 
              onClick={onExplore} 
              className="explore-button"
            >
              Discover events
            </Button>
          </div>
        ) : (
          <>
            <List disablePadding className="events-list">
              {items.map((event, index) => (
                <ListItemButton
                  key={event.id || index}
                  dense={dense}
                  onClick={(e) => handleView(event, e)}
                  className={`event-item ${dense ? 'dense' : ''}`}
                >
                  <ListItemAvatar className="event-avatar-wrapper">
                    <Avatar
                      variant="rounded"
                      src={event.cover}
                      alt={event.title}
                      className="event-avatar"
                    >
                      <Event className="avatar-fallback-icon" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText className="event-text">
                    <div className="event-primary-content">
                      <Typography variant="subtitle1" className="event-title">
                        {event.title}
                      </Typography>
                      {event.tag && (
                        <Chip
                          size="small"
                          label={event.tag}
                          className="event-tag"
                        />
                      )}
                    </div>
                    <div className="event-secondary-content">
                      <div className="event-detail">
                        <Event className="detail-icon" />
                        <Typography variant="body2" className="detail-text">
                          {event.date}
                        </Typography>
                      </div>
                      <div className="event-detail">
                        <Place className="detail-icon" />
                        <Typography variant="body2" className="detail-text" noWrap>
                          {event.location}
                        </Typography>
                      </div>
                    </div>
                  </ListItemText>
                  <div className="event-actions">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="view event"
                      onClick={(e) => handleView(event.raw || event, e)}
                      className="action-button view-button"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="remove from saved"
                      onClick={(e) => handleRemove(event.raw || event, e)}
                      className="action-button delete-button"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </div>
                </ListItemButton>
              ))}
            </List>
            
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="pagination-controls">
                <div className="pagination-buttons">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-nav-button"
                  >
                    Prev
                  </Button>
                  <div className="pagination-numbers">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        size="small"
                        variant={pagination.page === page ? 'contained' : 'outlined'}
                        onClick={() => onPageChange && onPageChange(page)}
                        className={`pagination-number ${pagination.page === page ? 'active' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="pagination-nav-button"
                  >
                    Next
                  </Button>
                </div>
                <CustomDropdown
                  value={pagination.limit}
                  onChange={(val) => onPerPageChange && onPerPageChange(Number(val))}
                  options={[
                    { value: 6, label: '6 per page' },
                    { value: 12, label: '12 per page' },
                    { value: 18, label: '18 per page' },
                    { value: 24, label: '24 per page' },
                    { value: 36, label: '36 per page' },
                    { value: 48, label: '48 per page' },
                  ]}
                  placeholder="Select per page"
                  size="sm"
                />
              </div>
            )}
          </>
        )}
      </Paper>
    </div>
  );
};

export default SavedEventsList;