-- Add Resource.loraTarget (kind-robots/t-069).
--
-- Nothing distinguishes a LoRA that trains the unet/model from one that trains
-- a text encoder. Both are `resourceType: LORA`, and the LTX graph's LoRA nodes
-- are `LoraLoaderModelOnly` -- a model-only loader with no clip input, so a
-- text-encoder LoRA applied through it has no effect and no error. A LoRA
-- registered for gemma-3-12b-it (the GEMMA_TEXT_ENCODER LTX uses) hit exactly
-- this: it is a real Resource with nowhere in the graph to apply.
--
-- This column is the discriminator the picker/enqueue guard needs before it can
-- refuse or re-route one; it is nullable and unread by any code path today, so
-- adding it changes no runtime behavior. Backfilling the one known
-- text-encoder LoRA, and building the guard/routing on top of this column, are
-- deliberate follow-up scope -- the routing half needs a real ComfyUI render to
-- validate and cannot be done from an agent sandbox.
--
-- Purely additive: a nullable column with no default rewrites no existing rows.

ALTER TABLE `Resource`
  ADD COLUMN `loraTarget` ENUM('MODEL', 'TEXT_ENCODER', 'BOTH') NULL;
