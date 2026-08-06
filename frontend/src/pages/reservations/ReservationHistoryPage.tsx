import { useEffect, useState } from 'react';
import { apiClient } from '../../services/api/client';

type Reservation = {
  id?: number;
  status?: string;
  seatNumber?: number | null;
  createdAt?: string;
  trip?: { id?: number; departureTime?: string; price?: number; route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } } };
};

export default function ReservationHistoryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getReservations();
        const items = Array.isArray(data)
          ? data
          : Array.isArray((data as { 'hydra:member'?: Reservation[] })['hydra:member'])
            ? (data as { 'hydra:member'?: Reservation[] })['hydra:member'] ?? []
            : [];
        setReservations(items);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Reservation history</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Your bookings</h1>
        </div>

        {loading ? <p className="text-sm text-gray-600">Loading reservations...</p> : null}

        <section className="grid gap-4">
          {reservations.map((reservation) => (
            <article key={reservation.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-900">Reservation #{reservation.id ?? 'N/A'}</h2>
              <p className="mt-2 text-sm text-gray-600">
                {reservation.trip?.route?.departureCity?.name ?? 'Departure'} → {reservation.trip?.route?.destinationCity?.name ?? 'Arrival'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Seat: {reservation.seatNumber ?? 'Auto-assigned'}</p>
              <p className="mt-1 text-xs text-gray-500">Status: {reservation.status ?? 'unknown'}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}