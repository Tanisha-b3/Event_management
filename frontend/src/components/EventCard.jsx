import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  FavoriteBorder,
  Favorite,
  Share,
  ConfirmationNumber,
  Visibility,
  TrendingUp,
} from '@mui/icons-material';
import { addToCartLocal, addToCartAsync } from '../store/slices/cartSlice';
import useAuth from '../store/hooks/useAuth';
import socketService from '../utils/socketService';

const EventCard = ({
  event,
  variant = 'default', // 'default', 'compact', 'featured'
  onFavorite,
  isFavorite = false,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useAuth();

  const {
    _id,
    title,
    description,
    image,
    date,
    location,
    category,
    price,
    ticketsAvailable,
    views,
    likes,
    ticketsSold,
    trendingScore,
  } = event;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleViewDetails = () => {
    navigate(`/event/${_id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const item = {
      id: `${_id}-General`,
      eventId: _id,
      eventName: title,
      eventTitle: title,
      ticketType: 'General Admission',
      price: price || 0,
      quantity: 1,
      eventDate: formattedDate,
      eventImage: image || image,
      eventLocation: location,
    };
    if (isAuthenticated && token) {
      dispatch(addToCartAsync(item));
    } else {
      dispatch(addToCart(item));
    }
    socketService.emitCartAdd(item);
    toast.success(`"${title}" added to cart!`);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: `${window.location.origin}/event/${_id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/event/${_id}`);
    }
  };

  if (variant === 'compact') {
    return (
      <Card
        sx={{
          display: 'flex',
          cursor: 'pointer',
          '&:hover': { boxShadow: 4 },
          transition: 'box-shadow 0.2s',
        }}
        onClick={handleViewDetails}
      >
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover' }}
          image={image || '/placeholder-event.jpg'}
          alt={title}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent sx={{ flex: '1 0 auto', py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <CalendarToday fontSize="small" />
              <Typography variant="caption">{formattedDate}</Typography>
            </Box>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {price > 0 ? `$${price}` : 'Free'}
            </Typography>
          </CardContent>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
      }}
      onClick={handleViewDetails}
    >
      {/* Category Badge */}
      {category && (
        <Chip
          label={category}
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
          }}
        />
      )}

      {/* Favorite Button */}
      {showActions && (
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { backgroundColor: 'white' },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(_id);
          }}
        >
          {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
        </IconButton>
      )}

      <CardMedia
        component="img"
        height={variant === 'featured' ? 240 : 180}
        image={image || '/placeholder-event.jpg'}
        alt={title}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant={variant === 'featured' ? 'h6' : 'subtitle1'}
          fontWeight="bold"
          gutterBottom
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <LocationOn fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" noWrap>
            {location || 'TBA'}
          </Typography>
        </Box>

        {variant === 'featured' && description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h6" color="primary" fontWeight="bold">
            {price > 0 ? `$${price}` : 'Free'}
          </Typography>
          {ticketsAvailable !== undefined && (
            <Chip
              icon={<ConfirmationNumber />}
              label={ticketsAvailable > 0 ? `${ticketsAvailable} left` : 'Sold out'}
              size="small"
              color={ticketsAvailable > 10 ? 'success' : ticketsAvailable > 0 ? 'warning' : 'error'}
              variant="outlined"
            />
          )}

        {(views || likes || ticketsSold || trendingScore) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {views || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Favorite sx={{ fontSize: 14, color: 'error.main' }} />
              <Typography variant="caption" color="text.secondary">
                {likes || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ConfirmationNumber sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                {ticketsSold || 0}
              </Typography>
            </Box>
            {trendingScore > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main" fontWeight="bold">
                  {trendingScore.toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {showActions && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            size="small"
            variant="contained"
            fullWidth
            startIcon={<ConfirmationNumber />}
            onClick={handleAddToCart}
            disabled={ticketsAvailable === 0}
          >
            {ticketsAvailable === 0 ? 'Sold Out' : 'Add to Cart'}
          </Button>
          <Tooltip title="Share">
            <IconButton size="small" onClick={handleShare}>
              <Share />
            </IconButton>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
};

export default EventCard;
