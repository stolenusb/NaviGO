import { Link } from 'react-router-dom';
import { getSessionDisplayName } from '../../services/session';

export default function CustomerDashboardPage() {
  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Customer dashboard</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Welcome back, {getSessionDisplayName()}</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your bookings and review your upcoming trips.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Search trips</Link>
            <Link to="/dashboard/customer/settings" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Account Settings</Link>
          </div>
        </section>
      </div>
    </main>
  );
}