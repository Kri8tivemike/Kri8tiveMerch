import React, { memo, useState, useEffect } from 'react';

interface PersistentPageProps {
  children: React.ReactNode;
  id: string; // A unique identifier for this page
}

/**
 * A wrapper component that helps preserve component state during navigation
 * It prevents components from unmounting when navigating away and back
 */
export const PersistentPage: React.FC<PersistentPageProps> = memo(({ children, id }) => {
  // Use state to store the component instance
  const [cached, setCached] = useState<React.ReactNode>(null);
  
  // Update the cached content when the id changes
  useEffect(() => {
    if (!cached) {
      console.log(`Caching page: ${id}`);
      setCached(children);
    }
  }, [id, children, cached]);
  
  // Render either the cached content or the new children
  return (
    <div className="persistent-page" data-page-id={id}>
      {cached || children}
    </div>
  );
});

PersistentPage.displayName = 'PersistentPage'; 