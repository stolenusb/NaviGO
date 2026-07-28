import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import AuthField from '../../components/forms/AuthField';
import AuthLink from '../../components/ui/AuthLink';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <AuthField label="Email" type="email" />
        <AuthField label="Password" type="password" />
        <AuthButton>Sign In</AuthButton>

        <div className="space-y-2 pt-1">
          <AuthLink href="#">Forgot password?</AuthLink>
          <div>
            <AuthLink href="/signup">Create an account</AuthLink>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}