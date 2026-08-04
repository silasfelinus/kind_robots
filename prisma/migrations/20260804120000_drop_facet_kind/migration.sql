-- Drop the deprecated Facet.kind column. FacetProfile.taxonomy is authoritative
-- (interface-vision t-016 consolidated every write onto
-- legacyFacetKindForTaxonomy; t-072 is the destructive second half).
--
-- Approved as a planned delete by Silas, 2026-08-04: "approved to drop it, this
-- was a planned delete."
--
-- THE PRECONDITION IS ENFORCED HERE, NOT ASSUMED. Facet and FacetProfile are
-- not 1:1 at the Prisma level -- only a DB-level FK with ON DELETE CASCADE -- so
-- a Facet with no FacetProfile row would become unclassifiable the moment the
-- column is gone. Two code paths prove this was load-bearing: both
-- server/utils/facetAssignments.ts and server/api/facets/[id].patch.ts read
-- `kind` precisely as the fallback for a missing profile.
--
-- So step 1 backfills a profile for every such Facet before step 2 removes the
-- source. Doing it in this file rather than as a "run repairFacetProfiles first"
-- instruction means there is no window in which the two can disagree, and no
-- way to apply the drop without the backfill.
--
-- The mapping mirrors legacyFacetTaxonomyFromKind exactly: every FacetKind value
-- is also a FacetTaxonomy value, so the CASE is a straight pass-through with
-- OTHER as the catch-all. FacetProfile's remaining columns all have defaults.

-- Step 1: no Facet may be left without a profile.
INSERT INTO `FacetProfile` (`facetId`, `taxonomy`)
SELECT `f`.`id`,
       CASE `f`.`kind`
         WHEN 'GENRE'         THEN 'GENRE'
         WHEN 'ANIMAL'        THEN 'ANIMAL'
         WHEN 'COLOR'         THEN 'COLOR'
         WHEN 'THEME'         THEN 'THEME'
         WHEN 'CORE'          THEN 'CORE'
         WHEN 'MOOD'          THEN 'MOOD'
         WHEN 'STYLE'         THEN 'STYLE'
         WHEN 'SETTING'       THEN 'SETTING'
         WHEN 'ART_DIRECTION' THEN 'ART_DIRECTION'
         ELSE 'OTHER'
       END
FROM `Facet` AS `f`
LEFT JOIN `FacetProfile` AS `p` ON `p`.`facetId` = `f`.`id`
WHERE `p`.`facetId` IS NULL;

-- Step 2: the column and its index are now unreferenced.
DROP INDEX `Facet_kind_idx` ON `Facet`;
ALTER TABLE `Facet` DROP COLUMN `kind`;
