import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../services/api/client';

export default function TripReservationPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [seatNumber, setSeatNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tripIri = useMemo(() => `/api/trips/${tripId}`, [tripId]);

  const handleReserve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.createReservation({ trip: tripIri, seatNumber: seatNumber ? Number(seatNumber) : undefined });
      navigate('/dashboard/customer/history', { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to create reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Reservation flow</p>
        <h1 className="mt-2 text-2xl font-normal text-black">Confirm your seat</h1>
        <p className="mt-2 text-sm text-gray-600">Choose a seat and confirm the reservation for trip #{tripId}.</p>

        <form onSubmit={handleReserve} className="mt-6 space-y-4">
          <label className="flex flex-col gap-2 text-sm text-gray-700">
            Seat number
            <input
              type="number"
              min="1"
              className="rounded-2xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="Optional"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm reservation'}
          </button>
        </form>
      </div>
    </main>
  );
}