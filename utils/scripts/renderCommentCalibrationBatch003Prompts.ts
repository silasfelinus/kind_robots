// Render the exact buildCommentDraftPrompt inputs for calibration batch 003.
// Offline except for GitHub Actions itself: no database, no model call, no writes.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { characterVoiceSeeds } from '@/stores/seeds/characterVoices'
import {
  buildCommentDraftPrompt,
  type CommentExchangeShape,
} from '@/utils/comments/commentDraftPrompt'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  type ArchivedVoiceRecord,
} from '@/utils/comments/voiceEvidence'
import type { CommentTargetProfile } from '@/utils/comments/commentCasting'

type InputExchange = {
  canonicalOrder: number
  exchangeKey: string
  shape: CommentExchangeShape
  target: CommentTargetProfile
  speakerIds: number[]
  comparison: string
}

type Inputs = {
  version: number
  batchId: string
  minimumProductionCommit: string
  issueNumber: number
  purpose: string
  exchanges: InputExchange[]
}

const repoRoot = process.cwd()
const configDir = join(repoRoot, 'config')
const inputs = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-003-inputs.json'), 'utf8'),
) as Inputs

const archiveFiles = readdirSync(configDir)
  .filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
  .sort()

const records: ArchivedVoiceRecord[] = archiveFiles.flatMap((name) => {
  const parsed = JSON.parse(readFileSync(join(configDir, name), 'utf8')) as {
    revisions?: ArchivedVoiceRecord[]
  }
  return parsed.revisions || []
})
const voiceIndex = buildVoiceEvidenceIndex(records)

for (const [position, exchange] of inputs.exchanges.entries()) {
  if (exchange.canonicalOrder !== position + 1) {
    throw new Error(`${exchange.exchangeKey}: canonicalOrder is not contiguous`)
  }

  const speakers = exchange.speakerIds.map((id) => {
    const seed = characterVoiceSeeds.find((candidate) => candidate.id === id)
    if (!seed) throw new Error(`${exchange.exchangeKey}: missing character voice seed ${id}`)

    const evidence = voiceIndex.get(speakerKey({ kind: 'CHARACTER', id }))
    const selected = selectVoiceSamples(evidence, 4)
    return {
      promptSpeaker: {
        kind: 'CHARACTER' as const,
        id,
        name: seed.name,
        canonicalVoice: seed.voice,
        sampleResponse: seed.sampleResponse,
        archivedVoiceSamples: selected.map((sample) => sample.text),
      },
      selectedVoiceEvidence: selected.map((sample) => ({
        draftId: sample.draftId,
        words: sample.words,
        text: sample.text,
      })),
    }
  })

  const prompt = buildCommentDraftPrompt(
    exchange.target,
    speakers.map((speaker) => speaker.promptSpeaker),
    {
      shape: exchange.shape,
      maxSpeakers: exchange.shape === 'TRIO' ? 3 : 2,
    },
  )
  const promptSha256 = createHash('sha256').update(JSON.stringify(prompt)).digest('hex')

  console.log(
    `BATCH003_PROMPT ${JSON.stringify({
      exchangeKey: exchange.exchangeKey,
      canonicalOrder: exchange.canonicalOrder,
      comparison: exchange.comparison,
      target: exchange.target,
      shape: exchange.shape,
      promptSha256,
      selectedVoiceEvidence: speakers.map((speaker) => speaker.selectedVoiceEvidence),
      prompt,
    })}`,
  )
}
