import React from 'react';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeProvider';
import { Moon, Sun, Check } from 'lucide-react';

export const ThemeTest = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="card max-w-4xl mx-auto my-8 p-8">
      <h2 className="text-2xl font-bold mb-6 text-primary-gold">Theme System Test</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Current theme: <span className="font-bold">{theme}</span>
            </p>
            <div className="flex space-x-4 mt-3">
              <button 
                onClick={() => theme === 'dark' || toggleTheme()} 
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                  theme === 'light' 
                    ? 'bg-primary-gold text-black font-medium' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
                {theme === 'light' && <Check className="w-4 h-4 ml-1" />}
              </button>
              
              <button 
                onClick={() => theme === 'light' && toggleTheme()} 
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                  theme === 'dark' 
                    ? 'bg-primary-gold text-black font-medium' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
                {theme === 'dark' && <Check className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </div>
          
          <Button 
            variant={theme === 'light' ? 'secondary' : 'primary'} 
            onClick={toggleTheme}
            className="hover-scale"
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <h3 className="text-lg font-medium mb-4 text-primary-gold">Primary Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-primary-gold rounded-md flex items-center justify-center shadow-md">
                <span className="text-black font-medium">Gold</span>
              </div>
              <div className="aspect-square bg-primary-emerald rounded-md flex items-center justify-center shadow-md">
                <span className="text-white font-medium">Emerald</span>
              </div>
              <div className="aspect-square bg-primary-gold-light rounded-md flex items-center justify-center shadow-md">
                <span className="text-black font-medium">Gold Light</span>
              </div>
              <div className="aspect-square bg-primary-emerald-light rounded-md flex items-center justify-center shadow-md">
                <span className="text-black font-medium">Emerald Light</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-primary-gold">Theme Elements</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-light-surface dark:bg-dark-surface shadow-md">
                <p className="mb-2 font-medium">Surface Color</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This demonstrates the surface color in the current theme.</p>
              </div>
              
              <div className="p-4 rounded-md bg-light-background dark:bg-dark-background border border-gray-200 dark:border-gray-700">
                <p className="mb-2 font-medium">Background Color</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This demonstrates the background color in the current theme.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 