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
    element: React.createElement(Layout),
    errorElement: React.createElement(RouteError),
    children: [
      ...publicRoutes,
      ...customerRoutes,
      ...shopManagerRoutes,
      ...superAdminRoutes,
      { path: "*", element: React.createElement(Navigate, { to: "/", replace: true }) }
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
});

export default router;
