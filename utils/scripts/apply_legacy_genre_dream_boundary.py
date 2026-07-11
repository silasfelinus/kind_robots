from pathlib import Path


def replace_exact(source: str, old: str, new: str, expected: int, label: str) -> str:
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected} match(es), found {count}')
    return source.replace(old, new)


DREAM_INDEX = Path('server/api/dreams/index.ts')
DREAM_PATCH = Path('server/api/dreams/[id].patch.ts')
DREAM_DELETE = Path('server/api/dreams/[id].delete.ts')
CHAT_POST = Path('server/api/chats/index.post.ts')
DREAM_HELPER = Path('stores/helpers/dreamHelper.ts')
DREAM_CARDS = Path('stores/helpers/dreamCards.ts')

index = DREAM_INDEX.read_text(encoding='utf-8')
index = replace_exact(
    index,
    "  if (normalized === 'PROJECT') {\n    throw createError({\n      statusCode: 409,\n      message: 'Projects must be created through /api/projects, not /api/dreams.',\n    })\n  }\n\n  return normalized\n",
    "  if (normalized === 'PROJECT') {\n    throw createError({\n      statusCode: 409,\n      message: 'Projects must be created through /api/projects, not /api/dreams.',\n    })\n  }\n\n  if (normalized === 'GENRE') {\n    throw createError({\n      statusCode: 409,\n      message: 'Reusable genres and taxonomy must be created through /api/facets, not /api/dreams.',\n    })\n  }\n\n  return normalized\n",
    1,
    'protect Genre creation in shared Dream normalizer',
)
DREAM_INDEX.write_text(index, encoding='utf-8')

patch = DREAM_PATCH.read_text(encoding='utf-8')
patch = replace_exact(
    patch,
    "    if (existingDream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message: 'Legacy Project Dreams are read-only. Update the matching record through /api/projects.',\n      })\n    }\n",
    "    if (existingDream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message: 'Legacy Project Dreams are read-only. Update the matching record through /api/projects.',\n      })\n    }\n\n    if (existingDream.dreamType === 'GENRE') {\n      throw createError({\n        statusCode: 409,\n        message: 'Legacy Genre Dreams are read-only. Update the matching taxonomy through /api/facets.',\n      })\n    }\n",
    1,
    'protect existing Genre Dream PATCH',
)
patch = replace_exact(
    patch,
    "    if (\n      body.dreamType === 'PROJECT' ||\n      body.projectStatus !== undefined ||\n      body.repoUrl !== undefined ||\n      body.liveUrl !== undefined\n    ) {\n      throw createError({\n        statusCode: 409,\n        message: 'Project fields must be updated through /api/projects, not /api/dreams.',\n      })\n    }\n",
    "    if (body.dreamType === 'GENRE') {\n      throw createError({\n        statusCode: 409,\n        message: 'Reusable genres and taxonomy must be created through /api/facets, not /api/dreams.',\n      })\n    }\n\n    if (\n      body.dreamType === 'PROJECT' ||\n      body.projectStatus !== undefined ||\n      body.repoUrl !== undefined ||\n      body.liveUrl !== undefined\n    ) {\n      throw createError({\n        statusCode: 409,\n        message: 'Project fields must be updated through /api/projects, not /api/dreams.',\n      })\n    }\n",
    1,
    'reject Dream conversion to Genre',
)
DREAM_PATCH.write_text(patch, encoding='utf-8')

delete = DREAM_DELETE.read_text(encoding='utf-8')
delete = replace_exact(
    delete,
    "    if (dream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Legacy Project Dreams are protected compatibility records and cannot be deleted through /api/dreams.',\n      })\n    }\n",
    "    if (dream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Legacy Project Dreams are protected compatibility records and cannot be deleted through /api/dreams.',\n      })\n    }\n\n    if (dream.dreamType === 'GENRE') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Legacy Genre Dreams are protected compatibility records. Manage the matching taxonomy through /api/facets.',\n      })\n    }\n",
    1,
    'protect existing Genre Dream DELETE',
)
DREAM_DELETE.write_text(delete, encoding='utf-8')

chat = CHAT_POST.read_text(encoding='utf-8')
chat = replace_exact(
    chat,
    "    if (dream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Project chats must use projectId and /api/projects; legacy Project Dream chat writes are disabled.',\n      })\n    }\n",
    "    if (dream.dreamType === 'PROJECT') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Project chats must use projectId and /api/projects; legacy Project Dream chat writes are disabled.',\n      })\n    }\n\n    if (dream.dreamType === 'GENRE') {\n      throw createError({\n        statusCode: 409,\n        message:\n          'Legacy Genre Dream chat writes are disabled. Use first-class Facets for reusable taxonomy.',\n      })\n    }\n",
    1,
    'protect Genre Dream chat writes',
)
CHAT_POST.write_text(chat, encoding='utf-8')

