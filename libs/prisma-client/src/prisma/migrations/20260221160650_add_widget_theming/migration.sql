-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `widgetBadgeBackground` VARCHAR(9) NOT NULL DEFAULT '#dcfce7',
    ADD COLUMN `widgetBadgeTextColor` VARCHAR(9) NOT NULL DEFAULT '#166534',
    ADD COLUMN `widgetBorderRadius` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `widgetButtonText` VARCHAR(50) NOT NULL DEFAULT 'Add Bundle to Cart',
    ADD COLUMN `widgetCardBackground` VARCHAR(9) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN `widgetLayout` VARCHAR(20) NOT NULL DEFAULT 'vertical',
    ADD COLUMN `widgetPrimaryColor` VARCHAR(9) NOT NULL DEFAULT '#2563eb',
    ADD COLUMN `widgetPrimaryColorHover` VARCHAR(9) NOT NULL DEFAULT '#1d4ed8',
    ADD COLUMN `widgetTextColor` VARCHAR(9) NOT NULL DEFAULT '#111827';
