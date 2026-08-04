-- Keep existing Kind Robots Project presentation rows aligned with the
-- Build-to-Play navigation cutover. This is a targeted, reversible data
-- correction keyed by the stable Conductor join key.

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'brainstorm', `liveUrl` = '/brainstorm'
WHERE `conductorSlug` = 'brainstorm';

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'model-builder', `liveUrl` = '/model-builder'
WHERE `conductorSlug` = 'model-builder';

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'packs', `liveUrl` = '/packs'
WHERE `conductorSlug` = 'packmaker';

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'mural', `liveUrl` = '/build/mural'
WHERE `conductorSlug` = 'mural-design';

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'hair-studio', `liveUrl` = '/build/hair-studio'
WHERE `conductorSlug` = 'superkate-hairstyle-ai';

UPDATE `Project`
SET `channelKey` = 'play', `tabKey` = 'animation-manager', `liveUrl` = '/build/animation-manager'
WHERE `conductorSlug` = 'animation-manager';
