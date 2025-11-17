import React from 'react';
import { MessageSquare, BookOpen, User, Library } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Bottom Navigation Bar for Mobile
 * Displays primary navigation tabs for mobile devices
 */
const BottomNavigation = ({ activeView, onViewChange }) => {
  const { isDark } = useTheme();

  const navItems = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      ariaLabel: 'Chat with tutor'
    },
    {
      id: 'vocabulary',
      label: 'Vocabulary',
      icon: Library,
      ariaLabel: 'View vocabulary'
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: BookOpen,
      ariaLabel: 'Practice flashcards'
    }
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 border-t z-40 safe-area-pb md:hidden ${
        isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors ${
                isActive
                  ? isDark ? 'text-dark-accent' : 'text-blue-600'
                  : isDark
                    ? 'text-dark-text-secondary hover:text-dark-text active:bg-dark-bg'
                    : 'text-gray-600 hover:text-gray-800 active:bg-gray-100'
              }`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`h-6 w-6 mb-1 ${isActive ? 'stroke-2' : ''}`}
                aria-hidden="true"
              />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
