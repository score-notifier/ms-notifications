-- AlterTable
ALTER TABLE `Notification` MODIFY `teamId` VARCHAR(191) NOT NULL,
    MODIFY `leagueId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Subscription` MODIFY `teamId` VARCHAR(191) NOT NULL,
    MODIFY `leagueId` VARCHAR(191) NOT NULL;
