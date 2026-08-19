import { getSessionDisplayName } from '../../services/session';

export default function AdminDashboardPage() {
  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Administrator dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Platform management for {getSessionDisplayName()}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Oversee users, routes, cities, and the operational health of the NaviGO platform.</p>
            </div>
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Administrator</span>
          </div>
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