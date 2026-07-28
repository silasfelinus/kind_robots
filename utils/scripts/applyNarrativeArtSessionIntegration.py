from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:140]!r}")
    path.write_text(text.replace(old, new, 1))


story = Path("stores/storymakerStore.ts")
task = Path("stores/taskmasterStore.ts")
transcript = Path("components/narrative/narrative-transcript.vue")
story_page = Path("components/conductor/storymaker-page.vue")
task_page = Path("components/pages/taskmaster-page.vue")

# Storymaker store
replace_once(
    story,
    """import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
""",
    """import { useNarrativeArtJobs } from '@/composables/useNarrativeArtJobs'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
import type { NarrativeArtMoment } from '@/utils/narrativeArtProfiles'
""",
)

replace_once(
    story,
    """  answer?: StorymakerAnswer
  stateDelta: StorymakerStateDelta
""",
    """  answer?: StorymakerAnswer
  art?: NarrativeArtJobState
  stateDelta: StorymakerStateDelta
""",
)

replace_once(
    story,
    """  const chatStore = useChatStore()
  const userStore = useUserStore()
""",
    """  const chatStore = useChatStore()
  const userStore = useUserStore()
  const narrativeArtJobs = useNarrativeArtJobs()
""",
)

replace_once(
    story,
    """  function resetSetup() {
""",
    """  function updateBeatArt(beatId: string, art: NarrativeArtJobState): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat) return
    beat.art = art
    if (session.value) session.value.updatedAt = nowIso()
    persist()
  }

  function narrativeArtContext(
    beat: StorymakerBeat,
    moment: NarrativeArtMoment,
  ) {
    const active = session.value
    if (!active) return null
    return {
      product: 'storymaker' as const,
      sessionId: active.id,
      beatId: beat.id,
      moment,
      narrative: beat.narrative,
      title: active.bible.title,
      location: active.bible.location
        ? ingredientDescription(active.bible.location)
        : null,
      cast: active.bible.cast.map(ingredientDescription),
      facets: active.bible.facets.map(ingredientDescription),
    }
  }

  function requestBeatArt(
    beat: StorymakerBeat,
    moment: NarrativeArtMoment,
  ): void {
    if (beat.art) return
    const context = narrativeArtContext(beat, moment)
    if (!context) return
    void narrativeArtJobs.enqueue(context, (art) => updateBeatArt(beat.id, art))
  }

  function resumeNarrativeArtJobs(): void {
    for (const beat of session.value?.beats ?? []) {
      if (!beat.art) continue
      narrativeArtJobs.resume(beat.art, (art) => updateBeatArt(beat.id, art))
    }
  }

  function retryBeatArt(beatId: string): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat?.art) return
    narrativeArtJobs.retry(beat.art, (art) => updateBeatArt(beat.id, art))
  }

  function resetSetup() {
""",
)

replace_once(
    story,
    """        session.value = normalizeRestoredSession(
          JSON.parse(sessionRaw) as StorymakerSession,
        )
""",
    """        session.value = normalizeRestoredSession(
          JSON.parse(sessionRaw) as StorymakerSession,
        )
        resumeNarrativeArtJobs()
""",
)

replace_once(
    story,
    """      active.beats.push({
        id: beatId,
        sessionId: active.id,
        narrative: parsed.narrative,
        question: closing ? '' : extractQuestion(parsed.narrative),
        stateDelta: parsed.stateDelta,
        createdAt: nowIso(),
      })
      applyStateDelta(active, beatId, parsed.stateDelta)
      if (closing) active.status = 'complete'
      active.updatedAt = nowIso()
      persist()
      return true
""",
    """      const beat: StorymakerBeat = {
        id: beatId,
        sessionId: active.id,
        narrative: parsed.narrative,
        question: closing ? '' : extractQuestion(parsed.narrative),
        stateDelta: parsed.stateDelta,
        createdAt: nowIso(),
      }
      active.beats.push(beat)
      applyStateDelta(active, beatId, parsed.stateDelta)
      if (closing) active.status = 'complete'
      active.updatedAt = nowIso()
      persist()

      const artMoment: NarrativeArtMoment | null = closing
        ? 'finale'
        : active.beats.length === 1
          ? 'opening'
          : null
      if (artMoment) requestBeatArt(beat, artMoment)
      return true
""",
)

replace_once(
    story,
    """    resetSession,
    beginStory,
""",
    """    resetSession,
    resumeNarrativeArtJobs,
    retryBeatArt,
    beginStory,
""",
)

# Taskmaster store
replace_once(
    task,
    """import { useChatStore } from '@/stores/chatStore'
""",
    """import { useNarrativeArtJobs } from '@/composables/useNarrativeArtJobs'
import { useChatStore } from '@/stores/chatStore'
""",
)

