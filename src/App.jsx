import React from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Auth from './components/Auth';
import LanguageTutor from './components/LanguageTutor';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const App = () => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  // Debug logging
  console.log('🔍 DEBUG App.jsx render:', { user: !!user, loading, isDark });

  if (loading) {
    console.log('🔍 DEBUG: Showing loading screen');
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}
        style={{ backgroundColor: '#10b981' }} // DEBUG: Force visible green background
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-dark-text-secondary' : 'text-gray-600'} style={{ color: 'white', fontSize: '24px' }}>
            DEBUG: LOADING...
          </p>
        </div>
      </div>
    );
  }

  console.log('🔍 DEBUG: Rendering', user ? 'LanguageTutor' : 'Auth');
  return (
    <>
      {user ? <LanguageTutor /> : <Auth />}
      <OfflineIndicator />
      <PWAInstallPrompt />
    </>
  );
};

export default App;
