import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import SignUpCustomerPage from '../pages/auth/SignUpCustomerPage';
import SignUpPage from '../pages/auth/SignUpPage';
import SignUpPartnerPage from '../pages/auth/SignUpPartnerPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signup/customer" element={<SignUpCustomerPage />} />
        <Route path="/signup/partner" element={<SignUpPartnerPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
