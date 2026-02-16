# Bundlify — Technical Specification & Claude Code Guide

## Product Overview

**Bundlify** is a Shopify app that creates margin-aware product bundles. Unlike existing bundle apps that optimize for AOV (Average Order Value), Bundlify ranks and recommends bundles by actual contribution margin — factoring in COGS, shipping costs, payment processing fees, and discounts.

**Domain:** bundlify.io
**Target:** Shopify merchants with 50+ SKUs who want to move slow inventory profitably

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Shopify Store                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Theme App    │  │  Checkout    │  │  Shopify       │  │
│  │ Extension    │  │  UI Extension│  │  Admin (embed) │  │
│  │ (bundle      │  │ (bundle      │  │  (dashboard)   │  │
│  │  widgets)    │  │  upsell)     │  │                │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                  Bundlify Backend (NestJS)                │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Auth     │ │ Product   │ │ Bundle   │ │ Analytics │  │
│  │ Module   │ │ Sync      │ │ Engine   │ │ Module    │  │
│  │ (OAuth)  │ │ Module    │ │          │ │           │  │
│  └──────────┘ └───────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐                │
│  │ Webhook  │ │ Margin    │ │ Display  │                │
│  │ Handler  │ │ Calculator│ │ Rules    │                │
│  └──────────┘ └───────────┘ └──────────┘                │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │  MySQL 8        │                         │
│              │  (Prisma ORM)   │                         │
│              └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | NX |
| Backend Framework | NestJS |
| ORM | Prisma (MySQL provider) |
| Database | MySQL 8 |
| Admin UI | React + Zustand + Shopify Polaris + App Bridge |
| Storefront widgets | Theme App Extension (Liquid + vanilla JS) |
| Checkout upsell | Checkout UI Extension (React) |
| Background jobs | BullMQ + Redis |
| Hosting | AWS (ECS/Fargate or EC2) or Railway/Render for MVP |
| CLI | Shopify CLI for extensions scaffolding |

---

## NX Monorepo Structure

