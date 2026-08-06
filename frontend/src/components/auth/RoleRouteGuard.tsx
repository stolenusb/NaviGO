import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSessionRole } from '../../services/session';

type RoleRouteGuardProps = {
  allowedRoles: Array<'customer' | 'partner' | 'admin'>;
  children: ReactNode;
};

export default function RoleRouteGuard({ allowedRoles, children }: RoleRouteGuardProps) {
  const location = useLocation();
  const role = getSessionRole();

  if (!allowedRoles.includes(role)) {
    const fallbackPath = role === 'partner' ? '/dashboard/partner' : role === 'admin' ? '/dashboard/admin' : '/dashboard/customer';
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}