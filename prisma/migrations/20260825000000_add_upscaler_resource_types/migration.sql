-- Add LATENT_UPSCALER and UPSCALER to ResourceType.
--
-- kind-robots/t-070. The enum had no way to describe an upscaler of any kind, so
-- ltx-2.3-spatial-upscaler-x2-1.1 -- a latent upscale model loaded by
-- LatentUpscaleModelLoader, and a hard requirement of the ltx-12gb-balanced video
-- preset -- had to be registered as CHECKPOINT.
--
-- That stopped being cosmetic once conductor began resolving engine model paths FROM
-- this registry keyed on resourceType (cthulhuquarium/t-034): the localPath
-- prefix-stripping table is keyed by type, so a CHECKPOINT-typed row keeps its leading
-- directory while a DIFFUSION_MODEL-typed one has it stripped. Wrong type, wrong path,
-- no error.
--
-- Two values rather than one because they are genuinely different: latent upscalers
-- load from models/latent_upscale_models/ via LatentUpscaleModelLoader and act on
-- latents; pixel upscalers (ESRGAN and friends) load from models/upscale_models/ and
-- act on images. Both directories exist on the array.
--
-- Purely additive: appending members to a MySQL ENUM rewrites no rows and invalidates
-- no existing value. Both columns that use the type are widened so they stay in sync.

ALTER TABLE `Resource`
  MODIFY `resourceType` ENUM(
    'CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'SAMPLER',
    'CONTROLNET', 'URL', 'API', 'VAE', 'TEXT_ENCODER', 'DIFFUSION_MODEL',
    'LATENT_UPSCALER', 'UPSCALER'
  ) NOT NULL DEFAULT 'EMBEDDING';

ALTER TABLE `DownloadRequest`
  MODIFY `resourceType` ENUM(
    'CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'SAMPLER',
    'CONTROLNET', 'URL', 'API', 'VAE', 'TEXT_ENCODER', 'DIFFUSION_MODEL',
    'LATENT_UPSCALER', 'UPSCALER'
  ) NOT NULL DEFAULT 'LORA';
