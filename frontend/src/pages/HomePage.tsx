export default function HomePage() {
  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-normal text-black sm:text-[2.5rem]">Home</h1>
        <p className="mt-3 text-sm text-gray-700">Home Page</p>
      </div>

      <section className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <article key={index} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-40 rounded-2xl bg-linear-to-br from-blue-100 to-gray-100" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Sample card {index + 1}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Placeholder content to create enough page height so you can scroll and test the navbar behavior.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}