```
bundlify/
├── nx.json
├── package.json
├── tsconfig.base.json
├── .env
├── .env.local
│
├── apps/
│   ├── api/                              # NestJS backend
│   │   ├── project.json
│   │   ├── tsconfig.app.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       │
│   │       ├── common/
│   │       │   ├── guards/
│   │       │   │   ├── shopify-auth.guard.ts
│   │       │   │   └── plan-gate.guard.ts
│   │       │   ├── interceptors/
│   │       │   │   └── shopify-billing.interceptor.ts
│   │       │   ├── decorators/
│   │       │   │   └── current-shop.decorator.ts
│   │       │   ├── filters/
│   │       │   │   └── shopify-error.filter.ts
│   │       │   └── utils/
│   │       │       └── crypto.util.ts
│   │       │
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   ├── auth.module.ts
│   │       │   │   ├── auth.controller.ts
│   │       │   │   ├── auth.service.ts
│   │       │   │   └── session.middleware.ts
│   │       │   │
│   │       │   ├── webhooks/
│   │       │   │   ├── webhooks.module.ts
│   │       │   │   ├── webhooks.controller.ts
│   │       │   │   ├── webhooks.service.ts
│   │       │   │   └── handlers/
│   │       │   │       ├── products-update.handler.ts
│   │       │   │       ├── orders-create.handler.ts
│   │       │   │       ├── orders-paid.handler.ts
│   │       │   │       └── app-uninstalled.handler.ts
│   │       │   │
│   │       │   ├── products/
│   │       │   │   ├── products.module.ts
│   │       │   │   ├── products.controller.ts
│   │       │   │   ├── products.service.ts
│   │       │   │   ├── products-sync.service.ts
│   │       │   │   └── dto/
│   │       │   │       ├── update-cogs.dto.ts
│   │       │   │       └── bulk-import-cogs.dto.ts
│   │       │   │
│   │       │   ├── margin/
│   │       │   │   ├── margin.module.ts
│   │       │   │   └── margin.service.ts
│   │       │   │
│   │       │   ├── bundles/
│   │       │   │   ├── bundles.module.ts
│   │       │   │   ├── bundles.controller.ts
│   │       │   │   ├── bundles.service.ts
│   │       │   │   ├── bundle-engine.service.ts
│   │       │   │   ├── bundle-display.service.ts
│   │       │   │   └── dto/
│   │       │   │       ├── create-bundle.dto.ts
│   │       │   │       ├── update-bundle.dto.ts
│   │       │   │       └── bundle-query.dto.ts
│   │       │   │
│   │       │   ├── storefront/
│   │       │   │   ├── storefront.module.ts
│   │       │   │   ├── storefront.controller.ts
│   │       │   │   └── storefront.service.ts
│   │       │   │
│   │       │   ├── analytics/
│   │       │   │   ├── analytics.module.ts
│   │       │   │   ├── analytics.controller.ts
│   │       │   │   ├── analytics.service.ts
│   │       │   │   └── event-tracker.service.ts
│   │       │   │
│   │       │   ├── settings/
│   │       │   │   ├── settings.module.ts
│   │       │   │   ├── settings.controller.ts
│   │       │   │   └── settings.service.ts
│   │       │   │
│   │       │   └── billing/
│   │       │       ├── billing.module.ts
│   │       │       ├── billing.controller.ts
│   │       │       └── billing.service.ts
│   │       │
│   │       └── jobs/
│   │           ├── jobs.module.ts
│   │           ├── product-sync.job.ts
│   │           ├── margin-recalculate.job.ts
│   │           ├── bundle-generate.job.ts
│   │           ├── dead-stock-detect.job.ts
│   │           ├── analytics-aggregate.job.ts
│   │           └── cleanup.job.ts
│   │
│   ├── admin/                            # React admin dashboard (embedded in Shopify)
│   │   ├── project.json
│   │   ├── tsconfig.app.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                   # AppBridgeProvider + PolarisProvider + Router
│   │       │
│   │       ├── stores/                   # Zustand stores
│   │       │   ├── shop.store.ts
│   │       │   ├── products.store.ts
│   │       │   ├── bundles.store.ts
│   │       │   ├── analytics.store.ts
│   │       │   └── settings.store.ts
│   │       │
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── Products.tsx
│   │       │   ├── ProductDetail.tsx
│   │       │   ├── Bundles.tsx
│   │       │   ├── BundleCreate.tsx
│   │       │   ├── BundleEdit.tsx
│   │       │   ├── Analytics.tsx
│   │       │   └── Settings.tsx
│   │       │
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── AppFrame.tsx
│   │       │   │   └── Navigation.tsx
│   │       │   ├── products/
│   │       │   │   ├── ProductTable.tsx
│   │       │   │   ├── CogsInlineEdit.tsx
│   │       │   │   ├── CogsCsvImport.tsx
│   │       │   │   └── MarginBadge.tsx
│   │       │   ├── bundles/
│   │       │   │   ├── BundleTable.tsx
│   │       │   │   ├── BundleWizard.tsx
│   │       │   │   ├── BundleProductPicker.tsx
│   │       │   │   ├── DiscountSlider.tsx
│   │       │   │   └── MarginImpactCard.tsx
│   │       │   ├── analytics/
│   │       │   │   ├── RevenueChart.tsx
│   │       │   │   ├── FunnelChart.tsx
│   │       │   │   └── TopBundlesCard.tsx
│   │       │   └── common/
│   │       │       ├── LoadingState.tsx
│   │       │       └── EmptyState.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── useAuthenticatedFetch.ts
│   │       │   ├── useBilling.ts
│   │       │   └── useShopifyNavigation.ts
│   │       │
│   │       └── lib/
│   │           ├── api-client.ts
│   │           └── formatters.ts
│   │
│   └── extensions/                       # Shopify CLI extensions (outside NX build)
│       ├── bundlify-widget/              # Theme App Extension
│       │   ├── shopify.extension.toml
│       │   ├── blocks/
│       │   │   ├── bundle-product-page.liquid
│       │   │   └── bundle-cart-upsell.liquid
│       │   ├── assets/
│       │   │   ├── bundlify.js
│       │   │   └── bundlify.css
│       │   └── locales/
│       │       └── en.default.json
│       │
│       └── bundlify-checkout/            # Checkout UI Extension
│           ├── shopify.extension.toml
│           └── src/
│               └── Checkout.tsx
│
├── libs/                                 # Shared NX libraries
│   ├── shared-types/                     # Shared TypeScript types/interfaces
│   │   ├── project.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── models/
│   │       │   ├── shop.types.ts
│   │       │   ├── product.types.ts
│   │       │   ├── bundle.types.ts
│   │       │   ├── analytics.types.ts
│   │       │   └── settings.types.ts
│   │       ├── dto/
│   │       │   ├── product.dto.ts
│   │       │   ├── bundle.dto.ts
│   │       │   ├── analytics.dto.ts
│   │       │   └── settings.dto.ts
│   │       └── enums/
│   │           ├── plan-type.enum.ts
│   │           ├── bundle-type.enum.ts
│   │           ├── bundle-status.enum.ts
│   │           └── bundle-event.enum.ts
│   │
│   ├── margin-engine/                    # Pure business logic (no framework deps)
│   │   ├── project.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── margin-calculator.ts
│   │       ├── bundle-scorer.ts
│   │       ├── discount-optimizer.ts
│   │       └── __tests__/
│   │           ├── margin-calculator.spec.ts
│   │           ├── bundle-scorer.spec.ts
│   │           └── discount-optimizer.spec.ts
│   │
│   └── prisma-client/                    # Prisma client shared lib
│       ├── project.json
│       └── src/
│           ├── index.ts
│           ├── prisma.service.ts
│           └── prisma/
│               ├── schema.prisma
│               └── migrations/
│
├── tools/
│   └── scripts/
│       ├── seed.ts
│       └── migrate.ts
│
└── shopify.app.toml                      # Shopify app config (root level)
```

---

## NX Workspace Configuration

### nx.json

```json
{
  "npmScope": "bundlify",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  }
}
```

