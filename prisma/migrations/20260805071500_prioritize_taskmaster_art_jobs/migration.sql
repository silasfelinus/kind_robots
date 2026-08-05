-- Put the currently queued Taskmaster art package ahead of the ordinary backlog.
-- This is deliberately data-preserving and only touches still-pending work.
UPDATE `ArtJob`
SET `priority` = 100
WHERE `status` = 'PENDING'
  AND (`projectSlug` = 'taskmaster' OR `id` IN (2846, 2847, 2848, 2849, 2850))
  AND `priority` < 100;
