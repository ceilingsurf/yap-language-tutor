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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-dark-text-secondary' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <LanguageTutor /> : <Auth />}
      <OfflineIndicator />
      <PWAInstallPrompt />
    </>
  );
};

export default App;
