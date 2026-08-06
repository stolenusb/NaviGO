import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import { useNavigate } from 'react-router-dom';

export default function SignUpPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout cardClassName="max-w-5xl">
      <div className="flex flex-col items-center gap-10 text-center lg:gap-14">
        <h1 className="text-3xl font-normal text-black sm:text-5xl">Create an account as</h1>
        
        <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:gap-24">
          <AuthButton
            type="button"
            className="w-56 bg-[#d7d82f] text-black hover:bg-[#c8c91e]"
            onClick={() => navigate('/signup/customer')}
          >
            Customer
          </AuthButton>
          <AuthButton
            type="button"
            className="w-56 bg-[#9f5200] text-white hover:bg-[#874400]"
            onClick={() => navigate('/signup/partner')}
          >
            Partner
          </AuthButton>
        </div>
      </div>
    </AuthLayout>
  );
}