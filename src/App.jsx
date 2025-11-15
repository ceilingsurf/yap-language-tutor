import React from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import LanguageTutor from './components/LanguageTutor';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
