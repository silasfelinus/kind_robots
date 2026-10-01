-- Retired Admin surfaces (kind_robots #2663, #2668): Scoop CMS, Packs and the
-- Mural Studio no longer have routes, so their projects stop pointing at them.
-- Data-only and backward-compatible: the old build simply links nowhere new.
-- Each row is cleared only while it still names the retired route, so a
-- placement someone has since changed by hand is left alone.

UPDATE `Project`
SET `channelKey` = NULL, `tabKey` = NULL, `liveUrl` = NULL
WHERE `conductorSlug` = 'humboldt-scoop-cms' AND `liveUrl` = '/scoop-cms';

UPDATE `Project`
SET `channelKey` = NULL, `tabKey` = NULL, `liveUrl` = NULL
WHERE `conductorSlug` = 'packmaker' AND `liveUrl` = '/packs';

UPDATE `Project`
SET `channelKey` = NULL, `tabKey` = NULL, `liveUrl` = NULL
WHERE `conductorSlug` = 'mural-design' AND `liveUrl` = '/build/mural';
