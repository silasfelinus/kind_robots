// /stores/taskmasterStore.ts
//
// Taskmaster is the permanent product identity for the narrative task experience.
// This boundary lets all new code use Taskmaster language while the existing
// session implementation is migrated without creating a second source of truth.
export {
  SERENDIPITY_TONES as TASKMASTER_TONES,
  useSerendipityStore as useTaskmasterStore,
} from '@/stores/serendipityStore'

export type {
  SerendipityAnswer as TaskmasterAnswer,
  SerendipityBeat as TaskmasterBeat,
  SerendipityIngredient as TaskmasterIngredient,
  SerendipityQuestion as TaskmasterQuestion,
  SerendipityRealHook as TaskmasterRealHook,
  SerendipitySession as TaskmasterSession,
  SerendipityStorySeed as TaskmasterStorySeed,
  SerendipityTone as TaskmasterTone,
} from '@/stores/serendipityStore'
