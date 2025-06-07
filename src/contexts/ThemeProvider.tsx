import React, { createContext, useState, useEffect, useContext } from 'react';
import { Theme as RadixTheme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default for SSR
  });

  // Apply theme class to document element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Remove both classes first
      root.classList.remove('light', 'dark');
      
      // Add the current theme class
      root.classList.add(theme);
      
      // Store preference
      localStorage.setItem('theme', theme);
      
      // Log for debugging
      console.log(`Theme set to: ${theme}`);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log(`Theme toggled to: ${newTheme}`);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <RadixTheme 
        appearance={theme} 
        accentColor="orange"
        grayColor={theme === 'light' ? 'gray' : 'mauve'}
        scaling="100%"
        radius="medium"
      >
        {children}
      </RadixTheme>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 