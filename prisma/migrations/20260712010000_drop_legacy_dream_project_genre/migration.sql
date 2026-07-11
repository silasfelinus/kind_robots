-- Final step of the Dream → Project/Genre migration: PROJECT dreams became
-- first-class Project rows and GENRE dreams became Facets. The remaining
-- legacy rows were archived (archives/legacy-dreams/) and deleted via the
-- legacy-dream-cleanup workflow before this migration ships, so the enum
-- narrowing and column drops below touch no live data.

-- DropIndex (projectStatus column drop below would also remove it implicitly)
DROP INDEX `Dream_projectStatus_idx` ON `Dream`;

-- AlterTable: drop the Project-specific columns and narrow the enum
ALTER TABLE `Dream`
    DROP COLUMN `projectStatus`,
    DROP COLUMN `priority`,
    DROP COLUMN `goal`,
    DROP COLUMN `waypoints`,
    DROP COLUMN `repoUrl`,
    DROP COLUMN `liveUrl`,
    MODIFY `dreamType` ENUM('ART', 'BRAINSTORM', 'PROMPTBOT', 'NARRATOR', 'CHARACTER', 'REWARD', 'SCENARIO', 'LOCATION', 'PITCH', 'WISH') NOT NULL DEFAULT 'PITCH';
