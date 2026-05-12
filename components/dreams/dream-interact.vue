<!-- /components/dreams/dream-interact.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
    <header class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Active Dream Location
          </p>
          <h2 class="text-2xl font-black text-base-content">
            {{ dreamStore.selectedDream?.title || 'No Dream selected' }}
          </h2>
          <p class="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-base-content/70">
            {{ dreamStore.selectedDream?.currentVibe || 'Pick a location before interrogating the wallpaper.' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-secondary rounded-2xl"
            type="button"
            :disabled="!dreamStore.selectedDreamId || dreamStore.chatsLoading"
            @click="refreshChats"
          >
            <Icon name="kind-icon:refresh" class="h-5 w-5" />
            Refresh
          </button>

          <button
            class="btn btn-primary rounded-2xl"
            type="button"
            @click="startLanternDream"
          >
            <Icon name="kind-icon:lamp" class="h-5 w-5" />
            Lantern
          </button>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div class="space-y-3 xl:col-span-8">
        <div
          v-if="dreamStore.selectedDreamCurrentImage"
          class="overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <img
            :src="dreamStore.selectedDreamCurrentImage"
            class="max-h-80 w-full object-cover"
            :alt="dreamStore.selectedDream?.title || 'Dream image'"
          />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Location Prompt
          </p>
          <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
            {{ dreamStore.dreamForm.currentPrompt || dreamStore.selectedDream?.currentPrompt || 'No prompt yet.' }}
          </p>
        </div>
      </div>

      <aside class="space-y-3 xl:col-span-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Context
          </p>
          <div class="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamCast.length }}
              </div>
              <div class="text-base-content/60">Cast</div>
            </div>
            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamItems.length }}
              </div>
              <div class="text-base-content/60">Items</div>
            </div>
            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamCollectionArt.length }}
              </div>
              <div class="text-base-content/60">Art</div>
            </div>
            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamChats.length }}
              </div>
              <div class="text-base-content/60">Notes</div>
            </div>
          </div>
        </div>

        <button
          class="btn btn-accent w-full rounded-2xl"
          type="button"
          :disabled="!dreamStore.selectedDream?.id || dreamStore.isSaving"
          @click="saveVibeAsPrompt"
        >
          <Icon name="kind-icon:sparkles" class="h-5 w-5" />
          Save vibe as prompt
        </button>
      </aside>
    </div>

    <div class="min-h-72 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3">
      <article
        v-for="chat in dreamStore.selectedDreamChats"
        :key="chat.id"
        class="rounded-2xl border p-3"
        :class="chat.type === 'BotResponse' ? 'border-secondary/40 bg-secondary/10' : 'border-base-300 bg-base-200'"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-primary">
            {{ chat.sender || chat.User?.username || 'Someone mysterious' }}
          </div>
          <div class="badge badge-outline">
            {{ chat.type }}
          </div>
        </div>

        <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
          {{ chat.content }}
        </p>
      </article>

      <div
        v-if="!dreamStore.selectedDreamChats.length"
        class="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-base-content/60"
      >
        <Icon name="kind-icon:chat" class="h-12 w-12" />
        <p>No room history yet. Say something ominous but useful.</p>
      </div>
    </div>

    <form
      class="rounded-2xl border border-base-300 bg-base-200 p-3"
      @submit.prevent="submitMessage"
    >
      <label class="form-control">
        <span class="label-text font-bold">Speak into the Dream</span>
        <textarea
          v-model="message"
          class="textarea textarea-bordered min-h-24 rounded-2xl"
          placeholder="The lanterns flicker as..."
        />
      </label>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2">
          <input
            v-model="reshapeDream"
            class="checkbox checkbox-primary"
            type="checkbox"
          />
          <span class="text-sm font-bold">Reshape vibe with this note</span>
        </label>

        <button
          class="btn btn-primary rounded-2xl"
          type="submit"
          :disabled="!canSubmit || dreamStore.isSaving"
        >
          <Icon name="kind-icon:send" class="h-5 w-5" />
          Send
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()
const message = ref('')
const reshapeDream = ref(false)

const canSubmit = computed(() => {
  return Boolean(dreamStore.selectedDreamId && message.value.trim())
})

watch(
  () => dreamStore.selectedDreamId,
  async (dreamId) => {
    if (dreamId) await dreamStore.fetchDreamChats({ dreamId })
  },
)

onMounted(async () => {
  await dreamStore.initialize()

  if (dreamStore.selectedDreamId) {
    await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
  }
})

function startLanternDream() {
  dreamStore.startAddingDream({
    title: 'The Lantern Greenhouse',
    slug: 'the-lantern-greenhouse',
    description:
      'A warm glasshouse floating somewhere between a dream, a garden, and a tiny impossible marketplace. Brass robots tend glowing plants, paper lanterns drift through the rafters, and every doorway seems to lead to a different story.',
    currentVibe:
      'Cozy, luminous, gently surreal. The air smells like rain on warm stone, jasmine tea, and old machine oil. The place feels safe, but not ordinary. Something magical is definitely doing paperwork in the back room.',
    currentPrompt:
      'A cozy floating lantern greenhouse filled with glowing plants, brass helper robots, warm paper lanterns, whimsical market stalls, dreamy cinematic lighting, soft surreal fantasy atmosphere',
    createCollection: true,
    isPublic: true,
    isMature: false,
    isActive: true,
  })
}

async function refreshChats() {
  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
}

async function saveVibeAsPrompt() {
  const vibe = dreamStore.selectedDream?.currentVibe || dreamStore.dreamForm.currentVibe
  if (!vibe) return

  await dreamStore.updateSelectedDream({
    currentPrompt: vibe,
    updateNote: 'Copied the Dream vibe into the location prompt.',
  })
}

async function submitMessage() {
  const content = message.value.trim()
  if (!content || !dreamStore.selectedDreamId) return

  const result = await dreamStore.addDreamChat(dreamStore.selectedDreamId, {
    type: 'Dream',
    content,
    updateDream: reshapeDream.value,
    currentVibe: reshapeDream.value ? content : undefined,
    isPublic: dreamStore.selectedDream?.isPublic ?? true,
    isMature: dreamStore.selectedDream?.isMature ?? false,
  })

  if (result.success) {
    message.value = ''
    reshapeDream.value = false
  }
}
</script>
