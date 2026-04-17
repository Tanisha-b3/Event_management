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
  FaUsers,
  FaTheaterMasks,
  FaGraduationCap,
  FaShoppingBag
} from 'react-icons/fa';
import './category.css';

const CategoryFilter = ({ activeCategory, setActiveCategory }) => {
  const categories = [
    { id: 'all', label: 'All Events', icon: <FaGlobeAmericas /> },
    { id: 'Music', label: 'Music', icon: <FaMusic /> },
    { id: 'Conference', label: 'Conference', icon: <FaUsers /> },
    { id: 'Entertainment', label: 'Entertainment', icon: <FaPalette /> },
    { id: 'Holiday', label: 'Holidays', icon: <FaCalendarAlt /> },
    { id: 'Meetup', label: 'Dating', icon: <FaHeart /> },
    { id: 'Sports', label: 'Sports', icon: <FaGamepad /> },
    { id: 'Business', label: 'Business', icon: <FaBriefcase /> },
    { id: 'Food', label: 'Food & Drink', icon: <FaUtensils /> },
    { id: 'Technology', label: 'Technology', icon: <FaMicrochip /> },
    { id: 'Festival', label: 'Festival', icon: <FaTheaterMasks /> },
    { id: 'Education', label: 'Education', icon: <FaGraduationCap /> },
    { id: 'Art', label: 'Art', icon: <FaPalette /> },
    { id: 'Workshop', label: 'Workshop', icon: <FaMicrochip /> },
  ];

  return (
    <div className="category-filter-container-k">
      <div className="category-scroll-wrapper-k">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn-k ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
            aria-label={`Filter by ${category.label}`}
            title={`Show ${category.label} events`}
          >
            <div className="category-icon-k">{category.icon}</div>
            <span className="category-label-k">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;