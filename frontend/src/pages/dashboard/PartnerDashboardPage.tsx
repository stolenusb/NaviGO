import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type ApiError } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';
import TripHistoryList from '../../components/trips/TripHistoryList';
import SeatSelection from '../../components/trips/SeatSelection';

type Trip = {
  id?: number;
  '@id'?: string;
  departureTime?: string;
  price?: number;
  status?: string;
  availableSeats?: number | null;
  route?: string | RouteDetails | { '@id'?: string; id?: number; departureCity?: { name?: string }; destinationCity?: { name?: string } } | null;
  vehicle?: string | VehicleDetails | { '@id'?: string; id?: number; brand?: string; seatCapacity?: number | null; driverName?: string } | null;
};

type Reservation = { trip?: { id?: number } | string; seatNumber?: number | null; status?: string };

type RouteDetails = { departureCity?: { name?: string }; destinationCity?: { name?: string } };
type VehicleDetails = { brand?: string; seatCapacity?: number | null; driverName?: string };
type Vehicle = { id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string };
type City = { id?: number; '@id'?: string; name?: string; label?: string; title?: string };
type Route = { id?: number; '@id'?: string; departureCity?: { name?: string } | string; destinationCity?: { name?: string } | string };

const ACTIVE_STATUSES = new Set(['scheduled', 'in_progress']);

const getTripIri = (trip: Trip) => trip['@id'] ?? (typeof trip.id === 'number' ? `/api/trips/${trip.id}` : undefined);