### tsconfig.base.json (path aliases)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@bundlify/shared-types": ["libs/shared-types/src/index.ts"],
      "@bundlify/margin-engine": ["libs/margin-engine/src/index.ts"],
      "@bundlify/prisma-client": ["libs/prisma-client/src/index.ts"]
    },
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "skipLibCheck": true
  }
}
```

---

## Database Schema (Prisma — MySQL)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// STORE & AUTH
// ============================================

model Shop {
  id              String   @id @default(cuid())
  shopifyDomain   String   @unique @db.VarChar(255)
  accessToken     String   @db.Text                    // encrypted at rest
  shopifyStoreId  String?  @unique @db.VarChar(255)
  name            String?  @db.VarChar(255)
  email           String?  @db.VarChar(255)
  plan            PlanType @default(FREE)
  trialEndsAt     DateTime?
  installedAt     DateTime @default(now())
  uninstalledAt   DateTime?
  currency        String   @default("USD") @db.VarChar(3)

  // Default cost assumptions
  defaultShippingCost   Decimal  @default(0)    @db.Decimal(10,2)
  paymentProcessingPct  Decimal  @default(2.9)  @db.Decimal(5,2)
  paymentProcessingFlat Decimal  @default(0.30) @db.Decimal(10,2)

  products        Product[]
  bundles         Bundle[]
  bundleViews     BundleView[]
  settings        ShopSettings?
  webhookSubscriptions WebhookSubscription[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PlanType {
  FREE
  STARTER
  GROWTH
}

model ShopSettings {
  id                    String   @id @default(cuid())
  shopId                String   @unique
  shop                  Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)

  // Display settings
  bundleWidgetEnabled   Boolean  @default(true)
  checkoutUpsellEnabled Boolean  @default(true)
  exitIntentEnabled     Boolean  @default(false)

  // Bundle generation settings
  autoGenerateBundles   Boolean  @default(true)
  minBundleMarginPct    Decimal  @default(15)   @db.Decimal(5,2)
  maxBundleProducts     Int      @default(4)
  includeDeadStock      Boolean  @default(true)
  deadStockDaysThreshold Int     @default(60)

  // Display rules
  showOnProductPage     Boolean  @default(true)
  showOnCartPage        Boolean  @default(true)
  showAtCheckout        Boolean  @default(true)
  showOnExitIntent      Boolean  @default(false)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ============================================
// PRODUCTS & COSTS
// ============================================

model Product {
  id                String   @id @default(cuid())
  shopId            String
  shop              Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)

  shopifyProductId  String   @db.VarChar(255)
  shopifyVariantId  String?  @db.VarChar(255)
  title             String   @db.VarChar(500)
  variantTitle      String?  @db.VarChar(500)
  sku               String?  @db.VarChar(255)
  price             Decimal  @db.Decimal(10,2)
  compareAtPrice    Decimal? @db.Decimal(10,2)

  // Cost data (merchant-entered or imported)
  cogs              Decimal? @db.Decimal(10,2)
  shippingCost      Decimal? @db.Decimal(10,2)
  additionalCosts   Decimal? @db.Decimal(10,2)

  // Calculated fields (updated by background job)
  contributionMargin    Decimal? @db.Decimal(10,2)
  contributionMarginPct Decimal? @db.Decimal(5,2)

  // Inventory & velocity
  inventoryQuantity Int      @default(0)
  inventoryItemId   String?  @db.VarChar(255)
  avgDailySales     Decimal  @default(0)  @db.Decimal(10,4)
  lastSoldAt        DateTime?
  daysWithoutSale   Int      @default(0)
  isDeadStock       Boolean  @default(false)

  // Sync metadata
  shopifyUpdatedAt  DateTime?
  lastSyncedAt      DateTime?
  imageUrl          String?  @db.Text
  status            ProductStatus @default(ACTIVE)

  bundleItems       BundleItem[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([shopId, shopifyProductId, shopifyVariantId])
  @@index([shopId, isDeadStock])
  @@index([shopId, contributionMarginPct])
  @@index([shopId, avgDailySales])
}

enum ProductStatus {
  ACTIVE
  DRAFT
  ARCHIVED
}

// ============================================
// BUNDLES
// ============================================

model Bundle {
  id              String       @id @default(cuid())
  shopId          String
  shop            Shop         @relation(fields: [shopId], references: [id], onDelete: Cascade)

  name            String       @db.VarChar(255)
  slug            String       @db.VarChar(255)
  type            BundleType
  status          BundleStatus @default(DRAFT)
  source          BundleSource @default(AUTO)

  // Pricing
  bundlePrice     Decimal      @db.Decimal(10,2)
  individualTotal Decimal      @db.Decimal(10,2)
  discountPct     Decimal      @db.Decimal(5,2)
  discountType    DiscountType @default(PERCENTAGE)

  // Margin data (calculated)
  totalCogs           Decimal? @db.Decimal(10,2)
  totalShippingCost   Decimal? @db.Decimal(10,2)
  processingFee       Decimal? @db.Decimal(10,2)
  contributionMargin  Decimal? @db.Decimal(10,2)
  contributionMarginPct Decimal? @db.Decimal(5,2)

  // Display rules
  displayPriority     Int      @default(0)
  triggerType         TriggerType @default(PRODUCT_PAGE)
  minCartValue        Decimal? @db.Decimal(10,2)
  maxCartValue        Decimal? @db.Decimal(10,2)

  // Limits
  maxRedemptions    Int?
  currentRedemptions Int     @default(0)
  startsAt          DateTime?
  endsAt            DateTime?

  items             BundleItem[]
  views             BundleView[]
  displayRules      BundleDisplayRule[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([shopId, status, triggerType])
  @@index([shopId, contributionMarginPct])
}

// MySQL doesn't support String[] — use a join table instead
model BundleDisplayRule {
  id              String   @id @default(cuid())
  bundleId        String
  bundle          Bundle   @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  targetType      DisplayRuleTarget
  targetId        String   @db.VarChar(255)

  @@unique([bundleId, targetType, targetId])
  @@index([targetType, targetId])
}

enum DisplayRuleTarget {
  PRODUCT
  COLLECTION
}

enum BundleType {
  FIXED
  MIX_MATCH
  VOLUME
  CROSS_SELL
  DEAD_STOCK
}

enum BundleStatus {
  DRAFT
  ACTIVE
  PAUSED
  EXPIRED
  ARCHIVED
}

enum BundleSource {
  AUTO
  MANUAL
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum TriggerType {
  PRODUCT_PAGE
  CART_PAGE
  CHECKOUT
  EXIT_INTENT
  POST_PURCHASE
}

model BundleItem {
  id          String   @id @default(cuid())
  bundleId    String
  bundle      Bundle   @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  quantity    Int      @default(1)
  isAnchor    Boolean  @default(false)
  isDeadStock Boolean  @default(false)
  sortOrder   Int      @default(0)

  @@unique([bundleId, productId])
}

// ============================================
// ANALYTICS
// ============================================

model BundleView {
  id          String   @id @default(cuid())
  shopId      String
  shop        Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  bundleId    String
  bundle      Bundle   @relation(fields: [bundleId], references: [id], onDelete: Cascade)

  event       BundleEvent
  sessionId   String?  @db.VarChar(255)

  triggerType TriggerType
  pageUrl     String?  @db.Text
  cartValue   Decimal? @db.Decimal(10,2)

  orderId     String?  @db.VarChar(255)
  revenue     Decimal? @db.Decimal(10,2)
  margin      Decimal? @db.Decimal(10,2)

  createdAt   DateTime @default(now())

  @@index([shopId, bundleId, event, createdAt])
  @@index([shopId, createdAt])
}

enum BundleEvent {
  VIEWED
  CLICKED
  ADDED_TO_CART
  PURCHASED
  DISMISSED
}

model WebhookSubscription {
  id          String   @id @default(cuid())
  shopId      String
  shop        Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  topic       String   @db.VarChar(255)
  webhookId   String   @unique @db.VarChar(255)

  createdAt   DateTime @default(now())

  @@unique([shopId, topic])
}
```

