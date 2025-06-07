import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Wrench, Loader2 } from 'lucide-react';
import schemaFixes from '../../lib/debugging/schemaFixes';

interface PaymentErrorPageProps {
  title?: string;
  message?: string;
  returnUrl?: string;
  returnText?: string;
}

export default function PaymentErrorPage({
  title = 'Payment Processing Error',
  message = 'An error occurred while processing your payment.',
  returnUrl = '/customization',
  returnText = 'Return to Customization'
}: PaymentErrorPageProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  
  // Check if this is a schema error that we can fix
  const isSchemaError = message.includes('Unknown attribute') || 
                        message.includes('Invalid document structure');
  
  // Extract the attribute name if possible
  const attributeMatch = message.match(/Unknown attribute: "([^"]+)"/);
  const attributeName = attributeMatch ? attributeMatch[1] : null;
  
  const handleFixSchema = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      let success = false;
      
      // If we know which attribute needs fixing, try to fix it specifically
      if (attributeName === 'image_url') {
        success = await schemaFixes.fixImageUrlAttribute();
      } else if (attributeName === 'material') {
        success = await schemaFixes.fixMaterialAttribute();
      } else if (attributeName === 'technique') {
        success = await schemaFixes.fixTechniqueAttributes();
      } else {
        // Otherwise try fixing all known issues
        success = await schemaFixes.fixAllSchemaIssues();
      }
      
      if (success) {
        setFixResult('Schema fixed successfully. You can now try again.');
      } else {
        setFixResult('Could not fix the schema. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error fixing schema:', error);
      setFixResult('An error occurred while fixing the schema.');
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-900 text-white px-4 py-12">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900/50">
          <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-medium text-white mt-4">{title}</h1>
        
        <div className="text-slate-300 mt-2">{message}</div>
        
        {attributeName && (
          <div className="mt-2 text-amber-400 text-sm">
            Problem with attribute: <span className="font-mono font-bold">{attributeName}</span>
          </div>
        )}
        
        {fixResult && (
          <div className={`mt-4 text-sm px-4 py-3 rounded ${
            fixResult.includes('successfully') 
              ? 'bg-green-900/40 text-green-300 border border-green-800'
              : 'bg-red-900/40 text-red-300 border border-red-800'
          }`}>
            {fixResult}
          </div>
        )}
        
        <div className="mt-8 space-y-3">
          {isSchemaError && (
            <button
              onClick={handleFixSchema}
              disabled={isFixing}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fixing Schema...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Fix Database Schema
                </>
              )}
            </button>
          )}
          
          <Link
            to={returnUrl}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {returnText} {' '} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 