-- art-archive/t-012: recoverable trash (restore) for ArchiveEntry.
--
-- Quarantine ("delete") relocates an entry's file into the reserved
-- `_archive_trash` subtree and overwrites `relativePath` with the trash
-- path, so the entry's original location is otherwise lost. This column
-- preserves that original location so a later restore can move the file
-- back where it came from.
--
-- SAFETY: additive nullable column only; existing ArchiveEntry rows are
-- untouched (all read back NULL, meaning "never quarantined").

ALTER TABLE `ArchiveEntry` ADD COLUMN `preQuarantineRelativePath` VARCHAR(764) NULL;