---

## Shared Types Library (`libs/shared-types`)

### Enums (`libs/shared-types/src/enums/`)

```typescript
// plan-type.enum.ts
export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
}

// bundle-type.enum.ts
export enum BundleType {
  FIXED = 'FIXED',
  MIX_MATCH = 'MIX_MATCH',
  VOLUME = 'VOLUME',
  CROSS_SELL = 'CROSS_SELL',
  DEAD_STOCK = 'DEAD_STOCK',
}

// bundle-status.enum.ts
export enum BundleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

// bundle-event.enum.ts
export enum BundleEvent {
  VIEWED = 'VIEWED',
  CLICKED = 'CLICKED',
  ADDED_TO_CART = 'ADDED_TO_CART',
  PURCHASED = 'PURCHASED',
  DISMISSED = 'DISMISSED',
}
```

### DTOs (`libs/shared-types/src/dto/`)

```typescript
// product.dto.ts
export interface ProductDto {
  id: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  cogs: number | null;
  shippingCost: number | null;
  additionalCosts: number | null;
  contributionMargin: number | null;
  contributionMarginPct: number | null;
  inventoryQuantity: number;
  avgDailySales: number;
  daysWithoutSale: number;
  isDeadStock: boolean;
  imageUrl: string | null;
  status: string;
}

export interface UpdateCogsDto {
  cogs?: number;
  shippingCost?: number;
  additionalCosts?: number;
}

export interface BulkCogsRow {
  sku: string;
  cogs: number;
  shippingCost?: number;
  additionalCosts?: number;
}

// bundle.dto.ts
export interface BundleDto {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  source: string;
  bundlePrice: number;
  individualTotal: number;
  discountPct: number;
  contributionMargin: number | null;
  contributionMarginPct: number | null;
  triggerType: string;
  items: BundleItemDto[];
  displayRules: BundleDisplayRuleDto[];
  currentRedemptions: number;
  startsAt: string | null;
  endsAt: string | null;
}

export interface BundleItemDto {
  id: string;
  productId: string;
  product: ProductDto;
  quantity: number;
  isAnchor: boolean;
  isDeadStock: boolean;
  sortOrder: number;
}

export interface BundleDisplayRuleDto {
  targetType: 'PRODUCT' | 'COLLECTION';
  targetId: string;
}

export interface CreateBundleDto {
  name: string;
  type: string;
  discountPct: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  triggerType: string;
  items: { productId: string; quantity: number; isAnchor: boolean }[];
  displayRules?: { targetType: 'PRODUCT' | 'COLLECTION'; targetId: string }[];
  minCartValue?: number;
  maxCartValue?: number;
  startsAt?: string;
  endsAt?: string;
}

// analytics.dto.ts
export interface DashboardDto {
  totalBundleRevenue: number;
  totalBundleMargin: number;
  bundleConversionRate: number;
  totalViews: number;
  totalClicks: number;
  totalAddToCarts: number;
  totalPurchases: number;
  topBundles: Array<{
    bundleId: string;
    name: string;
    revenue: number;
    margin: number;
    conversions: number;
  }>;
  deadStockValue: number;
  deadStockCount: number;
}

// storefront.dto.ts
export interface StorefrontBundleDto {
  bundleId: string;
  name: string;
  bundlePrice: number;
  individualTotal: number;
  savingsAmount: number;
  savingsPct: number;
  items: Array<{
    shopifyProductId: string;
    shopifyVariantId: string | null;
    title: string;
    variantTitle: string | null;
    price: number;
    imageUrl: string | null;
    quantity: number;
    isAnchor: boolean;
  }>;
}

export interface TrackEventDto {
  bundleId: string;
  event: string;
  sessionId?: string;
  triggerType: string;
  pageUrl?: string;
  cartValue?: number;
  orderId?: string;
  revenue?: number;
}
```

---

## Margin Engine Library (`libs/margin-engine`)

Pure business logic — zero framework dependencies. Imported by NestJS services and also usable client-side in the admin for real-time margin previews in the bundle wizard's DiscountSlider component.

