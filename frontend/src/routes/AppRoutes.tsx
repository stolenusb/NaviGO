import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import CustomerSignupSuccessPage from '../pages/auth/CustomerSignupSuccessPage';
import LoginSuccessPage from '../pages/auth/LoginSuccessPage';
import PartnerSignupSuccessPage from '../pages/auth/PartnerSignupSuccessPage';
import LogoutPage from '../pages/auth/LogoutPage';
import LoginPage from '../pages/auth/LoginPage';
import HomePage from '../pages/HomePage';
import SignUpCustomerPage from '../pages/auth/SignUpCustomerPage';
import SignUpPage from '../pages/auth/SignUpPage';
import SignUpPartnerPage from '../pages/auth/SignUpPartnerPage';
import AuthRouteGuard from '../components/auth/AuthRouteGuard';
import RoleRouteGuard from '../components/auth/RoleRouteGuard';
import MainNavbar from '../components/navigation/MainNavbar';
import CustomerDashboardPage from '../pages/dashboard/CustomerDashboardPage';
import PartnerDashboardPage from '../pages/dashboard/PartnerDashboardPage';
import PartnerHistoryPage from '../pages/dashboard/PartnerHistoryPage';
import PartnerRoutesPage from '../pages/dashboard/PartnerRoutesPage';
import PartnerVehiclesPage from '../pages/dashboard/PartnerVehiclesPage';
import AdminDashboardPage from '../pages/dashboard/AdminDashboardPage';
import ReservationHistoryPage from '../pages/reservations/ReservationHistoryPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';

function AppShell() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup') || location.pathname === '/logout';
  const state = location.state as { backgroundLocation?: typeof location } | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      {!isAuthPage ? <MainNavbar /> : null}
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route
          path="/profile"
          element={
            <AuthRouteGuard>
              <ProfilePage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <AuthRouteGuard>
              <SettingsPage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/dashboard/customer"
          element={
            <AuthRouteGuard>
              <RoleRouteGuard allowedRoles={['customer']}>
                <CustomerDashboardPage />
              </RoleRouteGuard>
            </AuthRouteGuard>
          }
        />
        <Route
          path="/dashboard/customer/history"
          element={
            <AuthRouteGuard>
              <RoleRouteGuard allowedRoles={['customer']}>
                <ReservationHistoryPage />
              </RoleRouteGuard>
            </AuthRouteGuard>
          }
        />
        <Route
          path="/dashboard/partner"
          element={
            <AuthRouteGuard>
              <RoleRouteGuard allowedRoles={['partner']}>
                <PartnerDashboardPage />
              </RoleRouteGuard>
            </AuthRouteGuard>
          }
        />
        <Route
          path="/dashboard/partner/history"
          element={
            <AuthRouteGuard>
              <RoleRouteGuard allowedRoles={['partner']}>
                <PartnerHistoryPage />
              </RoleRouteGuard>
            </AuthRouteGuard>
          }
        />
        <Route path="/dashboard/partner/routes" element={<AuthRouteGuard><RoleRouteGuard allowedRoles={['partner']}><PartnerRoutesPage /></RoleRouteGuard></AuthRouteGuard>} />
        <Route path="/dashboard/partner/vehicles" element={<AuthRouteGuard><RoleRouteGuard allowedRoles={['partner']}><PartnerVehiclesPage /></RoleRouteGuard></AuthRouteGuard>} />
        <Route
          path="/dashboard/admin"
          element={
            <AuthRouteGuard>
              <RoleRouteGuard allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRouteGuard>
            </AuthRouteGuard>
          }
        />
        <Route
          path="/signup"
          element={<SignUpPage />}
        />
        <Route
          path="/signup/customer"
          element={<SignUpCustomerPage />}
        />
        <Route
          path="/signup/customer/success"
          element={<CustomerSignupSuccessPage />}
        />
        <Route
          path="/signup/partner"
          element={<SignUpPartnerPage />}
        />
        <Route
          path="/signup/partner/success"
          element={<PartnerSignupSuccessPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
