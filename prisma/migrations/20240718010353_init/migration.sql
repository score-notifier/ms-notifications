/*
  Warnings:

  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subscriptionId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `subscriptionId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Subscription`;
