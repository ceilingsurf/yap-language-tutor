import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('auto'); // 'auto', 'light', 'dark'
  const [effectiveTheme, setEffectiveTheme] = useState('light');

  console.log('🔍 DEBUG ThemeContext render:', { themeMode, effectiveTheme });

  // Get system preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('yap-theme-mode');
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const applyTheme = () => {
      const theme = themeMode === 'auto' ? getSystemTheme() : themeMode;
      setEffectiveTheme(theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes when in auto mode
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themeMode]);

  const setTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('yap-theme-mode', mode);
  };

  const value = {
    themeMode,
    effectiveTheme,
    setTheme,
    isDark: effectiveTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
