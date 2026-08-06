import { getSessionDisplayName } from '../../services/session';

export default function PartnerDashboardPage() {
  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Partner dashboard</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Operations overview for {getSessionDisplayName()}</h1>
          <p className="mt-2 text-sm text-gray-600">This area is ready for trips, reservations, and fleet management features.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Active trips</h2><p className="mt-2 text-sm text-gray-600">Summary cards for live and scheduled trips.</p></article>
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Seat occupancy</h2><p className="mt-2 text-sm text-gray-600">Trip-level capacity and availability will be connected here.</p></article>
          <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Partner actions</h2><p className="mt-2 text-sm text-gray-600">Start, complete, and cancel trip controls can live here.</p></article>
        </section>
      </div>
    </main>
  );
}