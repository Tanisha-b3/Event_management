import { createSlice } from '@reduxjs/toolkit';

// Load theme from localStorage with error handling
const loadThemeFromStorage = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
};

// Load primary color from localStorage
const loadPrimaryColorFromStorage = () => {
  try {
    return localStorage.getItem('primaryColor') || '#6366f1';
  } catch {
    return '#6366f1';
  }
};

// Load font size from localStorage
const loadFontSizeFromStorage = () => {
  try {
    return localStorage.getItem('fontSize') || 'medium';
  } catch {
    return 'medium';
  }
};

// Load color scheme from localStorage
const loadColorSchemeFromStorage = () => {
  try {
    return localStorage.getItem('colorScheme') || 'default';
  } catch {
    return 'default';
  }
};

// Load reduced motion preference
const loadReducedMotionFromStorage = () => {
  try {
    const saved = localStorage.getItem('reducedMotion');
    if (saved !== null) return saved === 'true';
    // Check system preference
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

// Load high contrast mode preference
const loadHighContrastFromStorage = () => {
  try {
    const saved = localStorage.getItem('highContrast');
    if (saved !== null) return saved === 'true';
    return false;
  } catch {
    return false;
  }
};

// Apply theme to document
const applyThemeToDocument = (mode, primaryColor, fontSize, colorScheme, highContrast) => {
  // Apply dark mode class
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
  }
  
  // Apply primary color CSS variable
  document.documentElement.style.setProperty('--primary-color', primaryColor);
  
  // Generate and apply color shades
  const shades = generateColorShades(primaryColor);
  Object.entries(shades).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--primary-${key}`, value);
  });
  
  // Apply font size
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
    'x-large': '20px'
  };
  document.documentElement.style.fontSize = fontSizeMap[fontSize] || '16px';
  document.body.style.fontSize = fontSizeMap[fontSize] || '16px';
  
  // Apply high contrast mode
  if (highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  
  // Apply color scheme classes
  document.body.classList.remove('color-scheme-default', 'color-scheme-purple', 'color-scheme-blue', 'color-scheme-green', 'color-scheme-orange');
  document.body.classList.add(`color-scheme-${colorScheme}`);
};

// Generate color shades from primary color
const generateColorShades = (hex) => {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Generate shades with different opacities
  return {
    '50': `rgba(${r}, ${g}, ${b}, 0.05)`,
    '100': `rgba(${r}, ${g}, ${b}, 0.1)`,
    '200': `rgba(${r}, ${g}, ${b}, 0.2)`,
    '300': `rgba(${r}, ${g}, ${b}, 0.3)`,
    '400': `rgba(${r}, ${g}, ${b}, 0.4)`,
    '500': hex,
    '600': `rgba(${r}, ${g}, ${b}, 0.8)`,
    '700': `rgba(${r}, ${g}, ${b}, 0.9)`,
    '800': `rgba(${r}, ${g}, ${b}, 0.95)`,
    '900': `rgba(${r}, ${g}, ${b}, 1)`,
  };
};

// Predefined color schemes
export const colorSchemes = {
  default: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    name: 'Default Purple'
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    accent: '#c084fc',
    name: 'Purple Dream'
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#06b6d4',
    name: 'Ocean Blue'
  },
  green: {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#059669',
    name: 'Emerald Green'
  },
  orange: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    accent: '#ef4444',
    name: 'Sunset Orange'
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#db2777',
    name: 'Pink Passion'
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    accent: '#0891b2',
    name: 'Cyan Light'
  },
  indigo: {
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#818cf8',
    name: 'Indigo Night'
  }
};

const initialState = {
  mode: loadThemeFromStorage(),
  primaryColor: loadPrimaryColorFromStorage(),
  fontSize: loadFontSizeFromStorage(),
  colorScheme: loadColorSchemeFromStorage(),
  reducedMotion: loadReducedMotionFromStorage(),
  highContrast: loadHighContrastFromStorage(),
  sidebarCollapsed: false,
  density: 'comfortable', // compact, comfortable, spacious
  animationsEnabled: true,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    setPrimaryColor: (state, action) => {
      state.primaryColor = action.payload;
      localStorage.setItem('primaryColor', state.primaryColor);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
      localStorage.setItem('fontSize', state.fontSize);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    setColorScheme: (state, action) => {
      const scheme = action.payload;
      state.colorScheme = scheme;
      state.primaryColor = colorSchemes[scheme]?.primary || colorSchemes.default.primary;
      localStorage.setItem('colorScheme', scheme);
      localStorage.setItem('primaryColor', state.primaryColor);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    setReducedMotion: (state, action) => {
      state.reducedMotion = action.payload;
      localStorage.setItem('reducedMotion', state.reducedMotion);
      if (state.reducedMotion) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    },
    
    setHighContrast: (state, action) => {
      state.highContrast = action.payload;
      localStorage.setItem('highContrast', state.highContrast);
      applyThemeToDocument(
        state.mode, 
        state.primaryColor, 
        state.fontSize, 
        state.colorScheme,
        state.highContrast
      );
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    
    setDensity: (state, action) => {
      state.density = action.payload;
      localStorage.setItem('density', state.density);
      document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
      document.body.classList.add(`density-${state.density}`);
    },
    
    setAnimationsEnabled: (state, action) => {
      state.animationsEnabled = action.payload;
      localStorage.setItem('animationsEnabled', state.animationsEnabled);
      if (!state.animationsEnabled) {
        document.body.classList.add('animations-disabled');
      } else {
        document.body.classList.remove('animations-disabled');
      }
    },
    
    resetTheme: (state) => {
      state.mode = 'light';
      state.primaryColor = '#6366f1';
      state.fontSize = 'medium';
      state.colorScheme = 'default';
      state.reducedMotion = false;
      state.highContrast = false;
      state.density = 'comfortable';
      state.animationsEnabled = true;
      
      localStorage.setItem('theme', 'light');
      localStorage.setItem('primaryColor', '#6366f1');
      localStorage.setItem('fontSize', 'medium');
      localStorage.setItem('colorScheme', 'default');
      localStorage.setItem('reducedMotion', 'false');
      localStorage.setItem('highContrast', 'false');
      localStorage.setItem('density', 'comfortable');
      localStorage.setItem('animationsEnabled', 'true');
      
      applyThemeToDocument('light', '#6366f1', 'medium', 'default', false);
      document.body.classList.remove('reduced-motion', 'high-contrast', 'animations-disabled');
    },
  },
});

// Export actions
export const { 
  toggleTheme, 
  setTheme, 
  setPrimaryColor, 
  setFontSize,
  setColorScheme,
  setReducedMotion,
  setHighContrast,
  toggleSidebar,
  setSidebarCollapsed,
  setDensity,
  setAnimationsEnabled,
  resetTheme
} = themeSlice.actions;

// Export selectors
export const selectTheme = (state) => state.theme;
export const selectThemeMode = (state) => state.theme.mode;
export const selectPrimaryColor = (state) => state.theme.primaryColor;
export const selectFontSize = (state) => state.theme.fontSize;
export const selectColorScheme = (state) => state.theme.colorScheme;
export const selectReducedMotion = (state) => state.theme.reducedMotion;
export const selectHighContrast = (state) => state.theme.highContrast;
export const selectSidebarCollapsed = (state) => state.theme.sidebarCollapsed;
export const selectDensity = (state) => state.theme.density;
export const selectAnimationsEnabled = (state) => state.theme.animationsEnabled;

// Initialize theme on app start
export const initializeTheme = () => {
  const mode = loadThemeFromStorage();
  const primaryColor = loadPrimaryColorFromStorage();
  const fontSize = loadFontSizeFromStorage();
  const colorScheme = loadColorSchemeFromStorage();
  const highContrast = loadHighContrastFromStorage();
  const reducedMotion = loadReducedMotionFromStorage();
  
  applyThemeToDocument(mode, primaryColor, fontSize, colorScheme, highContrast);
  
  // Apply reduced motion
  if (reducedMotion) {
    document.body.classList.add('reduced-motion');
  }
  
  // Apply high contrast
  if (highContrast) {
    document.body.classList.add('high-contrast');
  }
  
  // Apply density
  const density = localStorage.getItem('density') || 'comfortable';
  document.body.classList.add(`density-${density}`);
  
  // Apply animations setting
  const animationsEnabled = localStorage.getItem('animationsEnabled') !== 'false';
  if (!animationsEnabled) {
    document.body.classList.add('animations-disabled');
  }
};

export default themeSlice.reducer;