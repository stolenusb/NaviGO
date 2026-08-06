import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import AuthButton from '../../components/ui/AuthButton';
import AuthField from '../../components/forms/AuthField';
import { apiClient } from '../../services/api/client';
import { Spinner } from '#components/ui/spinner';

export default function SignUpPartnerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    address: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await apiClient.registerPartner({
        ...form,
        plainPassword: form.password,
      });
      navigate('/signup/partner/success');
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setError(err.message);
      } else {
        setError('Unable to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout cardClassName="max-w-xl">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <h1 className="text-3xl text-center font-normal text-black sm:text-[2.5rem]">Partner Registration</h1>
        <AuthField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <AuthField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <AuthField label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <AuthField label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <AuthField label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <AuthField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <AuthField
          label="Description"
          as="textarea"
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {error ? (
          <div className="mb-6 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <AuthButton type="submit" disabled={loading}>
          {loading ? <Spinner/> : 'Sign Up'}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
