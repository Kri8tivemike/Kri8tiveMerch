import { Menu, X, User, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../hooks/use-toast';
import { useTheme } from '../contexts/ThemeProvider';
import { ThemeToggle } from './ui/ThemeToggle';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Get the total number of items in the cart
  const cartItemCount = itemCount;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const renderUserMenu = () => {
    if (!user) {
      return (
        <>
          <Link
            to="/login"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Register
          </Link>
        </>
      );
    }

    return (
      <>
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
          Signed in as {profile?.full_name || user.email}
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800"></div>
        
        <Link
          to="/account"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setIsUserMenuOpen(false)}
        >
          My Account
        </Link>

        {(profile?.role === 'shop_manager' || profile?.role === 'super_admin') && (
          <Link
            to="/shop-manager"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Shop Manager
          </Link>
        )}

        {profile?.role === 'super_admin' && (
          <Link
            to="/super-admin"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Super Admin
          </Link>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800"></div>
        
        <button
          onClick={() => {
            setIsUserMenuOpen(false);
            handleSignOut();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Sign Out
        </button>
      </>
    );
  };

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-dark-background border-b border-gray-200 dark:border-gray-800 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-primary-orange">
              KRI8TIVE
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/customize" className="nav-link">Customize</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            
            <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <ThemeToggle />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-orange dark:hover:text-primary-orange flex items-center space-x-1"
              >
                <User className="w-6 h-6" />
                {user && <span className="text-sm">{profile?.full_name?.split(' ')[0]}</span>}
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10">
                  {renderUserMenu()}
                </div>
              )}
            </div>

            <Link to="/cart" className="text-gray-700 dark:text-gray-300 hover:text-primary-orange dark:hover:text-primary-orange relative">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-emerald text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-dark-background">
            <Link 
              to="/" 
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              to="/customize" 
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Customize
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            
            <div className="flex items-center px-3 py-2">
              <span className="text-gray-700 dark:text-gray-300 mr-3">Theme:</span>
              <ThemeToggle />
            </div>
            
            {!user ? (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/account" 
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Account
                </Link>
                {(profile?.role === 'shop_manager' || profile?.role === 'super_admin') && (
                  <Link 
                    to="/shop-manager" 
                    className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Shop Manager
                  </Link>
                )}
                {profile?.role === 'super_admin' && (
                  <Link 
                    to="/super-admin" 
                    className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Super Admin
                  </Link>
                )}
                <button 
                  className="block w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign Out
                </button>
              </>
            )}

            <Link 
              to="/cart" 
              className="flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="bg-primary-emerald text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}