-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `widgetBorderColor` VARCHAR(9) NOT NULL DEFAULT '#e5e7eb',
    ADD COLUMN `widgetCardShadow` VARCHAR(10) NOT NULL DEFAULT 'subtle',
    ADD COLUMN `widgetCustomCss` TEXT NULL,
    ADD COLUMN `widgetFontSize` INTEGER NOT NULL DEFAULT 14,
    ADD COLUMN `widgetFontWeight` VARCHAR(10) NOT NULL DEFAULT 'normal',
    ADD COLUMN `widgetSecondaryTextColor` VARCHAR(9) NOT NULL DEFAULT '#6b7280',
    ADD COLUMN `widgetShowCompareAtPrice` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `widgetShowSavings` BOOLEAN NOT NULL DEFAULT true;
