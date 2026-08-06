import { Link } from 'react-router-dom';
import { getSessionDisplayName, getSessionRole } from '../services/session';

export default function ProfilePage() {
  const role = getSessionRole();
  const dashboardPath = role === 'partner' ? '/dashboard/partner' : role === 'admin' ? '/dashboard/admin' : '/dashboard/customer';

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Profile</p>
        <h1 className="mt-2 text-2xl font-normal text-black">{getSessionDisplayName()}</h1>
        <p className="mt-2 text-sm text-gray-600">This is the first-pass profile area for your account details.</p>

        <div className="mt-6 space-y-3 text-sm text-gray-700">
          <div><span className="font-medium">Role:</span> {role}</div>
          <div><span className="font-medium">Email:</span> {localStorage.getItem('email') ?? 'Unknown'}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={dashboardPath} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Go to dashboard</Link>
          <Link to="/logout" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Logout</Link>
        </div>
      </div>
    </main>
  );
}