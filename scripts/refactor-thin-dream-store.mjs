import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

const storePath = 'stores/dreamStore.ts'
const makerPath = 'components/dreams/dream-maker.vue'

let store = readFileSync(storePath, 'utf8')

store = replaceRequired(
  store,
  `    createCollection: true,\n    addArtToCollection: true,\n`,
  '',
  'default Dream side-effect flags',
)

store = replaceRequired(
  store,
  `      createCollection: false,\n`,
  '',
  'Dream edit collection flag',
)

store = replaceRequired(
  store,
  `    return normalizeDreamForm({\n      ...source,\n      ...built,\n      title: built.title || source.title || fallbackDreamTitle(built.pitch),\n      pitch: built.pitch || source.pitch || source.description || built.title,\n      artImageId: source.artImageId ?? null,\n      artCollectionId: source.artCollectionId ?? null,\n      tagIds: normalizeIds(source.tagIds),\n      characterIds: normalizeIds(source.characterIds),\n      rewardIds: normalizeIds(source.rewardIds),\n      createCollection: source.createCollection ?? !existingDream,\n      addArtToCollection: source.addArtToCollection ?? !existingDream,\n    })\n`,
  `    const mutation = normalizeDreamForm({\n      ...source,\n      ...built,\n      title: built.title || source.title || fallbackDreamTitle(built.pitch),\n      pitch: built.pitch || source.pitch || source.description || built.title,\n      artImageId: source.artImageId ?? null,\n      artCollectionId: source.artCollectionId ?? null,\n      tagIds: normalizeIds(source.tagIds),\n      characterIds: normalizeIds(source.characterIds),\n      rewardIds: normalizeIds(source.rewardIds),\n    })\n\n    delete mutation.createCollection\n    delete mutation.addArtToCollection\n    delete mutation.updateNote\n\n    return mutation\n`,
  'Dream mutation payload builder',
)

store = replaceRequired(
  store,
  `        const created = upsertDream(res.data)\n        selectedDream.value = created\n        selectedDreams.value = [created]\n        dreamForm.value = toDreamForm(created)\n        dreamChats.value = created.Chats ?? []\n        newestDreams.value = [created]\n        saveStateToLocalStorage()\n`,
  `        const createdSummary = upsertDream(res.data)\n        const created =\n          (await fetchDreamById(createdSummary.id, true)) ?? createdSummary\n\n        selectedDream.value = created\n        selectedDreams.value = [created]\n        dreamForm.value = toDreamForm(created)\n        dreamChats.value = created.Chats ?? []\n        newestDreams.value = [created]\n        saveStateToLocalStorage()\n`,
  'Dream create detail hydration',
)

store = replaceRequired(
  store,
  `        const updated = upsertDream(res.data)\n        selectedDream.value = updated\n        selectedDreams.value = [updated]\n        dreamForm.value = toDreamForm(updated)\n        saveStateToLocalStorage()\n`,
  `        const updatedSummary = upsertDream(res.data)\n        const updated =\n          (await fetchDreamById(dreamId, true)) ?? updatedSummary\n\n        selectedDream.value = updated\n        selectedDreams.value = [updated]\n        dreamForm.value = toDreamForm(updated)\n        saveStateToLocalStorage()\n`,
  'Dream update detail hydration',
)

store = replaceRequired(
  store,
  `      createCollection: overrides.createCollection ?? true,\n`,
  '',
  'Dream clone collection flag',
)

writeFileSync(storePath, store)

let maker = readFileSync(makerPath, 'utf8')

maker = replaceRequired(
  maker,
  `\n              <label\n                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"\n              >\n                <span class="label-text font-bold">Create art collection</span>\n                <input\n                  v-model="dreamStore.dreamForm.createCollection"\n                  type="checkbox"\n                  class="toggle toggle-secondary"\n                />\n              </label>`,
  '',
  'Dreammaker collection toggle',
)

maker = replaceRequired(
  maker,
  `    value: dreamStore.dreamForm.artCollectionId\n      ? \`#\${dreamStore.dreamForm.artCollectionId}\`\n      : dreamStore.dreamForm.createCollection\n        ? 'Create'\n        : 'None',\n`,
  `    value: dreamStore.dreamForm.artCollectionId\n      ? \`#\${dreamStore.dreamForm.artCollectionId}\`\n      : 'None',\n`,
  'Dreammaker collection check',
)

writeFileSync(makerPath, maker)
