import { RoleGuard } from '../components/auth/RoleGuard';
import ShopManager from '../pages/ShopManager';

export const shopManagerRoutes = [
  {
    path: "shop-manager/*",
    element: (
      <RoleGuard allowedRoles={['shop_manager', 'super_admin']} redirectTo="/login">
        <ShopManager />
      </RoleGuard>
    )
  },
];
