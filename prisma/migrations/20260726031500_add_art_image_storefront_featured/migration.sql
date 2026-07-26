-- Curated digital-storefront swag rail: mark specific ArtImage rows as
-- featured independent of the general self-service "print my gallery art"
-- flow. Additive only (conductor pitches/2026-07-15-storefront-featured-art.md).

ALTER TABLE `ArtImage`
  ADD COLUMN `storefrontFeatured` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `ArtImage_storefrontFeatured_idx` ON `ArtImage`(`storefrontFeatured`);
