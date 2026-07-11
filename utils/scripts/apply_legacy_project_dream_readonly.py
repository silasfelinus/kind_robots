from pathlib import Path

PATCH_PATH = Path('server/api/dreams/[id].patch.ts')
STORE_PATH = Path('stores/dreamStore.ts')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'Could not apply {label}; found {count}')
    return source.replace(old, new, 1)


patch = PATCH_PATH.read_text()
patch = replace_once(
    patch,
    '''        title: true,
        isPublic: true,''',
    '''        title: true,
        dreamType: true,
        isPublic: true,''',
    'legacy Project Dream select',
)
patch = replace_once(
    patch,
    '''    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    assertDreamAccess({''',
    '''    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    if (existingDream.dreamType === 'PROJECT') {
      throw createError({
        statusCode: 409,
        message: 'Legacy Project Dreams are read-only. Update the matching record through /api/projects.',
      })
    }

    assertDreamAccess({''',
    'legacy Project Dream readonly guard',
)
patch = replace_once(
    patch,
    '''    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    await assertAttachableRelations(body, user.id, user.Role)''',
    '''    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    if (
      body.dreamType === 'PROJECT' ||
      body.projectStatus !== undefined ||
      body.repoUrl !== undefined ||
      body.liveUrl !== undefined
    ) {
      throw createError({
        statusCode: 409,
        message: 'Project fields must be updated through /api/projects, not /api/dreams.',
      })
    }

    await assertAttachableRelations(body, user.id, user.Role)''',
    'Project field patch guard',
)
PATCH_PATH.write_text(patch)

store = STORE_PATH.read_text()
store = replace_once(
    store,
    '  const dreamTypes = DREAM_TYPES',
    "  const dreamTypes = DREAM_TYPES.filter((type) => type !== 'PROJECT')",
    'Dreammaker Project option removal',
)
STORE_PATH.write_text(store)

print(f'Updated {PATCH_PATH}')
print(f'Updated {STORE_PATH}')