helper = DREAM_HELPER.read_text(encoding='utf-8')
helper = replace_exact(
    helper,
    "export type DreamType = (typeof DREAM_TYPES)[number]\n\ntype DreamWithRequiredSlug<T> = T & { slug: string }\n",
    "export type DreamType = (typeof DREAM_TYPES)[number]\nexport type CreatableDreamType = Exclude<DreamType, 'PROJECT' | 'GENRE'>\n\nexport const CREATABLE_DREAM_TYPES = DREAM_TYPES.filter(\n  (type): type is CreatableDreamType =>\n    type !== 'PROJECT' && type !== 'GENRE',\n)\n\ntype DreamWithRequiredSlug<T> = T & { slug: string }\n",
    1,
    'define creatable Dream types',
)
DREAM_HELPER.write_text(helper, encoding='utf-8')

cards = DREAM_CARDS.read_text(encoding='utf-8')
cards = replace_exact(
    cards,
    "import {\n  DREAM_TYPES,\n  dreamTypeLabel,\n  type DreamType,\n} from '@/stores/helpers/dreamHelper'\n",
    "import {\n  CREATABLE_DREAM_TYPES,\n  dreamTypeLabel,\n  type CreatableDreamType,\n} from '@/stores/helpers/dreamHelper'\n",
    1,
    'use creatable Dream types in builder cards',
)
cards = replace_exact(
    cards,
    "export type DreamTypeChoice = BuilderChoice & {\n  value: DreamType\n}\n\nconst DREAM_TYPE_SUBTEXT: Record<DreamType, string> = {\n  PROJECT:\n    'A coordinated build target with status, repo links, live links, agents, reviews, and actual shipping energy.',\n",
    "export type DreamTypeChoice = BuilderChoice & {\n  value: CreatableDreamType\n}\n\nconst DREAM_TYPE_SUBTEXT: Record<CreatableDreamType, string> = {\n",
    1,
    'narrow Dream builder choice type',
)
cards = replace_exact(
    cards,
    "  PITCH:\n    'The classic one-sentence seed. Small enough to carry; dangerous enough to grow.',\n  GENRE: 'A genre, trope cluster, stylistic lane, or taste-map marker.',\n  WISH: 'A direct request, intention, or desired outcome ready to become a useful Dream.',\n",
    "  PITCH:\n    'The classic one-sentence seed. Small enough to carry; dangerous enough to grow.',\n  WISH: 'A direct request, intention, or desired outcome ready to become a useful Dream.',\n",
    1,
    'remove Genre builder subtext',
)
cards = replace_exact(
    cards,
    'export const DREAM_TYPE_CHOICES: DreamTypeChoice[] = DREAM_TYPES.map(\n',
    'export const DREAM_TYPE_CHOICES: DreamTypeChoice[] = CREATABLE_DREAM_TYPES.map(\n',
    1,
    'build choices from creatable Dream types',
)
cards = replace_exact(
    cards,
    "      'Dreams cover the old pitch duties: art seeds, brainstorms, locations, scenarios, characters, rewards, prompt bots, narrators, genres, and reusable sparks. The type tells the builder how to treat the seed.',\n",
    "      'Dreams cover creative seeds: art, brainstorms, locations, scenarios, characters, rewards, prompt bots, narrators, wishes, and reusable sparks. Projects live in the Project workspace; reusable taxonomy lives in Facets.',\n",
    1,
    'update Dream builder type narrative',
)
cards = replace_exact(
    cards,
    "          'Add examples separated by pipes. For BRAINSTORM and GENRE dreams, these become direct source material.',\n",
    "          'Add examples separated by pipes. For BRAINSTORM Dreams, these become direct source material; reusable genres and styles belong in Facets.',\n",
    1,
    'update Dream examples guidance',
)
DREAM_CARDS.write_text(cards, encoding='utf-8')

for path in (DREAM_INDEX, DREAM_PATCH, DREAM_DELETE, CHAT_POST, DREAM_HELPER, DREAM_CARDS):
    source = path.read_text(encoding='utf-8')
    if path in (DREAM_HELPER, DREAM_CARDS):
        continue
    if "dreamType === 'GENRE'" not in source and path != DREAM_INDEX:
        raise RuntimeError(f'{path}: expected explicit Genre boundary')

print('Applied legacy Genre Dream read-only boundary')
