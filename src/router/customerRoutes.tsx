import { RoleGuard } from '../components/auth/RoleGuard';
import Checkout from '../pages/Checkout';
import MyAccount from '../pages/MyAccount';

export const customerRoutes = [
  {
    path: "account/*",
    element: (
      <RoleGuard allowedRoles={['user', 'shop_manager', 'super_admin']} redirectTo="/login">
        <MyAccount />
      </RoleGuard>
    )
  },
  {
    path: "my-account/*",
    element: (
      <RoleGuard allowedRoles={['user', 'shop_manager', 'super_admin']} redirectTo="/login">
        <MyAccount />
      </RoleGuard>
    )
  },
  {
    path: "checkout",
    element: (
      <RoleGuard allowedRoles={['user', 'shop_manager', 'super_admin']} redirectTo="/login">
        <Checkout />
      </RoleGuard>
    )
  },
];
