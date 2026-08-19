import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { getSessionRole } from '../services/session';
import AuthField from '../components/forms/AuthField';

type Role = 'admin' | 'partner' | 'customer';

type Account = {
  '@id'?: string;
  id?: number;
  email?: string;
  accountType?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  description?: string;
  createdAt?: string;
};

type AccountForm = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: string;
  description: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: AccountForm = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  companyName: '',
  address: '',
  description: '',
  currentPassword: '',
  password: '',
  confirmPassword: '',
};

const getRoleLabel = (role: Role) => (role === 'admin' ? 'Administrator' : role === 'partner' ? 'Partner' : 'Customer');

const getResourceIri = (account: Account, role: Role) => {
  if (account['@id']) return account['@id'];
  if (typeof account.id !== 'number') return null;
  return `/api/${role === 'admin' ? 'administrators' : `${role}s`}/${account.id}`;
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unable to update your account.';
};

export default function SettingsPage() {
  const role = getSessionRole();
  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dashboardPath = useMemo(
    () => (role === 'partner' ? '/dashboard/partner' : role === 'admin' ? '/dashboard/admin' : '/dashboard/customer'),
    [role],
  );

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const data = await apiClient.getCurrentUser();
        setAccount(data);
        setForm({
          email: data.email ?? '',
          phone: data.phone ?? '',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          companyName: data.companyName ?? '',
          address: data.address ?? '',
          description: data.description ?? '',
          currentPassword: '',
          password: '',
          confirmPassword: '',
        });
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadAccount();
  }, []);

  const updateField = (field: keyof AccountForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email.trim() || !form.phone.trim()) {
      setError('Email and phone number are required.');
      return;
    }

    if (role !== 'partner' && (!form.firstName.trim() || !form.lastName.trim())) {
      setError('First name and last name are required.');
      return;
    }

    if (role === 'partner' && (!form.companyName.trim() || form.description.trim().length < 10)) {
      setError('Company name is required and the description must contain at least 10 characters.');
      return;
    }

    if (form.password || form.confirmPassword) {
      if (!form.currentPassword) {
        setError('Enter your current password before choosing a new password.');
        return;
      }
      if (form.password.length < 8) {
        setError('The new password must be at least 8 characters long.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    const iri = account ? getResourceIri(account, role) : null;
    if (!iri) {
      setError('Your account resource could not be identified.');
      return;
    }

    const payload: Record<string, unknown> = {
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    if (form.password) {
      payload.currentPassword = form.currentPassword;
      payload.plainPassword = form.password;
    }

    if (role === 'partner') {
      payload.companyName = form.companyName.trim();
      payload.address = form.address.trim();
      payload.description = form.description.trim();
    } else {
      payload.firstName = form.firstName.trim();
      payload.lastName = form.lastName.trim();
    }

    setSaving(true);
    try {
      const updated = await apiClient.updateCurrentUser(iri, payload);
      const updatedAccount = { ...account, ...updated, email: form.email.trim(), phone: form.phone.trim() } as Account;
      setAccount(updatedAccount);
      setForm((current) => ({ ...current, currentPassword: '', password: '', confirmPassword: '' }));
      localStorage.setItem('email', form.email.trim());
      localStorage.setItem('phone', form.phone.trim());
      if (role === 'partner') {
        localStorage.setItem('companyName', form.companyName.trim());
      } else {
        localStorage.setItem('firstName', form.firstName.trim());
        localStorage.setItem('lastName', form.lastName.trim());
      }
      window.dispatchEvent(new Event('auth-change'));
      setSuccess('Your account details have been saved.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Account settings</p>
                <h1 className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">Manage your account</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Update the information connected to your {getRoleLabel(role).toLowerCase()} account.
                </p>
              </div>
              <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                {getRoleLabel(role)}
              </span>
            </div>
          </div>

          <form className="space-y-8 p-6 sm:p-10" onSubmit={handleSubmit}>
            {loading ? <p className="text-sm text-gray-500">Loading your account details...</p> : null}
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            {!loading ? (
              <>
                <section>
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">Personal information</h2>
                    <p className="mt-1 text-sm text-gray-500">Keep your contact details current.</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email address" type="email" value={form.email} onChange={(value) => updateField('email', value)} />
                    <Field label="Phone number" type="tel" value={form.phone} onChange={(value) => updateField('phone', value)} />
                    {role !== 'partner' ? (
                      <>
                        <Field label="First name" value={form.firstName} onChange={(value) => updateField('firstName', value)} />
                        <Field label="Last name" value={form.lastName} onChange={(value) => updateField('lastName', value)} />
                      </>
                    ) : null}
                  </div>
                </section>

                {role === 'partner' ? (
                  <section className="border-t border-gray-100 pt-8">
                    <div className="mb-5">
                      <h2 className="text-lg font-semibold text-gray-900">Business profile</h2>
                      <p className="mt-1 text-sm text-gray-500">These details are shown as part of your partner profile.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Company name" value={form.companyName} onChange={(value) => updateField('companyName', value)} />
                      <Field label="Address" value={form.address} onChange={(value) => updateField('address', value)} />
                      <Field label="Description" as="textarea" rows={5} value={form.description} onChange={(value) => updateField('description', value)} className="sm:col-span-2" />
                    </div>
                  </section>
                ) : null}

                <section className="border-t border-gray-100 pt-8">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
                    <p className="mt-1 text-sm text-gray-500">Leave these fields empty to keep your current password.</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <AuthField label="Current password" type="password" value={form.currentPassword} onChange={(event) => updateField('currentPassword', event.target.value)} autoComplete="current-password" required={Boolean(form.password || form.confirmPassword)} />
                    <AuthField label="New password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} autoComplete="new-password" required={false} />
                    <AuthField label="Confirm new password" type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} autoComplete="new-password" required={false} />
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={dashboardPath} className="text-center text-sm font-medium text-gray-600 hover:text-gray-900 sm:text-left">Back to dashboard</Link>
                  <button type="submit" disabled={saving} className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? 'Saving changes...' : 'Save changes'}
                  </button>
                </div>
              </>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  className?: string;
  autoComplete?: string;
};

function Field({ label, value, onChange, type = 'text', as = 'input', rows, className = '', autoComplete }: FieldProps) {
  const sharedClassName = `mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${className}`;

  return (
    <label className={className.includes('sm:col-span-2') ? className.replace('sm:col-span-2', '') : ''}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {as === 'textarea' ? (
        <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={sharedClassName} />
      ) : (
        <input type={type} value={value} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} className={sharedClassName} />
      )}
    </label>
  );
}