export default function PartnerDashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyTripIds, setBusyTripIds] = useState<number[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [tripForm, setTripForm] = useState({ route: '', vehicle: '', departureTime: '', price: '' });
  const [reservationForm, setReservationForm] = useState({ phone: '', trip: '', seatNumber: null as number | null });
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [reservationStep, setReservationStep] = useState<'details' | 'seat' | 'confirm'>('details');
  const [formBusy, setFormBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTrips = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getPartnerTrips();
        const items = Array.isArray(response) ? response : response['hydra:member'] ?? [];

        if (cancelled) return;
        setTrips(items);
        if (cancelled) return;
      } catch (err) {
        const apiError = err as ApiError;
        if (!cancelled) setError(apiError.message || 'Failed to load partner trips.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [cityResponse, vehicleResponse, routeResponse] = await Promise.all([
          apiClient.getCities(),
          apiClient.getPartnerVehicles(),
          apiClient.getPartnerRoutes(),
        ]);
        setCities(Array.isArray(cityResponse) ? cityResponse : cityResponse.member ?? cityResponse['hydra:member'] ?? []);
        setVehicles(Array.isArray(vehicleResponse) ? vehicleResponse : vehicleResponse.member ?? vehicleResponse['hydra:member'] ?? []);
        setRoutes(Array.isArray(routeResponse) ? routeResponse : routeResponse.member ?? routeResponse['hydra:member'] ?? []);
      } catch (err) {
        setActionMessage((err as ApiError).message || 'Unable to load cities, routes, or vehicles.');
      }
    };
    void loadFormData();
  }, []);

  const resourceIri = (resource: { '@id'?: string; id?: number }, type: string) => resource['@id'] ?? (resource.id ? `/api/${type}/${resource.id}` : '');
  const cityLabel = (city?: { name?: string } | string) => {
    if (typeof city !== 'string') return city?.name ?? '';
    const cityId = city.split('/').pop() ?? city;
    const match = cities.find((item) => item['@id'] === city || String(item.id) === cityId);
    return match?.name ?? match?.label ?? match?.title ?? cityId;
  };

  const createTrip = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormBusy('trip'); setActionMessage(null);
    try {
      await apiClient.createTrip({ departureTime: new Date(tripForm.departureTime).toISOString(), price: Number(tripForm.price), route: tripForm.route, vehicle: tripForm.vehicle });
      const response = await apiClient.getPartnerTrips();
      setTrips(Array.isArray(response) ? response : response['hydra:member'] ?? []);
      setTripForm({ route: '', vehicle: '', departureTime: '', price: '' });
      setActionMessage('Trip created successfully.');
    } catch (err) { setActionMessage((err as ApiError).message || 'Unable to create trip.'); } finally { setFormBusy(null); }
  };

  const grantReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reservationStep === 'details') {
      const trip = trips.find((item) => resourceIri(item, 'trips') === reservationForm.trip);
      if (!trip) return;
      setFormBusy('reservation'); setActionMessage(null);
      try {
        const response = await apiClient.getReservations();
        const reservations = Array.isArray(response) ? response : response['hydra:member'] ?? [];
        setReservedSeats(reservations.filter((item: Reservation) => {
          const tripId = typeof item.trip === 'string' ? Number(item.trip.split('/').pop()) : item.trip?.id;
          return tripId === trip.id && item.status !== 'cancelled' && typeof item.seatNumber === 'number';
        }).map((item: Reservation) => item.seatNumber as number));
        setReservationStep('seat');
      } catch (err) { setActionMessage((err as ApiError).message || 'Unable to load reserved seats.'); } finally { setFormBusy(null); }
      return;
    }
    if (reservationStep === 'seat') {
      if (reservationForm.seatNumber === null) { setActionMessage('Select a seat before continuing.'); return; }
      setReservationStep('confirm');
      return;
    }
    setFormBusy('reservation'); setActionMessage(null);
    try {
      const customer = await apiClient.findCustomerByPhone(reservationForm.phone.trim());
      const trip = trips.find((item) => resourceIri(item, 'trips') === reservationForm.trip);
      if (!customer.id || !trip?.id || reservationForm.seatNumber === null) throw new Error('Select a trip, customer, and seat.');
      await apiClient.createFreeReservation({ customerId: customer.id, tripId: trip.id, seatNumber: reservationForm.seatNumber });
      setReservationForm({ phone: '', trip: '', seatNumber: null });
      setReservationStep('details');
      setActionMessage(`Free reservation granted to ${customer.firstName ?? ''} ${customer.lastName ?? ''}.`);
    } catch (err) { setActionMessage((err as ApiError).message || 'Unable to grant reservation.'); } finally { setFormBusy(null); }
  };

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status && ACTIVE_STATUSES.has(trip.status)), [trips]);

  const updateTripStatus = async (trip: Trip, action: 'start' | 'complete' | 'cancel') => {
    const iri = getTripIri(trip);
    const id = trip.id;
    if (!iri || typeof id !== 'number') return;

    setBusyTripIds((current) => [...current, id]);
    setActionMessage(null);

    try {
      if (action === 'start') await apiClient.startTrip(iri);
      if (action === 'complete') await apiClient.completeTrip(iri);
      if (action === 'cancel') await apiClient.cancelTrip(iri);

      const response = await apiClient.getPartnerTrips();
      const items = Array.isArray(response) ? response : response['hydra:member'] ?? [];
      setTrips(items);
      setActionMessage(`Trip ${action === 'start' ? 'started' : action === 'complete' ? 'completed' : 'cancelled'} successfully.`);
    } catch (err) {
      const apiError = err as ApiError;
      setActionMessage(apiError.message || 'Unable to update trip status.');
    } finally {
      setBusyTripIds((current) => current.filter((item) => item !== id));
    }
  };

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Partner dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Operations overview for {getSessionDisplayName()}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Manage live trips, monitor availability, and keep your transport operations moving.</p>
            </div>
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Partner</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/settings" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50">Account settings</Link>
            <Link to="/dashboard/partner/history" className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">Trip history</Link>
          </div>
        </section>

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {actionMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p> : null}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-gray-900">Active trips</h2>
              <p className="mt-1 text-sm text-gray-600">Scheduled and in-progress trips you can manage right now.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{activeTrips.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-gray-600">Loading active trips...</p> : null}
            {!loading && activeTrips.length === 0 ? <p className="text-sm text-gray-600">No active trips found.</p> : null}

            <TripHistoryList
              trips={activeTrips}
              loading={loading}
              emptyMessage="No active trips found."
              showActions
              busyTripIds={busyTripIds}
              onStart={(trip) => updateTripStatus(trip, 'start')}
              onComplete={(trip) => updateTripStatus(trip, 'complete')}
              onCancel={(trip) => updateTripStatus(trip, 'cancel')}
            />
          </div>
          </section>

        <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-medium text-gray-900">Manage your resources</h2><p className="mt-1 text-sm text-gray-600">Create, edit, and delete routes or vehicles from their dedicated pages.</p><div className="flex flex-wrap gap-2"><Link to="/dashboard/partner/routes" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Manage routes</Link><Link to="/dashboard/partner/vehicles" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">Manage vehicles</Link></div></section>

        <section className="grid gap-5 lg:grid-cols-2">

          <form onSubmit={createTrip} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-sm font-medium text-gray-900">Create a trip</h2><p className="mt-1 text-sm text-gray-600">Schedule a trip on your route and vehicle.</p></div>
            <select required value={tripForm.route} onChange={(event) => setTripForm({ ...tripForm, route: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="">{routes.length ? 'Route' : 'No routes available'}</option>{routes.map((route) => <option key={resourceIri(route, 'routes')} value={resourceIri(route, 'routes')}>{cityLabel(route.departureCity)} → {cityLabel(route.destinationCity)}</option>)}</select>
            <select required value={tripForm.vehicle} onChange={(event) => setTripForm({ ...tripForm, vehicle: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="">{vehicles.length ? 'Vehicle' : 'No vehicles available'}</option>{vehicles.map((vehicle) => <option key={resourceIri(vehicle, 'vehicles')} value={resourceIri(vehicle, 'vehicles')}>{vehicle.brand ?? 'Vehicle'} · {vehicle.licensePlate ?? 'No plate'}</option>)}</select>
            <input required type="datetime-local" value={tripForm.departureTime} onChange={(event) => setTripForm({ ...tripForm, departureTime: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
            <input required min="0.01" step="0.01" type="number" placeholder="Price" value={tripForm.price} onChange={(event) => setTripForm({ ...tripForm, price: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
            <button disabled={formBusy !== null} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{formBusy === 'trip' ? 'Creating...' : 'Create trip'}</button>
          </form>

          <form onSubmit={grantReservation} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-sm font-medium text-gray-900">Give a free reservation</h2><p className="mt-1 text-sm text-gray-600">Find a registered customer by phone.</p></div>
            {reservationStep === 'details' && <><input required type="tel" placeholder="Customer phone number" value={reservationForm.phone} onChange={(event) => setReservationForm({ ...reservationForm, phone: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /><select required value={reservationForm.trip} onChange={(event) => setReservationForm({ ...reservationForm, trip: event.target.value, seatNumber: null })} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="">Trip</option>{trips.map((trip) => <option key={trip.id} value={resourceIri(trip, 'trips')}>{trip.route && typeof trip.route !== 'string' ? `${trip.route.departureCity?.name ?? ''} → ${trip.route.destinationCity?.name ?? ''}` : `Trip #${trip.id}`} · {trip.departureTime ? new Date(trip.departureTime).toLocaleString() : 'No time'}</option>)}</select></>}
            {reservationStep !== 'details' && (() => { const trip = trips.find((item) => resourceIri(item, 'trips') === reservationForm.trip); const capacity = trip?.vehicle && typeof trip.vehicle === 'object' ? trip.vehicle.seatCapacity : null; return <><p className="text-sm text-gray-600">{reservationStep === 'seat' ? 'Select a seat for this customer.' : `Selected seat: ${reservationForm.seatNumber}`}</p>{reservationStep === 'seat' && <SeatSelection seats={Array.from({ length: capacity ?? 40 }, (_, index) => index + 1)} reservedSeats={reservedSeats} selectedSeat={reservationForm.seatNumber} onSelectSeat={(seat) => setReservationForm({ ...reservationForm, seatNumber: seat })} />}</>; })()}
            <button disabled={formBusy !== null} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{formBusy === 'reservation' ? 'Granting...' : reservationStep === 'details' ? 'Choose seat' : reservationStep === 'seat' ? 'Review reservation' : 'Confirm reservation'}</button>
          </form>
        </section>
      </div>
    </main>
  );
}