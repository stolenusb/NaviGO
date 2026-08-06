import { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import AuthField from '../../components/forms/AuthField';
import AuthLink from '../../components/ui/AuthLink';
import { apiClient } from '../../services/api/client';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '#components/ui/spinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.login(email, password);
      localStorage.setItem('jwt', response.token);
      
      const currentUser = await apiClient.me();
      if (currentUser.accountType) localStorage.setItem('accountType', currentUser.accountType);
      if (currentUser.email) localStorage.setItem('email', currentUser.email);
      if (currentUser.firstName) localStorage.setItem('firstName', currentUser.firstName);
      if (currentUser.lastName) localStorage.setItem('lastName', currentUser.lastName);
      if (currentUser.companyName) localStorage.setItem('companyName', currentUser.companyName);
      if (currentUser.id) localStorage.setItem('userId', String(currentUser.id));

      window.dispatchEvent(new Event('auth-change'));
      navigate('/login/success', { state: { email }, replace: true });
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <AuthField label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AuthButton type="submit" disabled={loading}>
          {loading ? <Spinner /> : 'Sign In'}
        </AuthButton>

        <div className="space-y-2 pt-1">
          <AuthLink href="#">Forgot password?</AuthLink>
          <div>
            <AuthLink href="/signup">Create an account</AuthLink>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}