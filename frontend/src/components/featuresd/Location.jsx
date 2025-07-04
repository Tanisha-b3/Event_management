import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiMapPin } from 'react-icons/fi';

const Location = ({ events, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const uniqueLocations = [...new Set(events.map(event => event.location))];

  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = uniqueLocations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, events]);

  const handleSelect = (location) => {
    setSearchTerm(location);
    onSearch(location);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className="location-search-bar1">
      <div className="search-input-container3">
        {/* <FiSearch className="search-icon" /> */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onSearch(e.target.value);
          }}
          onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search by location..."
          className="search-input"
          onClick={clearSearch}
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((location, index) => (
            <li 
              key={index}
              onClick={() => handleSelect(location)}
              className="suggestion-item"
            >
              <FiMapPin className="suggestion-icon" />
              {location}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Location;