import { useEffect, useMemo, useState } from 'react';
import { apiClient, type ApiError } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';

type Resource = Record<string, any>;
type Tab = 'overview' | 'customers' | 'partners' | 'admins' | 'trips' | 'routes' | 'vehicles' | 'reservations';

const items = (response: any): Resource[] => Array.isArray(response) ? response : response?.member ?? response?.['hydra:member'] ?? [];
const iri = (resource: Resource, type: string) => resource['@id'] ?? (resource.id ? `/api/${type}/${resource.id}` : '');
const label = (resource: Resource, tab: Tab) => {
  if (tab === 'customers' || tab === 'admins') return `${resource.firstName ?? ''} ${resource.lastName ?? ''}`.trim() || resource.email;
  if (tab === 'partners') return resource.companyName ?? resource.email;
  if (tab === 'routes') return `${resource.departureCity?.name ?? resource.departureCity ?? '?'} → ${resource.destinationCity?.name ?? resource.destinationCity ?? '?'}`;
  if (tab === 'vehicles') return `${resource.brand ?? 'Vehicle'} · ${resource.licensePlate ?? 'No plate'}`;
  if (tab === 'trips') return `Trip #${resource.id ?? '?'} · ${resource.departureTime ? new Date(resource.departureTime).toLocaleString() : 'No departure time'}`;
  if (tab === 'reservations') return `Reservation #${resource.id ?? '?'} · ${resource.status ?? 'unknown'}`;
  return resource.email ?? `Record #${resource.id ?? '?'}`;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Record<string, Resource[]>>({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createType, setCreateType] = useState<'customer' | 'partner' | 'admin'>('customer');
  const [form, setForm] = useState({ email: '', password: '', phone: '', firstName: '', lastName: '', companyName: '', address: '', description: '' });

  const load = async () => {
    setBusy(true);
    try {
      const [customers, partners, admins, trips, routes, vehicles, reservations] = await Promise.all([apiClient.getAdminCustomers(), apiClient.getAdminPartners(), apiClient.getAdminAdministrators(), apiClient.getAdminTrips(), apiClient.getAdminRoutes(), apiClient.getAdminVehicles(), apiClient.getAdminReservations()]);
      setData({ customers: items(customers), partners: items(partners), admins: items(admins), trips: items(trips), routes: items(routes), vehicles: items(vehicles), reservations: items(reservations) });
    } catch (error) { setMessage((error as ApiError).message || 'Unable to load administrator data.'); } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  const records = data[tab] ?? [];
  const filtered = useMemo(() => records.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase())), [records, search]);
  const resourceType = tab === 'admins' ? 'administrators' : tab;
  const deleteRecord = async (record: Resource) => { const resourceIri = iri(record, resourceType); if (!resourceIri || !window.confirm(`Delete ${label(record, tab)}?`)) return; try { await apiClient.deleteAdminResource(resourceIri); await load(); setMessage('Record deleted successfully.'); } catch (error) { setMessage((error as ApiError).message || 'Unable to delete record.'); } };
  const updateRecord = async (record: Resource) => { const resourceIri = iri(record, resourceType); const value = window.prompt('Enter a JSON object containing the fields to update:', '{"phone":""}'); if (!resourceIri || !value) return; try { await apiClient.updateCurrentUser(resourceIri, JSON.parse(value)); await load(); setMessage('Record updated successfully.'); } catch (error) { setMessage((error as ApiError).message || 'Invalid update payload.'); } };
  const createUser = async (event: React.FormEvent) => { event.preventDefault(); try { await apiClient.createAdminUser({ ...form, accountType: createType }); setForm({ email: '', password: '', phone: '', firstName: '', lastName: '', companyName: '', address: '', description: '' }); await load(); setMessage(`${createType} account created successfully.`); } catch (error) { setMessage((error as ApiError).message || 'Unable to create account.'); } };
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

        {message && <p className="whitespace-pre-line rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p>}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['customers', 'partners', 'trips', 'reservations'] as const).map((key) => <article key={key} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm capitalize text-gray-600">{key}</p><p className="mt-2 text-3xl font-semibold text-gray-950">{data[key]?.length ?? '—'}</p></article>)}
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">{(['overview', 'customers', 'partners', 'admins', 'trips', 'routes', 'vehicles', 'reservations'] as const).map((key) => <button key={key} onClick={() => { setTab(key); setSearch(''); }} className={`rounded-full px-3 py-2 text-sm font-semibold capitalize ${tab === key ? 'bg-slate-900 text-white' : 'border border-gray-300'}`}>{key}</button>)}</div>
          {tab === 'overview' ? <div className="grid gap-6 pt-6 lg:grid-cols-2"><div><h2 className="text-lg font-semibold">Create an account</h2><form onSubmit={createUser} className="mt-4 space-y-3"><select value={createType} onChange={(event) => setCreateType(event.target.value as typeof createType)} className="w-full rounded-xl border border-gray-300 px-3 py-2"><option value="customer">Customer</option><option value="partner">Partner</option><option value="admin">Administrator</option></select><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /><input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /><input required placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" />{createType === 'partner' ? <><input required placeholder="Company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /><input required placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /><textarea required minLength={10} placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /></> : <><input required placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /><input required placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2" /></>}<button disabled={busy} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Create account</button></form></div><p className="pt-1 text-sm leading-6 text-gray-600">Use the tabs to inspect and manage every user, partner, trip, route, vehicle, and reservation. Edit opens a JSON field editor so all API-exposed settings can be changed without exposing password hashes.</p></div> : <><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab}...`} className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /><div className="mt-4 divide-y divide-gray-100">{filtered.map((record) => <div key={iri(record, resourceType)} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium text-gray-950">{label(record, tab)}</p><p className="text-sm text-gray-600">{record.email ?? record.status ?? record.phone ?? ''}</p></div><div className="flex gap-2">{tab === 'partners' && record.status === 'pending' && <><button disabled={busy} onClick={async () => { await apiClient.approvePartner(iri(record, 'partners')); await load(); }} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={async () => { await apiClient.rejectPartner(iri(record, 'partners')); await load(); }} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Reject</button></>}<button disabled={busy} onClick={() => void updateRecord(record)} className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold">Edit</button><button disabled={busy} onClick={() => void deleteRecord(record)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></div></div>)}{!filtered.length && <p className="py-5 text-sm text-gray-600">No records found.</p>}</div></>}
        </section>
      </div>
    </main>
  );
}