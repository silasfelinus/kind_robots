// /utils/comments/archivedVoiceCorpus.ts
// Static imports keep the approved 39-file voice corpus inside Vercel's server
// bundle. Runtime filesystem reads of config/ are not portable to Nitro/Vercel.
import type { ArchivedVoiceRecord } from '@/utils/comments/voiceEvidence'
import batch001 from '@/config/wonderlab-voice-polish-batch-001.json'
import batch002 from '@/config/wonderlab-voice-polish-batch-002.json'
import batch003 from '@/config/wonderlab-voice-polish-batch-003.json'
import batch004 from '@/config/wonderlab-voice-polish-batch-004.json'
import batch005 from '@/config/wonderlab-voice-polish-batch-005.json'
import batch006 from '@/config/wonderlab-voice-polish-batch-006.json'
import batch007 from '@/config/wonderlab-voice-polish-batch-007.json'
import batch008 from '@/config/wonderlab-voice-polish-batch-008.json'
import batch009 from '@/config/wonderlab-voice-polish-batch-009.json'
import batch010 from '@/config/wonderlab-voice-polish-batch-010.json'
import batch011 from '@/config/wonderlab-voice-polish-batch-011.json'
import batch012 from '@/config/wonderlab-voice-polish-batch-012.json'
import batch013 from '@/config/wonderlab-voice-polish-batch-013.json'
import batch014 from '@/config/wonderlab-voice-polish-batch-014.json'
import batch015 from '@/config/wonderlab-voice-polish-batch-015.json'
import batch016 from '@/config/wonderlab-voice-polish-batch-016.json'
import batch017 from '@/config/wonderlab-voice-polish-batch-017.json'
import batch018 from '@/config/wonderlab-voice-polish-batch-018.json'
import batch019 from '@/config/wonderlab-voice-polish-batch-019.json'
import batch020 from '@/config/wonderlab-voice-polish-batch-020.json'
import batch021 from '@/config/wonderlab-voice-polish-batch-021.json'
import batch022 from '@/config/wonderlab-voice-polish-batch-022.json'
import batch023 from '@/config/wonderlab-voice-polish-batch-023.json'
import batch024 from '@/config/wonderlab-voice-polish-batch-024.json'
import batch025 from '@/config/wonderlab-voice-polish-batch-025.json'
import batch026 from '@/config/wonderlab-voice-polish-batch-026.json'
import batch027 from '@/config/wonderlab-voice-polish-batch-027.json'
import batch028 from '@/config/wonderlab-voice-polish-batch-028.json'
import batch029 from '@/config/wonderlab-voice-polish-batch-029.json'
import batch030 from '@/config/wonderlab-voice-polish-batch-030.json'
import batch031 from '@/config/wonderlab-voice-polish-batch-031.json'
import batch032 from '@/config/wonderlab-voice-polish-batch-032.json'
import batch033 from '@/config/wonderlab-voice-polish-batch-033.json'
import batch034 from '@/config/wonderlab-voice-polish-batch-034.json'
import batch035 from '@/config/wonderlab-voice-polish-batch-035.json'
import batch036 from '@/config/wonderlab-voice-polish-batch-036.json'
import batch037 from '@/config/wonderlab-voice-polish-batch-037.json'
import batch038 from '@/config/wonderlab-voice-polish-batch-038.json'
import batch039 from '@/config/wonderlab-voice-polish-batch-039.json'

export const archivedVoiceRecords: ArchivedVoiceRecord[] = [
  ...batch001.revisions,
  ...batch002.revisions,
  ...batch003.revisions,
  ...batch004.revisions,
  ...batch005.revisions,
  ...batch006.revisions,
  ...batch007.revisions,
  ...batch008.revisions,
  ...batch009.revisions,
  ...batch010.revisions,
  ...batch011.revisions,
  ...batch012.revisions,
  ...batch013.revisions,
  ...batch014.revisions,
  ...batch015.revisions,
  ...batch016.revisions,
  ...batch017.revisions,
  ...batch018.revisions,
  ...batch019.revisions,
  ...batch020.revisions,
  ...batch021.revisions,
  ...batch022.revisions,
  ...batch023.revisions,
  ...batch024.revisions,
  ...batch025.revisions,
  ...batch026.revisions,
  ...batch027.revisions,
  ...batch028.revisions,
  ...batch029.revisions,
  ...batch030.revisions,
  ...batch031.revisions,
  ...batch032.revisions,
  ...batch033.revisions,
  ...batch034.revisions,
  ...batch035.revisions,
  ...batch036.revisions,
  ...batch037.revisions,
  ...batch038.revisions,
  ...batch039.revisions,
] as ArchivedVoiceRecord[]
