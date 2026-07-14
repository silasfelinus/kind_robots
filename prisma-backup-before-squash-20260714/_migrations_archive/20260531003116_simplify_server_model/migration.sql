/*
  Warnings:

  - You are about to drop the column `allowBrowserRequests` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `backendBaseUrl` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `browserBaseUrl` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCfg` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultHeight` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultSampler` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultScheduler` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultSteps` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultTransport` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `defaultWidth` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `generationEngine` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `isMetered` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivateNetwork` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `oidcProvider` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `requiresApiKey` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `requiresClientSideCheck` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsBatch` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsChat` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsCheckpointOverride` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsComfyWorkflow` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsFlux` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsImageEdit` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsImg2Img` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsInpaint` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsKontext` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsNegativePrompt` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsOutpaint` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsSampler` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsSeed` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsSteps` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsTxt2Img` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsVideo` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `supportsWorkflowUpload` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `useOidc` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `workflowJson` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `workflowPath` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `workflowVersion` on the `Server` table. All the data in the column will be lost.
  - You are about to alter the column `serverType` on the `Server` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(18))`.
  - You are about to alter the column `accessMode` on the `Server` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(21))` to `Enum(EnumId(19))`.
  - Made the column `lastStatus` on table `Server` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Server` DROP COLUMN `allowBrowserRequests`,
    DROP COLUMN `backendBaseUrl`,
    DROP COLUMN `browserBaseUrl`,
    DROP COLUMN `defaultCfg`,
    DROP COLUMN `defaultHeight`,
    DROP COLUMN `defaultSampler`,
    DROP COLUMN `defaultScheduler`,
    DROP COLUMN `defaultSteps`,
    DROP COLUMN `defaultTransport`,
    DROP COLUMN `defaultWidth`,
    DROP COLUMN `generationEngine`,
    DROP COLUMN `isMetered`,
    DROP COLUMN `isPrivateNetwork`,
    DROP COLUMN `oidcProvider`,
    DROP COLUMN `requiresApiKey`,
    DROP COLUMN `requiresClientSideCheck`,
    DROP COLUMN `supportsBatch`,
    DROP COLUMN `supportsChat`,
    DROP COLUMN `supportsCheckpointOverride`,
    DROP COLUMN `supportsComfyWorkflow`,
    DROP COLUMN `supportsFlux`,
    DROP COLUMN `supportsImageEdit`,
    DROP COLUMN `supportsImg2Img`,
    DROP COLUMN `supportsInpaint`,
    DROP COLUMN `supportsKontext`,
    DROP COLUMN `supportsNegativePrompt`,
    DROP COLUMN `supportsOutpaint`,
    DROP COLUMN `supportsSampler`,
    DROP COLUMN `supportsSeed`,
    DROP COLUMN `supportsSteps`,
    DROP COLUMN `supportsTxt2Img`,
    DROP COLUMN `supportsVideo`,
    DROP COLUMN `supportsWorkflowUpload`,
    DROP COLUMN `useOidc`,
    DROP COLUMN `workflowJson`,
    DROP COLUMN `workflowPath`,
    DROP COLUMN `workflowVersion`,
    ADD COLUMN `authType` ENUM('NONE', 'BEARER', 'HEADER', 'QUERY', 'API_KEY') NOT NULL DEFAULT 'NONE',
    MODIFY `description` TEXT NULL,
    MODIFY `serverType` ENUM('A111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    MODIFY `baseUrl` VARCHAR(764) NULL,
    MODIFY `endpointPath` VARCHAR(512) NULL,
    MODIFY `healthPath` VARCHAR(512) NULL,
    MODIFY `isPublic` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `apiKeyName` VARCHAR(255) NULL,
    MODIFY `apiLink` VARCHAR(764) NULL,
    MODIFY `model` VARCHAR(255) NULL,
    MODIFY `designer` VARCHAR(255) NULL,
    MODIFY `version` VARCHAR(255) NULL,
    MODIFY `notes` TEXT NULL,
    MODIFY `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    MODIFY `accessMode` ENUM('BROWSER', 'BACKEND', 'TAILSCALE', 'PUBLIC', 'LOCAL') NOT NULL DEFAULT 'BROWSER';

-- CreateIndex
CREATE INDEX `Server_authType_idx` ON `Server`(`authType`);

-- CreateIndex
CREATE INDEX `Server_isOfficial_idx` ON `Server`(`isOfficial`);

-- CreateIndex
CREATE INDEX `Server_isDefault_idx` ON `Server`(`isDefault`);

-- CreateIndex
CREATE INDEX `Server_isActive_idx` ON `Server`(`isActive`);
