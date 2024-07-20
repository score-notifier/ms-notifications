/*
  Warnings:

  - Added the required column `matchLiveScoreURL` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `matchLiveScoreURL` VARCHAR(191) NOT NULL;
