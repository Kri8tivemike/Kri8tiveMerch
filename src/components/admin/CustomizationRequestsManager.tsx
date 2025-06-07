import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { 
  Eye, 
  Check, 
  X, 
  ShoppingBag, 
  Loader2, 
  AlertOctagon, 
  Filter, 
  RefreshCw,
  ArrowUpDown,
  Calendar,
  User,
  Palette,
  Package,
  MessageSquare,
  ShoppingCart,
  Info,
  List,
  Clock,
  CheckCircle,
  XCircle,
  CheckCheck,
  HelpCircle,
  ImageIcon
} from 'lucide-react';
import { 
  getAllCustomizationRequests, 
  getUserCustomizationRequests, 
  updateCustomizationStatus,
  getTechniqueNameById,
  CustomizationRequest as ServiceCustomizationRequest 
} from '../../services/customization.service';
import { CustomizationStatus } from '../../lib/actions/customization';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';

// Define interface for customer profile
interface CustomerProfile {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  delivery_address?: string | null;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow additional properties
}

// Use the type from the service
type CustomizationRequest = ServiceCustomizationRequest;

interface CustomizationRequestsManagerProps {
  isAdminView?: boolean;
}

export default function CustomizationRequestsManager({ isAdminView = false }: CustomizationRequestsManagerProps) {
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isAppwriteCompatible, setIsAppwriteCompatible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [techniqueName, setTechniqueName] = useState<string | null>(null);
  
  const COMPLETED_STATUSES: CustomizationStatus[] = ['approved', 'completed'];

  useEffect(() => {
    try {
      fetchRequests();
      
      // Note: Appwrite doesn't currently support real-time subscriptions for database changes
      // in the same way as Supabase. We'll use polling instead.
      const pollingInterval = setInterval(() => {
        fetchRequests();
      }, 30000); // Poll every 30 seconds
      
      return () => {
        clearInterval(pollingInterval);
      };
    } catch (err) {
      console.error("Error setting up customization manager:", err);
      setIsAppwriteCompatible(false);
      setError("There was an error loading the customization system. It may be missing or not properly configured.");
      setLoading(false);
    }
  }, [statusFilter, sortOrder]);

  // For profile updates, we'll also use polling when a request is selected
  useEffect(() => {
    if (selectedRequest?.user_id && isAppwriteCompatible) {
      try {
        console.log('Setting up profile polling for user ID:', selectedRequest.user_id);
        
        // Initial profile fetch
        fetchCustomerProfile(selectedRequest.user_id);
        
        // Poll for profile updates
        const profilePollingInterval = setInterval(() => {
          if (selectedRequest?.user_id) {
            fetchCustomerProfile(selectedRequest.user_id);
          }
        }, 30000); // Poll every 30 seconds
        
        return () => {
          clearInterval(profilePollingInterval);
        };
      } catch (err) {
        console.error("Error setting up profile polling:", err);
      }
    }
  }, [selectedRequest?.user_id, selectedRequest?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      
      try {
        if (isAdminView) {
          // Use the admin function to get all requests
          data = await getAllCustomizationRequests();
        } else {
          // Use the user function to get only their requests
          data = await getUserCustomizationRequests();
        }
        
        // Apply status filtering
        if (statusFilter !== 'all' && data) {
          data = data.filter(request => request.status === statusFilter);
        }
        
        // Apply sorting
        if (data) {
          data = [...data].sort((a, b) => {
            const dateA = new Date(a.created_at || '').getTime();
            const dateB = new Date(b.created_at || '').getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          });
        }
        
        setRequests(data || []);
      } catch (err: any) {
        // Handle collection not found error
        if (err.message?.includes('Collection not found') || 
            err.code === 404) {
          setError('The customization requests feature is not yet set up. Please contact the administrator.');
          setRequests([]);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Error fetching customization requests:', error);
      setError(error.message || 'Failed to load customization requests');
      setIsAppwriteCompatible(false);
      toast({
        title: 'Error',
        description: 'Failed to load customization requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async (userId: string) => {
    if (!userId) return;
    
    try {
      setLoadingProfile(true);
      console.log('Fetching profile for user ID:', userId);
      
      // Create a fallback profile with request data or default values
      const fallbackProfile = {
        id: userId,
        full_name: selectedRequest?.user_name || "Michael IGUARIEDE",
        email: selectedRequest?.user_email || "kri8tivemike@gmail.com",
        phone_number: selectedRequest?.phone_number || '',
        whatsapp_number: selectedRequest?.whatsapp_number || '',
        delivery_address: selectedRequest?.delivery_address || ''
      };
      
      // Try to fetch the user profile from role-based collections
      try {
        const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
        
        // Try to fetch from each role-based collection
        const collections = ['customers', 'shop_managers', 'super_admins'];
        let profile = null;
        
        for (const collectionId of collections) {
          try {
            const result = await databases.listDocuments(
              DATABASE_ID,
              collectionId,
              [
                // Corrected Appwrite query using Query class
                Query.equal("user_id", userId)
              ]
            );
            
            if (result.documents && result.documents.length > 0) {
              profile = result.documents[0];
              console.log(`Fetched profile data from ${collectionId}:`, profile);
              break;
            }
          } catch (err: any) {
            // Log the error for the specific collection but continue
            console.warn(`Could not fetch profile from ${collectionId} for user ${userId}:`, err.message);
            continue;
          }
        }
        
        if (profile) {
          console.log('Fetched profile data from role-based collections:', profile);
          
          // Create a complete profile by combining profile data with request data
          const completeProfile = {
            ...fallbackProfile, // Start with request data
            id: profile.$id,
            full_name: profile.full_name || 
                      (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null) || 
                      fallbackProfile.full_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            role: profile.$collectionId, // Use collection name as role
            // Ensure we prioritize contact info from the request
            phone_number: selectedRequest?.phone_number || profile.phone || profile.phone_number || '',
            whatsapp_number: selectedRequest?.whatsapp_number || profile.whatsapp_number || '',
            delivery_address: selectedRequest?.delivery_address || profile.delivery_address || '',
          };
          
          setCustomerProfile(completeProfile);
          return;
        }
      } catch (error) {
        console.error('Error fetching user profile from role-based collections:', error);
        // Continue with fallback profile
      }
      
      // If we get here, either the profile fetch failed or the profile wasn't found
      // Use the fallback profile (with request data)
      setCustomerProfile(fallbackProfile);
    } catch (err) {
      console.error('Unexpected error fetching customer profile:', err);
      
      // Create and use a fallback profile with request data
      const fallbackProfile = {
        id: userId,
        full_name: selectedRequest?.user_name || "Michael IGUARIEDE",
        email: selectedRequest?.user_email || "kri8tivemike@gmail.com",
        phone_number: selectedRequest?.phone_number || '',
        whatsapp_number: selectedRequest?.whatsapp_number || '',
        delivery_address: selectedRequest?.delivery_address || ''
      };
      
      setCustomerProfile(fallbackProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleViewRequest = (request: CustomizationRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    
    // Fetch customer profile if user_id is available
    if (request.user_id) {
      fetchCustomerProfile(request.user_id);
    } else {
      // If no user_id, create a minimal profile with Michael's information
      setCustomerProfile({
        id: 'unknown',
        full_name: request.user_name || "Michael IGUARIEDE",
        email: request.user_email || "kri8tivemike@gmail.com",
        phone_number: request.phone_number || '+2348147953648',
        whatsapp_number: request.whatsapp_number || '+2348147953649',
        delivery_address: request.delivery_address || '54 ABEOKUTA STREET ANIFOWOSE 54'
      });
    }

    // Fetch technique name if technique_id exists but technique_name is missing
    if (request.technique_id && !request.technique_name && !request.technique) {
      console.log('Fetching technique name for ID:', request.technique_id);
      getTechniqueNameById(request.technique_id)
        .then(fetchedTechniqueName => {
          if (fetchedTechniqueName) {
            setTechniqueName(fetchedTechniqueName);
            console.log('Fetched technique name:', fetchedTechniqueName);
          }
        })
        .catch(techniqueError => {
          console.error('Error fetching technique name:', techniqueError);
        });
    } else {
      // Reset technique name if not needed
      setTechniqueName(null);
    }
  };
  
  const updateRequestStatus = async (requestId: string, newStatus: CustomizationStatus) => {
    if (!requestId) {
      toast.error("Cannot update request: Invalid request ID");
      return;
    }

    try {
      setLoading(true);
      
      await updateCustomizationStatus(requestId, newStatus, adminNotes);
      
      // Optimistic UI update
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      
      // Update the selected request if it's the one being modified
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      
      toast.success(`Request ${newStatus} successfully`);
      
      // Close the modal if a status was updated
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error(`Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderStatusBadge = (status: CustomizationStatus | undefined) => {
    const statusStyles = {
      Pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
      approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30',
      rejected: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30',
      completed: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/30'
    };

    const statusIcons = {
      Pending: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
      completed: <CheckCheck className="w-3 h-3 mr-1" />
    };

    if (!status) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700">
          <HelpCircle className="w-3 h-3 mr-1" />
          Unknown
        </span>
      );
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${statusStyles[status]}`}>
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusActionColor = (status: CustomizationStatus) => {
    const colors = {
      Pending: 'bg-amber-600 hover:bg-amber-700',
      approved: 'bg-emerald-600 hover:bg-emerald-700',
      rejected: 'bg-rose-600 hover:bg-rose-700',
      completed: 'bg-sky-600 hover:bg-sky-700',
    };
    return colors[status] || 'bg-gray-600 hover:bg-gray-700';
  };

  /**
   * Parse and extract all design URLs from a customization request
   * This function looks in design_url, image_url, and notes to find all available design files
   */
  const parseDesignUrls = (request: CustomizationRequest): Array<{
    url: string;
    filename: string;
    type: 'canvas' | 'uploaded' | 'base64' | 'external';
    description: string;
  }> => {
    const designFiles: Array<{
      url: string;
      filename: string;
      type: 'canvas' | 'uploaded' | 'base64' | 'external';
      description: string;
    }> = [];

    // Helper function to determine file type and generate appropriate filename
    const analyzeUrl = (url: string, index: number = 0): {
      type: 'canvas' | 'uploaded' | 'base64' | 'external';
      filename: string;
      description: string;
    } => {
      // Check if it's an ImageKit URL (canvas design from ImageKit)
      if (url.includes('ik.imagekit.io')) {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        let filename = lastPart && lastPart.includes('.') ? 
          lastPart.split('?')[0] : // Remove query parameters
          `ImageKit-Design-${index + 1}.png`;
        
        // Check if this might be a saved design based on filename patterns
        const isSavedDesign = filename.includes('saved-design') || 
                             filename.includes('canvas-design') ||
                             filename.match(/^[A-Za-z0-9\-_\s]+\.png$/);
        
        return {
          type: 'canvas',
          filename: filename,
          description: isSavedDesign ? 
            'Saved design from canvas editor (ImageKit)' : 
            'Design created in canvas editor (ImageKit)'
        };
      }
      
      // Check if it's an Appwrite storage URL (canvas design)
      // Look for any Appwrite storage URL pattern, not just user_avatars bucket
      if (url.includes('cloud.appwrite.io/v1/storage/buckets/') && 
          url.includes('view?project=67ea2c3b00309b589901')) {
        const fileId = url.match(/files\/([^\/]+)\//)?.[1] || 'unknown';
        const bucketMatch = url.match(/buckets\/([^\/]+)\//)?.[1] || 'unknown';
        return {
          type: 'canvas',
          filename: `Canvas-Design-${fileId.substring(0, 8)}-${Date.now()}.png`,
          description: `Design created in canvas editor (${bucketMatch} bucket)`
        };
      }
      
      // Check if it's a Base64 data URL
      if (url.startsWith('data:')) {
        const mimeMatch = url.match(/data:([^;]+)/);
        const extension = mimeMatch?.[1]?.includes('png') ? 'png' : 
                         mimeMatch?.[1]?.includes('jpeg') || mimeMatch?.[1]?.includes('jpg') ? 'jpg' : 'png';
        return {
          type: 'base64',
          filename: `Design-${request.id || 'custom'}-${index + 1}.${extension}`,
          description: `Base64 encoded image (${Math.round(url.length / 1024)}KB)`
        };
      }
      
      // Check if it's an external HTTP URL
      if (url.startsWith('http')) {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        let filename = lastPart && lastPart.includes('.') ? 
          lastPart.split('?')[0] : // Remove query parameters
          `External-Design-${index + 1}.png`;
        
        // If it's an Appwrite URL but not in our project, still treat as external
        if (url.includes('cloud.appwrite.io') && !url.includes('view?project=67ea2c3b00309b589901')) {
          filename = `External-Appwrite-Design-${index + 1}.png`;
        }
        
        return {
          type: 'external',
          filename: filename,
          description: 'External design file'
        };
      }
      
      // Default case for uploaded files
      return {
        type: 'uploaded',
        filename: url.includes('.') ? url : `Uploaded-Design-${index + 1}.png`,
        description: 'Uploaded design file'
      };
    };

    // Process main design_url
    if (request.design_url && request.design_url.trim() !== '') {
      // Check if it's a placeholder text that might contain filename info
      if (request.design_url.includes('Design uploaded') || 
          request.design_url.includes('File uploaded') ||
          request.design_url.includes('data URL too long')) {
        
        // Try to extract filename from placeholder text
        const filenameMatch = request.design_url.match(/([^\/\s]+\.(png|jpg|jpeg|gif|webp|svg))/i);
        if (filenameMatch) {
          designFiles.push({
            url: request.design_url, // Keep the placeholder for now
            filename: filenameMatch[1],
            type: 'uploaded',
            description: 'Design file uploaded (filename extracted from placeholder)'
          });
        } else {
          // Generic placeholder entry
          designFiles.push({
            url: request.design_url,
            filename: `Design-${request.id || 'unknown'}-1.png`,
            type: 'uploaded',
            description: 'Design file uploaded (preview not available)'
          });
        }
      } else {
        // Regular URL processing
        const analysis = analyzeUrl(request.design_url, 0);
        designFiles.push({
          url: request.design_url,
          ...analysis
        });
      }
    }

    // Process image_url if different from design_url
    if (request.image_url && 
        request.image_url.trim() !== '' && 
        request.image_url !== request.design_url) {
      
      const analysis = analyzeUrl(request.image_url, 1);
      designFiles.push({
        url: request.image_url,
        ...analysis
      });
    }

    // Parse additional URLs from notes
    if (request.notes) {
      const urlMatches = request.notes.match(/https?:\/\/[^\s\n]+/g);
      if (urlMatches) {
        urlMatches.forEach((url, index) => {
          // Skip if this URL is already included in design_url or image_url
          if (url !== request.design_url && url !== request.image_url) {
            const analysis = analyzeUrl(url, designFiles.length);
            designFiles.push({
              url: url,
              ...analysis
            });
          }
        });
      }
    }

    // Check admin_notes for structured design data and additional URLs
    if (request.admin_notes) {
      // First, check for structured design data format: DESIGN_URLS: url1|url2|url3
      const structuredMatch = request.admin_notes.match(/DESIGN_URLS:\s*([^|]+(?:\|[^|]+)*)/);
      if (structuredMatch) {
        const urls = structuredMatch[1].split('|').map(url => url.trim()).filter(url => url);
        const filenamesMatch = request.admin_notes.match(/FILENAMES:\s*([^|]+(?:\|[^|]+)*)/);
        const filenames = filenamesMatch ? 
          filenamesMatch[1].split('|').map(name => name.trim()).filter(name => name) : [];
        
        // Check if there's a total count indicating more designs
        const totalMatch = request.admin_notes.match(/TOTAL:\s*(\d+)/);
        const totalDesigns = totalMatch ? parseInt(totalMatch[1]) : urls.length;
        
        urls.forEach((url, index) => {
          // Skip if this URL is already included
          const alreadyExists = designFiles.some(df => df.url === url) || 
                               url === request.design_url || 
                               url === request.image_url;
          if (!alreadyExists) {
            const analysis = analyzeUrl(url, designFiles.length);
            // Use provided filename if available
            if (filenames[index]) {
              analysis.filename = filenames[index];
            }
            designFiles.push({
              url: url,
              ...analysis
            });
          }
        });
        
        // If there are more designs than URLs stored, add a placeholder entry
        if (totalDesigns > urls.length + (request.design_url ? 1 : 0) + (request.image_url ? 1 : 0)) {
          const missingCount = totalDesigns - designFiles.length;
          if (missingCount > 0) {
            designFiles.push({
              url: `placeholder-${request.id || 'unknown'}`,
              filename: `Additional-Designs-${missingCount}.info`,
              type: 'uploaded',
              description: `${missingCount} additional design file(s) - contact customer for access`
            });
          }
        }
      } else {
        // Fallback to regular URL matching if no structured data found
        const urlMatches = request.admin_notes.match(/https?:\/\/[^\s\n]+/g);
        if (urlMatches) {
          urlMatches.forEach((url) => {
            // Skip if this URL is already included
            const alreadyExists = designFiles.some(df => df.url === url) || 
                                 url === request.design_url || 
                                 url === request.image_url;
            if (!alreadyExists) {
              const analysis = analyzeUrl(url, designFiles.length);
              designFiles.push({
                url: url,
                ...analysis
              });
            }
          });
        }
      }
    }

    // Check for any additional fields that might contain design URLs
    // Look for common field names that might contain design data
    const requestData = request as any;
    const potentialDesignFields = [
      'design_urls', 'designUrls', 'permanent_design_urls', 'permanentDesignUrls',
      'canvas_designs', 'canvasDesigns', 'uploaded_designs', 'uploadedDesigns',
      'additional_designs', 'additionalDesigns', 'design_files', 'designFiles'
    ];

    potentialDesignFields.forEach(fieldName => {
      const fieldValue = requestData[fieldName];
      if (fieldValue) {
        if (Array.isArray(fieldValue)) {
          // Handle array of URLs
          fieldValue.forEach((item, index) => {
            let url = '';
            if (typeof item === 'string') {
              url = item;
            } else if (typeof item === 'object' && item.url) {
              url = item.url;
            } else if (typeof item === 'object' && item.imageUrl) {
              url = item.imageUrl;
            }
            
            if (url && url.startsWith('http')) {
              const alreadyExists = designFiles.some(df => df.url === url) || 
                                   url === request.design_url || 
                                   url === request.image_url;
              if (!alreadyExists) {
                const analysis = analyzeUrl(url, designFiles.length);
                designFiles.push({
                  url: url,
                  ...analysis
                });
              }
            }
          });
        } else if (typeof fieldValue === 'string') {
          // Handle string that might contain URLs
          const urlMatches = fieldValue.match(/https?:\/\/[^\s\n]+/g);
          if (urlMatches) {
            urlMatches.forEach((url) => {
              const alreadyExists = designFiles.some(df => df.url === url) || 
                                   url === request.design_url || 
                                   url === request.image_url;
              if (!alreadyExists) {
                const analysis = analyzeUrl(url, designFiles.length);
                designFiles.push({
                  url: url,
                  ...analysis
                });
              }
            });
          }
        }
      }
    });

    return designFiles;
  };

  /**
   * Download a design file with proper filename
   */
  const downloadDesignFile = async (url: string, filename: string, type: 'canvas' | 'uploaded' | 'base64' | 'external') => {
    try {
      // Check if URL is a placeholder entry
      if (url.startsWith('placeholder-')) {
        toast({
          title: "Additional Design Files",
          description: "This entry represents additional design files that were uploaded. Please contact the customer directly for access to these files.",
          variant: "default",
        });
        return;
      }
      
      // Check if URL is a placeholder text
      if (url.includes('Design uploaded') || 
          url.includes('File uploaded') ||
          url.includes('data URL too long')) {
        toast({
          title: "Download not available",
          description: "This design file was uploaded but the URL is not accessible for download. Please contact the customer for the original file.",
          variant: "destructive",
        });
        return;
      }

      if (type === 'base64') {
        // Handle Base64 data URLs
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (type === 'canvas' || type === 'external') {
        // Handle Appwrite storage URLs and external URLs
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } else {
        // Handle uploaded files - try direct download first
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(blobUrl);
          } else {
            throw new Error('Direct download failed');
          }
        } catch (fetchError) {
          // Fallback: open in new tab
          window.open(url, '_blank');
        }
      }
      
      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the file. Opening in new tab instead.",
        variant: "destructive",
      });
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  /**
   * View a design file in a new tab
   */
  const viewDesignFile = (url: string, type: 'canvas' | 'uploaded' | 'base64' | 'external') => {
    if (type === 'base64') {
      // For Base64, create a new window with the image
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Design Preview</title></head>
            <body style="margin:0;padding:20px;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="Design Preview" />
            </body>
          </html>
        `);
      }
    } else {
      // For other types, open directly
      window.open(url, '_blank');
    }
  };

  // Render a fallback UI if the Appwrite compatibility layer doesn't work
  if (!isAppwriteCompatible) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertOctagon className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Customization System Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
            The customization system is currently being migrated to Appwrite.
            This feature will be available soon.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Error: {error || "Compatibility layer issue"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header with actions */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm pb-4 border-b border-gray-100 dark:border-gray-700 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {isAdminView ? 'Customization Requests' : 'My Customization Requests'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage customer customization requests and update their statuses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button 
              onClick={toggleSortOrder}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={`Sort by date ${sortOrder === 'asc' ? 'oldest first' : 'newest first'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content area */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent scrollbar-thumb-rounded-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center">
            <AlertOctagon className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Customization Requests</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-full mb-5">
              <ShoppingBag className="w-14 h-14 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">No Requests Found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              {statusFilter !== 'all' 
                ? `No ${statusFilter} customization requests found. Try changing the filter.`
                : 'No customization requests have been submitted yet.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <List className="w-4 h-4" />
                  Show All Requests
                </button>
              )}
            </div>
            
            {isAdminView && (
              <div className="mt-10 border-t border-gray-100 dark:border-gray-700 pt-6 text-left">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  About Customization Requests
                </h4>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Customers can request custom designs and modifications to products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Review and respond to customization requests to provide quotes and pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShoppingCart className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>When approved, customers can add customized products to their cart</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 relative">
                    {(() => {
                      // Check if design_url exists and is a valid URL (not a placeholder text)
                      const hasValidDesignUrl = request.design_url && 
                        (request.design_url.startsWith('data:') || 
                         request.design_url.startsWith('http') || 
                         request.design_url.startsWith('/'));
                      
                      const isPlaceholderText = request.design_url && 
                        (request.design_url.includes('data URL too long') || 
                         request.design_url.includes('Design uploaded') ||
                         request.design_url.includes('File uploaded'));

                      if (hasValidDesignUrl && !isPlaceholderText) {
                        return (
                          <img
                            src={request.design_url}
                            alt="Custom design"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        );
                      } else if (isPlaceholderText) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        );
                      } else if (request.image_url) {
                        return (
                          <img
                            src={request.image_url}
                            alt={request.item_type || 'Custom Item'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder-product.png";
                            }}
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                            <Package className="w-8 h-8" />
                          </div>
                        );
                      }
                    })()}
                    {request.quantity && request.quantity > 1 && (
                      <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-tl-md font-medium">
                        x{request.quantity}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {request.product?.name || request.item_type || 'Custom Item'}
                      </h3>
                      {renderStatusBadge(request.status as CustomizationStatus | undefined)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-1">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                        Submitted {request.created_at ? new Date(request.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Unknown date'}
                      </div>
                      {isAdminView && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <User className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                          {request.user_email || request.user_name || 'Unknown User'}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-1.5 font-medium">Size:</span> {request.size || 'Standard'}
                      </div>
                      {request.technique_name && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-1.5 font-medium">Technique:</span> {request.technique_name || request.technique || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleViewRequest(request)}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium flex items-center transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View Details
                    </button>
                    {request.status === 'Pending' && request.id && (
                      <button
                        onClick={() => request.id ? updateRequestStatus(request.id, 'approved') : null}
                        disabled={!request.id}
                        className={`px-3 py-1.5 text-white rounded-lg text-sm font-medium flex items-center transition-colors ${getStatusActionColor('approved')}`}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}>
          <div 
            className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-xl font-semibold text-white">Request Details</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedRequest.status && renderStatusBadge(selectedRequest.status as CustomizationStatus | undefined)}
                  <span className="ml-2">
                    Submitted on {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'Unknown date'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Make this scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent scrollbar-thumb-rounded-full">
              <div className="p-6">
                <div className="mt-6 space-y-4">
                  {/* Custom design image */}
                  <div className="flex justify-center mb-4">
                    {(() => {
                      // Check if design_url exists and is a valid URL (not a placeholder text)
                      const hasValidDesignUrl = selectedRequest.design_url && 
                        (selectedRequest.design_url.startsWith('data:') || 
                         selectedRequest.design_url.startsWith('http') || 
                         selectedRequest.design_url.startsWith('/'));
                      
                      const isPlaceholderText = selectedRequest.design_url && 
                        (selectedRequest.design_url.includes('data URL too long') || 
                         selectedRequest.design_url.includes('Design uploaded') ||
                         selectedRequest.design_url.includes('File uploaded'));

                      if (hasValidDesignUrl && !isPlaceholderText) {
                        return (
                          <div className="relative w-full max-w-xs h-48 overflow-hidden rounded-lg border border-slate-700">
                            <img
                              src={selectedRequest.design_url}
                              alt="Custom design"
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            {/* Error fallback */}
                            <div className="absolute inset-0 hidden items-center justify-center bg-slate-800">
                              <div className="text-center text-slate-400">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">Failed to load design</p>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (isPlaceholderText) {
                        return (
                          <div className="flex items-center justify-center w-full max-w-xs h-48 bg-slate-800 rounded-lg border border-slate-700">
                            <div className="text-center text-slate-400">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm font-medium">Design File Uploaded</p>
                              <p className="text-xs mt-1 opacity-75">Preview not available due to file size</p>
                            </div>
                          </div>
                        );
                      } else if (selectedRequest.image_url) {
                        return (
                          <div className="relative w-full max-w-xs h-48 overflow-hidden rounded-lg border border-slate-700">
                            <img
                              src={selectedRequest.image_url}
                              alt="Product image"
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = "/placeholder-product.png";
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center justify-center w-full max-w-xs h-48 bg-slate-800 rounded-lg border border-slate-700">
                            <div className="text-center text-slate-400">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm">No design preview available</p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Customer information */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Customer Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.user_name || customerProfile?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.user_email || customerProfile?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.phone_number || customerProfile?.phone_number || 'N/A'}</p>
                      </div>
                      {(selectedRequest.whatsapp_number || customerProfile?.whatsapp_number) && (
                        <div>
                          <p className="text-xs text-slate-500">WhatsApp</p>
                          <p className="text-sm font-medium text-white">{selectedRequest.whatsapp_number || customerProfile?.whatsapp_number}</p>
                        </div>
                      )}
                      {(selectedRequest.delivery_address || customerProfile?.delivery_address) && (
                        <div className="col-span-1 sm:col-span-3">
                          <p className="text-xs text-slate-500">Delivery Address</p>
                          <p className="text-sm font-medium text-white">{selectedRequest.delivery_address || customerProfile?.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product details */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Product Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">Product</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.product?.name || selectedRequest.item_type || 'Custom Item'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Size</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.size || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.quantity || 1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Technique</p>
                        <p className="text-sm font-medium text-white">{techniqueName || selectedRequest.technique_name || selectedRequest.technique || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Color</p>
                        <p className="text-sm font-medium text-white">{selectedRequest.color || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Base Price</p>
                        <p className="text-sm font-medium text-white">₦{(selectedRequest.product?.price || 0).toFixed(2)}</p>
                      </div>
                      {selectedRequest.payment_reference && (
                        <div className="col-span-1 sm:col-span-2">
                          <p className="text-xs text-slate-500">Payment Reference</p>
                          <p className="text-sm font-medium text-white font-mono break-all">{selectedRequest.payment_reference}</p>
                        </div>
                      )}
                      {selectedRequest.fabric_purchase_option === 'help_buy' && selectedRequest.fabric_quality && (
                        <div className="col-span-1 sm:col-span-2">
                          <p className="text-xs text-slate-500">Fabric Details</p>
                          <p className="text-sm font-medium text-white">
                            Help buying fabric ({selectedRequest.fabric_quality} GSM)
                            {selectedRequest.material && ` - ${selectedRequest.material}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Download design files */}
                  {(() => {
                    const designFiles = parseDesignUrls(selectedRequest);
                    return designFiles.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">
                          Download Design Files ({designFiles.length})
                        </h4>
                        <div className="p-4 bg-slate-800 rounded-lg">
                          <div className="space-y-3">
                            {designFiles.map((designFile, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <ImageIcon className="w-5 h-5 text-slate-400" />
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {designFile.filename}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {designFile.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        designFile.type === 'canvas' ? 'bg-blue-600 text-blue-100' :
                                        designFile.type === 'base64' ? 'bg-green-600 text-green-100' :
                                        designFile.type === 'external' ? 'bg-purple-600 text-purple-100' :
                                        'bg-gray-600 text-gray-100'
                                      }`}>
                                        {designFile.type === 'canvas' ? 'Canvas' :
                                         designFile.type === 'base64' ? 'Base64' :
                                         designFile.type === 'external' ? 'External' :
                                         'Uploaded'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => viewDesignFile(designFile.url, designFile.type)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => downloadDesignFile(designFile.url, designFile.filename, designFile.type)}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Bulk download option if multiple files */}
                          {designFiles.length > 1 && (
                            <div className="mt-4 pt-3 border-t border-slate-600">
                              <button
                                onClick={async () => {
                                  toast({
                                    title: "Bulk download started",
                                    description: `Downloading ${designFiles.length} design files...`,
                                  });
                                  
                                  // Download all files with a small delay between each
                                  for (let i = 0; i < designFiles.length; i++) {
                                    const file = designFiles[i];
                                    setTimeout(() => {
                                      downloadDesignFile(file.url, file.filename, file.type);
                                    }, i * 500); // 500ms delay between downloads
                                  }
                                }}
                                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download All ({designFiles.length} files)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Download Design Files</h4>
                        <div className="p-4 bg-slate-800 rounded-lg">
                          <div className="text-center py-4">
                            <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No design files available</p>
                            {(selectedRequest.design_url?.includes('data URL too long') || 
                              selectedRequest.design_url?.includes('Design uploaded') ||
                              selectedRequest.design_url?.includes('File uploaded')) && (
                              <p className="text-xs text-slate-500 mt-1">
                                Design file was uploaded but URL is not accessible
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cost breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Cost Breakdown</h4>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="space-y-2">
                        {(selectedRequest.technique_cost !== undefined && selectedRequest.technique_cost !== null) && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">
                              {techniqueName || selectedRequest.technique_name || selectedRequest.technique || 'Printing Technique'}:
                            </span>
                            <span className="text-sm font-medium text-white">₦{selectedRequest.technique_cost.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedRequest.fabric_cost && selectedRequest.fabric_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Fabric Cost:</span>
                            <span className="text-sm font-medium text-white">₦{selectedRequest.fabric_cost.toFixed(2)}</span>
                          </div>
                        )}
                        {(selectedRequest.unit_cost !== undefined && selectedRequest.unit_cost !== null) && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Unit Cost:</span>
                            <span className="text-sm font-medium text-white">₦{selectedRequest.unit_cost.toFixed(2)}</span>
                          </div>
                        )}
                        {(selectedRequest.quantity || 1) > 1 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Quantity:</span>
                            <span className="text-sm font-medium text-white">x{selectedRequest.quantity || 1}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-700 flex justify-between">
                          <span className="text-sm font-medium text-white">Total:</span>
                          <span className="text-sm font-bold text-white">₦{(selectedRequest.total_cost || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer - Sticky buttons */}
            <div className="border-t border-gray-100 p-6 sticky bottom-0 bg-white z-10">
              <div className="flex flex-wrap gap-3">
                {selectedRequest.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => {
                        if (selectedRequest.id) {
                          updateRequestStatus(selectedRequest.id, 'approved');
                          setSelectedRequest(null);
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                      disabled={!selectedRequest.id}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (selectedRequest.id) {
                          updateRequestStatus(selectedRequest.id, 'rejected');
                          setSelectedRequest(null);
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors"
                      disabled={!selectedRequest.id}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}
                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => {
                      if (selectedRequest.id) {
                        updateRequestStatus(selectedRequest.id, 'completed');
                        setSelectedRequest(null);
                      }
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors"
                    disabled={!selectedRequest.id}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </button>
                )}
                {(selectedRequest.status === 'rejected' || selectedRequest.status === 'completed' || !selectedRequest.status) && (
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 