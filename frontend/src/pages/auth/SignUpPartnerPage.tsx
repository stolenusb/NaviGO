import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import AuthField from '../../components/forms/AuthField';

export default function SignUpPartnerPage() {
  return (
    <AuthLayout cardClassName="max-w-xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-normal text-black sm:text-[2.5rem]">Partner Registration</h1>
        <AuthField label="Email" type="email" />
        <AuthField label="Password" type="password" />
        <AuthField label="Confirm Password" type="password" />
        <AuthField label="Phone" type="tel" />
        <AuthField label="Company Name" />
        <AuthField label="Address" />
        <AuthButton>Sign Up</AuthButton>
      </div>
    </AuthLayout>
  );
}
