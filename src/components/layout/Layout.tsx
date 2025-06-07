import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { Toaster } from '../../components/ui/Toaster';
import { useTheme } from '../../contexts/ThemeProvider';

export default function Layout() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col bg-white dark:bg-dark-background transition-colors duration-200`}>
      <Navbar />
      <main className="flex-grow pt-16 pb-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}