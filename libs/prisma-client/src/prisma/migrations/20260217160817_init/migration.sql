-- CreateTable
CREATE TABLE `Shop` (
    `id` VARCHAR(191) NOT NULL,
    `shopifyDomain` VARCHAR(255) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `shopifyStoreId` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `plan` ENUM('FREE', 'STARTER', 'GROWTH') NOT NULL DEFAULT 'FREE',
    `trialEndsAt` DATETIME(3) NULL,
    `installedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uninstalledAt` DATETIME(3) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `defaultShippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `paymentProcessingPct` DECIMAL(5, 2) NOT NULL DEFAULT 2.9,
    `paymentProcessingFlat` DECIMAL(10, 2) NOT NULL DEFAULT 0.30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shop_shopifyDomain_key`(`shopifyDomain`),
    UNIQUE INDEX `Shop_shopifyStoreId_key`(`shopifyStoreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShopSettings` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `bundleWidgetEnabled` BOOLEAN NOT NULL DEFAULT true,
    `checkoutUpsellEnabled` BOOLEAN NOT NULL DEFAULT true,
    `exitIntentEnabled` BOOLEAN NOT NULL DEFAULT false,
    `autoGenerateBundles` BOOLEAN NOT NULL DEFAULT true,
    `minBundleMarginPct` DECIMAL(5, 2) NOT NULL DEFAULT 15,
    `maxBundleProducts` INTEGER NOT NULL DEFAULT 4,
    `includeDeadStock` BOOLEAN NOT NULL DEFAULT true,
    `deadStockDaysThreshold` INTEGER NOT NULL DEFAULT 60,
    `showOnProductPage` BOOLEAN NOT NULL DEFAULT true,
    `showOnCartPage` BOOLEAN NOT NULL DEFAULT true,
    `showAtCheckout` BOOLEAN NOT NULL DEFAULT true,
    `showOnExitIntent` BOOLEAN NOT NULL DEFAULT false,
    `multiCurrencyEnabled` BOOLEAN NOT NULL DEFAULT false,
    `displayCurrency` VARCHAR(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ShopSettings_shopId_key`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `shopifyProductId` VARCHAR(255) NOT NULL,
    `shopifyVariantId` VARCHAR(255) NULL,
    `title` VARCHAR(500) NOT NULL,
    `variantTitle` VARCHAR(500) NULL,
    `sku` VARCHAR(255) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `compareAtPrice` DECIMAL(10, 2) NULL,
    `cogs` DECIMAL(10, 2) NULL,
    `shippingCost` DECIMAL(10, 2) NULL,
    `additionalCosts` DECIMAL(10, 2) NULL,
    `contributionMargin` DECIMAL(10, 2) NULL,
    `contributionMarginPct` DECIMAL(5, 2) NULL,
    `inventoryQuantity` INTEGER NOT NULL DEFAULT 0,
    `inventoryItemId` VARCHAR(255) NULL,
    `avgDailySales` DECIMAL(10, 4) NOT NULL DEFAULT 0,
    `lastSoldAt` DATETIME(3) NULL,
    `daysWithoutSale` INTEGER NOT NULL DEFAULT 0,
    `isDeadStock` BOOLEAN NOT NULL DEFAULT false,
    `shopifyUpdatedAt` DATETIME(3) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `imageUrl` TEXT NULL,
    `status` ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_shopId_isDeadStock_idx`(`shopId`, `isDeadStock`),
    INDEX `Product_shopId_contributionMarginPct_idx`(`shopId`, `contributionMarginPct`),
    INDEX `Product_shopId_avgDailySales_idx`(`shopId`, `avgDailySales`),
    UNIQUE INDEX `Product_shopId_shopifyProductId_shopifyVariantId_key`(`shopId`, `shopifyProductId`, `shopifyVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bundle` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `type` ENUM('FIXED', 'MIX_MATCH', 'VOLUME', 'CROSS_SELL', 'DEAD_STOCK') NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `source` ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO',
    `abTestId` VARCHAR(191) NULL,
    `bundlePrice` DECIMAL(10, 2) NOT NULL,
    `individualTotal` DECIMAL(10, 2) NOT NULL,
    `discountPct` DECIMAL(5, 2) NOT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    `totalCogs` DECIMAL(10, 2) NULL,
    `totalShippingCost` DECIMAL(10, 2) NULL,
    `processingFee` DECIMAL(10, 2) NULL,
    `contributionMargin` DECIMAL(10, 2) NULL,
    `contributionMarginPct` DECIMAL(5, 2) NULL,
    `displayPriority` INTEGER NOT NULL DEFAULT 0,
    `triggerType` ENUM('PRODUCT_PAGE', 'CART_PAGE', 'CHECKOUT', 'EXIT_INTENT', 'POST_PURCHASE') NOT NULL DEFAULT 'PRODUCT_PAGE',
    `minCartValue` DECIMAL(10, 2) NULL,
    `maxCartValue` DECIMAL(10, 2) NULL,
    `maxRedemptions` INTEGER NULL,
    `currentRedemptions` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Bundle_shopId_status_triggerType_idx`(`shopId`, `status`, `triggerType`),
    INDEX `Bundle_shopId_contributionMarginPct_idx`(`shopId`, `contributionMarginPct`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleDisplayRule` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('PRODUCT', 'COLLECTION') NOT NULL,
    `targetId` VARCHAR(255) NOT NULL,

    INDEX `BundleDisplayRule_targetType_targetId_idx`(`targetType`, `targetId`),
    UNIQUE INDEX `BundleDisplayRule_bundleId_targetType_targetId_key`(`bundleId`, `targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleItem` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `isAnchor` BOOLEAN NOT NULL DEFAULT false,
    `isDeadStock` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `BundleItem_bundleId_productId_key`(`bundleId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleView` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `event` ENUM('VIEWED', 'CLICKED', 'ADDED_TO_CART', 'PURCHASED', 'DISMISSED') NOT NULL,
    `sessionId` VARCHAR(255) NULL,
    `abTestId` VARCHAR(255) NULL,
    `abVariant` VARCHAR(10) NULL,
    `triggerType` ENUM('PRODUCT_PAGE', 'CART_PAGE', 'CHECKOUT', 'EXIT_INTENT', 'POST_PURCHASE') NOT NULL,
    `pageUrl` TEXT NULL,
    `cartValue` DECIMAL(10, 2) NULL,
    `orderId` VARCHAR(255) NULL,
    `revenue` DECIMAL(10, 2) NULL,
    `margin` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BundleView_shopId_bundleId_event_createdAt_idx`(`shopId`, `bundleId`, `event`, `createdAt`),
    INDEX `BundleView_shopId_createdAt_idx`(`shopId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(255) NOT NULL,
    `webhookId` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WebhookSubscription_webhookId_key`(`webhookId`),
    UNIQUE INDEX `WebhookSubscription_shopId_topic_key`(`shopId`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ABTest` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('DRAFT', 'RUNNING', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `controlDiscountPct` DECIMAL(5, 2) NOT NULL,
    `variantDiscountPct` DECIMAL(5, 2) NOT NULL,
    `controlImpressions` INTEGER NOT NULL DEFAULT 0,
    `controlConversions` INTEGER NOT NULL DEFAULT 0,
    `controlRevenue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `variantImpressions` INTEGER NOT NULL DEFAULT 0,
    `variantConversions` INTEGER NOT NULL DEFAULT 0,
    `variantRevenue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `winnerVariant` VARCHAR(10) NULL,
    `confidenceLevel` DECIMAL(5, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ABTest_shopId_status_idx`(`shopId`, `status`),
    INDEX `ABTest_bundleId_idx`(`bundleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductAffinity` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `productAId` VARCHAR(191) NOT NULL,
    `productBId` VARCHAR(191) NOT NULL,
    `coOccurrences` INTEGER NOT NULL DEFAULT 0,
    `affinityScore` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `lastCalculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductAffinity_shopId_affinityScore_idx`(`shopId`, `affinityScore`),
    UNIQUE INDEX `ProductAffinity_shopId_productAId_productBId_key`(`shopId`, `productAId`, `productBId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` VARCHAR(191) NOT NULL,
    `baseCurrency` VARCHAR(3) NOT NULL,
    `targetCurrency` VARCHAR(3) NOT NULL,
    `rate` DECIMAL(20, 10) NOT NULL,
    `source` VARCHAR(50) NOT NULL DEFAULT 'ecb',
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExchangeRate_baseCurrency_targetCurrency_key`(`baseCurrency`, `targetCurrency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Integration` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `provider` ENUM('QUICKBOOKS', 'XERO') NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `externalId` VARCHAR(255) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'ERROR') NOT NULL DEFAULT 'CONNECTED',
    `syncErrors` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Integration_shopId_provider_key`(`shopId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscountHistory` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `previousDiscountPct` DECIMAL(5, 2) NOT NULL,
    `newDiscountPct` DECIMAL(5, 2) NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiscountHistory_bundleId_appliedAt_idx`(`bundleId`, `appliedAt`),
    INDEX `DiscountHistory_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ShopSettings` ADD CONSTRAINT `ShopSettings_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bundle` ADD CONSTRAINT `Bundle_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleDisplayRule` ADD CONSTRAINT `BundleDisplayRule_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleItem` ADD CONSTRAINT `BundleItem_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleItem` ADD CONSTRAINT `BundleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleView` ADD CONSTRAINT `BundleView_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleView` ADD CONSTRAINT `BundleView_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookSubscription` ADD CONSTRAINT `WebhookSubscription_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ABTest` ADD CONSTRAINT `ABTest_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ABTest` ADD CONSTRAINT `ABTest_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAffinity` ADD CONSTRAINT `ProductAffinity_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAffinity` ADD CONSTRAINT `ProductAffinity_productAId_fkey` FOREIGN KEY (`productAId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAffinity` ADD CONSTRAINT `ProductAffinity_productBId_fkey` FOREIGN KEY (`productBId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Integration` ADD CONSTRAINT `Integration_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountHistory` ADD CONSTRAINT `DiscountHistory_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountHistory` ADD CONSTRAINT `DiscountHistory_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
