-- AlterTable
ALTER TABLE `Bundle` ADD COLUMN `giftsEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `giftsSubtitle` VARCHAR(255) NULL,
    ADD COLUMN `giftsTitle` VARCHAR(255) NOT NULL DEFAULT 'Free gifts with your order';

-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `stickyBarBgColor` VARCHAR(9) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN `stickyBarButtonBgColor` VARCHAR(9) NOT NULL DEFAULT '#2563eb',
    ADD COLUMN `stickyBarButtonTextColor` VARCHAR(9) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN `stickyBarEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stickyBarTextColor` VARCHAR(9) NOT NULL DEFAULT '#111827';

-- CreateTable
CREATE TABLE `BundleUpsell` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `discountType` VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    `discountValue` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `title` VARCHAR(255) NOT NULL DEFAULT '{{product}}',
    `subtitle` VARCHAR(255) NULL,
    `selectedByDefault` BOOLEAN NOT NULL DEFAULT false,
    `matchQuantity` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BundleUpsell_bundleId_idx`(`bundleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GiftTier` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `giftType` VARCHAR(20) NOT NULL DEFAULT 'FREE_GIFT',
    `unlockQuantity` INTEGER NOT NULL DEFAULT 1,
    `label` VARCHAR(255) NULL,
    `lockedTitle` VARCHAR(255) NOT NULL DEFAULT 'Locked',
    `imageUrl` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GiftTier_bundleId_idx`(`bundleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BundleUpsell` ADD CONSTRAINT `BundleUpsell_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleUpsell` ADD CONSTRAINT `BundleUpsell_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GiftTier` ADD CONSTRAINT `GiftTier_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GiftTier` ADD CONSTRAINT `GiftTier_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
