import { useState, useEffect } from 'react';
import {
  reactExtension,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Image,
  useApi,
  useCartLines,
} from '@shopify/ui-extensions-react/checkout';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BundleItem {
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  variantTitle: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
  isAnchor: boolean;
}

interface StorefrontBundle {
  bundleId: string;
  name: string;
  bundlePrice: number;
  individualTotal: number;
  savingsAmount: number;
  savingsPct: number;
  items: BundleItem[];
}

/* -------------------------------------------------------------------------- */
/*  Extension registration                                                     */
/* -------------------------------------------------------------------------- */

export default reactExtension(
  'purchase.checkout.cart-line-list.render-after',
  () => <BundleUpsell />,
);

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

function BundleUpsell() {
  const { shop, sessionToken } = useApi();
  const cartLines = useCartLines();

  const [bundle, setBundle] = useState<StorefrontBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBundle() {
      try {
        // Obtain a session token for authenticated requests
        const token = await sessionToken.get();

        // Collect Shopify product GIDs currently in the cart
        const cartProductIds = cartLines
          .map((line) => line.merchandise?.product?.id)
          .filter(Boolean);

        const shopDomain = shop.myshopifyDomain;
        const url =
          `https://${shopDomain}/apps/bundlify/bundles` +
          `?shop=${encodeURIComponent(shopDomain)}&trigger=checkout`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        const bundles: StorefrontBundle[] = await res.json();

        // Pick the first bundle that is NOT already fully represented
        // in the cart so we don't upsell something the customer
        // already has.
        const available = bundles.find(
          (b) =>
            !b.items.every((item) =>
              cartProductIds.includes(
                `gid://shopify/Product/${item.shopifyProductId}`,
              ),
            ),
        );

        if (!cancelled) {
          setBundle(available || null);
        }
      } catch (e) {
        console.error('Bundlify checkout:', e);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBundle();

    return () => {
      cancelled = true;
    };
  }, [cartLines, shop.myshopifyDomain, sessionToken]);

  /* Nothing to show -------------------------------------------------------- */
  if (loading || error || !bundle) {
    return null;
  }

  /* Render the upsell banner ---------------------------------------------- */
  return (
    <Banner title={`Save ${Math.round(bundle.savingsPct)}%`} status="info">
      <BlockStack spacing="tight">
        <Text size="medium" emphasis="bold">
          {bundle.name}
        </Text>

        {/* Item thumbnails */}
        <InlineStack spacing="tight">
          {bundle.items.map((item) =>
            item.imageUrl ? (
              <Image
                key={item.shopifyVariantId}
                source={item.imageUrl}
                accessibilityDescription={item.title}
                borderRadius="base"
                aspectRatio={1}
                fit="cover"
              />
            ) : null,
          )}
        </InlineStack>

        {/* Pricing */}
        <InlineStack spacing="tight">
          <Text
            size="small"
            appearance="subdued"
            accessibilityRole="deletion"
          >
            ${bundle.individualTotal.toFixed(2)}
          </Text>
          <Text size="small" emphasis="bold">
            ${bundle.bundlePrice.toFixed(2)}
          </Text>
        </InlineStack>

        <Text size="small">
          Save ${bundle.savingsAmount.toFixed(2)} with this bundle
        </Text>
      </BlockStack>
    </Banner>
  );
}
