import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { publicRoutes } from './publicRoutes';
import { customerRoutes } from './customerRoutes';
import { shopManagerRoutes } from './shopManagerRoutes';
import { superAdminRoutes } from './superAdminRoutes';
import { RouteError } from './RouteError';

// Combine all routes under the main layout
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      ...publicRoutes,
      ...customerRoutes,
      ...shopManagerRoutes,
      ...superAdminRoutes,
      { path: "*", element: <Navigate to="/" replace /> }
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  },
  // Add scroll restoration to maintain scroll position when navigating
  // This helps with the user experience when going back and forth
  scrollRestoration: 'enabled',
  // If using React 18+, enable view transitions for smoother navigations
  unstable_viewTransition: true
});

export default router;
