-- Collapse the duplicate ArtJob rows created by the former bulk re-enqueue
-- behavior. Those retries cloned FAILED jobs into fresh PENDING rows; the queue
-- now retries the original row in place. Keep the root work item, cancel its
-- still-pending NEW_OUTPUT descendants, and reset a failed root to PENDING.
--
-- This intentionally does not compare prompts or raw payload equality. Repeated
-- prompts can be a legitimate batch. Only explicit retry lineage whose root is
-- still unresolved is consolidated.

CREATE TEMPORARY TABLE `_ArtJobLineageDuplicate` (
  `cloneId` INTEGER NOT NULL,
  `rootId` INTEGER NOT NULL,
  PRIMARY KEY (`cloneId`),
  INDEX `_ArtJobLineageDuplicate_rootId_idx` (`rootId`)
);

INSERT INTO `_ArtJobLineageDuplicate` (`cloneId`, `rootId`)
SELECT
  clone.`id`,
  root.`id`
FROM `ArtJob` AS clone
INNER JOIN `ArtJob` AS root
  ON root.`id` = CAST(
    COALESCE(
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(clone.`payload`, '$.retry.rootJobId')), ''),
      JSON_UNQUOTE(JSON_EXTRACT(clone.`payload`, '$.retry.sourceJobId'))
    ) AS UNSIGNED
  )
WHERE clone.`status` = 'PENDING'
  AND root.`status` IN ('FAILED', 'PENDING')
  AND clone.`id` <> root.`id`
  AND JSON_VALID(clone.`payload`) = 1
  AND JSON_UNQUOTE(JSON_EXTRACT(clone.`payload`, '$.retry.mode')) = 'NEW_OUTPUT';

UPDATE `ArtJob` AS clone
INNER JOIN `_ArtJobLineageDuplicate` AS duplicate
  ON duplicate.`cloneId` = clone.`id`
SET
  clone.`status` = 'CANCELLED',
  clone.`claimedAt` = NULL,
  clone.`claimedBy` = NULL,
  clone.`error` = CONCAT(
    'Cancelled as duplicate retry descendant of ArtJob #',
    duplicate.`rootId`,
    '; the original job was retained.'
  )
WHERE clone.`status` = 'PENDING';

UPDATE `ArtJob` AS root
INNER JOIN (
  SELECT DISTINCT `rootId`
  FROM `_ArtJobLineageDuplicate`
) AS duplicateRoot
  ON duplicateRoot.`rootId` = root.`id`
SET
  root.`status` = 'PENDING',
  root.`attempts` = 0,
  root.`claimedAt` = NULL,
  root.`claimedBy` = NULL,
  root.`error` = NULL
WHERE root.`status` = 'FAILED';

DROP TEMPORARY TABLE `_ArtJobLineageDuplicate`;
