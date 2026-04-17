import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  Popper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  ClickAwayListener,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close,
  Event,
  LocationOn,
  Category,
  TrendingUp,
} from '@mui/icons-material';
import { setFilters } from '../store/slices/eventSlice';
import { debounce } from 'lodash';

const popularSearches = [
  { text: 'Music Concerts', icon: <TrendingUp /> },
  { text: 'Tech Conferences', icon: <TrendingUp /> },
  { text: 'Food Festivals', icon: <TrendingUp /> },
  { text: 'Sports Events', icon: <TrendingUp /> },
];

const SearchBar = ({ fullWidth = false, placeholder = 'Search events...' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [anchorEl, setAnchorEl] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      if (searchQuery.length > 2) {
        // Simulated suggestions - replace with actual API call
        setSuggestions([
          { type: 'event', text: `${searchQuery} concert`, icon: <Event /> },
          { type: 'location', text: `Events in ${searchQuery}`, icon: <LocationOn /> },
          { type: 'category', text: `${searchQuery} festivals`, icon: <Category /> },
        ]);
      } else {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleFocus = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecent = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));

      // Update Redux state
      dispatch(setFilters({ search: searchQuery }));

      // Navigate to discover page with search param
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      handleClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    handleSearch(text);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const open = Boolean(anchorEl);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <Paper
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 3,
            width: fullWidth ? '100%' : { xs: '100%', sm: 400 },
            boxShadow: open ? 3 : 1,
            transition: 'box-shadow 0.2s',
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyPress={handleKeyPress}
            sx={{ flex: 1 }}
            inputProps={{ 'aria-label': 'search events' }}
          />
          {query && (
            <IconButton size="small" onClick={handleClear}>
              <Close fontSize="small" />
            </IconButton>
          )}
          <IconButton color="primary" onClick={() => handleSearch()}>
            <SearchIcon />
          </IconButton>
        </Paper>

        <Popper
          open={open && (suggestions.length > 0 || recentSearches.length > 0)}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          style={{ width: anchorEl?.offsetWidth, zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }}>
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
                      Suggestions
                    </Typography>
                    <List dense>
                      {suggestions.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleSuggestionClick(suggestion.text)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {suggestion.icon}
                          </ListItemIcon>
                          <ListItemText primary={suggestion.text} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && !query && (
                  <>
                    <Box sx={{ px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Recent Searches
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ cursor: 'pointer' }}
                        onClick={clearRecentSearches}
                      >
                        Clear
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {recentSearches.map((search, index) => (
                        <Chip
                          key={index}
                          label={search}
                          size="small"
                          onClick={() => handleSuggestionClick(search)}
                          onDelete={() => {
                            const newRecent = recentSearches.filter((_, i) => i !== index);
                            setRecentSearches(newRecent);
                            localStorage.setItem('recentSearches', JSON.stringify(newRecent));
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}

                {/* Popular Searches */}
                {!query && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
                      Popular Searches
                    </Typography>
                    <List dense>
                      {popularSearches.map((item, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleSuggestionClick(item.text)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.text} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
