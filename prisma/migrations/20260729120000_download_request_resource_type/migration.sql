-- Add resourceType to DownloadRequest so the import agent knows which engine
-- directory to place the file in (LoRA vs checkpoint). Defaults to LORA so any
-- rows queued before this column keep their original meaning.
ALTER TABLE `DownloadRequest`
    ADD COLUMN `resourceType` ENUM(
        'CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK',
        'SAMPLER', 'CONTROLNET', 'URL', 'API', 'VAE', 'TEXT_ENCODER',
        'DIFFUSION_MODEL'
    ) NOT NULL DEFAULT 'LORA' AFTER `source`;
