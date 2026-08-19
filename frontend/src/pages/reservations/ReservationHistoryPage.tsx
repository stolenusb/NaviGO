import { useEffect, useState } from 'react';
import ReservationList, { type Reservation } from '../../components/reservations/ReservationList';
import { apiClient } from '../../services/api/client';
import type { ApiError } from '../../services/api/client';

export default function ReservationHistoryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const normalizeReservations = (data: unknown): Reservation[] => {
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      const collection = data as {
        member?: Reservation[];
        'hydra:member'?: Reservation[];
      };
      if (Array.isArray(collection.member)) return collection.member;
      if (Array.isArray(collection['hydra:member'])) return collection['hydra:member'];
    }

    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getReservations();
        setReservations(normalizeReservations(data));
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 401) {
          setUnauthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Reservations</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Reservation history</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Review past trips, seat assignments, and reservation status in one place.</p>
            </div>
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Customer</span>
          </div>

          <ReservationList
            reservations={reservations}
            loading={loading}
            emptyMessage="You have no reservations yet."
            unauthorizedMessage={unauthorized ? 'Your session expired. Please log in again to view your reservation history.' : undefined}
            showActions
            onCancel={async (reservation) => {
              const iri = reservation['@id'] ?? (typeof reservation.id === 'number' ? `/api/reservations/${reservation.id}` : undefined);
              if (!iri || typeof reservation.id !== 'number') return;

              await apiClient.cancelReservation(iri);
              setReservations((current) =>
                current.map((item) =>
                  item.id === reservation.id ? { ...item, status: 'cancelled', seatNumber: null } : item,
                ),
              );
            }}
          />
        </section>
      </div>
    </main>
  );
}