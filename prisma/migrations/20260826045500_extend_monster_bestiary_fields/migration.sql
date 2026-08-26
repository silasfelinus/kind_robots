-- cthulhuquarium/t-042: expand the production database before the Prisma
-- client starts selecting these fields. This is deliberately migration-only
-- for the first rollout step so the currently deployed client remains fully
-- compatible while Alexandria is prepared for the later schema/seed wiring.
--
-- Additive only: three nullable columns and one additional enum value.
-- No DROP, rename, or existing data rewrite is requested here.

ALTER TABLE `Monster`
    ADD COLUMN `depth` INTEGER NULL,
    ADD COLUMN `dietRole` VARCHAR(255) NULL,
    ADD COLUMN `schoolRole` VARCHAR(255) NULL;

ALTER TABLE `Monster`
    MODIFY `evolutionKind` ENUM('GROWTH', 'BREEDING', 'SECRET') NULL;