```typescript
// margin-calculator.ts

export interface MarginInput {
  price: number;
  cogs: number;
  shippingCost: number;
  additionalCosts: number;
  paymentProcessingPct: number;   // e.g. 2.9
  paymentProcessingFlat: number;  // e.g. 0.30
  discountPct?: number;
}

export interface MarginResult {
  effectivePrice: number;
  totalCost: number;
  processingFee: number;
  contributionMargin: number;
  contributionMarginPct: number;
  isProfitable: boolean;
}

export function calculateProductMargin(input: MarginInput): MarginResult {
  const effectivePrice = input.price * (1 - (input.discountPct || 0) / 100);
  const processingFee =
    effectivePrice * (input.paymentProcessingPct / 100) + input.paymentProcessingFlat;
  const totalCost =
    input.cogs + input.shippingCost + input.additionalCosts + processingFee;
  const contributionMargin = effectivePrice - totalCost;
  const contributionMarginPct =
    effectivePrice > 0 ? (contributionMargin / effectivePrice) * 100 : 0;

  return {
    effectivePrice,
    totalCost,
    processingFee,
    contributionMargin,
    contributionMarginPct,
    isProfitable: contributionMargin > 0,
  };
}

export interface BundleMarginInput {
  items: Array<{
    price: number;
    cogs: number;
    shippingCost: number;
    additionalCosts: number;
    quantity: number;
  }>;
  bundleDiscountPct: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}

/**
 * For bundles, payment processing flat fee is charged once per order,
 * not per item.
 */
export function calculateBundleMargin(input: BundleMarginInput): MarginResult {
  const individualTotal = input.items.reduce(
    (sum, i) => sum + i.price * i.quantity, 0,
  );
  const bundlePrice = individualTotal * (1 - input.bundleDiscountPct / 100);

  const totalCogs = input.items.reduce((sum, i) => sum + i.cogs * i.quantity, 0);
  const totalShipping = input.items.reduce((sum, i) => sum + i.shippingCost * i.quantity, 0);
  const totalAdditional = input.items.reduce((sum, i) => sum + i.additionalCosts * i.quantity, 0);
  const processingFee =
    bundlePrice * (input.paymentProcessingPct / 100) + input.paymentProcessingFlat;

  const totalCost = totalCogs + totalShipping + totalAdditional + processingFee;
  const contributionMargin = bundlePrice - totalCost;
  const contributionMarginPct =
    bundlePrice > 0 ? (contributionMargin / bundlePrice) * 100 : 0;

  return {
    effectivePrice: bundlePrice,
    totalCost,
    processingFee,
    contributionMargin,
    contributionMarginPct,
    isProfitable: contributionMargin > 0,
  };
}
```

```typescript
// bundle-scorer.ts

export interface BundleCandidate {
  anchorAvgDailySales: number;
  companionDaysWithoutSale: number[];
  estimatedMarginPct: number;
}

/**
 * Higher score = better bundle candidate.
 * Weights: margin (50%), dead stock urgency (30%), anchor popularity (20%).
 */
export function scoreBundleCandidate(candidate: BundleCandidate): number {
  const marginScore = candidate.estimatedMarginPct;
  const deadStockUrgency =
    candidate.companionDaysWithoutSale.reduce(
      (max, d) => Math.max(max, d / 90),
      0,
    );
  const anchorPopularity = Math.min(candidate.anchorAvgDailySales / 5, 1);

  return marginScore * 0.5 + deadStockUrgency * 30 + anchorPopularity * 20;
}
```

```typescript
// discount-optimizer.ts

import { calculateBundleMargin, type BundleMarginInput } from './margin-calculator';

/**
 * Binary-search the maximum discount % that keeps bundle margin >= threshold.
 */
export function findOptimalDiscount(
  items: BundleMarginInput['items'],
  paymentProcessingPct: number,
  paymentProcessingFlat: number,
  minMarginPct: number,
): number {
  let low = 0;
  let high = 50;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateBundleMargin({
      items,
      bundleDiscountPct: mid,
      paymentProcessingPct,
      paymentProcessingFlat,
    });

    if (result.contributionMarginPct >= minMarginPct) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
```

---

## Bundle Engine Algorithm (`bundle-engine.service.ts`)

```typescript
/**
 * Runs as a BullMQ job. Generates bundle candidates, scores them, keeps the best.
 *
 * Algorithm:
 * 1. Fetch all ACTIVE products with COGS data for this shop
 * 2. Classify: bestsellers (top 20% by avgDailySales) and dead stock (isDeadStock=true)
 * 3. For each bestseller (anchor), find compatible dead stock companions:
 *    - Same or complementary product_type / collection tags
 *    - Combined bundle margin > shop.minBundleMarginPct
 *    - Dead stock item is in stock (inventoryQuantity > 0)
 * 4. Use findOptimalDiscount() to find max discount that maintains min margin
 * 5. Score candidates using scoreBundleCandidate()
 * 6. Keep top N bundles (N = setting, default 10), archive old auto-generated ones
 * 7. Set new bundles status = DRAFT for merchant review (or ACTIVE if autoActivate)
 *
 * For CROSS_SELL type:
 * - Query Shopify Orders API for frequently-bought-together product pairs
 * - Create bundles from top co-purchase pairs that meet margin threshold
 */
```

---

## Zustand Stores (`apps/admin/src/stores/`)

