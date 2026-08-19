import { useEffect, useMemo, useState } from 'react';
import { apiClient, type ApiError } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';

type Customer = { id?: number; '@id'?: string; firstName?: string; lastName?: string; email?: string; phone?: string; createdAt?: string };
type Partner = { id?: number; '@id'?: string; companyName?: string; email?: string; phone?: string; status?: string };

const items = <T,>(response: T[] | { member?: T[]; 'hydra:member'?: T[] }) => Array.isArray(response) ? response : response.member ?? response['hydra:member'] ?? [];
const iri = (resource: { id?: number; '@id'?: string }, type: string) => resource['@id'] ?? (resource.id ? `/api/${type}/${resource.id}` : '');

export default function AdminDashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'customers' | 'partners'>('overview');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [customerResponse, partnerResponse] = await Promise.all([apiClient.getAdminCustomers(), apiClient.getAdminPartners()]);
      setCustomers(items(customerResponse));
      setPartners(items(partnerResponse));
    } catch (error) { setMessage((error as ApiError).message || 'Unable to load administrator data.'); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filteredCustomers = useMemo(() => customers.filter((customer) => `${customer.firstName ?? ''} ${customer.lastName ?? ''} ${customer.email ?? ''} ${customer.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const filteredPartners = useMemo(() => partners.filter((partner) => `${partner.companyName ?? ''} ${partner.email ?? ''} ${partner.phone ?? ''} ${partner.status ?? ''}`.toLowerCase().includes(search.toLowerCase())), [partners, search]);
  const updatePartner = async (partner: Partner, action: 'approve' | 'reject') => {
    const partnerIri = iri(partner, 'partners');
    if (!partnerIri || !window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this partner?`)) return;
    setBusy(partnerIri); setMessage(null);
    try { if (action === 'approve') await apiClient.approvePartner(partnerIri); else await apiClient.rejectPartner(partnerIri); await load(); setMessage(`Partner ${action}d successfully.`); } catch (error) { setMessage((error as ApiError).message || `Unable to ${action} partner.`); } finally { setBusy(null); }
  };

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
          {[['Customers', customers.length], ['Partners', partners.length], ['Pending partners', partners.filter((partner) => partner.status === 'pending').length], ['Total users', customers.length + partners.length]].map(([label, value]) => <article key={label} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">{label}</p><p className="mt-2 text-3xl font-semibold text-gray-950">{loading ? '—' : value}</p></article>)}
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4"><button onClick={() => setTab('overview')} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'overview' ? 'bg-slate-900 text-white' : 'border border-gray-300'}`}>Overview</button><button onClick={() => setTab('customers')} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'customers' ? 'bg-slate-900 text-white' : 'border border-gray-300'}`}>Customers</button><button onClick={() => setTab('partners')} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'partners' ? 'bg-slate-900 text-white' : 'border border-gray-300'}`}>Partners</button></div>
          {tab !== 'overview' && <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab}...`} className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />}
          {tab === 'overview' && <p className="pt-5 text-sm text-gray-600">Use the tabs to review registered customers and manage partner registrations.</p>}
          {loading && tab !== 'overview' ? <p className="pt-5 text-sm text-gray-600">Loading records...</p> : null}
          {tab === 'customers' && <div className="mt-4 divide-y divide-gray-100">{filteredCustomers.map((customer) => <div key={iri(customer, 'customers')} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium text-gray-950">{customer.firstName} {customer.lastName}</p><p className="text-sm text-gray-600">{customer.email} · {customer.phone}</p></div><span className="text-xs text-gray-500">Customer</span></div>)}{!filteredCustomers.length && <p className="py-5 text-sm text-gray-600">No customers found.</p>}</div>}
          {tab === 'partners' && <div className="mt-4 divide-y divide-gray-100">{filteredPartners.map((partner) => <div key={iri(partner, 'partners')} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium text-gray-950">{partner.companyName}</p><p className="text-sm text-gray-600">{partner.email} · {partner.phone}</p><span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{partner.status ?? 'unknown'}</span></div>{partner.status === 'pending' && <div className="flex gap-2"><button disabled={busy !== null} onClick={() => void updatePartner(partner, 'approve')} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busy !== null} onClick={() => void updatePartner(partner, 'reject')} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button></div>}</div>)}{!filteredPartners.length && <p className="py-5 text-sm text-gray-600">No partners found.</p>}</div>}
        </section>
      </div>
    </main>
  );
}