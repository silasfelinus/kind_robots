from pathlib import Path


def replace_exact(source: str, old: str, new: str, expected: int, label: str) -> str:
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected} match(es), found {count}')
    return source.replace(old, new)


DREAM_STORE = Path('stores/dreamStore.ts')
DREAM_GALLERY = Path('components/dreams/dream-gallery.vue')
RELATIONSHIP_GALLERY = Path('components/dreams/dream-relationship-gallery.vue')
DREAM_MANAGER = Path('components/dreams/dream-manager.vue')

store = DREAM_STORE.read_text(encoding='utf-8')
store = replace_exact(
    store,
    "  DREAM_TYPES,\n  buildBrainstormPrompt,\n",
    "  CREATABLE_DREAM_TYPES,\n  DREAM_TYPES,\n  buildBrainstormPrompt,\n",
    1,
    'import creatable Dream types',
)
store = replace_exact(
    store,
    "function normalizeDream<T extends DreamWithRelations | Dream>(dream: T): T {\n  return normalizeDreamType(dream) as T\n}\n\nfunction normalizeDreamForm",
    "function normalizeDream<T extends DreamWithRelations | Dream>(dream: T): T {\n  return normalizeDreamType(dream) as T\n}\n\nfunction isCreativeDream(dream: Pick<Dream, 'dreamType'>): boolean {\n  return dream.dreamType !== 'PROJECT' && dream.dreamType !== 'GENRE'\n}\n\nfunction normalizeDreamForm",
    1,
    'define creative Dream predicate',
)
store = replace_exact(
    store,
    "  const dreamTypes = DREAM_TYPES.filter((type) => type !== 'PROJECT')\n",
    "  const dreamTypes = CREATABLE_DREAM_TYPES\n",
    1,
    'use creatable Dream type choices',
)
store = replace_exact(
    store,
    "  const activeDreams = computed(() =>\n    dreams.value.filter((dream) => dream.isActive),\n  )\n  const ownedDreams = computed(() =>\n    dreams.value.filter((dream) => dream.userId === currentUserId.value),\n  )\n\n  const publicDreams = computed(() =>\n    filterPublicDreams(dreams.value, currentUserId.value, userStore.isAdmin),\n  )\n\n  const visibleDreams = computed(() =>\n    filterVisibleDreams(\n      dreams.value,\n      currentUserId.value,\n      userStore.showMature,\n      userStore.isAdmin,\n    ),\n  )\n",
    "  const creativeDreams = computed(() => dreams.value.filter(isCreativeDream))\n  const activeDreams = computed(() =>\n    creativeDreams.value.filter((dream) => dream.isActive),\n  )\n  const ownedDreams = computed(() =>\n    creativeDreams.value.filter((dream) => dream.userId === currentUserId.value),\n  )\n\n  const publicDreams = computed(() =>\n    filterPublicDreams(\n      creativeDreams.value,\n      currentUserId.value,\n      userStore.isAdmin,\n    ),\n  )\n\n  const visibleDreams = computed(() =>\n    filterVisibleDreams(\n      creativeDreams.value,\n      currentUserId.value,\n      userStore.showMature,\n      userStore.isAdmin,\n    ),\n  )\n",
    1,
    'build normal projections from creative Dreams',
)
store = replace_exact(
    store,
    "  const newestDreamsDisplay = computed(() =>\n    newestDreams.value.map((dream) => ({ ...dream, isNewest: true })),\n  )\n",
    "  const newestDreamsDisplay = computed(() =>\n    newestDreams.value\n      .filter(isCreativeDream)\n      .map((dream) => ({ ...dream, isNewest: true })),\n  )\n",
    1,
    'hide legacy rows from newest Dream display',
)
store = replace_exact(
    store,
    "    selectedDreamChats,\n    activeDreams,\n",
    "    selectedDreamChats,\n    creativeDreams,\n    activeDreams,\n",
    1,
    'export creative Dream projection',
)
DREAM_STORE.write_text(store, encoding='utf-8')

gallery = DREAM_GALLERY.read_text(encoding='utf-8')
gallery = replace_exact(
    gallery,
    'dreamStore.dreams',
    'dreamStore.creativeDreams',
    8,
    'use creative Dreams throughout general gallery',
)
DREAM_GALLERY.write_text(gallery, encoding='utf-8')

relationship = RELATIONSHIP_GALLERY.read_text(encoding='utf-8')
relationship = replace_exact(
    relationship,
    '  let dreams = dreamStore.dreams ?? []\n',
    '  let dreams = dreamStore.creativeDreams ?? []\n',
    1,
    'use creative Dreams in relationship choices',
)
RELATIONSHIP_GALLERY.write_text(relationship, encoding='utf-8')

manager = DREAM_MANAGER.read_text(encoding='utf-8')
manager = replace_exact(
    manager,
    '  return `${dreamStore.activeDreams.length}/${dreamStore.dreams.length} active Dreams • ${scenarioStore.scenarios.length} Scenarios • ${selected}`\n',
    '  return `${dreamStore.activeDreams.length}/${dreamStore.creativeDreams.length} active Dreams • ${scenarioStore.scenarios.length} Scenarios • ${selected}`\n',
    1,
    'use creative Dream total in manager summary',
)
DREAM_MANAGER.write_text(manager, encoding='utf-8')

for path in (DREAM_GALLERY, RELATIONSHIP_GALLERY, DREAM_MANAGER):
    source = path.read_text(encoding='utf-8')
    if path != DREAM_MANAGER and 'dreamStore.creativeDreams' not in source:
        raise RuntimeError(f'{path}: creative Dream projection missing')

print('Applied creative Dream projection boundary')
