-- Append only; preserve every existing MySQL enum ordinal.
ALTER TABLE `Project`
  MODIFY `status` ENUM('ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED', 'BRAINSTORM', 'CONTINUOUS', 'PLAYTEST') NOT NULL DEFAULT 'BRAINSTORM';
