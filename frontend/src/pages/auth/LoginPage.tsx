import { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import AuthField from '../../components/forms/AuthField';
import AuthLink from '../../components/ui/AuthLink';
import { apiClient } from '../../services/api/client';
import { useNavigate } from 'react-router-dom';

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
      localStorage.setItem('email', email);
      navigate('/login/success', { state: { email }, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
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
          {loading ? 'Signing In...' : 'Sign In'}
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