/**
 * App Bridge v4 CDN patches window.fetch automatically with session tokens.
 * This hook wraps it for consistency with the Zustand store pattern.
 */
export function useAuthenticatedFetch() {
  return window.fetch.bind(window);
}
