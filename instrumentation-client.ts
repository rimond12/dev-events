/**
 * PostHog analytics initialization for client-side tracking.
 * Configures PostHog with project token and host from environment variables.
 * Throws error in development if required environment variables are missing.
 */
import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!projectToken || !posthogHost) {
  if (process.env.NODE_ENV === "development") {
    const missingVariable = !projectToken
      ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
      : "NEXT_PUBLIC_POSTHOG_HOST";

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
} else {
  posthog.init(projectToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
