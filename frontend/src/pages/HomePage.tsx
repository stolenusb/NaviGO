import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../services/api/client';

type Trip = {
  id?: number;
  departureTime?: string;
  price?: number;
  status?: string;
  route?: {
    departureCity?: { name?: string };
    destinationCity?: { name?: string };
  };
};

type City = {
  id?: number;
  name?: string;
};

export default function HomePage() {
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activeCityField, setActiveCityField] = useState<'departure' | 'arrival' | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState('');
  const cityNames = useMemo(
    () =>
      (Array.isArray(cities) ? cities : [])
        .flatMap((city) => {
          if (!city) return [];

          const rawName =
            typeof city.name === 'string'
              ? city.name
              : typeof (city as { '@id'?: string; '@type'?: string; label?: string; title?: string }).label === 'string'
                ? (city as { label?: string }).label
                : typeof (city as { title?: string }).title === 'string'
                  ? (city as { title?: string }).title
                  : '';

          const name = (rawName ?? '').trim();
          return name ? [name] : [];
        })
        .filter((name, index, list) => list.indexOf(name) === index),
    [cities],
  );

  const activeCityValue = activeCityField === 'departure' ? departureCity : arrivalCity;

  const filteredCityNames = useMemo(() => {
    const normalized = activeCityValue.trim().toLowerCase();
    return normalized === ''
      ? cityNames
      : cityNames.filter((name) => name.toLowerCase().includes(normalized));
  }, [activeCityValue, cityNames]);

  const selectedCitySetter = activeCityField === 'departure' ? setDepartureCity : setArrivalCity;

  const closeCityDropdown = () => {
    setActiveCityField(null);
    setHighlightedIndex(0);
  };

  const openCityDropdown = (field: 'departure' | 'arrival') => {
    setActiveCityField(field);
    setHighlightedIndex(0);
  };

  const handleCityFocus = (field: 'departure' | 'arrival') => {
    openCityDropdown(field);
  };

  const handleCityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeCityField) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredCityNames.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter' && filteredCityNames[highlightedIndex]) {
      event.preventDefault();
      selectedCitySetter(filteredCityNames[highlightedIndex]);
      closeCityDropdown();
    }

    if (event.key === 'Escape') {
      closeCityDropdown();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        closeCityDropdown();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      setCitiesLoading(true);
      try {
        const data = await apiClient.getCities();

        const normalizedCities = Array.isArray(data)
          ? data
          : Array.isArray((data as { member?: City[] }).member)
            ? (data as { member?: City[] }).member ?? []
            : Array.isArray((data as { 'hydra:member'?: City[] })['hydra:member'])
              ? (data as { 'hydra:member'?: City[] })['hydra:member'] ?? []
              : [];

        setCities(normalizedCities);
      } catch {
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    void loadCities();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.getTrips({
        departureCity,
        arrivalCity,
        departureTime,
      });

      const normalizedTrips = Array.isArray(data)
        ? data
        : Array.isArray((data as { member?: Trip[] }).member)
          ? (data as { member?: Trip[] }).member ?? []
          : Array.isArray((data as { 'hydra:member'?: Trip[] })['hydra:member'])
            ? (data as { 'hydra:member'?: Trip[] })['hydra:member'] ?? []
            : [];

      setTrips(normalizedTrips);
    } catch {
      setError('Unable to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-normal text-black sm:text-[1.75rem]">Home</h1>
        <p className="mt-3 text-xs text-gray-700">Search for available trips</p>
      </div>

      <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <form ref={searchFormRef} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 md:items-end">
          <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
            Departure city
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                value={departureCity}
                onFocus={() => handleCityFocus('departure')}
                onChange={(e) => {
                  setDepartureCity(e.target.value);
                  setActiveCityField('departure');
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleCityKeyDown}
                placeholder={citiesLoading ? 'Loading cities...' : 'Casablanca'}
                autoComplete="off"
              />
              {activeCityField === 'departure' && filteredCityNames.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                  {filteredCityNames.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-xs ${
                        index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setDepartureCity(name);
                        closeCityDropdown();
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
            Arrival city
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                value={arrivalCity}
                onFocus={() => handleCityFocus('arrival')}
                onChange={(e) => {
                  setArrivalCity(e.target.value);
                  setActiveCityField('arrival');
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleCityKeyDown}
                placeholder={citiesLoading ? 'Loading cities...' : 'Rabat'}
                autoComplete="off"
              />
              {activeCityField === 'arrival' && filteredCityNames.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                  {filteredCityNames.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-xs ${
                        index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setArrivalCity(name);
                        closeCityDropdown();
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
            Departure time
            <input
              type="date"
              className="rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </label>

          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="h-10 w-full rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search trips'}
            </button>
          </div>

          {error ? <p className="md:col-span-4 text-xs text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {
          trips.map((trip, index) => (
            <article key={trip.id ?? index} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-900">
                {trip.route?.departureCity?.name ?? 'Departure'} → {trip.route?.destinationCity?.name ?? 'Arrival'}
              </h2>
              <p className="mt-2 text-xs text-gray-600">Time: {trip.departureTime ?? 'N/A'}</p>
              <p className="mt-1 text-xs text-gray-600">Price: {trip.price ?? 'N/A'}</p>
              <p className="mt-1 text-xs text-gray-600">Status: {trip.status ?? 'N/A'}</p>
            </article>
          ))
        }
      </section>
    </main>
  );
}