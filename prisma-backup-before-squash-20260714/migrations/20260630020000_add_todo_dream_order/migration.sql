-- Add dreamId and order columns that were missing from the readd_todo_with_category migration.
-- Add DESIRED_FEATURE to TodoCategory enum to match the Prisma schema.

ALTER TABLE `Todo`
  ADD COLUMN `dreamId` INTEGER NULL,
  ADD COLUMN `order` INTEGER NULL;

ALTER TABLE `Todo`
  MODIFY COLUMN `category` ENUM('AGENT', 'KAIZEN', 'HONEYDO', 'DESIRED_FEATURE') NOT NULL DEFAULT 'AGENT';

CREATE INDEX `Todo_dreamId_idx` ON `Todo`(`dreamId`);

ALTER TABLE `Todo`
  ADD CONSTRAINT `Todo_dreamId_fkey`
  FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
