import React from 'react';
import { 
  FaMusic, 
  FaGlassCheers, 
  FaPalette, 
  FaCalendarAlt,
  FaHeart,
  FaGamepad,
  FaBriefcase,
  FaUtensils,
  FaMicrochip,
  FaGlobeAmericas,
  FaUsers 
} from 'react-icons/fa';
import './category.css';

const CategoryFilter = ({ activeCategory, setActiveCategory }) => {
  const categories = [
    { id: 'all', label: 'All', icon: <FaGlobeAmericas /> },
    { id: 'music', label: 'Music', icon: <FaMusic /> },
    { id: 'conference', label: 'Conference', icon: <FaUsers /> },
    { id: 'Entertainment', label: 'Entertainment', icon: <FaPalette /> },
    { id: 'holidays', label: 'Holidays', icon: <FaCalendarAlt /> },
    { id: 'dating', label: 'Dating', icon: <FaHeart /> },
    { id: 'Sports', label: 'Sports', icon: <FaGamepad /> },
    { id: 'business', label: 'Business', icon: <FaBriefcase /> },
    { id: 'food-drink', label: 'Food & Drink', icon: <FaUtensils /> },
    { id: 'technology', label: 'Technology', icon: <FaMicrochip /> }
  ];

  return (
    <div className="category-filter-container">
      <div className="category-scroll-wrapper">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;