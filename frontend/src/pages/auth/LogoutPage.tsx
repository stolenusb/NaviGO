import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

export default function LogoutPage() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Logging out...');

  useEffect(() => {
    const token = localStorage.getItem('jwt');

    if (!token) {
      setStatus('error');
      setMessage('Failed to log out. You are not logged in.');
      return;
    }

    localStorage.clear();
    sessionStorage.setItem('logoutCompleted', 'true');
    setStatus('success');
    setMessage('Successfully logged out. Redirecting to home...');

    redirectTimerRef.current = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
  }, []);

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-normal text-black sm:text-[2.5rem]">Logout</h1>
        <p className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-gray-700'}>{message}</p>

        {status === 'success' ? (
          <div className="pt-2">
            <Link to="/" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
              Go to home now
            </Link>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="pt-2">
            <Link to="/login" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
              Go to login
            </Link>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}