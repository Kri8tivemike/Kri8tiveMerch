import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Type, Image as ImageIcon, Square, Circle, Palette, 
  Upload, Download, Save, Trash2, Undo, Redo, Move, MousePointer,
  RotateCw, RotateCcw, ZoomIn, ZoomOut, Plus, Minus, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, Copy, Layers, Star, Eye, EyeOff, X, Cloud, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import imagekitOnlyService, { ImageKitUploadResult } from '../../services/imagekit-only.service';
import RichTextEditor from './RichTextEditor';
import { retryRequest } from '../../utils/retry';
import type { Product } from '../../types/product';
import { SafeImage } from '../common/SafeImage';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';

interface SimpleDesignCanvasProps {
  productId: string;
  productImage?: string;
  onDesignSave?: (designData: any) => void;
  width?: number;
  height?: number;
  isFullscreen?: boolean;
  onClose?: () => void;
}

interface DesignElement {
  id: string;
  type: 'text' | 'shape' | 'drawing' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  richContent?: string; // HTML content from Tiptap
  color: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  shapeType?: 'rectangle' | 'circle';
  strokeWidth?: number;
  rotation?: number;
  selected?: boolean;
  scale?: number;
  visible?: boolean;
  imageUrl?: string;
  imagekitFileId?: string;
  imageElement?: HTMLImageElement;
}

interface HistoryState {
  elements: DesignElement[];
  timestamp: number;
}

