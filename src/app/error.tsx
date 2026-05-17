"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">
          We couldn&apos;t load this page. This is usually temporary — please
          try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white hover:bg-deep-teal-dark"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
