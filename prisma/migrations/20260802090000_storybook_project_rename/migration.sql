-- Storymaker becomes Storybook: the one persisted row that names the PRODUCT.
--
-- Silas, 2026-08-02: "I actually really like the Storybook theme, and think
-- that it makes a better name than Storymaker, lets go with Storybook as the
-- name of the route/app."
--
-- The code rename ships in the same commit as this migration, deliberately.
-- utils/projectPlacements.ts now keys the placement on slug 'storybook', so a
-- deploy where new code met an un-migrated row would simply fail to find the
-- project. Shipping them together means there is no window where they disagree.
--
-- WHAT WAS COUNTED FIRST (and what is deliberately NOT touched)
--
-- Every persisted place the old name could appear was queried against
-- production before writing this:
--
--   ArtJob.projectSlug = 'storymaker'      0 rows  -> nothing to migrate
--   Chat.channel       = 'storymaker'      0 rows  -> nothing to migrate
--   Project.slug       = 'storymaker'      1 row   -> THIS migration
--   ArtImage.designer LIKE '%storymaker%'  4 rows  -> deliberately left alone
--   ArtCollection.slug = 'storymaker'      1 row   -> deliberately left alone
--
-- The last two are PROVENANCE, not product naming. Those four ArtImages carry
-- `designer = 'folder-sync:storymaker'`, which server/utils/syncFolderCollection.ts
-- derives from the collection slug, which in turn mirrors a real directory:
-- their imagePath values are /images/artcollections/storymaker/*.webp and the
-- files physically exist there. Renaming those fields would make them describe
-- a folder that does not exist, and would not move a single byte. If the media
-- folder is ever renamed on the server, THAT is when those rows should follow —
-- as a separate, deliberate change.
--
-- FIVE COLUMNS, NOT TWO. The row carries the old name in more places than the
-- obvious one, and a partial rename is worse than none:
--
--   slug           the lookup key
--   conductorSlug  what conductor's sync_projects.py matches on. Left stale, a
--                  later sync would look up 'storybook', miss, and CREATE A
--                  SECOND project rather than update this one.
--   title          display
--   tabKey         frontend placement — stale, it points at a dashboard tab
--                  that no longer exists after the content rename
--   liveUrl        stale, it points at the 301 instead of the real route
--
-- The matching conductor registry entry (project-overrides.yaml) is renamed in
-- the same change, because that entry is what sync_projects.py writes FROM —
-- migrating the row without it would simply be undone by the next sync.
--
-- SAFETY: one UPDATE, scoped by slug, touching one row. Idempotent — re-running
-- it matches nothing, because the slug it looks for is gone after the first
-- run. Reversible by hand with the inverse UPDATE. No schema change, no DDL,
-- nothing dropped.

UPDATE `Project`
SET `slug` = 'storybook',
    `conductorSlug` = 'storybook',
    `title` = 'Storybook',
    `tabKey` = 'storybook',
    `liveUrl` = '/storybook'
WHERE `slug` = 'storymaker';
