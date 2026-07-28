import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type AuthRouteGuardProps = {
  children: ReactNode;
};

export default function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const location = useLocation();
  const token = localStorage.getItem('jwt');

  if (token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}