```typescript
// products.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProductDto, UpdateCogsDto, BulkCogsRow } from '@bundlify/shared-types';

interface ProductFilters {
  search: string;
  deadStockOnly: boolean;
  missingCogsOnly: boolean;
  sortBy: 'title' | 'margin' | 'daysWithoutSale' | 'price';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface ProductsState {
  products: ProductDto[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;

  setFilters: (filters: Partial<ProductFilters>) => void;
  fetchProducts: (authenticatedFetch: typeof fetch) => Promise<void>;
  updateCogs: (
    authenticatedFetch: typeof fetch,
    productId: string,
    data: UpdateCogsDto,
  ) => Promise<void>;
  bulkImportCogs: (
    authenticatedFetch: typeof fetch,
    rows: BulkCogsRow[],
  ) => Promise<{ matched: number; unmatched: number }>;
}

export const useProductsStore = create<ProductsState>()(
  devtools(
    (set, get) => ({
      products: [],
      total: 0,
      loading: false,
      error: null,
      filters: {
        search: '',
        deadStockOnly: false,
        missingCogsOnly: false,
        sortBy: 'title',
        sortDir: 'asc',
        page: 1,
        pageSize: 25,
      },

      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial, page: 1 } })),

      fetchProducts: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const { filters } = get();
          const params = new URLSearchParams({
            search: filters.search,
            deadStockOnly: String(filters.deadStockOnly),
            missingCogsOnly: String(filters.missingCogsOnly),
            sortBy: filters.sortBy,
            sortDir: filters.sortDir,
            page: String(filters.page),
            pageSize: String(filters.pageSize),
          });
          const res = await authenticatedFetch(`/api/admin/products?${params}`);
          const data = await res.json();
          set({ products: data.items, total: data.total, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      updateCogs: async (authenticatedFetch, productId, data) => {
        const res = await authenticatedFetch(`/api/admin/products/${productId}/costs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const updated = await res.json();
        set((s) => ({
          products: s.products.map((p) => (p.id === productId ? updated : p)),
        }));
      },

      bulkImportCogs: async (authenticatedFetch, rows) => {
        const res = await authenticatedFetch('/api/admin/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }),
        });
        return res.json();
      },
    }),
    { name: 'products-store' },
  ),
);
```

```typescript
// bundles.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BundleDto, CreateBundleDto } from '@bundlify/shared-types';

interface BundlesState {
  bundles: BundleDto[];
  currentBundle: BundleDto | null;
  loading: boolean;
  generating: boolean;
  error: string | null;

  fetchBundles: (authenticatedFetch: typeof fetch) => Promise<void>;
  fetchBundle: (authenticatedFetch: typeof fetch, id: string) => Promise<void>;
  createBundle: (authenticatedFetch: typeof fetch, data: CreateBundleDto) => Promise<BundleDto>;
  updateBundle: (authenticatedFetch: typeof fetch, id: string, data: Partial<CreateBundleDto>) => Promise<void>;
  deleteBundle: (authenticatedFetch: typeof fetch, id: string) => Promise<void>;
  generateBundles: (authenticatedFetch: typeof fetch) => Promise<void>;
  setStatus: (authenticatedFetch: typeof fetch, id: string, status: string) => Promise<void>;
}

export const useBundlesStore = create<BundlesState>()(
  devtools(
    (set) => ({
      bundles: [],
      currentBundle: null,
      loading: false,
      generating: false,
      error: null,

      fetchBundles: async (authenticatedFetch) => {
        set({ loading: true });
        const res = await authenticatedFetch('/api/admin/bundles');
        const data = await res.json();
        set({ bundles: data, loading: false });
      },

      fetchBundle: async (authenticatedFetch, id) => {
        set({ loading: true });
        const res = await authenticatedFetch(`/api/admin/bundles/${id}`);
        const data = await res.json();
        set({ currentBundle: data, loading: false });
      },

      createBundle: async (authenticatedFetch, data) => {
        const res = await authenticatedFetch('/api/admin/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const bundle = await res.json();
        set((s) => ({ bundles: [bundle, ...s.bundles] }));
        return bundle;
      },

      updateBundle: async (authenticatedFetch, id, data) => {
        const res = await authenticatedFetch(`/api/admin/bundles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const updated = await res.json();
        set((s) => ({
          bundles: s.bundles.map((b) => (b.id === id ? updated : b)),
          currentBundle: s.currentBundle?.id === id ? updated : s.currentBundle,
        }));
      },

      deleteBundle: async (authenticatedFetch, id) => {
        await authenticatedFetch(`/api/admin/bundles/${id}`, { method: 'DELETE' });
        set((s) => ({ bundles: s.bundles.filter((b) => b.id !== id) }));
      },

      generateBundles: async (authenticatedFetch) => {
        set({ generating: true });
        await authenticatedFetch('/api/admin/bundles/generate', { method: 'POST' });
        const res = await authenticatedFetch('/api/admin/bundles');
        const data = await res.json();
        set({ bundles: data, generating: false });
      },

      setStatus: async (authenticatedFetch, id, status) => {
        const res = await authenticatedFetch(`/api/admin/bundles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const updated = await res.json();
        set((s) => ({
          bundles: s.bundles.map((b) => (b.id === id ? updated : b)),
        }));
      },
    }),
    { name: 'bundles-store' },
  ),
);
```

```typescript
// analytics.store.ts
import { create } from 'zustand';
import type { DashboardDto } from '@bundlify/shared-types';

interface AnalyticsState {
  dashboard: DashboardDto | null;
  dateRange: '7d' | '30d' | '90d';
  loading: boolean;

  setDateRange: (range: '7d' | '30d' | '90d') => void;
  fetchDashboard: (authenticatedFetch: typeof fetch) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  dashboard: null,
  dateRange: '30d',
  loading: false,

  setDateRange: (range) => set({ dateRange: range }),

  fetchDashboard: async (authenticatedFetch) => {
    set({ loading: true });
    const { dateRange } = get();
    const res = await authenticatedFetch(`/api/admin/dashboard?range=${dateRange}`);
    const data = await res.json();
    set({ dashboard: data, loading: false });
  },
}));
```

```typescript
// settings.store.ts
import { create } from 'zustand';

interface ShopSettingsData {
  bundleWidgetEnabled: boolean;
  checkoutUpsellEnabled: boolean;
  exitIntentEnabled: boolean;
  autoGenerateBundles: boolean;
  minBundleMarginPct: number;
  maxBundleProducts: number;
  includeDeadStock: boolean;
  deadStockDaysThreshold: number;
  showOnProductPage: boolean;
  showOnCartPage: boolean;
  showAtCheckout: boolean;
  showOnExitIntent: boolean;
  // Shop-level cost defaults
  defaultShippingCost: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}

