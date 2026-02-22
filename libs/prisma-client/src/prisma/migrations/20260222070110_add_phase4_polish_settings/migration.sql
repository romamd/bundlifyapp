-- AlterTable
ALTER TABLE `Bundle` ADD COLUMN `translations` TEXT NULL;

-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `discountOnlyViaWidget` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `excludeB2B` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `priceRoundingEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `themePriceMode` VARCHAR(20) NOT NULL DEFAULT 'per_item',
    ADD COLUMN `updateThemePrice` BOOLEAN NOT NULL DEFAULT false;
