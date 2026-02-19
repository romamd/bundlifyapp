import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Upsert test shop
  const shop = await prisma.shop.upsert({
    where: { shopifyDomain: 'bundlifydev.myshopify.com' },
    update: {},
    create: {
      shopifyDomain: 'bundlifydev.myshopify.com',
      accessToken: 'dev-token-placeholder',
      name: 'Bundlify Dev Store',
      email: 'dev@bundlify.io',
      plan: 'FREE',
      currency: 'USD',
      defaultShippingCost: 5.0,
      paymentProcessingPct: 2.9,
      paymentProcessingFlat: 0.3,
    },
  });

  console.log(`Shop: ${shop.id} (${shop.shopifyDomain})`);

  // Upsert shop settings
  await prisma.shopSettings.upsert({
    where: { shopId: shop.id },
    update: {},
    create: {
      shopId: shop.id,
    },
  });

  // Seed products
  const productData = [
    {
      shopifyProductId: '9310950359001',
      shopifyVariantId: 'var-001',
      title: 'Classic Cotton T-Shirt',
      variantTitle: 'Medium / Black',
      price: 29.99,
      cogs: 8.5,
      shippingCost: 3.0,
      inventoryQuantity: 150,
    },
    {
      shopifyProductId: '9310950359002',
      shopifyVariantId: 'var-002',
      title: 'Premium Denim Jeans',
      variantTitle: 'Size 32',
      price: 79.99,
      cogs: 25.0,
      shippingCost: 5.0,
      inventoryQuantity: 80,
    },
    {
      shopifyProductId: '9310950359003',
      shopifyVariantId: 'var-003',
      title: 'Leather Belt',
      variantTitle: 'Brown / One Size',
      price: 34.99,
      cogs: 12.0,
      shippingCost: 2.5,
      inventoryQuantity: 200,
      daysWithoutSale: 45,
      isDeadStock: true,
    },
    {
      shopifyProductId: '9310950359004',
      shopifyVariantId: 'var-004',
      title: 'Canvas Sneakers',
      variantTitle: 'White / US 10',
      price: 59.99,
      cogs: 18.0,
      shippingCost: 4.0,
      inventoryQuantity: 60,
    },
    {
      shopifyProductId: '9310950359005',
      shopifyVariantId: 'var-005',
      title: 'Wool Beanie',
      variantTitle: 'Grey',
      price: 19.99,
      cogs: 5.0,
      shippingCost: 2.0,
      inventoryQuantity: 300,
      daysWithoutSale: 60,
      isDeadStock: true,
    },
  ];

  const products = [];
  for (const data of productData) {
    const product = await prisma.product.upsert({
      where: {
        shopId_shopifyProductId_shopifyVariantId: {
          shopId: shop.id,
          shopifyProductId: data.shopifyProductId,
          shopifyVariantId: data.shopifyVariantId,
        },
      },
      update: {},
      create: {
        shopId: shop.id,
        ...data,
      },
    });
    products.push(product);
    console.log(`Product: ${product.id} (${product.title})`);
  }

  // Seed an active bundle
  const existingBundle = await prisma.bundle.findFirst({
    where: { shopId: shop.id, slug: 'summer-essentials-pack' },
  });

  if (!existingBundle) {
    const bundle = await prisma.bundle.create({
      data: {
        shopId: shop.id,
        name: 'Summer Essentials Pack',
        slug: 'summer-essentials-pack',
        type: 'FIXED',
        status: 'ACTIVE',
        source: 'MANUAL',
        bundlePrice: 89.99,
        individualTotal: 109.98,
        discountPct: 18,
        contributionMargin: 42.5,
        contributionMarginPct: 47.2,
        triggerType: 'PRODUCT_PAGE',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 1,
              isAnchor: true,
              sortOrder: 0,
            },
            {
              productId: products[1].id,
              quantity: 1,
              isAnchor: false,
              sortOrder: 1,
            },
          ],
        },
        displayRules: {
          create: [
            {
              targetType: 'PRODUCT',
              targetId: '9310950359001',
            },
          ],
        },
      },
    });
    console.log(`Bundle: ${bundle.id} (${bundle.name})`);
  } else {
    console.log(`Bundle already exists: ${existingBundle.id} (${existingBundle.name})`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