interface SettingsState {
  settings: ShopSettingsData | null;
  loading: boolean;
  saving: boolean;

  fetchSettings: (authenticatedFetch: typeof fetch) => Promise<void>;
  updateSettings: (authenticatedFetch: typeof fetch, data: Partial<ShopSettingsData>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,
  loading: false,
  saving: false,

  fetchSettings: async (authenticatedFetch) => {
    set({ loading: true });
    const res = await authenticatedFetch('/api/admin/settings');
    const data = await res.json();
    set({ settings: data, loading: false });
  },

  updateSettings: async (authenticatedFetch, data) => {
    set({ saving: true });
    const res = await authenticatedFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set({ settings: updated, saving: false });
  },
}));
```

---

## API Endpoints

### Admin API (Authenticated via App Bridge session)

```
GET    /api/admin/dashboard              # Overview stats
GET    /api/admin/products               # List products (paginated, filterable)
PUT    /api/admin/products/:id/costs     # Update COGS
POST   /api/admin/products/import        # Bulk CSV import of COGS
GET    /api/admin/bundles                # List all bundles
GET    /api/admin/bundles/:id            # Single bundle details
POST   /api/admin/bundles                # Create manual bundle
PUT    /api/admin/bundles/:id            # Update bundle
DELETE /api/admin/bundles/:id            # Delete bundle
POST   /api/admin/bundles/generate       # Trigger auto-generation
GET    /api/admin/analytics/bundles      # Bundle performance over time
GET    /api/admin/analytics/products     # Product margin breakdown
GET    /api/admin/settings               # Shop settings
PUT    /api/admin/settings               # Update settings
POST   /api/admin/billing/upgrade        # Trigger Shopify billing
```

### Storefront API (Public, via App Proxy)

```
GET    /api/storefront/bundles
       ?product_id=X&collection_id=Y&cart_value=Z
       &trigger=product_page|cart|exit_intent
       &shop=mystore.myshopify.com

POST   /api/storefront/events
       { bundle_id, event, session_id, trigger_type, page_url, cart_value }
```

### Webhooks

```
POST   /webhooks/products-update
POST   /webhooks/products-create
POST   /webhooks/products-delete
POST   /webhooks/orders-create
POST   /webhooks/orders-paid
POST   /webhooks/inventory-levels-update
POST   /webhooks/app-uninstalled
```

---

## Shopify Integration

### Required API Scopes

```
read_products, write_products, read_orders, read_inventory,
write_discounts, read_price_rules, write_price_rules, read_customers
```

### Webhooks to Register

```
products/create, products/update, products/delete,
orders/create, orders/paid,
inventory_levels/update, app/uninstalled
```

### Extensions

#### Theme App Extension (`apps/extensions/bundlify-widget/`)

App Block architecture — merchant places the bundle widget via theme editor. All JS must be vanilla (no React in storefront).

Key behavior:
- On load, JS calls `GET /apps/bundlify/bundles?product_id={{product.id}}&trigger=product_page`
- Renders: anchor + companion items + total price + savings badge
- "Add Bundle to Cart" adds all items via Shopify AJAX Cart API (`/cart/add.js`)
- Fires analytics: `POST /apps/bundlify/events`

#### Checkout UI Extension (`apps/extensions/bundlify-checkout/`)

Uses `purchase.checkout.cart-line-list.render-after` target. Shows highest-margin bundle not already in cart.

---

## Background Jobs (BullMQ)

| Job | Schedule | Description |
|-----|----------|-------------|
| `product-sync` | Every 6h + webhook | Full/delta product sync |
| `margin-recalculate` | On COGS change + daily | Recalculate all margins |
| `dead-stock-detect` | Daily 3am | Update velocity, flag dead stock |
| `bundle-generate` | Daily 4am + manual | Auto-generate bundles |
| `analytics-aggregate` | Daily 5am | Roll up events |
| `cleanup` | Daily 6am | Purge uninstalled shop data |

---

## NX Commands

```bash
# Dev
npx nx serve api                        # NestJS on :3000
npx nx serve admin                      # React admin on :4200
# Run both + shopify tunnel for extensions:
# Terminal 1: npx nx serve api
# Terminal 2: npx nx serve admin
# Terminal 3: shopify app dev (from workspace root)

# Build
npx nx build api --configuration=production
npx nx build admin --configuration=production

# Test
npx nx test margin-engine               # Unit tests for pure business logic
npx nx test api                         # API integration tests
npx nx test admin                       # Component tests

# Lint
npx nx run-many --target=lint --all

# Prisma
npx nx run prisma-client:generate       # Generate Prisma client
npx nx run prisma-client:migrate        # Run migrations

# Affected (only changed projects)
npx nx affected --target=build
npx nx affected --target=test

