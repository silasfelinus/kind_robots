import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyResolvedCheckpointResourceToArtJobPayload } from '../../server/utils/artJobResourceRefresh'

{
  const refresh = applyResolvedCheckpointResourceToArtJobPayload(
    {
      checkpoint: 'SDXL/old-model.safetensors',
      checkpointResourceId: 77,
      resources: {
        checkpointResourceId: 77,
        checkpointName: 'SDXL/old-model.safetensors',
      },
      workflow: {
        '1': {
          class_type: 'CheckpointLoaderSimple',
          inputs: { ckpt_name: 'SDXL/old-model.safetensors' },
        },
      },
    },
    {
      id: 77,
      localPath: 'SDXL/current/model.safetensors',
    },
  )

  assert.equal(refresh.changed, true)
  assert.equal(refresh.checkpointResourceId, 77)
  assert.equal(refresh.checkpointName, 'SDXL/current/model.safetensors')
  assert.equal(refresh.payload.checkpoint, 'SDXL/current/model.safetensors')
  assert.equal(refresh.payload.checkpointResourceId, 77)
  assert.equal(
    (refresh.payload.workflow as any)['1'].inputs.ckpt_name,
    'SDXL/current/model.safetensors',
  )
  assert.equal((refresh.payload.resources as any).checkpointResourceId, 77)
  assert.equal(
    (refresh.payload.resources as any).checkpointName,
    'SDXL/current/model.safetensors',
  )
}

{
  const trainer = readFileSync(
    new URL(
      '../../server/api/art/queue/[id]/trainer-redo.post.ts',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(
    trainer,
    /resolveTrainerCheckpoint\(/,
    'Trainer SDXL revisions must resolve a checkpoint Resource before queueing.',
  )
  assert.match(
    trainer,
    /checkpoint: checkpoint\?\.localPath/,
    'Trainer SDXL img2img must pass the resolved Resource localPath into its workflow.',
  )
  assert.match(
    trainer,
    /checkpointResourceId: checkpoint\.id/,
    'Trainer SDXL revisions must preserve checkpoint Resource identity.',
  )
}

{
  const requeue = readFileSync(
    new URL('../../server/api/art/queue/[id]/requeue.post.ts', import.meta.url),
    'utf8',
  )
  assert.match(
    requeue,
    /await refreshArtJobCheckpointResource\(/,
    'Requeue must refresh checkpoint Resources before returning a job to PENDING.',
  )
  assert.match(
    requeue,
    /await refreshArtJobLoraResources\(/,
    'Requeue must continue refreshing LoRA Resources before returning a job to PENDING.',
  )
}

{
  const repair = readFileSync(
    new URL('./repairTrainerCheckpointFailures.ts', import.meta.url),
    'utf8',
  )
  assert.match(repair, /CheckpointLoaderSimple\|ckpt_name/)
  assert.match(repair, /Resource .* still points at rejected checkpoint/)
  assert.match(repair, /status: 'PENDING'/)
  assert.match(repair, /attempts: 0/)
}

console.log('✅ verifyArtJobCheckpointRefresh: all assertions passed')
