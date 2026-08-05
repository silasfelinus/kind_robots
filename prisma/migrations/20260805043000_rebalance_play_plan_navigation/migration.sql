-- Keep existing Kind Robots Project presentation rows aligned with the
-- Play-to-Plan navigation rebalance. Routes and tab keys stay stable; only
-- the owning channel changes.

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'coloring', `liveUrl` = '/coloring'
WHERE `conductorSlug` = 'coloring-book';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'brainstorm', `liveUrl` = '/brainstorm'
WHERE `conductorSlug` = 'brainstorm';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'packs', `liveUrl` = '/packs'
WHERE `conductorSlug` = 'packmaker';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'model-builder', `liveUrl` = '/model-builder'
WHERE `conductorSlug` = 'model-builder';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'mural', `liveUrl` = '/build/mural'
WHERE `conductorSlug` = 'mural-design';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'animation-manager', `liveUrl` = '/build/animation-manager'
WHERE `conductorSlug` = 'animation-manager';

UPDATE `Project`
SET `channelKey` = 'plan', `tabKey` = 'hair-studio', `liveUrl` = '/build/hair-studio'
WHERE `conductorSlug` = 'superkate-hairstyle-ai';
