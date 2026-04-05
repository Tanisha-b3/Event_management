import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiX, FiMapPin } from 'react-icons/fi';
import { getLocations } from '../constants';
import './Location.css';

const Location = ({ events = [], onSearch = () => {}, placeholder = 'Search by location...', className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const uniqueLocations = useMemo(() => {
    const locations = getLocations(events)
      .filter(Boolean)
      .map((loc) => loc.trim())
      .filter((loc) => loc.toLowerCase() !== 'all');
    return [...new Set(locations)];
  }, [events]);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = uniqueLocations.filter((location) =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, uniqueLocations]);

  const handleSelect = (location) => {
    setSearchTerm(location);
    onSearch(location);
    setShowSuggestions(false);
  };

  const handleInputChange = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`location-search ${className}`.trim()}>
      <div className="location-search__input-wrap">
        <FiSearch className="location-search__icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="location-search__input"
        />
        {searchTerm && (
          <button
            type="button"
            className="location-search__clear"
            onClick={clearSearch}
            aria-label="Clear location search"
          >
            <FiX />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="location-search__dropdown">
          {suggestions.map((location) => (
            <li
              key={location}
              onMouseDown={() => handleSelect(location)}
              className="location-search__item"
            >
              <FiMapPin className="location-search__item-icon" />
              <span>{location}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Location;
