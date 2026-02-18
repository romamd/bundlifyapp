/**
 * App Bridge v4 CDN patches window.fetch automatically with session tokens.
 * This hook wraps it to handle 401s by redirecting to the OAuth install flow.
 */
export function useAuthenticatedFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await window.fetch(input, init);

    if (response.status === 401) {
      // Extract shop domain from the URL params or App Bridge
      const params = new URLSearchParams(window.location.search);
      const shop =
        params.get('shop') ||
        new URL(
          decodeURIComponent(
            atob(params.get('host') || '').replace(/\0/g, ''),
          ),
        ).hostname;

      if (shop) {
        // Redirect to OAuth install flow using App Bridge navigation
        const redirectUrl = `/auth?shop=${encodeURIComponent(shop)}`;
        // Use open() to break out of the iframe for OAuth
        window.open(redirectUrl, '_top');
      }
    }

    return response;
  };
}
