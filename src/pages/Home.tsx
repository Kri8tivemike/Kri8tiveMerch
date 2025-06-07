import Hero from '../components/home/Hero';
import Benefits from '../components/home/Benefits';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CustomizeCTA from '../components/home/CustomizeCTA';
import Newsletter from '../components/home/Newsletter';
import { ImagePerformanceMonitor } from '../components/common/ImagePerformanceMonitor';
import { useTheme } from '../contexts/ThemeProvider';
import { Phone, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const phoneNumber = '+2348147953648';
  const whatsappMessage = encodeURIComponent('Hello! I\'m interested in your custom t-shirt printing services. Can you help me?');
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${phoneNumber.replace('+', '')}?text=${whatsappMessage}`, '_blank');
  };
  
  const handleCallClick = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };
  
  return (
    <div className="min-h-screen">
      <Hero />
      <Benefits />
      <FeaturedProducts />
      <CustomizeCTA />
      <Newsletter />
      
      {/* Floating Contact Buttons */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end space-y-3">
          {/* Expanded Action Buttons */}
          {isExpanded && (
            <div className="flex flex-col space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              {/* WhatsApp Button */}
              <button
                onClick={handleWhatsAppClick}
                className="group flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium whitespace-nowrap">WhatsApp Chat</span>
              </button>
              
              {/* Call Button */}
              <button
                onClick={handleCallClick}
                className="group flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                aria-label="Call us"
              >
                <Phone className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium whitespace-nowrap">Call Now</span>
              </button>
            </div>
          )}
          
          {/* Main Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isExpanded 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-primary-orange hover:bg-primary-orange-dark'
            }`}
            aria-label={isExpanded ? 'Close contact menu' : 'Open contact menu'}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
            
            {/* Pulse Animation for Main Button */}
            {!isExpanded && (
              <div className="absolute inset-0 rounded-full bg-primary-orange animate-ping opacity-20"></div>
            )}
          </button>
        </div>
        
        {/* Contact Info Tooltip */}
        {isExpanded && (
          <div className="absolute bottom-0 right-16 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs whitespace-nowrap animate-in slide-in-from-right-1 duration-200">
            <div className="font-medium">Need Help?</div>
            <div className="text-gray-600 dark:text-gray-400">{phoneNumber}</div>
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-white dark:border-l-gray-800"></div>
          </div>
        )}
      </div>
      
      {/* AVIF Performance Monitor (Development Only) */}
      <ImagePerformanceMonitor />
    </div>
  );
}