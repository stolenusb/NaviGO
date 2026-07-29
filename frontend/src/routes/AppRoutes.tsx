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
import MainNavbar from '../components/navigation/MainNavbar';

function AppShell() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup') || location.pathname === '/logout';

  return (
    <>
      {!isAuthPage ? <MainNavbar /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <AuthRouteGuard>
              <LoginPage />
            </AuthRouteGuard>
          }
        />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route
          path="/signup"
          element={
            <AuthRouteGuard>
              <SignUpPage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/signup/customer"
          element={
            <AuthRouteGuard>
              <SignUpCustomerPage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/signup/customer/success"
          element={
            <AuthRouteGuard>
              <CustomerSignupSuccessPage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/signup/partner"
          element={
            <AuthRouteGuard>
              <SignUpPartnerPage />
            </AuthRouteGuard>
          }
        />
        <Route
          path="/signup/partner/success"
          element={
            <AuthRouteGuard>
              <PartnerSignupSuccessPage />
            </AuthRouteGuard>
          }
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
