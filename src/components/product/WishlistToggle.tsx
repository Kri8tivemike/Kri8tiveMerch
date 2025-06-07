import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addToWishlist, removeFromWishlist, getUserWishlist } from '../../services/profile.service';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';

interface WishlistToggleProps {
  productId: string;
  productName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WishlistToggle({ 
  productId, 
  productName,
  size = 'md',
  className = ''
}: WishlistToggleProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Icon size based on the size prop
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Button padding based on the size prop
  const buttonPadding = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  // Check if product is in wishlist when component mounts
  useEffect(() => {
    // Only check wishlist status if user is logged in
    if (user) {
      checkWishlistStatus();
    }
  }, [user, productId]);

  // Check if this product is in the user's wishlist
  const checkWishlistStatus = async () => {
    if (!user) return;
    
    try {
      const wishlist = await getUserWishlist();
      
      // Find this product in the wishlist 
      // Note that getUserWishlist will now filter out products that don't exist
      const wishlistItem = wishlist.find(item => 
        item.product_id === productId || 
        (item.product && item.product.$id === productId)
      );
      
      if (wishlistItem) {
        setIsInWishlist(true);
        // Support both Appwrite ($id) and legacy (id) document IDs
        setWishlistItemId(wishlistItem.$id || wishlistItem.id);
      } else {
        setIsInWishlist(false);
        setWishlistItemId(null);
      }
    } catch (error) {
      // We already added error handling to the service to return empty array for permission errors
      // Just log the error here and continue, don't disrupt the UI
      console.error('Error checking wishlist status:', error);
      setIsInWishlist(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      if (isInWishlist && wishlistItemId) {
        // Remove from wishlist
        await removeFromWishlist(wishlistItemId);
        setIsInWishlist(false);
        setWishlistItemId(null);
        
        toast({
          title: "Removed from Wishlist",
          description: `${productName} has been removed from your wishlist`,
        });
      } else {
        try {
          // Add to wishlist
          await addToWishlist(productId);
          setIsInWishlist(true);
          
          // Refresh wishlist to get the new item ID
          await checkWishlistStatus();
          
          toast({
            title: "Added to Wishlist",
            description: `${productName} has been added to your wishlist`,
          });
        } catch (addError: any) {
          // Special handling for product not found error
          if (addError.code === 404 || addError.message?.includes('could not be found')) {
            toast({
              title: "Product Not Available",
              description: "This product is no longer available in our store",
              variant: "destructive",
            });
            return;
          }
          // Re-throw for general error handling
          throw addError;
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isProcessing}
      className={`rounded-full shadow-md transition-all ${buttonPadding[size]}
        ${isInWishlist 
          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
          : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={`${iconSizes[size]} ${isInWishlist ? 'fill-current' : ''}`} 
      />
    </button>
  );
} 