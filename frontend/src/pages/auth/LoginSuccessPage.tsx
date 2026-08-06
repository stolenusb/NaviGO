import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Spinner } from '#components/ui/spinner';

type LocationState = {
  email?: string;
};

export default function LoginSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const email = state?.email;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [email, navigate]);

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-normal text-black sm:text-[2.5rem]">Login Successful</h1>
        <p className="text-sm text-gray-700">
          {email ? <>Successfully logged in as {email}.</> : 'Successfully logged in.'}
        </p>
        <p className="text-sm text-gray-700">Redirecting to home...</p>
        {<Spinner/>}
        <div className="pt-2">
          <Link to="/" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
            Go to home now
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}