import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type ApiError } from '../../services/api/client';

type City = { id?: number; '@id'?: string; name?: string; label?: string; title?: string };
type RouteCity = { id?: number; '@id'?: string; name?: string; label?: string; title?: string };
type Route = { id?: number; '@id'?: string; departureCity?: RouteCity | string | number; destinationCity?: RouteCity | string | number; trips?: unknown[] };
type Trip = { route?: string | { id?: number; '@id'?: string; departureCity?: { name?: string }; destinationCity?: { name?: string } } | null };

const iri = (item: { '@id'?: string; id?: number }, type: string) => {
  if (item['@id']) return item['@id'];
  return item.id ? `/${type}/${item.id}` : '';
};
const cityIri = (city: City) => iri(city, 'cities');
const cityId = (city?: RouteCity | string | number) => {
  if (typeof city === 'number') return String(city);
  if (typeof city !== 'string') return city?.id ? String(city.id) : city?.['@id']?.split('/').pop() ?? '';
  return city.split('/').pop() ?? city;
};
const cityName = (city: RouteCity | string | number | undefined, cities: City[]) => {
  if (typeof city === 'number') {
    const match = cities.find((item) => cityId(item) === String(city));
    return match?.name ?? match?.label ?? match?.title ?? `City ${city}`;
  }
  if (typeof city !== 'string') return city?.name ?? city?.label ?? city?.title ?? (city?.id ? `City ${city.id}` : 'Unknown city');
  const id = cityId(city);
  const match = cities.find((item) => cityId(item) === id || item['@id'] === city);
  return match?.name ?? match?.label ?? match?.title ?? (Number.isNaN(Number(id)) ? city : `City ${id}`);
};
const items = <T,>(response: T[] | { member?: T[]; 'hydra:member'?: T[] }) => Array.isArray(response) ? response : response.member ?? response['hydra:member'] ?? [];

export default function PartnerRoutesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState({ departureCity: '', destinationCity: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [cityResponse, routeResponse, tripResponse] = await Promise.all([apiClient.getCities(), apiClient.getPartnerRoutes(), apiClient.getPartnerTrips()]);
    setCities(items(cityResponse));
    setRoutes(items(routeResponse));
    setTrips(items(tripResponse));
  };

  useEffect(() => { void load().catch((error: ApiError) => setMessage(error.message)); }, []);

  const usedRouteIds = useMemo(() => new Set(trips.map((trip) => typeof trip.route === 'string' ? trip.route : trip.route ? iri(trip.route, 'routes') : '').filter(Boolean)), [trips]);
  const editingRoute = editing ? routes.find((route) => iri(route, 'routes') === editing) : undefined;
  const cityReference = (city: RouteCity | string | number | undefined) => {
    if (typeof city === 'object' && city) return city['@id'] ?? (city.id ? `/api/cities/${city.id}` : '');
    if (!city) return '';
    if (typeof city === 'number') return `/api/cities/${city}`;
    return city.startsWith('/api/cities/') ? city : `/api/cities/${cityId(city)}`;
  };
  const reset = () => { setForm({ departureCity: '', destinationCity: '' }); setEditing(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const payload = { departureCity: cityReference(form.departureCity), destinationCity: cityReference(form.destinationCity) };
      if (editing) await apiClient.updateRoute(editing, payload); else await apiClient.createRoute(payload);
      await load(); reset(); setMessage(editing ? 'Route updated successfully.' : 'Route created successfully.');
    } catch (error) { setMessage((error as ApiError).message || 'Unable to save route.'); } finally { setBusy(false); }
  };
  const remove = async (route: Route) => {
    const routeIri = iri(route, 'routes');
    if (usedRouteIds.has(routeIri) || !window.confirm('Delete this route?')) return;
    setBusy(true); setMessage(null);
    try { await apiClient.deleteRoute(routeIri); await load(); setMessage('Route deleted successfully.'); }
    catch (error) { setMessage((error as ApiError).message || 'Unable to delete route.'); } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Link to="/dashboard/partner" className="text-sm text-blue-600">← Partner dashboard</Link><h1 className="mt-2 text-3xl font-semibold text-gray-950">Route management</h1><p className="mt-2 text-gray-600">Create, edit, and review your routes. Routes used by trips cannot be deleted.</p></div><Link to="/dashboard/partner/vehicles" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">Manage vehicles</Link></div>
    {message && <p className="whitespace-pre-line rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p>}
    <form onSubmit={submit} className={`space-y-4 rounded-3xl border bg-white p-5 shadow-sm ${editing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{editing ? 'Editing existing route' : 'New route'}</p><h2 className="mt-1 text-lg font-semibold text-gray-950">{editing ? `Modify ${cityName(editingRoute?.departureCity, cities)} → ${cityName(editingRoute?.destinationCity, cities)}` : 'Create a route'}</h2><p className="mt-1 text-sm text-gray-600">{editing ? 'Update the selected route below, then save your changes.' : 'Choose the departure and destination cities.'}</p></div>{editing && <button type="button" onClick={reset} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel editing</button>}</div>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"><select required value={form.departureCity} onChange={(event) => setForm({ ...form, departureCity: event.target.value })} className="rounded-xl border border-gray-300 px-3 py-2"><option value="">Departure city</option>{cities.map((city) => <option key={cityIri(city)} value={cityIri(city)}>{city.name ?? city.label ?? city.title}</option>)}</select><select required value={form.destinationCity} onChange={(event) => setForm({ ...form, destinationCity: event.target.value })} className="rounded-xl border border-gray-300 px-3 py-2"><option value="">Destination city</option>{cities.map((city) => <option key={cityIri(city)} value={cityIri(city)}>{city.name ?? city.label ?? city.title}</option>)}</select><button disabled={busy} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{editing ? 'Save route changes' : 'Create route'}</button></div>
    </form>
    <section className="grid gap-4 md:grid-cols-2">{routes.map((route) => { const routeIri = iri(route, 'routes'); const used = usedRouteIds.has(routeIri); const departure = cityReference(route.departureCity); const destination = cityReference(route.destinationCity); return <article key={routeIri} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-950">{cityName(route.departureCity, cities)} → {cityName(route.destinationCity, cities)}</h2><p className="mt-2 text-sm text-gray-600">{used ? 'Used by a trip' : 'Not used by any trip'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${used ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{used ? 'In use' : 'Available'}</span></div><div className="mt-5 flex gap-2"><button onClick={() => { setEditing(routeIri); setForm({ departureCity: departure, destinationCity: destination }); }} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">Edit</button><button disabled={busy || used} onClick={() => void remove(route)} title={used ? 'A route used by a trip cannot be deleted.' : undefined} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Delete</button></div></article>; })}</section>
  </div></main>;
}