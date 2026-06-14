/*
  Warnings:

  - The primary key for the `apartment_images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `apartment_images` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `apartment_images` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `apartment_id` on the `apartment_images` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `apartments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `apartment_code` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `apartments` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `apartments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `building_id` on the `apartments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status` on the `apartments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(10))` to `Int`.
  - The primary key for the `buildings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `total_rooms` on the `buildings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `buildings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status` on the `buildings` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Int`.
  - The primary key for the `chatbot_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `chatbot_messages` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `conversation_id` on the `chatbot_messages` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `sender_type` on the `chatbot_messages` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.
  - The primary key for the `invoice_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `invoice_id` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `quantity` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - The primary key for the `invoices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `contract_id` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `tenant_id` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Int`.
  - The primary key for the `maintenance_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `maintenance_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `tenant_id` on the `maintenance_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `apartment_id` on the `maintenance_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `priority` on the `maintenance_requests` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `maintenance_requests` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(11))` to `Int`.
  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `reference_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `user_id` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `type` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(191)`.
  - The primary key for the `payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `invoice_id` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `payment_method` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Int`.
  - The primary key for the `rental_contracts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `rental_contracts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `apartment_id` on the `rental_contracts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `tenant_id` on the `rental_contracts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status` on the `rental_contracts` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(12))` to `Int`.
  - The primary key for the `tenants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `tenants` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `citizen_id` on the `tenants` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(12)`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(0))`.
  - You are about to alter the column `status` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Int`.
  - The primary key for the `utility_readings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `image_url` on the `utility_readings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `apartment_id` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `invoice_id` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `electric_old` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - You are about to alter the column `electric_new` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - You are about to alter the column `water_old` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - You are about to alter the column `water_new` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - The primary key for the `viewing_schedules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `viewing_schedules` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `apartment_id` on the `viewing_schedules` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status` on the `viewing_schedules` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `Int`.
  - You are about to drop the `chat_sessions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `floor` to the `apartments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_number` to the `apartments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_name` to the `buildings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_floors` to the `buildings` table without a default value. This is not possible if the table is not empty.
  - Made the column `user_id` on table `tenants` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `apartment_images_apartment_id_idx` ON `apartment_images`;

-- DropIndex
DROP INDEX `apartments_building_id_idx` ON `apartments`;

-- DropIndex
DROP INDEX `buildings_name_idx` ON `buildings`;

-- DropIndex
DROP INDEX `buildings_name_key` ON `buildings`;

-- DropIndex
DROP INDEX `chatbot_messages_conversation_id_idx` ON `chatbot_messages`;

-- DropIndex
DROP INDEX `invoice_items_invoice_id_idx` ON `invoice_items`;

-- DropIndex
DROP INDEX `invoices_contract_id_idx` ON `invoices`;

-- DropIndex
DROP INDEX `invoices_tenant_id_idx` ON `invoices`;

-- DropIndex
DROP INDEX `maintenance_requests_apartment_id_idx` ON `maintenance_requests`;

-- DropIndex
DROP INDEX `maintenance_requests_tenant_id_idx` ON `maintenance_requests`;

-- DropIndex
DROP INDEX `notifications_user_id_idx` ON `notifications`;

-- DropIndex
DROP INDEX `payments_invoice_id_idx` ON `payments`;

-- DropIndex
DROP INDEX `payments_transaction_code_key` ON `payments`;

-- DropIndex
DROP INDEX `rental_contracts_apartment_id_idx` ON `rental_contracts`;

-- DropIndex
DROP INDEX `rental_contracts_tenant_id_idx` ON `rental_contracts`;

-- DropIndex
DROP INDEX `users_phone_key` ON `users`;

-- DropIndex
DROP INDEX `utility_readings_apartment_id_idx` ON `utility_readings`;

-- DropIndex
DROP INDEX `utility_readings_invoice_id_key` ON `utility_readings`;

-- DropIndex
DROP INDEX `viewing_schedules_apartment_id_idx` ON `viewing_schedules`;

-- AlterTable
ALTER TABLE `apartment_images` DROP PRIMARY KEY,
    DROP COLUMN `created_at`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `apartment_id` INTEGER NOT NULL,
    MODIFY `image_url` TEXT NOT NULL,
    MODIFY `is_thumbnail` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `apartments` DROP PRIMARY KEY,
    DROP COLUMN `apartment_code`,
    DROP COLUMN `created_at`,
    DROP COLUMN `title`,
    ADD COLUMN `floor` INTEGER NOT NULL,
    ADD COLUMN `room_number` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `building_id` INTEGER NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `buildings` DROP PRIMARY KEY,
    DROP COLUMN `total_rooms`,
    ADD COLUMN `branch_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `total_floors` INTEGER NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `status` INTEGER NOT NULL DEFAULT 1,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `chatbot_messages` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `conversation_id` INTEGER NOT NULL,
    MODIFY `sender_type` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `invoice_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `invoice_id` INTEGER NOT NULL,
    MODIFY `quantity` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `invoices` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `contract_id` INTEGER NOT NULL,
    MODIFY `tenant_id` INTEGER NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `maintenance_requests` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `tenant_id` INTEGER NOT NULL,
    MODIFY `apartment_id` INTEGER NOT NULL,
    MODIFY `image_url` TEXT NULL,
    MODIFY `priority` VARCHAR(191) NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `notifications` DROP PRIMARY KEY,
    DROP COLUMN `reference_id`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `user_id` INTEGER NOT NULL,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `is_read` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `payments` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `invoice_id` INTEGER NOT NULL,
    MODIFY `payment_method` VARCHAR(191) NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 1,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `rental_contracts` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `apartment_id` INTEGER NOT NULL,
    MODIFY `tenant_id` INTEGER NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 1,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `tenants` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `user_id` INTEGER NOT NULL,
    MODIFY `citizen_id` VARCHAR(12) NULL,
    MODIFY `is_verified` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    DROP COLUMN `updated_at`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `role` ENUM('ADMIN', 'BAN_QUAN_LY', 'CU_DAN') NOT NULL DEFAULT 'CU_DAN',
    MODIFY `status` INTEGER NOT NULL DEFAULT 1,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `utility_readings` DROP PRIMARY KEY,
    DROP COLUMN `image_url`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `apartment_id` INTEGER NOT NULL,
    MODIFY `invoice_id` INTEGER NULL,
    MODIFY `electric_old` INTEGER NOT NULL,
    MODIFY `electric_new` INTEGER NOT NULL,
    MODIFY `water_old` INTEGER NOT NULL,
    MODIFY `water_new` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `viewing_schedules` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `apartment_id` INTEGER NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `chat_sessions`;

-- CreateTable
CREATE TABLE `chat_conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apartments` ADD CONSTRAINT `apartments_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apartment_images` ADD CONSTRAINT `apartment_images_apartment_id_fkey` FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_apartment_id_fkey` FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `rental_contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_apartment_id_fkey` FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viewing_schedules` ADD CONSTRAINT `viewing_schedules_apartment_id_fkey` FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utility_readings` ADD CONSTRAINT `utility_readings_apartment_id_fkey` FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utility_readings` ADD CONSTRAINT `utility_readings_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chatbot_messages` ADD CONSTRAINT `chatbot_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