// Rich text rendering utility
const renderRichTextToCanvas = (
  ctx: CanvasRenderingContext2D, 
  htmlContent: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  scale: number = 1,
  baseFontSize: number = 16
) => {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.fontFamily = 'Inter, Arial, sans-serif';
  tempDiv.style.fontSize = `${baseFontSize}px`;
  tempDiv.style.lineHeight = '1.4';
  tempDiv.style.width = `${maxWidth}px`;
  document.body.appendChild(tempDiv);

  let currentY = y;
  const lineHeight = Math.max(baseFontSize * 1.4, 20);
  // baseFontSize is now passed as parameter

  // Set default canvas properties
  ctx.textBaseline = 'top';

  // Process each paragraph
  const paragraphs = tempDiv.querySelectorAll('p');
  
  if (paragraphs.length === 0) {
    // If no paragraphs, treat as single line with basic formatting
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    if (textContent.trim()) {
      ctx.font = `${baseFontSize}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(textContent, x, currentY);
    }
  } else {
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraphIndex > 0) {
        currentY += lineHeight * 0.3; // Add spacing between paragraphs
      }

      // Get paragraph alignment from style attribute
      const paragraphStyle = paragraph.getAttribute('style') || '';
      let textAlign = 'left';
      const alignMatch = paragraphStyle.match(/text-align:\s*(left|center|right)/);
      if (alignMatch) {
        textAlign = alignMatch[1];
      }

      // Process text runs within the paragraph
      const processTextRuns = (element: Element): Array<{text: string, styles: any}> => {
        const runs: Array<{text: string, styles: any}> = [];
        
        const traverse = (node: Node, inheritedStyles: any = {}) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text.trim()) {
              runs.push({ text, styles: { ...inheritedStyles } });
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            const style = element.getAttribute('style') || '';
            
            // Parse styles from the element
            const newStyles = { ...inheritedStyles };
            
            // Handle tag-based formatting
            if (tagName === 'strong' || tagName === 'b') newStyles.fontWeight = 'bold';
            if (tagName === 'em' || tagName === 'i') newStyles.fontStyle = 'italic';
            if (tagName === 'u') newStyles.textDecoration = 'underline';
            
            // Handle inline styles
            if (style.includes('font-weight: bold') || style.includes('font-weight:bold')) {
              newStyles.fontWeight = 'bold';
            }
            if (style.includes('font-style: italic') || style.includes('font-style:italic')) {
              newStyles.fontStyle = 'italic';
            }
            if (style.includes('text-decoration: underline') || style.includes('text-decoration:underline')) {
              newStyles.textDecoration = 'underline';
            }
            
            // Handle color
            const colorMatch = style.match(/color:\s*([^;]+)/);
            if (colorMatch) {
              newStyles.color = colorMatch[1].trim();
            }
            
                         // Handle font size
             const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
             if (fontSizeMatch) {
               newStyles.fontSize = parseInt(fontSizeMatch[1]);
             }
            
            // Process child nodes
            for (const childNode of Array.from(element.childNodes)) {
              traverse(childNode, newStyles);
            }
          }
        };
        
        traverse(element);
        return runs;
      };

      const textRuns = processTextRuns(paragraph);
      
      if (textRuns.length > 0) {
        // Calculate total width for alignment
        let totalWidth = 0;
        textRuns.forEach(run => {
          const fontSize = run.styles.fontSize || baseFontSize;
          const fontWeight = run.styles.fontWeight || 'normal';
          const fontStyle = run.styles.fontStyle || 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Inter, Arial, sans-serif`;
          totalWidth += ctx.measureText(run.text).width;
        });

        // Calculate starting X position based on alignment
        let startX = x;
        if (textAlign === 'center') {
          startX = x + (maxWidth - totalWidth) / 2;
        } else if (textAlign === 'right') {
          startX = x + maxWidth - totalWidth;
        }

        // Render each text run
        let currentX = startX;
        textRuns.forEach(run => {
          const fontSize = run.styles.fontSize || baseFontSize;
          const fontWeight = run.styles.fontWeight || 'normal';
          const fontStyle = run.styles.fontStyle || 'normal';
          const color = run.styles.color || '#000000';
          const textDecoration = run.styles.textDecoration;
          
          // Set font and color
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Inter, Arial, sans-serif`;
          ctx.fillStyle = color;
          
          // Draw text
          ctx.fillText(run.text, currentX, currentY);
          
          // Handle underline
          if (textDecoration === 'underline') {
            const textWidth = ctx.measureText(run.text).width;
            ctx.beginPath();
            ctx.moveTo(currentX, currentY + fontSize + 2);
            ctx.lineTo(currentX + textWidth, currentY + fontSize + 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          currentX += ctx.measureText(run.text).width;
        });
      }

      currentY += lineHeight;
    });
  }

  // Clean up
  document.body.removeChild(tempDiv);
};

export const SimpleDesignCanvas: React.FC<SimpleDesignCanvasProps> = ({
  productId,
  productImage,
  onDesignSave,
  width = 600,
  height = 400,
  isFullscreen = false,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Core state
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'text' | 'select' | 'shape' | 'move'>('select');
  const [brushSize, setBrushSize] = useState(2);
  const [fontSize, setFontSize] = useState(20);
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle'>('rectangle');
  
  // Element management
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [canvasCursor, setCanvasCursor] = useState('default');
  
  // Image cache to prevent reloading same images
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // Image registry to track all images by element ID for faster restoration
  const imageRegistry = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // History management for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // UI state
  const [productImageLoaded, setProductImageLoaded] = useState(false);
  const [showProductImage, setShowProductImage] = useState(true);
  const [designOpacity, setDesignOpacity] = useState(0.8);
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const [canvasRotation, setCanvasRotation] = useState(0);
  
  // Text editor state
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [textEditorValue, setTextEditorValue] = useState('');
  const [richTextContent, setRichTextContent] = useState('');
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [textFontSize, setTextFontSize] = useState(20);
  const [textFontWeight, setTextFontWeight] = useState<'normal' | 'bold'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  
  // ImageKit state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagekitConfigured, setImagekitConfigured] = useState(false);
  
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state to track saved design URLs for form submission
  const [savedDesignUrls, setSavedDesignUrls] = useState<string[]>([]);
  
  // State to trigger re-renders for saved files section
  const [savedFilesRefresh, setSavedFilesRefresh] = useState(0);

  // Function to get all design URLs for form submission
  const getDesignUrls = useCallback(() => {
    return savedDesignUrls;
  }, [savedDesignUrls]);

  // Expose getDesignUrls function to parent component
  useEffect(() => {
    if (onDesignSave) {
      // Pass the getDesignUrls function to parent
      onDesignSave({ getDesignUrls });
    }
  }, [onDesignSave]); // Remove getDesignUrls from dependencies to avoid calling on every URL change

  // Adjust canvas dimensions for fullscreen and mobile
  const getResponsiveCanvasSize = () => {
    if (isFullscreen) {
      // For fullscreen, use responsive dimensions
      if (window.innerWidth < 640) { // mobile
        return { width: Math.min(350, window.innerWidth - 32), height: 250 };
      } else if (window.innerWidth < 1024) { // tablet
        return { width: 500, height: 350 };
      } else { // desktop
        return { width: 800, height: 600 };
      }
    } else {
      // For embedded mode, use responsive dimensions
      if (window.innerWidth < 640) { // mobile
        return { width: Math.min(300, window.innerWidth - 32), height: 200 };
      } else if (window.innerWidth < 1024) { // tablet
        return { width: Math.min(400, width), height: Math.min(300, height) };
      } else { // desktop
        return { width, height };
      }
    }
  };

  const { width: canvasWidth, height: canvasHeight } = getResponsiveCanvasSize();

  // Color palette for quick selection
  const colorPalette = useMemo(() => [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ], []);

  // Product data state
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState<string | null>(null);
  
  // View selection state
  const [selectedView, setSelectedView] = useState<string>('Front View');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  const viewOptions = [
    'Front View',
    'Back View', 
    'Side View',
    'Bottom',
    'Top'
  ];

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) {
          setProductLoading(false);
          return;
        }

        // Get database and collection IDs
        const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
        const PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
        const COLORS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCT_COLORS_COLLECTION_ID || '';

        const data = await retryRequest(async () => {
          try {
          // Get the product document
          const productDoc = await databases.getDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            productId
          );

          // Get the product colors
          const colorsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLORS_COLLECTION_ID,
            [Query.equal('product_id', productId)]
          );

          // Combine the product with its colors
          return {
            ...productDoc,
            colors: colorsResponse.documents
          };
          } catch (dbError) {
            console.warn('Database fetch failed, using mock data for ImageKit testing:', dbError);
            // Fallback to mock data for testing ImageKit functionality
            return {
              $id: productId,
              name: 'Sample Product',
              description: 'Sample product for ImageKit testing',
              price: 29.99,
              stock_quantity: 100,
              image_url: productImage || '/images/sample-product.jpg',
              category: 'Apparel',
              sku: 'SAMPLE-001',
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              colors: [],
              sizes: ['S', 'M', 'L', 'XL'],
              customizable: 'Enabled',
              gallery_images: []
            };
          }
        });

        if (data) {
          // Use type assertion to access properties safely
          const productData = data as any;
          
          // Check if gallery_images is in the database response
          const hasGalleryImages = 'gallery_images' in productData && 
                                   Array.isArray(productData.gallery_images) && 
                                   productData.gallery_images.length > 0;
          
          console.log(`Product has gallery images in database: ${hasGalleryImages}`);
          
          // Try to get gallery images from localStorage if not in database or empty
          let galleryImages = hasGalleryImages ? productData.gallery_images : [];
          
          if ((!hasGalleryImages) && productData.$id) {
            try {
              const storedGallery = localStorage.getItem(`product_${productData.$id}_gallery`);
              if (storedGallery) {
                galleryImages = JSON.parse(storedGallery);
                console.log(`Loaded ${galleryImages.length} gallery images from localStorage for product ${productData.$id}`);
                
                // Only attempt to update database if we know the field exists
                const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
                
                // If we loaded from localStorage and the field exists in database,
                // update the database with these images for future consistency
                if (galleryFieldExists && galleryImages.length > 0) {
                  try {
                    await databases.updateDocument(
                      DATABASE_ID,
                      PRODUCTS_COLLECTION_ID,
                      productData.$id,
                      { gallery_images: galleryImages }
                    );
                    console.log('Synchronized gallery images from localStorage to database');
                  } catch (syncError: any) {
                    // If we get an 'Unknown attribute' error, mark the field as non-existent
                    if (syncError.message?.includes('Unknown attribute') ||
                        syncError.message?.includes('gallery_images')) {
                      localStorage.setItem('galleryImagesFieldExists', 'false');
                      console.log('Field gallery_images not available in schema, using localStorage only');
                    } else {
                      console.warn('Could not sync gallery images to database:', syncError);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to load gallery images from localStorage:', e);
            }
          }
          
          const transformedProduct: Product = {
            id: productData.$id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock_quantity: productData.stock_quantity || 0,
            image_url: productData.image_url,
            category: productData.category,
            sku: productData.sku || '',
            created_at: productData.$createdAt,
            updated_at: productData.$updatedAt,
            colors: Array.isArray(productData.colors) ? productData.colors.map((color: any) => ({
              id: color.$id,
              product_id: color.product_id,
              name: color.name,
              hex: color.hex,
              image_url: color.image_url || productData.image_url,
              created_at: color.$createdAt,
              updated_at: color.$updatedAt
            })) : [],
            sizes: productData.sizes || [],
            customizable: productData.customizable === true || productData.customizable === 'Enabled' 
              ? 'Enabled' 
              : 'Disabled',
            gallery_images: galleryImages
          };
          setProduct(transformedProduct);
          
          // Set initial background image (use productImage prop or main product image)
          if (productImage) {
            setCurrentBackgroundImage(productImage);
          } else if (transformedProduct.image_url) {
            setCurrentBackgroundImage(transformedProduct.image_url);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        showToast('Failed to load product details', 'error');
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [productId, productImage, showToast]);

  // Initialize ImageKit service configuration check
  useEffect(() => {
    // Check if ImageKit service is configured
    setImagekitConfigured(imagekitOnlyService.isConfigured());
    
    // Test ImageKit connection
    if (imagekitOnlyService.isConfigured()) {
      imagekitOnlyService.testImageKitConnection().then(result => {
        console.log('🔧 ImageKit Connection Test:', result);
        if (!result.success) {
          console.warn('⚠️ ImageKit connection issue:', result.message);
        }
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showViewDropdown) {
        const target = event.target as Element;
        if (!target.closest('.view-dropdown')) {
          setShowViewDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewDropdown]);



  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && onClose) {
        onClose();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when fullscreen
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      if (isFullscreen) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isFullscreen, onClose]);

  // Optimized history management
  const addToHistory = useCallback((elements: DesignElement[]) => {
    const newState: HistoryState = {
      elements: JSON.parse(JSON.stringify(elements)),
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Function to restore image elements after undo/redo
  const restoreImageElements = useCallback((elements: DesignElement[]): DesignElement[] => {
    return elements.map(element => {
      if (element.type === 'image' && element.imageUrl) {
        // Check if image is already in cache
        const cachedImage = imageCache.current.get(element.imageUrl);
        if (cachedImage) {
          return { ...element, imageElement: cachedImage };
        }
        
        // Check if image is in registry by element ID
        const registeredImage = imageRegistry.current.get(element.id);
        if (registeredImage) {
          return { ...element, imageElement: registeredImage };
        }

        // Load image if not cached
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCache.current.set(element.imageUrl!, img);
            imageRegistry.current.set(element.id, img);
          // Force re-render to show the loaded image
          setDesignElements(prev => [...prev]);
        };
          img.src = element.imageUrl;
        
        return { ...element, imageElement: img };
      }
      return element;
    });
  }, []);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const restoredElements = restoreImageElements(history[newIndex].elements);
      setDesignElements(restoredElements);
      setSelectedElement(null);
      showToast('Undone', 'success');
    }
  }, [historyIndex, history, showToast, restoreImageElements]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const restoredElements = restoreImageElements(history[newIndex].elements);
      setDesignElements(restoredElements);
      setSelectedElement(null);
      showToast('Redone', 'success');
    }
  }, [historyIndex, history, showToast, restoreImageElements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            if (selectedElement) {
              e.preventDefault();
              duplicateElement();
            }
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedElement) {
              e.preventDefault();
              deleteSelectedElement();
            }
            break;
        }
      }
      
      // Arrow keys for positioning
      if (selectedElement && !e.ctrlKey && !e.metaKey) {
        const moveDistance = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            moveElement(0, -moveDistance);
            break;
          case 'ArrowDown':
            e.preventDefault();
            moveElement(0, moveDistance);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            moveElement(-moveDistance, 0);
            break;
          case 'ArrowRight':
            e.preventDefault();
            moveElement(moveDistance, 0);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, undo, redo]);

  // Load and draw product image on background canvas
  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!backgroundCanvas || !productImage) return;

    const ctx = backgroundCanvas.getContext('2d');
    if (!ctx) return;

    backgroundCanvas.width = canvasWidth;
    backgroundCanvas.height = canvasHeight;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      setProductImageLoaded(true);
    };
    
    img.onerror = () => {
      console.error('Failed to load product image');
      setProductImageLoaded(false);
    };
    
    // Use direct URL for product image
    img.src = productImage;
  }, [productImage, canvasWidth, canvasHeight]);

  // Initialize main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    redrawCanvas();
  }, [canvasWidth, canvasHeight]);

  // Optimized redraw with requestAnimationFrame
  const redrawCanvas = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.globalAlpha = designOpacity;

      designElements.forEach(element => {
        if (element.visible === false) return;
        
        ctx.save();
        
        const elementScale = element.scale || 1;
        const elementWidth = (element.width || 50) * elementScale;
        const elementHeight = (element.height || 50) * elementScale;
        
        if (element.rotation) {
          ctx.translate(element.x + elementWidth / 2, element.y + elementHeight / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.translate(-(element.x + elementWidth / 2), -(element.y + elementHeight / 2));
        }

        if (element.type === 'text') {
          if (element.richContent) {
            // Render rich text with proper HTML parsing and formatting
            try {
              // For text elements, don't apply scale transform - use fontSize directly
              const elementFontSize = element.fontSize || fontSize;
              renderRichTextToCanvas(ctx, element.richContent, element.x, element.y, elementWidth, 1, elementFontSize);
            } catch (error) {
              console.error('Error rendering rich text:', error);
              // Fallback to plain text rendering
              const plainText = element.richContent.replace(/<[^>]*>/g, '');
              const fallbackFontSize = element.fontSize || fontSize;
              ctx.font = `${fallbackFontSize}px Inter, Arial, sans-serif`;
              ctx.fillStyle = element.color;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              ctx.fillText(plainText, element.x, element.y);
            }
          } else {
            // Render simple text
            const elementFontSize = element.fontSize || fontSize;
            const fontWeight = element.fontWeight || 'normal';
            const textAlign = element.textAlign || 'left';
            
            ctx.font = `${fontWeight} ${elementFontSize}px Inter, Arial, sans-serif`;
            ctx.fillStyle = element.color;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'top';
            
            // Calculate text position based on alignment
            let textX = element.x;
            if (textAlign === 'center') {
              textX = element.x + elementWidth / 2;
            } else if (textAlign === 'right') {
              textX = element.x + elementWidth;
            }
            
            ctx.fillText(element.content || '', textX, element.y);
          }
        } else if (element.type === 'shape') {
          ctx.strokeStyle = element.color;
          ctx.lineWidth = (element.strokeWidth || brushSize) * elementScale;
          
          if (element.shapeType === 'rectangle') {
            ctx.strokeRect(element.x, element.y, elementWidth, elementHeight);
          } else if (element.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(element.x + elementWidth / 2, element.y + elementHeight / 2, elementWidth / 2, 0, 2 * Math.PI);
            ctx.stroke();
          }
        } else if (element.type === 'image') {
          if (element.imageElement && element.imageElement instanceof HTMLImageElement && element.imageElement.complete && element.imageElement.naturalWidth > 0) {
            // Draw uploaded image only if it's properly loaded
            try {
              ctx.drawImage(element.imageElement, element.x, element.y, elementWidth, elementHeight);
            } catch (error) {
              console.warn('Failed to draw image element:', error);
              // Draw placeholder rectangle for failed images
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(element.x, element.y, elementWidth, elementHeight);
              ctx.setLineDash([]);
              
              // Draw X to indicate missing image
              ctx.beginPath();
              ctx.moveTo(element.x, element.y);
              ctx.lineTo(element.x + elementWidth, element.y + elementHeight);
              ctx.moveTo(element.x + elementWidth, element.y);
              ctx.lineTo(element.x, element.y + elementHeight);
              ctx.stroke();
            }
          } else if (element.imageUrl) {
            // Check cache one more time before showing loading state
            const cachedImage = imageCache.current.get(element.imageUrl);
            if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
              // Use cached image immediately and update element
              try {
                ctx.drawImage(cachedImage, element.x, element.y, elementWidth, elementHeight);
                // Register image by ID and update element asynchronously
                imageRegistry.current.set(element.id, cachedImage);
                setTimeout(() => {
                  setDesignElements(prev => prev.map(el => 
                    el.id === element.id && el.type === 'image' && el.imageUrl === element.imageUrl 
                      ? { ...el, imageElement: cachedImage } : el
                  ));
                }, 0);
              } catch (error) {
                console.warn('Failed to draw cached image:', error);
              }
            } else {
              // Draw minimal placeholder without "Reloading..." text initially
              ctx.strokeStyle = '#6b7280';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(element.x, element.y, elementWidth, elementHeight);
              ctx.setLineDash([]);
              
              // Only show loading text after a brief delay to avoid flicker
              ctx.fillStyle = '#6b7280';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('●', element.x + elementWidth / 2, element.y + elementHeight / 2);
            }
          } else {
            // Draw placeholder for images without URL (shouldn't happen in normal use)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(element.x, element.y, elementWidth, elementHeight);
            ctx.setLineDash([]);
            
            // Draw error indicator
            ctx.fillStyle = '#ef4444';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No Image', element.x + elementWidth / 2, element.y + elementHeight / 2);
          }
        }

        // Draw selection handles if element is selected
        if (element.selected && element.id === selectedElement && !isPerformanceMode) {
          let selectionWidth = elementWidth;
          let selectionHeight = elementHeight;
          
          // For text elements, calculate actual text dimensions
          if (element.type === 'text') {
            const textFontSize = element.fontSize || fontSize;
            ctx.font = `${element.fontWeight || 'normal'} ${textFontSize}px Inter, Arial, sans-serif`;
            
            if (element.richContent) {
              // For rich text, estimate dimensions based on content
              const plainText = element.richContent.replace(/<[^>]*>/g, '');
              const textMetrics = ctx.measureText(plainText);
              selectionWidth = Math.max(textMetrics.width, 50);
              selectionHeight = Math.max(textFontSize * 1.2, 20);
            } else {
              // For simple text, measure actual text
              const textMetrics = ctx.measureText(element.content || '');
              selectionWidth = Math.max(textMetrics.width, 50);
              selectionHeight = Math.max(textFontSize * 1.2, 20);
            }
          }
          
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(element.x - 5, element.y - 5, selectionWidth + 10, selectionHeight + 10);
          ctx.setLineDash([]);
          
          // Draw corner handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(element.x - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
          ctx.fillRect(element.x + selectionWidth - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
          ctx.fillRect(element.x - handleSize/2, element.y + selectionHeight - handleSize/2, handleSize, handleSize);
          ctx.fillRect(element.x + selectionWidth - handleSize/2, element.y + selectionHeight - handleSize/2, handleSize, handleSize);
        }
        
        ctx.restore();
      });

      ctx.globalAlpha = 1;
    });
  }, [designElements, selectedElement, designOpacity, canvasWidth, canvasHeight, brushSize, fontSize, isPerformanceMode]);

  // Trigger redraw when elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      // Force re-render to update canvas dimensions
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const findElementAt = useCallback((x: number, y: number): DesignElement | null => {
    for (let i = designElements.length - 1; i >= 0; i--) {
      const element = designElements[i];
      if (element.visible === false) continue;
      
      let elementWidth, elementHeight;
      
      if (element.type === 'text') {
        // For text elements, calculate actual text dimensions
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const textFontSize = element.fontSize || fontSize;
            ctx.font = `${element.fontWeight || 'normal'} ${textFontSize}px Inter, Arial, sans-serif`;
            
            if (element.richContent) {
              const plainText = element.richContent.replace(/<[^>]*>/g, '');
              const textMetrics = ctx.measureText(plainText);
              elementWidth = Math.max(textMetrics.width, 50);
              elementHeight = Math.max(textFontSize * 1.2, 20);
            } else {
              const textMetrics = ctx.measureText(element.content || '');
              elementWidth = Math.max(textMetrics.width, 50);
              elementHeight = Math.max(textFontSize * 1.2, 20);
            }
          } else {
            // Fallback if context is not available
            elementWidth = 100;
            elementHeight = 30;
          }
        } else {
          // Fallback if canvas is not available
          elementWidth = 100;
          elementHeight = 30;
        }
      } else {
        // For non-text elements, use scale-based dimensions
        const elementScale = element.scale || 1;
        elementWidth = (element.width || 50) * elementScale;
        elementHeight = (element.height || 50) * elementScale;
      }
      
      if (x >= element.x && x <= element.x + elementWidth &&
          y >= element.y && y <= element.y + elementHeight) {
        return element;
      }
    }
    return null;
  }, [designElements]);

  const getResizeHandle = useCallback((x: number, y: number, element: DesignElement): 'nw' | 'ne' | 'sw' | 'se' | null => {
    if (!element.selected || element.id !== selectedElement) return null;
    
    const elementScale = element.scale || 1;
    const elementWidth = (element.width || 50) * elementScale;
    const elementHeight = (element.height || 50) * elementScale;
    const handleSize = 8;
    const tolerance = 4;
    
    // Check each corner handle
    const handles = [
      { type: 'nw' as const, x: element.x - handleSize/2, y: element.y - handleSize/2 },
      { type: 'ne' as const, x: element.x + elementWidth - handleSize/2, y: element.y - handleSize/2 },
      { type: 'sw' as const, x: element.x - handleSize/2, y: element.y + elementHeight - handleSize/2 },
      { type: 'se' as const, x: element.x + elementWidth - handleSize/2, y: element.y + elementHeight - handleSize/2 }
    ];
    
    for (const handle of handles) {
      if (x >= handle.x - tolerance && x <= handle.x + handleSize + tolerance &&
          y >= handle.y - tolerance && y <= handle.y + handleSize + tolerance) {
        return handle.type;
      }
    }
    
    return null;
  }, [selectedElement]);

  const getCursorStyle = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isResizing) {
      switch (resizeHandle) {
        case 'nw':
        case 'se':
          return 'nw-resize';
        case 'ne':
        case 'sw':
          return 'ne-resize';
        default:
          return 'default';
      }
    }

    if (isDragging) {
      return 'grabbing';
    }

    const pos = getMousePos(e);
    const element = findElementAt(pos.x, pos.y);
    
    if (element) {
      // Check for resize handles on selected elements
      if (element.selected && element.id === selectedElement) {
        const handle = getResizeHandle(pos.x, pos.y, element);
        if (handle) {
          switch (handle) {
            case 'nw':
            case 'se':
              return 'nw-resize';
            case 'ne':
            case 'sw':
              return 'ne-resize';
            default:
              return 'default';
          }
        }
      }
      
      // Show grab cursor for any element (instant drag capability)
      return tool === 'text' ? 'text' : 'grab';
    }
    
    // Default cursor based on tool
    return tool === 'text' ? 'text' : 
           tool === 'shape' ? 'crosshair' : 
           'default';
  }, [isResizing, isDragging, resizeHandle, getMousePos, findElementAt, selectedElement, getResizeHandle, tool]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Always check for elements first, regardless of tool
    const element = findElementAt(pos.x, pos.y);
    
    if (element) {
      // Check if clicking on a resize handle first (only for already selected elements)
      const handle = getResizeHandle(pos.x, pos.y, element);
      if (handle && element.selected && element.id === selectedElement) {
        // Start resizing
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStartPos({ x: pos.x, y: pos.y });
        setResizeStartSize({ 
          width: (element.width || 50) * (element.scale || 1), 
          height: (element.height || 50) * (element.scale || 1) 
        });
        setIsPerformanceMode(true);
        return;
      }
      
      // Select the element
      setSelectedElement(element.id);
      setDesignElements(prev => prev.map(el => ({
        ...el,
        selected: el.id === element.id
      })));
      
      // Immediately start dragging for instant move (except for text tool)
      if (tool !== 'text') {
        setIsDragging(true);
        setDragOffset({
          x: pos.x - element.x,
          y: pos.y - element.y
        });
        setIsPerformanceMode(true);
      }
      
      return;
    } else {
      // Clicked on empty area - deselect all
      setSelectedElement(null);
      setDesignElements(prev => prev.map(el => ({ ...el, selected: false })));
    }
    
    // Handle tool-specific actions for empty area clicks
    if (tool === 'pen') {
      setIsDrawing(true);
    }
  }, [tool, getMousePos, findElementAt, getResizeHandle, selectedElement]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Update cursor style based on mouse position
    if (!isResizing && !isDragging) {
      const newCursor = getCursorStyle(e);
      if (newCursor !== canvasCursor) {
        setCanvasCursor(newCursor);
      }
    }
    

    
    if (isResizing && selectedElement && resizeHandle) {
      const deltaX = pos.x - resizeStartPos.x;
      const deltaY = pos.y - resizeStartPos.y;
      
      setDesignElements(prev => prev.map(el => {
        if (el.id !== selectedElement) return el;
        
        const currentScale = el.scale || 1;
        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;
        let newX = el.x;
        let newY = el.y;
        
        // Calculate new dimensions based on resize handle
        switch (resizeHandle) {
          case 'se': // Bottom-right
            newWidth = Math.max(20, resizeStartSize.width + deltaX);
            newHeight = Math.max(20, resizeStartSize.height + deltaY);
            break;
          case 'sw': // Bottom-left
            newWidth = Math.max(20, resizeStartSize.width - deltaX);
            newHeight = Math.max(20, resizeStartSize.height + deltaY);
            newX = el.x + (resizeStartSize.width - newWidth);
            break;
          case 'ne': // Top-right
            newWidth = Math.max(20, resizeStartSize.width + deltaX);
            newHeight = Math.max(20, resizeStartSize.height - deltaY);
            newY = el.y + (resizeStartSize.height - newHeight);
            break;
          case 'nw': // Top-left
            newWidth = Math.max(20, resizeStartSize.width - deltaX);
            newHeight = Math.max(20, resizeStartSize.height - deltaY);
            newX = el.x + (resizeStartSize.width - newWidth);
            newY = el.y + (resizeStartSize.height - newHeight);
            break;
        }
        
        // Update element with new dimensions
        return {
          ...el,
          width: newWidth / currentScale,
          height: newHeight / currentScale,
          x: newX,
          y: newY
        };
      }));
    } else if (isDragging && selectedElement) {
      // Allow dragging regardless of current tool (except text tool during text input)
      setDesignElements(prev => prev.map(el => 
        el.id === selectedElement 
          ? { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : el
      ));
    }
  }, [isDragging, selectedElement, tool, getMousePos, dragOffset, isResizing, resizeHandle, resizeStartPos, resizeStartSize, getCursorStyle, canvasCursor]);

  const stopDrawing = useCallback(() => {
    if (isDragging || isResizing) {
      addToHistory(designElements);
      setIsPerformanceMode(false);
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setCanvasCursor('default');
  }, [isDragging, isResizing, designElements, addToHistory]);

  // Handle image upload
  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    if (!imagekitConfigured) {
      showToast('ImageKit is not configured. Please check your API keys.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];
      const validation = imagekitOnlyService.validateImageFile(file);
      
      if (!validation.isValid) {
        showToast(validation.error || 'Invalid file', 'error');
        return;
      }

      let uploadResult: ImageKitUploadResult;
      
      // Upload using ImageKit only
      uploadResult = await imagekitOnlyService.uploadImage({
        file,
        fileName: `design-${Date.now()}-${file.name}`,
        folder: '/user-uploads',
        tags: ['design', 'user-upload'],
      });

      // Create image element for canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Ensure image is fully loaded before creating element
        if (img.complete && img.naturalWidth > 0) {
          // Cache the loaded image (with size limit)
          if (imageCache.current.size > 50) {
            // Clear oldest entries if cache gets too large
            const firstKey = imageCache.current.keys().next().value;
            if (firstKey) imageCache.current.delete(firstKey);
          }
          imageCache.current.set(uploadResult.url, img);
          
          const elementId = `image-${Date.now()}`;
          const newElement: DesignElement = {
            id: elementId,
            type: 'image',
            x: 50,
            y: 50,
            width: Math.min(200, img.naturalWidth),
            height: Math.min(200, img.naturalHeight),
            color: '#000000',
            selected: true,
            scale: 1,
            visible: true,
            imageUrl: uploadResult.url,
            imagekitFileId: uploadResult.fileId,
            imageElement: img,
          };

          // Register image by element ID for faster restoration
          imageRegistry.current.set(elementId, img);

          const newElements = [...designElements.map(el => ({ ...el, selected: false })), newElement];
          setDesignElements(newElements);
          setSelectedElement(newElement.id);
          addToHistory(newElements);

          // **NEW FEATURE: Automatically create a saved design copy**
          const timestamp = Date.now();
          const designName = `uploaded-${file.name.replace(/\.[^/.]+$/, "")}-${timestamp}`;
          
          // Create saved design data structure
          const savedDesignData = {
            name: designName,
            imageUrl: uploadResult.url,
            imagekitFileId: uploadResult.fileId,
            thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.url,
            elements: [newElement], // Include the uploaded image element
            canvasSize: { width: canvasWidth, height: canvasHeight },
            productId,
            productImage: currentBackgroundImage || productImage,
            hasProductBackground: false, // Uploaded images don't include product background
            createdAt: new Date().toISOString(),
            isUploading: false, // Already uploaded
            uploadFailed: false,
            type: 'uploaded-design' // Mark as uploaded design
          };

          // Add to saved designs in localStorage
          const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
          savedDesigns.unshift(savedDesignData);
          localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns.slice(0, 20)));
          
          // Add URL to tracked URLs
          setSavedDesignUrls(prev => [...prev, uploadResult.url]);
          
          // Trigger refresh of saved files section
          setSavedFilesRefresh(prev => prev + 1);
          
          showToast(`Design uploaded and saved as "${designName}"`, 'success');
        } else {
          showToast('Image loaded but dimensions are invalid', 'error');
        }
      };
      
      img.onerror = (error) => {
        console.error('Image load error:', error);
        showToast('Failed to load uploaded image', 'error');
      };
      
      // Set source last to trigger loading
      img.src = uploadResult.url;
      
    } catch (error) {
      console.error('Image upload error:', error);
      showToast(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [designElements, imagekitConfigured, addToHistory, showToast, canvasWidth, canvasHeight, productId, currentBackgroundImage, productImage, setSavedDesignUrls, setSavedFilesRefresh]);

  const addText = useCallback(() => {
    setRichTextContent('');
    setEditingElementId(null);
    setShowRichTextEditor(true);
  }, []);

  const handleRichTextSubmit = useCallback(() => {
    if (!richTextContent.trim() || richTextContent === '<p></p>') {
      showToast('Please enter some text', 'error');
      return;
    }

    // Extract plain text for width calculation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = richTextContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (editingElementId) {
      // Edit existing text element
      const newElements = designElements.map(el => 
        el.id === editingElementId 
          ? { 
              ...el, 
              content: plainText,
              richContent: richTextContent,
              fontSize: el.fontSize || 16, // Preserve existing fontSize or set default
              width: Math.max(plainText.length * 12, 100),
              height: Math.max(60, (richTextContent.match(/<p>/g) || []).length * 24)
            }
          : el
      );
      setDesignElements(newElements);
      addToHistory(newElements);
      showToast('Rich text updated', 'success');
    } else {
      // Add new text element
      const newElement: DesignElement = {
        id: `richtext-${Date.now()}`,
        type: 'text',
        x: 50,
        y: 50,
        content: plainText,
        richContent: richTextContent,
        color: selectedColor,
        fontSize: 16, // Set default fontSize for rich text elements
        width: Math.max(plainText.length * 12, 100),
        height: Math.max(60, (richTextContent.match(/<p>/g) || []).length * 24),
        selected: true,
        scale: 1,
        visible: true
      };

      const newElements = [...designElements.map(el => ({ ...el, selected: false })), newElement];
      setDesignElements(newElements);
      setSelectedElement(newElement.id);
      addToHistory(newElements);
      showToast('Rich text added to canvas', 'success');
    }

    setShowRichTextEditor(false);
    setRichTextContent('');
    setEditingElementId(null);
  }, [richTextContent, editingElementId, designElements, selectedColor, addToHistory, showToast]);

  const handleTextSubmit = useCallback(() => {
    if (!textEditorValue.trim()) {
      setShowTextEditor(false);
      return;
    }

    if (editingElementId) {
      // Edit existing text element
      const newElements = designElements.map(el => 
        el.id === editingElementId 
          ? { 
              ...el, 
              content: textEditorValue,
              fontSize: textFontSize,
              fontWeight: textFontWeight,
              textAlign: textAlign,
              width: textEditorValue.length * textFontSize * 0.6,
              height: textFontSize
            }
          : el
      );
      setDesignElements(newElements);
      addToHistory(newElements);
      showToast('Text updated', 'success');
    } else {
      // Add new text element
      const newElement: DesignElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: 50,
        y: 50,
        content: textEditorValue,
        color: selectedColor,
        fontSize: textFontSize,
        fontWeight: textFontWeight,
        textAlign: textAlign,
        width: textEditorValue.length * textFontSize * 0.6,
        height: textFontSize,
        selected: true,
        scale: 1,
        visible: true
      };

      const newElements = [...designElements.map(el => ({ ...el, selected: false })), newElement];
      setDesignElements(newElements);
      setSelectedElement(newElement.id);
      addToHistory(newElements);
      showToast('Text added to canvas', 'success');
    }

    setShowTextEditor(false);
    setTextEditorValue('');
    setEditingElementId(null);
  }, [textEditorValue, editingElementId, designElements, selectedColor, fontSize, addToHistory, showToast]);

  const handleEditText = useCallback((elementId: string) => {
    const element = designElements.find(el => el.id === elementId);
    if (element && element.type === 'text') {
      if (element.richContent) {
        // Edit as rich text
        setRichTextContent(element.richContent);
        setEditingElementId(elementId);
        setShowRichTextEditor(true);
      } else {
        // Edit as simple text
        setTextEditorValue(element.content || '');
        setTextFontSize(element.fontSize || 20);
        setTextFontWeight(element.fontWeight || 'normal');
        setTextAlign(element.textAlign || 'left');
        setEditingElementId(elementId);
        setShowTextEditor(true);
      }
    }
  }, [designElements]);

  const addShape = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'shape') return;

    const pos = getMousePos(e);
    const shapeSize = 50;

    const newElement: DesignElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: pos.x - shapeSize / 2,
      y: pos.y - shapeSize / 2,
      width: shapeSize,
      height: shapeSize,
      color: selectedColor,
      shapeType: selectedShape,
      strokeWidth: brushSize,
      selected: true,
      scale: 1,
      visible: true
    };

    const newElements = [...designElements.map(el => ({ ...el, selected: false })), newElement];
    setDesignElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
    showToast(`${selectedShape} added to canvas`, 'success');
  }, [tool, getMousePos, selectedColor, selectedShape, brushSize, designElements, addToHistory, showToast]);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) return;
    
    const newElements = designElements.filter(el => el.id !== selectedElement);
    setDesignElements(newElements);
    setSelectedElement(null);
    addToHistory(newElements);
    showToast('Element deleted', 'success');
  }, [selectedElement, designElements, addToHistory, showToast]);

  const duplicateElement = useCallback(() => {
    if (!selectedElement) return;
    
    const elementToDuplicate = designElements.find(el => el.id === selectedElement);
    if (!elementToDuplicate) return;
    
    // Create base element without image-specific properties
    const baseElement = {
      id: `${elementToDuplicate.type}-${Date.now()}`,
      type: elementToDuplicate.type,
      x: elementToDuplicate.x + 20,
      y: elementToDuplicate.y + 20,
      width: elementToDuplicate.width,
      height: elementToDuplicate.height,
      content: elementToDuplicate.content,
      color: elementToDuplicate.color,
      fontSize: elementToDuplicate.fontSize,
      shapeType: elementToDuplicate.shapeType,
      strokeWidth: elementToDuplicate.strokeWidth,
      rotation: elementToDuplicate.rotation,
      selected: true,
      scale: elementToDuplicate.scale,
      visible: elementToDuplicate.visible
    };
    
    // Add image-specific properties only for image elements
    const newElement: DesignElement = elementToDuplicate.type === 'image' ? {
      ...baseElement,
      imageUrl: elementToDuplicate.imageUrl,
      imagekitFileId: elementToDuplicate.imagekitFileId,
      imageElement: elementToDuplicate.imageElement
    } : baseElement;
    
    const newElements = [...designElements.map(el => ({ ...el, selected: false })), newElement];
    setDesignElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
    showToast('Element duplicated', 'success');
  }, [selectedElement, designElements, addToHistory, showToast]);

  const rotateSelectedElement = useCallback((degrees: number = 15) => {
    if (!selectedElement) return;
    
    const newElements = designElements.map(el => 
      el.id === selectedElement 
        ? { ...el, rotation: (el.rotation || 0) + degrees }
        : el
    );
    setDesignElements(newElements);
    addToHistory(newElements);
    showToast(`Element rotated ${degrees > 0 ? 'clockwise' : 'counter-clockwise'}`, 'success');
  }, [selectedElement, designElements, addToHistory, showToast]);

  const rotateClockwise = useCallback(() => {
    rotateSelectedElement(15);
  }, [rotateSelectedElement]);

  const rotateCounterClockwise = useCallback(() => {
    rotateSelectedElement(-15);
  }, [rotateSelectedElement]);

  // Replace background image with gallery image
  const replaceBackgroundImage = useCallback(async (imageUrl: string) => {
    try {
      const backgroundCanvas = backgroundCanvasRef.current;
      if (!backgroundCanvas) return;

      const ctx = backgroundCanvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions
      backgroundCanvas.width = canvasWidth;
      backgroundCanvas.height = canvasHeight;

      // Load the new background image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Clear the canvas and draw the new background image
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Calculate scaling to fit the canvas while maintaining aspect ratio
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Update state
      setCurrentBackgroundImage(imageUrl);
      setProductImageLoaded(true);
      setShowProductImage(true);
      
      showToast('Background image updated', 'success');
    } catch (error) {
      console.error('Error updating background image:', error);
      showToast('Failed to update background image', 'error');
    }
  }, [canvasWidth, canvasHeight, showToast]);

  const scaleSelectedElement = useCallback((scaleFactor: number) => {
    if (!selectedElement) return;
    
    const newElements = designElements.map(el => 
      el.id === selectedElement 
        ? { ...el, scale: Math.max(0.1, Math.min(3, (el.scale || 1) * scaleFactor)) }
        : el
    );
    setDesignElements(newElements);
    addToHistory(newElements);
  }, [selectedElement, designElements, addToHistory]);

  const moveElement = useCallback((deltaX: number, deltaY: number) => {
    if (!selectedElement) return;
    
    const newElements = designElements.map(el => 
      el.id === selectedElement 
        ? { 
            ...el, 
            x: Math.max(0, Math.min(canvasWidth - (el.width || 50) * (el.scale || 1), el.x + deltaX)),
            y: Math.max(0, Math.min(canvasHeight - (el.height || 50) * (el.scale || 1), el.y + deltaY))
          }
        : el
    );
    setDesignElements(newElements);
    addToHistory(newElements);
  }, [selectedElement, designElements, canvasWidth, canvasHeight, addToHistory]);

  const toggleElementVisibility = useCallback((elementId: string) => {
    const newElements = designElements.map(el => 
      el.id === elementId 
        ? { ...el, visible: el.visible !== false ? false : true }
        : el
    );
    setDesignElements(newElements);
    addToHistory(newElements);
  }, [designElements, addToHistory]);

  const clearCanvas = useCallback(() => {
    const newElements: DesignElement[] = [];
    setDesignElements(newElements);
    setSelectedElement(null);
    addToHistory(newElements);
    showToast('All designs cleared', 'success');
  }, [addToHistory, showToast]);

  // Clear only canvas-created elements (text, shapes, drawings) but keep uploaded images
  const clearCanvasDesigns = useCallback(() => {
    // Keep only uploaded images (type 'image'), remove text, shapes, and drawings
    const uploadedImages = designElements.filter(el => el.type === 'image' && el.imageUrl);
    setDesignElements(uploadedImages);
    setSelectedElement(null);
    addToHistory(uploadedImages);
    showToast('Canvas cleared for new design', 'success');
  }, [designElements, addToHistory, showToast]);

  // Save design function - saves one composite file with product and design (optimized for fast UI)
  const saveDesign = useCallback(async (designName?: string) => {
    if (!canvasRef.current || !backgroundCanvasRef.current) {
      showToast('Canvas not available', 'error');
      return null;
    }

    try {
      const designCanvas = canvasRef.current;
      const backgroundCanvas = backgroundCanvasRef.current;
      
      // Create name with selected view prefix
      const viewPrefix = selectedView.replace(/\s+/g, '-').toLowerCase();
      const timestamp = Date.now();
      const baseName = designName || `${viewPrefix}-design-${timestamp}`;
      
      // Create composite canvas (product + design)
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = canvasWidth;
      compositeCanvas.height = canvasHeight;
      const compositeCtx = compositeCanvas.getContext('2d');
      
      if (!compositeCtx) {
        throw new Error('Failed to create composite canvas context');
      }

      // Draw white background first
      compositeCtx.fillStyle = '#ffffff';
      compositeCtx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw product background if visible and loaded
      if (showProductImage && productImageLoaded) {
        compositeCtx.drawImage(backgroundCanvas, 0, 0);
      }

      // Draw design elements on top
      compositeCtx.drawImage(designCanvas, 0, 0);
      
      // Create immediate local preview (base64 data URL for instant display)
      const localPreviewUrl = compositeCanvas.toDataURL('image/jpeg', 0.8); // Lower quality for faster generation
      
      // Create temporary design data with local preview for immediate UI update
      const tempDesignData = {
        name: baseName,
        imageUrl: localPreviewUrl, // Use local preview initially
        imagekitFileId: `temp-${timestamp}`, // Temporary ID
        thumbnailUrl: localPreviewUrl,
        elements: designElements,
        canvasSize: { width: canvasWidth, height: canvasHeight },
        productId,
        productImage: currentBackgroundImage || productImage,
        hasProductBackground: showProductImage && productImageLoaded,
        createdAt: new Date().toISOString(),
        isUploading: true // Flag to indicate upload in progress
      };

      // Immediately save to localStorage and update UI
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      savedDesigns.unshift(tempDesignData);
      localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns.slice(0, 20)));
      
      // Trigger immediate refresh of saved files section
      setSavedFilesRefresh(prev => prev + 1);
      
      // Show immediate success message
      showToast('Design saved! Uploading to cloud...', 'success');
      
      // Clear the canvas immediately (remove all design elements but keep uploaded images)
      clearCanvasDesigns();

      // Upload to ImageKit in the background
      imagekitOnlyService.uploadCanvasDesign(compositeCanvas, baseName)
        .then((uploadResult) => {
          console.log('✅ Design uploaded to ImageKit:', uploadResult);
          
          // Add URL to our tracked URLs
          setSavedDesignUrls(prev => [...prev, uploadResult.url]);
          
          // Update the design data with real ImageKit URLs
          const finalDesignData = {
            ...tempDesignData,
            imageUrl: uploadResult.url,
            imagekitFileId: uploadResult.fileId,
            thumbnailUrl: uploadResult.thumbnailUrl,
            isUploading: false // Upload complete
          };

          // Update localStorage with final data
          const currentSavedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
          const updatedDesigns = currentSavedDesigns.map((design: any) => 
            design.imagekitFileId === `temp-${timestamp}` ? finalDesignData : design
          );
          localStorage.setItem('savedDesigns', JSON.stringify(updatedDesigns));
          
          // Trigger another refresh to show the final uploaded version
      setSavedFilesRefresh(prev => prev + 1);

      // Call parent callback if provided
      if (onDesignSave) {
            onDesignSave(finalDesignData);
          }
          
          showToast('Design uploaded to cloud successfully!', 'success');
        })
        .catch((error) => {
          console.error('Background upload failed:', error);
          
          // Update the design to show upload failed
          const currentSavedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
          const updatedDesigns = currentSavedDesigns.map((design: any) => 
            design.imagekitFileId === `temp-${timestamp}` 
              ? { ...design, isUploading: false, uploadFailed: true }
              : design
          );
          localStorage.setItem('savedDesigns', JSON.stringify(updatedDesigns));
          setSavedFilesRefresh(prev => prev + 1);
          
          showToast('Design saved locally, but cloud upload failed', 'warning');
        });

      return tempDesignData;
    } catch (error) {
      console.error('Save design error:', error);
      showToast(`Failed to save design: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    }
  }, [canvasRef, backgroundCanvasRef, designElements, canvasWidth, canvasHeight, productId, currentBackgroundImage, productImage, showProductImage, productImageLoaded, selectedView, onDesignSave, showToast, clearCanvasDesigns]);

  // Test ImageKit upload function
  const testImageKitUpload = useCallback(async () => {
    if (!canvasRef.current) {
      showToast('Canvas not available for testing', 'error');
      return;
    }

    try {
      console.log('🧪 Testing ImageKit upload...');
      
      const canvas = canvasRef.current;
      const testName = `imagekit-test-design-${Date.now()}`;
      
      const result = await imagekitOnlyService.uploadCanvasDesign(canvas, testName);
      
      console.log('✅ ImageKit test upload result:', result);
      console.log('🎉 ImageKit URL:', result.url);
      
      // Add test URL to tracked URLs
      setSavedDesignUrls(prev => [...prev, result.url]);
      
      showToast('ImageKit test upload successful!', 'success');
      return result;
      } catch (error) {
      console.error('❌ ImageKit test upload failed:', error);
      showToast(`ImageKit test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    }
  }, [canvasRef, showToast]);

  const submitAllFiles = useCallback(() => {
    if (!onDesignSave) {
      showToast('No submission handler available', 'error');
      return;
    }

    try {
      // Collect all uploaded images from canvas elements
      const uploadedImages = designElements.filter(el => el.type === 'image' && el.imageUrl);
      
      // Collect all saved designs from localStorage
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      
      // Filter out saved designs that are still uploading or failed to upload
      const validSavedDesigns = savedDesigns.filter((savedDesign: any) => 
        savedDesign.imageUrl && 
        !savedDesign.isUploading && 
        !savedDesign.uploadFailed &&
        savedDesign.imageUrl.startsWith('http') // Ensure it's a valid URL
      );
      
      // Prepare all design data for submission with enhanced metadata
      const allDesignData = {
        designFiles: uploadedImages.map((element, index) => ({
          imageUrl: element.imageUrl,
          thumbnailUrl: element.imageUrl, // Use same URL for thumbnail
          fileName: `uploaded-image-${index + 1}.png`,
          imagekitFileId: element.imagekitFileId || `file-${element.id}`,
          name: `Uploaded Image ${index + 1}`,
          timestamp: new Date().toISOString(),
          type: 'uploaded',
          elementId: element.id,
          description: 'Image uploaded directly to canvas'
        })),
        savedFiles: validSavedDesigns.map((savedDesign: any, index: number) => ({
              imageUrl: savedDesign.imageUrl,
              thumbnailUrl: savedDesign.thumbnailUrl || savedDesign.imageUrl,
              fileName: savedDesign.name ? `${savedDesign.name}.png` : `saved-design-${index + 1}.png`,
              imagekitFileId: savedDesign.imagekitFileId || `saved-${index + 1}`,
              name: savedDesign.name || `Saved Design ${index + 1}`,
          timestamp: savedDesign.createdAt || new Date().toISOString(),
          type: 'saved-design',
          elements: savedDesign.elements || [],
          description: `Design created and saved in canvas editor${savedDesign.imagekitFileId && !savedDesign.imagekitFileId.startsWith('temp-') ? ' (uploaded to cloud)' : ''}`
        })),
        // Also include current canvas state if it has elements
        currentCanvas: designElements.length > 0 ? {
          elements: designElements,
          timestamp: new Date().toISOString(),
          name: `Current Canvas Design`,
          type: 'current',
          description: 'Current state of the canvas editor'
        } : null,
        // Summary information
        totalFiles: uploadedImages.length + validSavedDesigns.length + (designElements.length > 0 ? 1 : 0),
        submissionTimestamp: new Date().toISOString(),
        // Add metadata for better tracking
        metadata: {
          totalUploadedImages: uploadedImages.length,
          totalSavedDesigns: validSavedDesigns.length,
          totalInvalidSavedDesigns: savedDesigns.length - validSavedDesigns.length,
          hasCurrentCanvas: designElements.length > 0,
          submissionSource: 'canvas-submit-all-files'
        }
      };

      // Log submission details for debugging
      console.log('Submitting all files from canvas:', {
        uploadedImages: uploadedImages.length,
        validSavedDesigns: validSavedDesigns.length,
        invalidSavedDesigns: savedDesigns.length - validSavedDesigns.length,
        currentCanvasElements: designElements.length,
        totalFiles: allDesignData.totalFiles,
        allSavedFileUrls: validSavedDesigns.map((design: { imageUrl: string }) => design.imageUrl)
      });

      // Call the parent's design save handler with all collected data
      onDesignSave(allDesignData);
      
      // Show success message with detailed breakdown
      const totalCount = allDesignData.totalFiles;
      const breakdown = [];
      if (uploadedImages.length > 0) breakdown.push(`${uploadedImages.length} uploaded image${uploadedImages.length !== 1 ? 's' : ''}`);
      if (validSavedDesigns.length > 0) breakdown.push(`${validSavedDesigns.length} saved design${validSavedDesigns.length !== 1 ? 's' : ''}`);
      if (designElements.length > 0) breakdown.push('current canvas');
      
      showToast(
        `Successfully submitted ${totalCount} file${totalCount !== 1 ? 's' : ''}!${breakdown.length > 0 ? ` (${breakdown.join(', ')})` : ''}`, 
        'success'
      );

      // Close the canvas if it's in fullscreen mode
      if (isFullscreen && onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error submitting all files:', error);
      showToast('Failed to submit files', 'error');
    }
  }, [designElements, onDesignSave, showToast, isFullscreen, onClose]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!canvas || !backgroundCanvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (showProductImage && productImageLoaded) {
      tempCtx.drawImage(backgroundCanvas, 0, 0);
    } else {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    const viewName = selectedView.replace(/\s+/g, '-');
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    link.download = `${viewName}-${shortCode}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    
    showToast('Design exported!', 'success');
  }, [canvasWidth, canvasHeight, showProductImage, productImageLoaded, productId, selectedView, showToast]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle click if we weren't dragging (to avoid conflicts with drag operations)
    if (isDragging || isResizing) {
      return;
    }
    
    const pos = getMousePos(e);
    
    // Handle tool-specific actions for empty area clicks
    if (tool === 'shape') {
      const element = findElementAt(pos.x, pos.y);
      if (!element) {
        addShape(e);
      }
    }
  }, [tool, addShape, getMousePos, findElementAt, isDragging, isResizing]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const canvasContent = (
    <div className={`flex flex-col lg:flex-row ${isFullscreen ? 'h-screen' : 'h-full'} bg-gray-900 text-white`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">Kri8tive Merch Editor</h1>
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Create and position custom designs on products</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 ml-2">
            {isFullscreen && onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 p-2 sm:px-3"
              >
                <X className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Close</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveDesign()}
              disabled={isUploading}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 p-2 sm:px-3"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Design</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={submitAllFiles}
              className="bg-green-600 hover:bg-green-700 text-white p-2 sm:px-3"
            >
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Submit All Files</span>
            </Button>

          </div>
        </div>
      </div>

      {/* Left Sidebar - Design Tools */}
      <div className="w-full lg:w-64 bg-gray-800 border-r border-gray-700 lg:border-b-0 border-b pt-16 sm:pt-20 overflow-y-auto order-3 lg:order-1 max-h-64 lg:max-h-none">
        {/* Upload Design Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Upload Design</h3>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-6 text-center hover:border-gray-500 transition-colors cursor-pointer relative"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-blue-500');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-500');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-500');
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleImageUpload(files);
              }
            }}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs sm:text-sm text-gray-400">Uploading...</p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-400">Click or drag to upload</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleImageUpload(e.target.files);
              }
            }}
          />
        </div>

        {/* Design Properties */}
        <div className="p-2 sm:p-4 border-b border-gray-700 lg:block hidden">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Design Properties</h3>
          
          {/* Width */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <input
              type="range"
              min="50"
              max="300"
              value={selectedElement ? (designElements.find(el => el.id === selectedElement)?.width || 50) : 150}
              onChange={(e) => {
                if (selectedElement) {
                  const newElements = designElements.map(el => 
                    el.id === selectedElement ? { ...el, width: Number(e.target.value) } : el
                  );
                  setDesignElements(newElements);
                }
              }}
              className="w-full h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-400 mt-1">
              {selectedElement ? (designElements.find(el => el.id === selectedElement)?.width || 50) : 150}px
            </div>
          </div>

          {/* Height */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Height</label>
            <input
              type="range"
              min="20"
              max="200"
              value={selectedElement ? (designElements.find(el => el.id === selectedElement)?.height || 50) : 150}
              onChange={(e) => {
                if (selectedElement) {
                  const newElements = designElements.map(el => 
                    el.id === selectedElement ? { ...el, height: Number(e.target.value) } : el
                  );
                  setDesignElements(newElements);
                }
              }}
              className="w-full h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-400 mt-1">
              {selectedElement ? (designElements.find(el => el.id === selectedElement)?.height || 50) : 150}px
            </div>
          </div>


        </div>

        {/* Position & Size Controls */}
        <div className="p-2 sm:p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Position & Size</h3>
          
          {/* Position Controls */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
              {/* Top row */}
              <div></div>
              <button
                onClick={() => moveElement(0, -10)}
                disabled={!selectedElement}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded p-2 flex items-center justify-center transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div></div>
              
              {/* Middle row */}
              <button
                onClick={() => moveElement(-10, 0)}
                disabled={!selectedElement}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded p-2 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8"></div>
              <button
                onClick={() => moveElement(10, 0)}
                disabled={!selectedElement}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded p-2 flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              
              {/* Bottom row */}
              <div></div>
              <button
                onClick={() => moveElement(0, 10)}
                disabled={!selectedElement}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded p-2 flex items-center justify-center transition-colors"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div></div>
            </div>
          </div>

          {/* Size Control */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-2">Size</label>
            <input
              type="range"
              min={selectedElement && designElements.find(el => el.id === selectedElement)?.type === 'text' ? "8" : "0.2"}
              max={selectedElement && designElements.find(el => el.id === selectedElement)?.type === 'text' ? "72" : "2"}
              step={selectedElement && designElements.find(el => el.id === selectedElement)?.type === 'text' ? "1" : "0.1"}
              value={selectedElement ? (() => {
                const element = designElements.find(el => el.id === selectedElement);
                if (element?.type === 'text') {
                  return element.fontSize || 16;
                } else {
                  return element?.scale || 1;
                }
              })() : 1}
              onChange={(e) => {
                if (selectedElement) {
                  const element = designElements.find(el => el.id === selectedElement);
                  if (element?.type === 'text') {
                    // For text elements, update fontSize
                    const newFontSize = Number(e.target.value);
                    const newElements = designElements.map(el => 
                      el.id === selectedElement ? { ...el, fontSize: newFontSize } : el
                    );
                    setDesignElements(newElements);
                    addToHistory(newElements);
                  } else {
                    // For other elements, update scale
                    const newScale = Number(e.target.value);
                    const newElements = designElements.map(el => 
                      el.id === selectedElement ? { ...el, scale: newScale } : el
                    );
                    setDesignElements(newElements);
                    addToHistory(newElements);
                  }
                }
              }}
              disabled={!selectedElement}
              className="w-full h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer disabled:bg-gray-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Small</span>
              <span>
                {selectedElement ? (() => {
                  const element = designElements.find(el => el.id === selectedElement);
                  if (element?.type === 'text') {
                    return `${element.fontSize || 16}px`;
                  } else {
                    return `${Math.round((element?.scale || 1) * 100)}%`;
                  }
                })() : '100%'}
              </span>
              <span>Large</span>
            </div>
          </div>
        </div>

        {/* Text Tools */}
        <div className="p-2 sm:p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Text Tools</h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRichTextContent('');
              setEditingElementId(null);
              setShowRichTextEditor(true);
            }}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs p-2 w-full"
          >
            <Type className="w-4 h-4 mr-2" />
            Text Editor
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Add and format text with advanced styling options
          </p>
        </div>


      </div>

      {/* Central Canvas Area */}
      <div className="flex-1 flex flex-col pt-16 sm:pt-20 order-2">
        {/* Canvas Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-2 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-400">Select View</span>
                <div className="relative hidden sm:block view-dropdown">
                  <button
                    onClick={() => setShowViewDropdown(!showViewDropdown)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-gray-600 hover:border-gray-500"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{selectedView}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showViewDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50 min-w-[120px]">
                      {viewOptions.map((view) => (
                        <button
                          key={view}
                          onClick={() => {
                            setSelectedView(view);
                            setShowViewDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-600 transition-colors first:rounded-t-md last:rounded-b-md ${
                            selectedView === view ? 'bg-gray-600 text-white' : 'text-gray-300'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Centered Toolbar Controls */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 sm:gap-2">
              {/* History Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 h-8 w-8 p-0"
              >
                <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 h-8 w-8 p-0"
              >
                <Redo className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-700 rounded-lg p-0.5 sm:p-1">
                {/* Primary Creation Tools */}
                <Button
                  variant={tool === 'text' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('text')}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0"
                  title="Add text"
                >
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={tool === 'shape' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('shape')}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0"
                  title="Add shape"
                >
                  <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={tool === 'select' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0"
                  title="Select tool"
                >
                  <MousePointer className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                
                {/* Color Selector */}
                <div className="relative">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      // Update selected element color if it's text or shape
                      if (selectedElement) {
                        const newElements = designElements.map(el => 
                          el.id === selectedElement ? { ...el, color: e.target.value } : el
                        );
                        setDesignElements(newElements);
                        addToHistory(newElements);
                      }
                    }}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded border-2 border-gray-600 cursor-pointer bg-transparent"
                    style={{ 
                      backgroundColor: selectedColor,
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                    title="Change color"
                  />
                  <Palette className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 m-auto pointer-events-none text-white mix-blend-difference" />
                </div>
                
                {/* Element Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicateElement}
                  disabled={!selectedElement}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0 disabled:opacity-50"
                  title="Duplicate element"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateCounterClockwise}
                  disabled={!selectedElement}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0 disabled:opacity-50"
                  title="Rotate counter-clockwise 15°"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateClockwise}
                  disabled={!selectedElement}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0 disabled:opacity-50"
                  title="Rotate clockwise 15°"
                >
                  <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                
                {/* Destructive Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedElement}
                  disabled={!selectedElement}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0 disabled:opacity-50"
                  title="Delete element"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent border-0"
                  title="Clear all elements"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
            
            {/* Right side spacer to maintain balance */}
            <div className="w-0"></div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-2 sm:p-4 lg:p-8">
          <div className="relative w-full max-w-full">
            {/* Product Canvas */}
            <div className="relative bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden mx-auto" style={{ maxWidth: `${canvasWidth}px`, maxHeight: `${canvasHeight}px` }}>
              {/* Background Canvas (Product Image) */}
              <canvas
                ref={backgroundCanvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ 
                  opacity: showProductImage ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              />
              
              {/* Design Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  startDrawing(mouseEvent as any);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  draw(mouseEvent as any);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
                onClick={tool === 'text' ? addText : handleCanvasClick}
                onDoubleClick={(e) => {
                  const pos = getMousePos(e);
                  const element = findElementAt(pos.x, pos.y);
                  if (element && element.type === 'text') {
                    handleEditText(element.id);
                  }
                }}
                className="relative z-10 w-full h-full touch-none"
                style={{ 
                  cursor: canvasCursor
                }}
              />
              
              {/* Performance indicator */}
              {isPerformanceMode && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-600 text-yellow-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                  Performance Mode
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Layers & Options */}
      <div className="w-full lg:w-64 bg-gray-800 border-l border-gray-700 lg:border-t-0 border-t pt-16 sm:pt-20 overflow-y-auto order-1 lg:order-3 max-h-64 lg:max-h-none">
        {/* Layers Section */}
        <div className="p-2 sm:p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </h3>
          
          {designElements.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2 sm:py-4">No designs added yet</p>
          ) : (
            <div className="space-y-1 sm:space-y-2 max-h-32 lg:max-h-none overflow-y-auto">
              {designElements.map((element, index) => (
                <div
                  key={element.id}
                  onClick={() => {
                    setSelectedElement(element.id);
                    setDesignElements(prev => prev.map(el => ({
                      ...el,
                      selected: el.id === element.id
                    })));
                  }}
                  className={`flex items-center justify-between p-1.5 sm:p-2 rounded cursor-pointer transition-colors ${
                    element.selected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    {element.type === 'text' ? (
                      <Type className="w-3 h-3 flex-shrink-0" />
                    ) : element.type === 'image' ? (
                      element.imageUrl ? (
                        <img 
                          src={element.imageUrl} 
                          alt="thumbnail"
                          className="w-3 h-3 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-3 h-3 flex-shrink-0" />
                      )
                    ) : (
                      <Square className="w-3 h-3 flex-shrink-0" />
                    )}
                    {element.type === 'image' && element.imageUrl && (
                      <ImageIcon className="w-3 h-3 hidden flex-shrink-0" />
                    )}
                    <span className="text-xs truncate">
                      {element.type === 'text' 
                        ? element.content 
                        : element.type === 'image' 
                          ? `Image ${index + 1}`
                          : element.type === 'shape'
                            ? `${element.shapeType || 'Shape'} ${index + 1}`
                            : `${element.type} ${index + 1}`
                      }
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleElementVisibility(element.id);
                    }}
                    className="text-gray-400 hover:text-white flex-shrink-0"
                  >
                    {element.visible !== false ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Images */}
        <div className="p-2 sm:p-4 lg:block hidden">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            Product Gallery
          </h3>
          
          {productLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
            </div>
          ) : product?.gallery_images && product.gallery_images.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">
                Click any image to set as background
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {product.gallery_images.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => replaceBackgroundImage(imageUrl)}
                    className={`relative group aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      currentBackgroundImage === imageUrl 
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                        : 'border-gray-600 hover:border-blue-500'
                    }`}
                    title={`Set gallery image ${index + 1} as background`}
                  >
                    <SafeImage
                      src={imageUrl}
                      alt={`${product.name} gallery image ${index + 1}`}
                      optimizeForAppwrite={true}
                      thumbnail={true}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      {currentBackgroundImage === imageUrl ? (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : product ? (
            <div className="text-center py-8">
              <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No gallery images available</p>
              <p className="text-xs text-gray-500 mt-1">
                Upload images in the product management section
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Failed to load product data</p>
            </div>
          )}
        </div>



        {/* Saved Files Section */}
        <div className="p-2 sm:p-4 lg:block hidden">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Saved Files
          </h3>
          
          {(() => {
            // Get saved designs from localStorage (refresh trigger: savedFilesRefresh)
            const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
            
            if (savedDesigns.length > 0) {
              return (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">
                    Click any saved design to load it
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {savedDesigns.map((savedDesign: any, index: number) => (
                      <div
                        key={`${savedDesign.imagekitFileId || savedDesign.name}-${index}`}
                        className="relative group aspect-square overflow-hidden rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all duration-200 hover:scale-105"
                      >
                                <SafeImage
                          src={savedDesign.imageUrl}
                          alt={`Saved design ${savedDesign.name}`}
                                  optimizeForAppwrite={false}
                                  thumbnail={true}
                                  className="w-full h-full object-cover"
                                />
                        
                        {/* Upload status overlay */}
                        {savedDesign.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-white">Uploading...</span>
                                  </div>
                                </div>
                        )}
                        
                        {/* Upload failed overlay */}
                        {savedDesign.uploadFailed && (
                          <div className="absolute top-1 left-1">
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Upload failed - saved locally only">
                              <AlertCircle className="w-2.5 h-2.5 text-white" />
                                </div>
                          </div>
                        )}
                        
                        {/* Cloud upload success indicator */}
                        {!savedDesign.isUploading && !savedDesign.uploadFailed && savedDesign.imagekitFileId && !savedDesign.imagekitFileId.startsWith('temp-') && (
                          <div className="absolute top-1 left-1">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center" title="Uploaded to cloud">
                              <Cloud className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="flex gap-1">
                            {/* Load button */}
                              <button
                                onClick={() => {
                                  if (savedDesign.elements) {
                                    setDesignElements(savedDesign.elements);
                                    addToHistory(savedDesign.elements);
                                    showToast(`Loaded design: ${savedDesign.name}`, 'success');
                                  }
                                }}
                              className="w-5 h-5 bg-white bg-opacity-80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              title={`Load saved design: ${savedDesign.name}`}
                            >
                                    <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                              </button>
                            {/* Submit this design button - disabled during upload */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDesignSave && !savedDesign.isUploading) {
                                  const designData = {
                                    designFiles: [],
                                    savedFiles: [{
                                      imageUrl: savedDesign.imageUrl,
                                      thumbnailUrl: savedDesign.thumbnailUrl || savedDesign.imageUrl,
                                      fileName: `${savedDesign.name}.png`,
                                      imagekitFileId: savedDesign.imagekitFileId,
                                      name: savedDesign.name,
                                      timestamp: savedDesign.createdAt || new Date().toISOString(),
                                      type: 'saved-design',
                                      elements: savedDesign.elements || [],
                                      description: `Saved design: ${savedDesign.name}`
                                    }],
                                    totalFiles: 1,
                                    submissionTimestamp: new Date().toISOString(),
                                    metadata: {
                                      submissionSource: 'individual-saved-design',
                                      designName: savedDesign.name
                                    }
                                  };
                                  console.log('Submitting individual saved design:', designData);
                                  onDesignSave(designData);
                                  showToast(`Submitted design: ${savedDesign.name}`, 'success');
                                  if (isFullscreen && onClose) {
                                    onClose();
                                  }
                                }
                              }}
                              disabled={savedDesign.isUploading}
                              className={`w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                                savedDesign.isUploading 
                                  ? 'bg-gray-500 cursor-not-allowed' 
                                  : 'bg-blue-600 bg-opacity-90 hover:bg-blue-700'
                              }`}
                              title={savedDesign.isUploading ? "Upload in progress..." : "Submit this design"}
                            >
                              <Upload className="w-2.5 h-2.5 text-white" />
                            </button>
                              </div>
                            </div>
                            
                            {/* Design name overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
                              {savedDesign.name}
                            </div>
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedSavedDesigns = savedDesigns.filter((_: any, i: number) => i !== index);
                                localStorage.setItem('savedDesigns', JSON.stringify(updatedSavedDesigns));
                                setSavedDesignUrls(prev => prev.filter(url => url !== savedDesign.imageUrl));
                                showToast('Saved design removed', 'success');
                                setSavedFilesRefresh(prev => prev + 1);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              title="Remove saved design"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Saved Files Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          localStorage.removeItem('savedDesigns');
                          setSavedDesignUrls([]);
                          showToast('All saved designs cleared', 'success');
                          setSavedFilesRefresh(prev => prev + 1);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                      
                      <button
                        onClick={() => {
                          const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
                          if (savedDesigns.length > 0) {
                            const dataStr = JSON.stringify(savedDesigns, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `saved-designs-${Date.now()}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                            showToast('Saved designs exported', 'success');
                          } else {
                            showToast('No saved designs to export', 'error');
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="text-center py-8">
                  <Save className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No saved designs</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use "Save Design" button to save your work
                  </p>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Text Editor Modal */}
      {showTextEditor && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingElementId ? 'Edit Text' : 'Add Text'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your text:
                </label>
                <textarea
                  value={textEditorValue}
                  onChange={(e) => setTextEditorValue(e.target.value)}
                  placeholder="Type your text here..."
                  className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleTextSubmit();
                    } else if (e.key === 'Escape') {
                      setShowTextEditor(false);
                      setTextEditorValue('');
                      setEditingElementId(null);
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Press Ctrl+Enter to submit, Esc to cancel
                </p>
              </div>

              {/* Text Formatting Controls */}
              <div className="mb-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Formatting</h4>
                
                {/* Font Size */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>12px</span>
                    <span>{textFontSize}px</span>
                    <span>72px</span>
                  </div>
                </div>

                {/* Font Weight and Text Alignment */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Font Weight */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Weight</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTextFontWeight('normal')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          textFontWeight === 'normal' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => setTextFontWeight('bold')}
                        className={`flex-1 px-2 py-1 text-xs rounded font-bold transition-colors ${
                          textFontWeight === 'bold' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Align</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTextAlign('left')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          textAlign === 'left' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        L
                      </button>
                      <button
                        onClick={() => setTextAlign('center')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          textAlign === 'center' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        C
                      </button>
                      <button
                        onClick={() => setTextAlign('right')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          textAlign === 'right' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        R
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTextEditor(false);
                    setTextEditorValue('');
                    setEditingElementId(null);
                  }}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleTextSubmit}
                  disabled={!textEditorValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
                >
                  {editingElementId ? 'Update' : 'Add Text'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor Modal */}
      {showRichTextEditor && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingElementId ? 'Edit Rich Text' : 'Add Rich Text'}
              </h3>
              
              <RichTextEditor
                content={richTextContent}
                onChange={setRichTextContent}
                onSubmit={handleRichTextSubmit}
                onCancel={() => {
                  setShowRichTextEditor(false);
                  setRichTextContent('');
                  setEditingElementId(null);
                }}
                placeholder="Type your rich text here..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-900">
        {canvasContent}
      </div>
    );
  }

  return canvasContent;
}; 