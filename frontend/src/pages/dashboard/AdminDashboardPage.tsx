import { getSessionDisplayName } from '../../services/session';

export default function AdminDashboardPage() {
  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Administrator dashboard</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Platform management for {getSessionDisplayName()}</h1>
          <p className="mt-2 text-sm text-gray-600">This shell is ready for system-wide oversight and moderation tools.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Users and roles</h2><p className="mt-2 text-sm text-gray-600">Manage customer, partner, and admin access here.</p></article>
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Cities and routes</h2><p className="mt-2 text-sm text-gray-600">City and route management can be expanded from this section.</p></article>
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Platform health</h2><p className="mt-2 text-sm text-gray-600">Reservation volume and system metrics can be connected later.</p></article>
        </section>
      </div>
    </main>
  );
}