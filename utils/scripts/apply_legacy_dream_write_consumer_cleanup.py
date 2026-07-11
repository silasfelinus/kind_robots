from pathlib import Path


def replace_exact(source: str, old: str, new: str, expected: int, label: str) -> str:
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected} match(es), found {count}')
    return source.replace(old, new)


BRAINSTORM = Path('components/dreams/dream-brainstorm.vue')
SHEET_BATCH = Path('server/api/sheets/batch.post.ts')

brainstorm = BRAINSTORM.read_text(encoding='utf-8')
brainstorm = replace_exact(
    brainstorm,
    "import {\n  useDreamStore,\n  type DreamType,\n  type DreamWithRelations,\n} from '@/stores/dreamStore'\n",
    "import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\nimport {\n  CREATABLE_DREAM_TYPES,\n  type CreatableDreamType,\n} from '@/stores/helpers/dreamHelper'\n",
    1,
    'use shared creatable Dream types in Brainstorm',
)
brainstorm = replace_exact(
    brainstorm,
    "const saveDreamType = ref<DreamType>('PITCH')\n\nconst saveDreamTypes: DreamType[] = [\n  'ART',\n  'BRAINSTORM',\n  'PROMPTBOT',\n  'NARRATOR',\n  'CHARACTER',\n  'REWARD',\n  'SCENARIO',\n  'LOCATION',\n  'PITCH',\n  'GENRE',\n]\n",
    "const saveDreamType = ref<CreatableDreamType>('PITCH')\nconst saveDreamTypes = CREATABLE_DREAM_TYPES\n",
    1,
    'remove legacy types from Brainstorm save targets',
)
if "'GENRE'," in brainstorm or "'PROJECT'," in brainstorm:
    raise RuntimeError('Brainstorm still contains a legacy Dream save target')
BRAINSTORM.write_text(brainstorm, encoding='utf-8')

sheets = SHEET_BATCH.read_text(encoding='utf-8')
sheets = replace_exact(
    sheets,
    "  'LOCATION',\n  'PITCH',\n  'GENRE',\n] as const satisfies readonly DreamType[]\n\nconst DREAM_TYPE_SET = new Set<string>(DREAM_TYPES)\n",
    "  'LOCATION',\n  'PITCH',\n] as const satisfies readonly DreamType[]\n\nconst DREAM_TYPE_SET = new Set<string>(DREAM_TYPES)\nconst LEGACY_DREAM_TYPES = new Set(['PROJECT', 'GENRE'])\n",
    1,
    'remove Genre from PitchSheet batch types',
)
sheets = replace_exact(
    sheets,
    "function getDreamTypes(value: unknown): DreamType[] | undefined {\n  if (!Array.isArray(value)) return undefined\n\n  const dreamTypes = value.filter(\n",
    "function getDreamTypes(value: unknown): DreamType[] | undefined {\n  if (!Array.isArray(value)) return undefined\n\n  const legacyTypes = value.filter(\n    (entry): entry is string =>\n      typeof entry === 'string' && LEGACY_DREAM_TYPES.has(entry),\n  )\n  if (legacyTypes.length) {\n    throw createError({\n      statusCode: 409,\n      message:\n        'Project and Genre PitchSheets must be managed through /api/projects or /api/facets, not Dream batch processing.',\n    })\n  }\n\n  const dreamTypes = value.filter(\n",
    1,
    'reject legacy PitchSheet batch targets',
)
if "  'GENRE',\n] as const satisfies readonly DreamType[]" in sheets:
    raise RuntimeError('PitchSheet batch still permits Genre Dreams')
SHEET_BATCH.write_text(sheets, encoding='utf-8')

print('Removed legacy Dream write consumers')
