/**
 * Builds Shopify theme editor deep links for enabling app blocks/embeds.
 * Uses the official Shopify deep link format documented at:
 * https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
 */

const SHOP_CACHE_KEY = 'bundlify:shop-domain';

export function getShopDomain(): string | null {
  // Check URL params first (available on initial load inside Shopify iframe)
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');
  if (shop) {
    sessionStorage.setItem(SHOP_CACHE_KEY, shop);
    return shop;
  }

  const host = params.get('host');
  if (host) {
    try {
      const decoded = atob(host).replace(/\0/g, '');
      const hostname = new URL(decodeURIComponent(decoded)).hostname;
      sessionStorage.setItem(SHOP_CACHE_KEY, hostname);
      return hostname;
    } catch {
      // fall through to cache
    }
  }

  // Fall back to cached value (survives client-side route changes)
  return sessionStorage.getItem(SHOP_CACHE_KEY);
}

export function getApiKey(): string | null {
  const meta = document.querySelector('meta[name="shopify-api-key"]');
  return meta?.getAttribute('content') ?? null;
}

export function buildAppBlockDeepLink(
  shop: string,
  apiKey: string,
  template: string,
  blockHandle: string,
): string {
  return `https://${shop}/admin/themes/current/editor?template=${template}&addAppBlockId=${apiKey}/${blockHandle}&target=newAppsSection`;
}

export function buildAppEmbedDeepLink(
  shop: string,
  apiKey: string,
  embedHandle: string,
): string {
  return `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/${embedHandle}`;
}

export interface ThemeSetupStep {
  id: string;
  label: string;
  description: string;
  deepLink: string;
}

export function getThemeSetupSteps(shop: string, apiKey: string): ThemeSetupStep[] {
  return [
    {
      id: 'product-page',
      label: 'Product Page Widget',
      description: 'Show bundle offers on product pages',
      deepLink: buildAppBlockDeepLink(shop, apiKey, 'product', 'bundle-product-page'),
    },
    {
      id: 'cart-upsell',
      label: 'Cart Upsell Widget',
      description: 'Show upsell offers on the cart page',
      deepLink: buildAppBlockDeepLink(shop, apiKey, 'cart', 'bundle-cart-upsell'),
    },
    {
      id: 'exit-intent',
      label: 'Exit-Intent Overlay',
      description: 'Show popup when a visitor tries to leave',
      deepLink: buildAppEmbedDeepLink(shop, apiKey, 'bundle-exit-intent'),
    },
  ];
}
