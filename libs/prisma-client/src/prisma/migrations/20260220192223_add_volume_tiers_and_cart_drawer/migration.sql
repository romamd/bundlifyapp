-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `cartDrawerEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeShippingThreshold` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `VolumeTier` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `minQuantity` INTEGER NOT NULL,
    `maxQuantity` INTEGER NULL,
    `discountPct` DECIMAL(5, 2) NOT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    `pricePerUnit` DECIMAL(10, 2) NULL,
    `label` VARCHAR(50) NULL,

    INDEX `VolumeTier_bundleId_idx`(`bundleId`),
    UNIQUE INDEX `VolumeTier_bundleId_minQuantity_key`(`bundleId`, `minQuantity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VolumeTier` ADD CONSTRAINT `VolumeTier_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
