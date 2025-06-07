import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeProvider';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  const handleToggle = () => {
    toggleTheme();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button 
      className={`
        relative inline-flex items-center justify-center w-10 h-10 rounded-full 
        transition-all duration-300 
        ${theme === 'dark' 
          ? 'bg-[#121212] text-[#e98003] hover:bg-[#111827] hover:text-[#e98003] border border-[#121212]' 
          : 'bg-gray-100 text-[#e98003] hover:bg-gray-200 hover:text-[#e98003]'}
      `}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}; 