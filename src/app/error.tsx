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
        <h1 className="font-heading text-2xl font-medium text-ink">Something went wrong</h1>
        <p className="mt-2 font-body text-sm text-muted-2">
          We couldn&apos;t load this page. This is usually temporary — please
          try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-full bg-ink px-5 py-2.5 font-body text-sm font-medium text-white hover:bg-ink-soft transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
