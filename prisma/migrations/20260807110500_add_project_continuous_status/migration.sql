-- Preserve the existing enum value order so MariaDB/MySQL ordinal storage does not shift.
ALTER TABLE `Project`
  MODIFY `status` ENUM('ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED', 'BRAINSTORM', 'CONTINUOUS') NOT NULL DEFAULT 'BRAINSTORM';
