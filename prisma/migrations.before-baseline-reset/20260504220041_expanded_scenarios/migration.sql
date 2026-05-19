-- AlterTable
ALTER TABLE `Scenario` MODIFY `description` TEXT NOT NULL,
    MODIFY `intros` TEXT NOT NULL,
    MODIFY `locations` TEXT NULL,
    MODIFY `artPrompt` TEXT NULL,
    MODIFY `inspirations` TEXT NULL;
