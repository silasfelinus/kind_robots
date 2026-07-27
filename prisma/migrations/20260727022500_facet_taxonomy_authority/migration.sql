-- Make FacetProfile.taxonomy the authoritative typed classifier.
-- Unknown legacy strings are preserved safely as OTHER before the enum conversion.

UPDATE `FacetProfile`
SET `taxonomy` = 'OTHER'
WHERE `taxonomy` IS NULL
   OR `taxonomy` NOT IN (
     'GENRE',
     'ANIMAL',
     'COLOR',
     'THEME',
     'CORE',
     'MOOD',
     'STYLE',
     'SETTING',
     'ART_DIRECTION',
     'SPECIES',
     'OCCUPATION',
     'ARCHETYPE',
     'ROLE',
     'ALIGNMENT',
     'GENDER',
     'BOT_TYPE',
     'DREAM_TYPE',
     'REWARD_TYPE',
     'RARITY',
     'PERSONALITY',
     'BACKSTORY',
     'QUIRK',
     'MATERIAL',
     'PROMPT_ENHANCEMENT',
     'OTHER'
   );

ALTER TABLE `FacetProfile`
  MODIFY `taxonomy` ENUM(
    'GENRE',
    'ANIMAL',
    'COLOR',
    'THEME',
    'CORE',
    'MOOD',
    'STYLE',
    'SETTING',
    'ART_DIRECTION',
    'SPECIES',
    'OCCUPATION',
    'ARCHETYPE',
    'ROLE',
    'ALIGNMENT',
    'GENDER',
    'BOT_TYPE',
    'DREAM_TYPE',
    'REWARD_TYPE',
    'RARITY',
    'PERSONALITY',
    'BACKSTORY',
    'QUIRK',
    'MATERIAL',
    'PROMPT_ENHANCEMENT',
    'OTHER'
  ) NOT NULL DEFAULT 'OTHER';
