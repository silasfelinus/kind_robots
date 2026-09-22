-- Add Resource.loraCategory + Resource.loraCategorySource (lora-ingestion).
--
-- Every LoRA in this catalog is described by what it LOADS ONTO
-- (supportedServer/generation) and, since t-069, by where it ATTACHES
-- (loraTarget). Nothing describes what it is FOR. A character LoRA, a style
-- LoRA and a clothing LoRA are indistinguishable to every code path here,
-- which is exactly why a prompt like "{character} running in {style}" had no
-- answer: there was no column that could tell those two pools apart.
--
-- loraCategory is that column. loraCategorySource records who decided it, so
-- re-running the classifier over the catalog can refresh CIVITAI/HEURISTIC
-- guesses without ever overwriting a hand correction (HUMAN).
--
-- Purely additive: two nullable columns with no default rewrite no existing
-- rows, and nothing reads them until a row is actually classified. The index
-- serves the randomizer's one hot query -- "give me the classified LoRAs in
-- category X" -- which would otherwise scan the whole Resource table on every
-- batch roll.

ALTER TABLE `Resource`
  ADD COLUMN `loraCategory` ENUM(
    'CHARACTER',
    'STYLE',
    'SETTING',
    'ACTION',
    'CLOTHING',
    'OBJECT',
    'CREATURE',
    'DETAIL',
    'CONCEPT',
    'OTHER'
  ) NULL,
  ADD COLUMN `loraCategorySource` VARCHAR(32) NULL;

CREATE INDEX `Resource_loraCategory_idx`
  ON `Resource` (`loraCategory`, `resourceType`);
