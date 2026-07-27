// /utils/seeds/facetLegacyBotTypes.ts
//
// Existing production Bots predate the illustrated Bot Builder vocabulary.
// Preserve their exact stored values as canonical BOT_TYPE Facets so migration
// never silently rewrites behavior or strands existing rows.

export const LEGACY_BOT_TYPE_VALUES = [
  {
    value: 'CHATBOT',
    label: 'Chatbot',
    description:
      'Legacy general conversational bot type retained for existing Bots and compatibility workflows.',
  },
  {
    value: 'PROMPTBOT',
    label: 'Prompt Bot',
    description:
      'Legacy prompt-driven bot type retained for existing Bots and compatibility workflows.',
  },
  {
    value: 'NARRATOR',
    label: 'Narrator',
    description:
      'Legacy narrator bot type retained for narrator selection and existing story systems.',
  },
] as const
