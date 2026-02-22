-- AlterTable
ALTER TABLE `Bundle` ADD COLUMN `customCss` TEXT NULL;

-- AlterTable
ALTER TABLE `ShopSettings` ADD COLUMN `cartTimerMinutes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `cartTimerText` VARCHAR(255) NOT NULL DEFAULT 'Your cart will expire in {{timer}}';
