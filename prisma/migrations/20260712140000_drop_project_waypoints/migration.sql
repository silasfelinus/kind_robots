-- Drop the Project.waypoints column. Project roadmap progress is tracked by
-- Conductor milestones (surfaced read-only in the front end); the parallel
-- free-text waypoint system has been removed.
ALTER TABLE `Project` DROP COLUMN `waypoints`;
