"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F4EE] px-4">
      <div className="w-full max-w-md rounded-2xl border border-charcoal/10 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-charcoal">Something went wrong</h1>
        <p className="mt-2 text-sm text-charcoal/55">
          We couldn&apos;t load this page. This is usually temporary — please
          try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
