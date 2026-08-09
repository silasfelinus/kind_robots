-- Wishmaster was retired in Conductor on 2026-08-09. The projection sync
-- already moved its lifecycle status to ARCHIVED, but older sync semantics
-- preserved the Project row's active flag and dead frontend placement.
--
-- This one-time cleanup makes the existing production row match the new
-- lifecycle contract in server/api/conductor/sync.post.ts. Future archived
-- Conductor projects are cleaned by the sync route itself.
UPDATE `Project`
SET
  `isActive` = 0,
  `liveUrl` = NULL,
  `channelKey` = NULL,
  `tabKey` = NULL
WHERE
  `status` = 'ARCHIVED'
  AND (
    `conductorSlug` = 'wishmaster'
    OR (`conductorSlug` IS NULL AND `slug` = 'wishmaster')
  );
