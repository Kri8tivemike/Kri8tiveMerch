import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeProvider';

export default function Hero() {
  const { theme } = useTheme();
  
  return (
    <div className="relative min-h-screen">
      {/* Background Image Container */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b"
          alt="T-shirt background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40"></div>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Hero Text */}
            <h1 className="text-white font-bold">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3">
                Premium Blank Tees
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary-orange">
                & Custom Printing
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl">
              Elevate your style with our premium blank t-shirts and state-of-the-art customization services.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link
                to="/shop"
                className="btn btn-primary inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-medium rounded-md hover:shadow-lg transition-all duration-200"
              >
                Shop Collection
              </Link>
              <Link
                to="/customize"
                className="btn btn-outline inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-medium rounded-md hover:shadow-lg transition-all duration-200"
              >
                Start Designing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}