import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

export default function PartnerSignupSuccessPage() {
  return (
    <AuthLayout cardClassName="max-w-xl">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-normal text-black sm:text-[2.5rem]">Registration Successful</h1>
        <p className="text-base text-gray-700">You have successfully been registered. But your account is still awaiting partnership approval by an Admin.</p>
        <p className="text-base text-gray-700">
          Click{' '}
          <Link to="/login" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
            here
          </Link>{' '}
          to login.
        </p>
      </div>
    </AuthLayout>
  );
}