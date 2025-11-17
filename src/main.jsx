import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { registerServiceWorker } from './utils/registerSW.js';
import './index.css';

// Debug: Check environment variables
console.log('🔍 DEBUG: main.jsx loaded');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Using fallback');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Using fallback');

// Register service worker for PWA
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
