// /utils/storybookLifeRunKeys.ts
//
// storybook/t-026: shared localStorage key names for the "life" run flavor of
// Storybook, used by both stores/storybookStore.ts and
// components/storybook/storybook-life-run.vue. Renamed from the davinci-*
// names the life engine used before it moved under Storybook (t-025). The
// legacy keys are read as a fallback so a run already in flight when this
// shipped keeps resuming instead of being stranded.

export const LIFE_RUN_ID_KEY = 'storybook-active-life-run-id'
export const LEGACY_LIFE_RUN_ID_KEY = 'davinci-active-life-run-id'

export const LIFE_RUN_ART_JOBS_KEY = 'storybook-active-life-run-art-jobs'
export const LEGACY_LIFE_RUN_ART_JOBS_KEY = 'davinci-active-life-run-art-jobs'
