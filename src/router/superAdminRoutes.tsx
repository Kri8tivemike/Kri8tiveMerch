import { RoleGuard } from '../components/auth/RoleGuard';
import SuperAdmin from '../pages/SuperAdmin';
import SuperAdminLogin from '../pages/SuperAdminLogin';
import AdminAuth from '../pages/AdminAuth';
import { GuestOnlyRoute } from '../components/auth/GuestOnlyRoute';

export const superAdminRoutes = [
  {
    path: "admin-login",
    element: <GuestOnlyRoute redirectTo="/super-admin"><SuperAdminLogin /></GuestOnlyRoute>
  },
  {
    path: "admin-auth",
    element: <GuestOnlyRoute redirectTo="/super-admin"><AdminAuth /></GuestOnlyRoute>
  },
  {
    path: "super-admin",
    element: (
      <RoleGuard allowedRoles={['super_admin']} redirectTo="/admin-login">
        <SuperAdmin />
      </RoleGuard>
    )
  },
];
