-- Give Characters, Dreams, Rewards, Scenarios and Facets their own card theme.
--
-- Silas, 2026-08-10: "it looks very pretty to have the bots with their custom
-- theme backgrounds and displays. I want that in the others ... So each card
-- when viewed should have a theme shift to distinguish it from neighbours, and
-- the nice themed background border around each card."
--
-- Bot has had `theme` for a while and bot-card puts it on a data-theme wrapper.
-- These five now carry the same column. Resources are excluded on Silas's call;
-- Themes, Icons and Achievements were excluded in the same message.
--
-- BUILT-INS ONLY. "from daisyui, don't use the customs in case things break" --
-- so the 35 stock daisyUI themes, without the `storybook`/`storybook-dark`
-- house themes that lead the app's own daisyuiThemes array.
--
-- THE BACKFILL IS DERIVED, NOT RANDOM. MOD(id, 35) is the same rule
-- resolveEntityTheme() applies client-side when the column is NULL, so a
-- backfilled row and an un-backfilled one look identical. RAND() would have
-- been reasonable here and wrong in the client -- a fallback that re-rolls per
-- render makes a scrolling grid strobe -- and having the two disagree would
-- mean a card changing colour the moment someone saved an unrelated edit.
--
-- Sequential ids step through the list one at a time, which is what makes
-- ADJACENT cards reliably differ; 35 entries means a repeat is never visible
-- in one screenful.
--
-- SAFETY: additive. Five nullable columns; no existing column or row shape
-- changes, and the backfill only writes rows where the column is still NULL.
-- IF NOT EXISTS because DDL is not transactional here -- the 2026-08-06
-- per-slot migration died in its backfill with its ALTERs already applied, so a
-- re-run has to be a no-op on whatever landed before the failure.

-- AlterTable
ALTER TABLE `Character`
  ADD COLUMN IF NOT EXISTS `theme` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Dream`
  ADD COLUMN IF NOT EXISTS `theme` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Reward`
  ADD COLUMN IF NOT EXISTS `theme` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Scenario`
  ADD COLUMN IF NOT EXISTS `theme` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Facet`
  ADD COLUMN IF NOT EXISTS `theme` VARCHAR(764) NULL;

UPDATE `Character` SET `theme` = ELT(MOD(`id`, 35) + 1,
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk'
  )
  WHERE `theme` IS NULL;

UPDATE `Dream` SET `theme` = ELT(MOD(`id`, 35) + 1,
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk'
  )
  WHERE `theme` IS NULL;

UPDATE `Reward` SET `theme` = ELT(MOD(`id`, 35) + 1,
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk'
  )
  WHERE `theme` IS NULL;

UPDATE `Scenario` SET `theme` = ELT(MOD(`id`, 35) + 1,
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk'
  )
  WHERE `theme` IS NULL;

UPDATE `Facet` SET `theme` = ELT(MOD(`id`, 35) + 1,
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk'
  )
  WHERE `theme` IS NULL;
