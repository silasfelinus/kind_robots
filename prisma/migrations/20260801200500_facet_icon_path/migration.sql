-- Facet iconPath is generated logo artwork. Facet.icon remains the name of
-- a simple Kind Robots UI glyph and is intentionally unchanged.
--
-- SAFETY: additive nullable column only; existing Facets and curated artwork
-- are untouched.

ALTER TABLE `Facet` ADD COLUMN `iconPath` TEXT NULL;
