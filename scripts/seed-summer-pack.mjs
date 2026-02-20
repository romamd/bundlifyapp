/**
 * Seeds the "Summer Essentials Pack" bundle for E2E tests.
 * Uses the admin API in dev mode (no auth needed).
 */
const BASE = 'https://dev.bundlify.io';

async function seed() {
  // Step 1: Create the bundle with 2 items + display rule for product_id 9310950359001
  const createRes = await fetch(`${BASE}/api/admin/bundles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Summer Essentials Pack',
      type: 'FIXED',
      discountPct: 18.18,
      discountType: 'PERCENTAGE',
      triggerType: 'PRODUCT_PAGE',
      items: [
        {
          productId: 'cmltvnbjp0004sck5rb16ns3q', // Classic Cotton T-Shirt ($29.99)
          quantity: 1,
          isAnchor: true,
        },
        {
          productId: 'cmltvnbt90006sck565jfudj4', // Premium Denim Jeans ($79.99)
          quantity: 1,
          isAnchor: false,
        },
      ],
      displayRules: [
        {
          targetType: 'PRODUCT',
          targetId: '9310950359001',
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('Failed to create bundle:', createRes.status, err);
    process.exit(1);
  }

  const bundle = await createRes.json();
  console.log(`Created bundle: ${bundle.name} (${bundle.id})`);
  console.log(`  bundlePrice: ${bundle.bundlePrice}`);
  console.log(`  items: ${bundle.items.length}`);
  console.log(`  displayRules: ${bundle.displayRules.length}`);

  // Step 2: Activate the bundle
  const activateRes = await fetch(`${BASE}/api/admin/bundles/${bundle.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });

  if (!activateRes.ok) {
    const err = await activateRes.text();
    console.error('Failed to activate bundle:', activateRes.status, err);
    process.exit(1);
  }

  const activated = await activateRes.json();
  console.log(`  status: ${activated.status}`);

  // Step 3: Verify via storefront API
  const sfRes = await fetch(
    `${BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=PRODUCT_PAGE&product_id=9310950359001`,
  );
  const bundles = await sfRes.json();
  const summerPack = bundles.find((b) => b.name === 'Summer Essentials Pack');

  if (summerPack) {
    console.log(`\nVerified on storefront API:`);
    console.log(`  name: ${summerPack.name}`);
    console.log(`  bundlePrice: ${summerPack.bundlePrice}`);
    console.log(`  items: ${summerPack.items.length}`);
  } else {
    console.error('\nBundle NOT found on storefront API!');
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