replace_once(
    task,
    """import { useUserStore } from '@/stores/userStore'
""",
    """import { useUserStore } from '@/stores/userStore'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
import type { NarrativeArtMoment } from '@/utils/narrativeArtProfiles'
""",
)

replace_once(
    task,
    """  question: TaskmasterQuestion
  answer?: TaskmasterAnswer
  createdAt: string
""",
    """  question: TaskmasterQuestion
  answer?: TaskmasterAnswer
  art?: NarrativeArtJobState
  createdAt: string
""",
)

replace_once(
    task,
    """  const userStore = useUserStore()

  const session = ref<TaskmasterSession | null>(null)
""",
    """  const userStore = useUserStore()
  const narrativeArtJobs = useNarrativeArtJobs()

  const session = ref<TaskmasterSession | null>(null)
""",
)

replace_once(
    task,
    """  function resetSession() {
""",
    """  function updateBeatArt(beatId: string, art: NarrativeArtJobState): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat) return
    beat.art = art
    if (session.value) session.value.updatedAt = nowIso()
    saveToLocalStorage()
  }

  function narrativeArtContext(
    beat: TaskmasterBeat,
    moment: NarrativeArtMoment,
  ) {
    const active = session.value
    if (!active) return null
    return {
      product: 'taskmaster' as const,
      sessionId: active.id,
      beatId: beat.id,
      moment,
      narrative: beat.narrative,
      title: active.seed.taskTitle || 'Taskmaster quest',
      objective: active.seed.taskTitle,
      location: active.location ? describeIngredient(active.location) : null,
      facets: [
        active.genre ? describeIngredient(active.genre) : '',
        ...active.seed.vibeTags,
      ].filter(Boolean),
    }
  }

  function requestBeatArt(
    beat: TaskmasterBeat,
    moment: NarrativeArtMoment,
  ): void {
    if (beat.art) return
    const context = narrativeArtContext(beat, moment)
    if (!context) return
    void narrativeArtJobs.enqueue(context, (art) => updateBeatArt(beat.id, art))
  }

  function resumeNarrativeArtJobs(): void {
    for (const beat of session.value?.beats ?? []) {
      if (!beat.art) continue
      narrativeArtJobs.resume(beat.art, (art) => updateBeatArt(beat.id, art))
    }
  }

  function retryBeatArt(beatId: string): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat?.art) return
    narrativeArtJobs.retry(beat.art, (art) => updateBeatArt(beat.id, art))
  }

  function resetSession() {
""",
)

replace_once(
    task,
    """      session.value = restored
""",
    """      session.value = restored
      resumeNarrativeArtJobs()
""",
)

replace_once(
    task,
    """      if (closing) active.status = 'complete'
      active.beats.push(beat)
      active.updatedAt = nowIso()
      saveToLocalStorage()
      return true
""",
    """      if (closing) active.status = 'complete'
      active.beats.push(beat)
      active.updatedAt = nowIso()
      saveToLocalStorage()

      const artMoment: NarrativeArtMoment | null = closing
        ? 'finale'
        : active.beats.length === 1
          ? 'opening'
          : null
      if (artMoment) requestBeatArt(beat, artMoment)
      return true
""",
)

replace_once(
    task,
    """    resetSession,
    prepareQuest,
""",
    """    resetSession,
    resumeNarrativeArtJobs,
    retryBeatArt,
    prepareQuest,
""",
)

# Shared transcript slot typing
replace_once(
    transcript,
    """import { computed } from 'vue'
""",
    """import { computed } from 'vue'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
""",
)

replace_once(
    transcript,
    """      answer?: { text: string } | null
    }[]
""",
    """      answer?: { text: string } | null
      art?: NarrativeArtJobState | null
    }[]
""",
)

# Storymaker page uses shared art slot
replace_once(
    story_page,
    """          empty-label="Storymaker is preparing the opening scene."
        />
""",
    """          empty-label="Storymaker is preparing the opening scene."
        >
          <template #after-beat="{ beat }">
            <NarrativeArtStatus
              :art="beat.art"
              :label="`Illustration from ${store.session?.bible.title || 'this story'}`"
              @retry="store.retryBeatArt(beat.id)"
            />
          </template>
        </NarrativeTranscript>
""",
)

# Taskmaster page uses shared art slot
replace_once(
    task_page,
    """          empty-label="Taskmaster is preparing the opening scene."
        />
""",
    """          empty-label="Taskmaster is preparing the opening scene."
        >
          <template #after-beat="{ beat }">
            <NarrativeArtStatus
              :art="beat.art"
              :label="`Illustration for ${store.session?.seed.taskTitle || 'this quest'}`"
              @retry="store.retryBeatArt(beat.id)"
            />
          </template>
        </NarrativeTranscript>
""",
)

print("Applied narrative art session integration")
