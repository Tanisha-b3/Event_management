import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Paper,
  Typography,
  Slider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, clearFilters } from '../store/slices/eventSlice';

const categories = [
  'All',
  'Music',
  'Sports',
  'Arts & Theatre',
  'Food & Drink',
  'Business',
  'Technology',
  'Health & Wellness',
  'Education',
  'Community',
];

const sortOptions = [
  { value: 'date-asc', label: 'Date (Earliest)' },
  { value: 'date-desc', label: 'Date (Latest)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'popularity', label: 'Most Popular' },
];

const EventFilters = ({ expanded = true, variant = 'sidebar' }) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.events);
  const [showFilters, setShowFilters] = React.useState(expanded);
  const [priceRange, setPriceRange] = React.useState([0, 500]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value === 'All' ? '' : value }));
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handlePriceCommit = () => {
    dispatch(setFilters({ minPrice: priceRange[0], maxPrice: priceRange[1] }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setPriceRange([0, 500]);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== ''
  ).length;

  if (variant === 'horizontal') {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category || 'All'}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Date"
            value={filters.date || ''}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            size="small"
            label="Location"
            placeholder="City or venue"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            sx={{ minWidth: 150 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sort || 'date-asc'}
              label="Sort By"
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {activeFiltersCount > 0 && (
            <Button
              startIcon={<Clear />}
              onClick={handleClearFilters}
              color="error"
              size="small"
            >
              Clear ({activeFiltersCount})
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          <Typography variant="h6">Filters</Typography>
          {activeFiltersCount > 0 && (
            <Chip label={activeFiltersCount} size="small" color="primary" />
          )}
        </Box>
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Category */}
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category || 'All'}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date */}
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Date"
            value={filters.date || ''}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Location */}
          <TextField
            fullWidth
            size="small"
            label="Location"
            placeholder="City or venue"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />

          {/* Price Range */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              onChangeCommitted={handlePriceCommit}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              step={10}
            />
          </Box>

          {/* Sort */}
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sort || 'date-asc'}
              label="Sort By"
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(filters).map(
                  ([key, value]) =>
                    value && (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        onDelete={() => handleFilterChange(key, '')}
                      />
                    )
                )}
              </Box>
            </Box>
          )}

          {/* Clear Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
          >
            Clear All Filters
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default EventFilters;