# Dep graph
npx nx graph
```

---

## Admin UI Pages (Polaris + React)

### 1. Dashboard (`/`)
- Total bundle revenue (last 30 days) with margin breakdown
- Conversion funnel: Views → Clicks → Add to Cart → Purchased
- Top 5 bundles by margin
- Dead stock value: $ tied up in unsold inventory
- Quick actions: "Generate Bundles", "Import COGS"

### 2. Products (`/products`)
- Polaris IndexTable: product, price, COGS, margin %, dead stock badge
- Inline COGS edit (CogsInlineEdit component)
- Bulk CSV import modal (CogsCsvImport component)
- MarginBadge: green (>30%), yellow (15-30%), red (<15%), gray (no COGS)
- Filter/sort by margin, dead stock, velocity

### 3. Bundles (`/bundles`)
- Polaris IndexTable: name, type, discount %, margin %, conversions, status
- BundleWizard (multi-step):
  - Step 1: Type selection (fixed, cross-sell, dead stock)
  - Step 2: Product picker (BundleProductPicker) with live margin preview
  - Step 3: Discount slider (DiscountSlider) — uses `@bundlify/margin-engine` client-side for instant margin recalc
  - Step 4: Display rules (where, when)
  - Step 5: Review MarginImpactCard → Activate
- Auto-generated bundles section with approve/reject actions

### 4. Analytics (`/analytics`)
- Revenue & margin chart (Recharts or Polaris chart)
- Funnel visualization
- Dead stock cleared metric
- Per-bundle breakdown table

### 5. Settings (`/settings`)
- Default costs (shipping, processing fees)
- Bundle engine config (min margin, dead stock threshold)
- Widget display toggles
- Plan & billing (upgrade CTA)

---

## MVP Scope (Week 1–3)

### Week 1: Foundation
- [ ] NX workspace scaffold (`npx create-nx-workspace@latest bundlify --preset=ts`)
- [ ] Add NestJS app (`npx nx g @nx/nest:app api`)
- [ ] Add React app (`npx nx g @nx/react:app admin --bundler=vite`)
- [ ] Create libs: `shared-types`, `margin-engine`, `prisma-client`
- [ ] Prisma schema + MySQL migrations
- [ ] Shopify OAuth flow (auth module)
- [ ] Product sync (full + webhook handlers)
- [ ] COGS input: inline edit + CSV upload
- [ ] Margin calculator + unit tests

### Week 2: Bundle Engine + Display
- [ ] Manual bundle creation (admin UI wizard)
- [ ] Auto bundle generation (bestseller + dead stock pairing)
- [ ] Theme App Extension (product page widget)
- [ ] Storefront API (serve bundles via App Proxy)
- [ ] Cart add-to-cart flow (Shopify AJAX Cart API)
- [ ] Analytics event tracking

### Week 3: Polish + Launch
- [ ] Dashboard page with charts
- [ ] Checkout UI Extension
- [ ] Billing integration (free/starter/growth)
- [ ] Settings page
- [ ] App Store listing prep
- [ ] Submit for Shopify review

### Post-MVP (Month 2+)
- Exit-intent bundles
- A/B testing per slot
- Smart discount auto-optimization
- "Frequently bought together" from order history
- Shopify Flow integration
- Multi-currency margin calcs
- QuickBooks/Xero COGS sync

---

## Environment Variables

```env
# App
NODE_ENV=production
PORT=3000
APP_URL=https://app.bundlify.io

# Shopify
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_inventory,write_discounts
SHOPIFY_APP_URL=https://app.bundlify.io
SHOPIFY_AUTH_CALLBACK_URL=https://app.bundlify.io/auth/callback

# MySQL
DATABASE_URL=mysql://user:pass@host:3306/bundlify?charset=utf8mb4

# Redis (BullMQ)
REDIS_URL=redis://host:6379

# Encryption
TOKEN_ENCRYPTION_KEY=xxx

# Sentry (optional)
SENTRY_DSN=xxx
```

---

## Key Implementation Notes for Claude Code

1. **NX + Shopify CLI coexistence**: `apps/extensions/` is managed by Shopify CLI (`shopify app dev`), not NX. Keep `shopify.app.toml` at workspace root. NX handles `api` and `admin` apps. Run Shopify CLI from root for extension dev/deploy.

2. **MySQL-specific Prisma notes**:
   - No native array columns — use `BundleDisplayRule` join table instead of `String[]`
   - Use `@db.Text` for long strings (URLs, encrypted tokens)
   - Use `@db.VarChar(N)` on all indexed string columns (MySQL requires length for indexes)
   - Use `@db.Decimal(10,2)` for all money fields — never use floats
   - Prisma enums map cleanly to MySQL enums
   - Add `?charset=utf8mb4` to the connection string for full Unicode support
   - MySQL 8's default auth plugin is `caching_sha2_password` — ensure your driver supports it

3. **Prisma as a shared NX lib**: `@bundlify/prisma-client` wraps generated client + NestJS-compatible `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`). Import from `@bundlify/prisma-client` in the api app.

4. **Margin engine as a pure lib**: `@bundlify/margin-engine` has zero framework dependencies. Used server-side by `margin.service.ts` and client-side by the DiscountSlider component for real-time margin preview without API calls.

5. **Zustand stores receive `authenticatedFetch`** as a parameter (not imported globally). This keeps stores testable and framework-agnostic. The `useAuthenticatedFetch` hook (App Bridge) is called in components and passed to store actions.

6. **Admin app embedded in Shopify**: Use `@shopify/app-bridge-react` v4 with `AppProvider`. Polaris for all UI components. Vite builds the admin app. In production, NestJS serves it as static files. In dev, proxy from NestJS to Vite dev server.

7. **Shopify API rate limits**: Prefer GraphQL Admin API (50 cost/sec) over REST (40 req/min). For large catalog sync, use `bulkOperationRunQuery`. Implement a rate-limit-aware API client wrapper with automatic retry and exponential backoff.

8. **COGS cold start is the biggest UX risk**: Onboarding must make entering COGS dead simple. Priority: (1) CSV upload matching by SKU, (2) inline edit with "quick fill" for collections, (3) future: QuickBooks/Xero sync.

9. **Storefront security**: Configure Shopify App Proxy in `shopify.app.toml` to route `/apps/bundlify/*` through Shopify's domain. This avoids CORS issues and provides automatic shop authentication via `signature` parameter.

10. **Dev workflow**: Three terminals: `npx nx serve api` (backend :3000) + `npx nx serve admin` (React :4200) + `shopify app dev` (tunnel for extensions). In production, `nx build api` + `nx build admin`, then NestJS serves the built admin as static files from `/admin`.
