-- Give Dream and Project the fourth art variant, so all seven core objects
-- carry the same four: imagePath (square), cardPath (vertical), heroPath
-- (horizontal), iconPath (square, as a text-forward row's intro piece).
--
-- Silas, 2026-08-04: "please make sure that all our major objects have the
-- needs image variables: card icon hero and path."
--
-- Dream was the last core object without iconPath (interface-vision t-077), so
-- the gallery's Icons mode had no dedicated art to load there and fell back
-- through the variant chain to whatever else the record carried. Project had
-- the same gap and had not been filed at all -- found by auditing all four
-- fields across every core model rather than acting on the one known report.
--
-- SAFETY: purely additive. Two nullable columns; no existing table, column, or
-- row is touched, and nothing backfills. resolveArtVariantSrc already degrades
-- variant path -> variant base64 -> full-size -> fallback, so rows with a NULL
-- iconPath behave exactly as they do today until art is generated for them.

-- AlterTable
ALTER TABLE `Dream` ADD COLUMN `iconPath` TEXT NULL;

-- AlterTable
ALTER TABLE `Project` ADD COLUMN `iconPath` TEXT NULL;
