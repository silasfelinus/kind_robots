-- conductor brainstorm/t-015: art-prompt output domain, additive-only.
ALTER TABLE `BrainstormSession` ADD COLUMN `outputDomain` VARCHAR(40) NOT NULL DEFAULT 'ideas';
