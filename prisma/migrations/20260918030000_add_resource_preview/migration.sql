-- Upstream preview images for a Resource, as a LIST.
--
-- `Resource.previewImageUrl` holds exactly ONE url, so a LoRA's gallery showed
-- one picture however many the model shipped with. Fantasy_art_XL_V1 (civitai
-- 122806) has TEN, and we kept the first. Silas, 2026-09-18: "still not seeing
-- the multiple images when viewing the card or actual object page" -- the
-- gallery was not dropping anything, there was only ever one row to show.
--
-- WHY A TABLE AND NOT A JSON COLUMN ON Resource:
--
--   Civitai rates each image with its own nsfwLevel. Maturity is a per-image
--   property once there is a gate that acts on it, and a blob cannot be
--   filtered or indexed on that.
--
--   /api/resources is an unpaginated findMany over the whole catalog (~2,343
--   rows) and server/api/resources/gallery.ts already carries a comment about
--   trimming that payload because it broke on a tablet. An array on the
--   Resource row would go straight back into every row of it. A table keeps it
--   off the list query entirely and is read only for the Resource being opened.
--
-- previewImageUrl is untouched: it stays the card's single face, and this is
-- the gallery behind it. Both are backfilled from the same upstream response.
--
-- Purely additive -- a new table rewrites no existing row. ON DELETE CASCADE so
-- removing a Resource takes its previews with it rather than orphaning them.

CREATE TABLE `ResourcePreview` (
  `id`         INTEGER      NOT NULL AUTO_INCREMENT,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resourceId` INTEGER      NOT NULL,
  `url`        VARCHAR(764) NOT NULL,
  `sortOrder`  INTEGER      NOT NULL DEFAULT 0,
  `nsfwLevel`  INTEGER      NULL,
  `isMature`   BOOLEAN      NOT NULL DEFAULT false,
  `width`      INTEGER      NULL,
  `height`     INTEGER      NULL,
  `blurHash`   VARCHAR(64)  NULL,
  `mediaType`  VARCHAR(16)  NULL,
  `source`     VARCHAR(32)  NOT NULL DEFAULT 'civitai',

  UNIQUE INDEX `ResourcePreview_resource_url_key`(`resourceId`, `url`(200)),
  INDEX `ResourcePreview_resourceId_sortOrder_idx`(`resourceId`, `sortOrder`),
  INDEX `ResourcePreview_isMature_idx`(`isMature`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ResourcePreview`
  ADD CONSTRAINT `ResourcePreview_resourceId_fkey`
  FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
