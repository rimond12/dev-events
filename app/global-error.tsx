"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Global error handler component - Displays error UI when unhandled errors occur.
 * Captures errors in PostHog for monitoring and provides a reset action.
 * @param props - Error object and reset function
 * @returns React component
 */
export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>Please try again.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
