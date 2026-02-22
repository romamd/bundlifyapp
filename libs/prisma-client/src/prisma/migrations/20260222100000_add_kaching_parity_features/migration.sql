-- AlterTable: ShopSettings — gift colors, upsell colors, typography, spacing, sticky bar extended
ALTER TABLE `ShopSettings`
    ADD COLUMN `widgetGiftBgColor` VARCHAR(9) NOT NULL DEFAULT '#fef9c3',
    ADD COLUMN `widgetGiftTextColor` VARCHAR(9) NOT NULL DEFAULT '#854d0e',
    ADD COLUMN `widgetGiftSelectedBgColor` VARCHAR(9) NOT NULL DEFAULT '#fef08a',
    ADD COLUMN `widgetGiftSelectedTextColor` VARCHAR(9) NOT NULL DEFAULT '#713f12',
    ADD COLUMN `widgetUpsellBgColor` VARCHAR(9) NOT NULL DEFAULT '#f0fdf4',
    ADD COLUMN `widgetUpsellTextColor` VARCHAR(9) NOT NULL DEFAULT '#166534',
    ADD COLUMN `widgetUpsellSelectedBgColor` VARCHAR(9) NOT NULL DEFAULT '#dcfce7',
    ADD COLUMN `widgetUpsellSelectedTextColor` VARCHAR(9) NOT NULL DEFAULT '#14532d',
    ADD COLUMN `widgetLabelFontSize` INTEGER NOT NULL DEFAULT 11,
    ADD COLUMN `widgetLabelFontWeight` VARCHAR(10) NOT NULL DEFAULT 'bold',
    ADD COLUMN `widgetGiftFontSize` INTEGER NOT NULL DEFAULT 13,
    ADD COLUMN `widgetGiftFontWeight` VARCHAR(10) NOT NULL DEFAULT 'normal',
    ADD COLUMN `widgetUpsellFontSize` INTEGER NOT NULL DEFAULT 13,
    ADD COLUMN `widgetUpsellFontWeight` VARCHAR(10) NOT NULL DEFAULT 'normal',
    ADD COLUMN `widgetUnitLabelFontSize` INTEGER NOT NULL DEFAULT 13,
    ADD COLUMN `widgetUnitLabelFontWeight` VARCHAR(10) NOT NULL DEFAULT 'bold',
    ADD COLUMN `widgetSpacing` INTEGER NOT NULL DEFAULT 12,
    ADD COLUMN `stickyBarButtonText` VARCHAR(100) NOT NULL DEFAULT 'Choose Bundle',
    ADD COLUMN `stickyBarTitleFontSize` INTEGER NOT NULL DEFAULT 14,
    ADD COLUMN `stickyBarTitleFontWeight` VARCHAR(10) NOT NULL DEFAULT 'normal',
    ADD COLUMN `stickyBarButtonFontSize` INTEGER NOT NULL DEFAULT 14,
    ADD COLUMN `stickyBarButtonFontWeight` VARCHAR(10) NOT NULL DEFAULT 'bold',
    ADD COLUMN `stickyBarButtonPadding` INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN `stickyBarButtonBorderRadius` INTEGER NOT NULL DEFAULT 8;

-- AlterTable: Bundle — countdown styling, gift options, low stock, skip-to-checkout
ALTER TABLE `Bundle`
    ADD COLUMN `giftsLayout` VARCHAR(20) NOT NULL DEFAULT 'vertical',
    ADD COLUMN `giftsHideUntilUnlocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `giftsShowLockedLabels` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `countdownTitleFontSize` INTEGER NULL,
    ADD COLUMN `countdownTitleFontWeight` VARCHAR(10) NULL,
    ADD COLUMN `countdownTitleAlignment` VARCHAR(10) NOT NULL DEFAULT 'center',
    ADD COLUMN `lowStockAlertEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `skipToCheckout` BOOLEAN NOT NULL DEFAULT false;
