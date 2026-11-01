<template>
  <div class="evs" data-testid="studio-scene-editor">
    <div class="evs-scenes" aria-label="Scenes">
      <button
        v-for="scene in scenes"
        :key="scene.id"
        type="button"
        class="evs-scene-tab"
        :aria-pressed="current?.id === scene.id"
        :data-testid="'studio-scene-' + scene.id"
        @click="store.editingSceneId = scene.id"
      >
        <small>{{ TRIGGER_LABELS[scene.trigger.kind] }}</small>
        <strong>{{ scene.title }}</strong>
      </button>
      <div class="evs-add">
        <button
          type="button"
          data-testid="studio-add-opening"
          @click="store.addStudioScene('opening')"
        >
          + Opening
        </button>
        <button
          type="button"
          data-testid="studio-add-triggered"
          @click="store.addStudioScene('turn')"
        >
          + Triggered
        </button>
        <button
          type="button"
          data-testid="studio-add-closing"
          @click="store.addStudioScene('closing')"
        >
          + Closing
        </button>
      </div>
    </div>

    <div v-if="current" class="evs-detail">
      <div class="evs-row">
        <label
          >TITLE
          <input
            :value="current.title"
            maxlength="80"
            data-testid="studio-scene-title"
            @change="
              store.renameStudioScene(
                current.id,
                ($event.target as HTMLInputElement).value,
              )
            "
        /></label>
        <label
          >TRIGGER
          <select
            :value="current.trigger.kind"
            data-testid="studio-scene-trigger"
            @change="
              store.setSceneTriggerKind(
                current.id,
                ($event.target as HTMLSelectElement).value as TriggerKind,
              )
            "
          >
            <option
              v-for="(label, kind) in TRIGGER_LABELS"
              :key="kind"
              :value="kind"
            >
              {{ label }}
            </option>
          </select></label
        >
        <label v-for="field in triggerFields" :key="field.key"
          >{{ field.label }}
          <select
            v-if="field.options"
            :value="String(field.value)"
            @change="
              patch(field.key, ($event.target as HTMLSelectElement).value)
            "
          >
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            :type="field.numeric ? 'number' : 'text'"
            :value="field.value"
            :min="field.numeric ? 0 : undefined"
            :max="field.numeric ? 40 : undefined"
            @change="
              patch(
                field.key,
                ($event.target as HTMLInputElement).value,
                field.numeric,
              )
            "
        /></label>
      </div>
      <div class="evs-row">
        <button
          type="button"
          data-testid="studio-scene-preview"
          @click="store.previewScene(current.id)"
        >
          ▶ PREVIEW
        </button>
        <button
          type="button"
          class="is-danger"
          @click="store.removeStudioScene(current.id)"
        >
          DELETE SCENE
        </button>
      </div>

      <ol class="evs-lines">
        <li
          v-for="node in current.nodes"
          :key="node.id"
          class="evs-line"
          :data-testid="'studio-line-' + node.id"
        >
          <div class="evs-row">
            <select
              :value="node.speaker"
              :aria-label="'Speaker for ' + node.id"
              @change="
                store.updateSceneLine(current.id, node.id, {
                  speaker: ($event.target as HTMLSelectElement).value,
                })
              "
            >
              <option
                v-for="speaker in SPEAKERS"
                :key="speaker.value"
                :value="speaker.value"
              >
                {{ speaker.label }}
              </option>
            </select>
            <select
              :value="node.emotion"
              :aria-label="'Emotion for ' + node.id"
              @change="
                store.updateSceneLine(current.id, node.id, {
                  emotion: ($event.target as HTMLSelectElement)
                    .value as Emotion,
                })
              "
            >
              <option v-for="emotion in EMOTIONS" :key="emotion">
                {{ emotion }}
              </option>
            </select>
            <select
              :value="node.camera"
              :aria-label="'Camera for ' + node.id"
              @change="
                store.updateSceneLine(current.id, node.id, {
                  camera: ($event.target as HTMLSelectElement).value as Camera,
                })
              "
            >
              <option v-for="camera in CAMERAS" :key="camera">
                {{ camera }}
              </option>
            </select>
            <select
              :value="node.role ?? ''"
              :aria-label="'Story role for ' + node.id"
              @change="
                store.updateSceneLine(current.id, node.id, {
                  role:
                    (($event.target as HTMLSelectElement).value as SceneRole) ||
                    undefined,
                })
              "
            >
              <option value="">No role tag</option>
              <option v-for="role in ROLES" :key="role" :value="role">
                the {{ role }}
              </option>
            </select>
            <button
              type="button"
              :aria-pressed="!!node.choices?.length"
              @click="store.toggleSceneChoices(current.id, node.id)"
            >
              CHOICES
            </button>
            <button
              type="button"
              :aria-pressed="!!node.branch"
              data-testid="studio-line-branch"
              @click="
                store.setSceneBranch(
                  current.id,
                  node.id,
                  node.branch ? null : defaultBranch(node.next),
                )
              "
            >
              IF…
            </button>
            <button
              type="button"
              :aria-label="'Remove line ' + node.id"
              @click="store.removeSceneLine(current.id, node.id)"
            >
              ✕
            </button>
          </div>
          <textarea
            :value="node.text"
            rows="2"
            maxlength="400"
            :aria-label="'Line text ' + node.id"
            @change="
              store.updateSceneLine(current.id, node.id, {
                text: ($event.target as HTMLTextAreaElement).value,
              })
            "
          ></textarea>
          <label v-if="!node.choices?.length && !node.branch" class="evs-inline"
            >THEN
            <select
              :value="node.next ?? ''"
              data-testid="studio-line-next"
              @change="
                store.setSceneNext(
                  current.id,
                  node.id,
                  ($event.target as HTMLSelectElement).value || null,
                )
              "
            >
              <option value="">End the scene</option>
              <option
                v-for="other in targetsFor(node.id)"
                :key="other.id"
                :value="other.id"
              >
                {{ other.label }}
              </option>
            </select></label
          >
          <div v-if="node.branch" class="evs-row evs-choice">
            <select
              :value="node.branch.when.kind"
              aria-label="Branch condition"
              @change="
                store.setSceneBranch(current.id, node.id, {
                  ...node.branch,
                  when: defaultCondition(
                    ($event.target as HTMLSelectElement)
                      .value as SceneCondition['kind'],
                  ),
                })
              "
            >
              <option value="flag">If story flag is set</option>
              <option value="perspective">If the viewpoint is</option>
              <option value="alive">If unit is still standing</option>
              <option value="outnumber">If team outnumbers the other</option>
            </select>
            <input
              v-if="node.branch.when.kind === 'flag'"
              :value="node.branch.when.flag"
              maxlength="32"
              aria-label="Branch flag"
              @change="
                store.setSceneBranch(current.id, node.id, {
                  ...node.branch,
                  when: {
                    kind: 'flag',
                    flag: ($event.target as HTMLInputElement).value,
                  },
                })
              "
            />
            <select
              v-else
              :value="conditionValue(node.branch.when)"
              aria-label="Branch condition value"
              @change="
                store.setSceneBranch(current.id, node.id, {
                  ...node.branch,
                  when: withValue(
                    node.branch.when,
                    ($event.target as HTMLSelectElement).value,
                  ),
                })
              "
            >
              <option
                v-for="option in conditionOptions(node.branch.when)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <label class="evs-inline"
              >YES →
              <select
                :value="node.branch.then ?? ''"
                @change="
                  store.setSceneBranch(current.id, node.id, {
                    ...node.branch,
                    then: ($event.target as HTMLSelectElement).value || null,
                  })
                "
              >
                <option value="">End</option>
                <option
                  v-for="other in targetsFor(node.id)"
                  :key="other.id"
                  :value="other.id"
                >
                  {{ other.label }}
                </option>
              </select></label
            >
            <label class="evs-inline"
              >NO →
              <select
                :value="node.branch.else ?? ''"
                @change="
                  store.setSceneBranch(current.id, node.id, {
                    ...node.branch,
                    else: ($event.target as HTMLSelectElement).value || null,
                  })
                "
              >
                <option value="">End</option>
                <option
                  v-for="other in targetsFor(node.id)"
                  :key="other.id"
                  :value="other.id"
                >
                  {{ other.label }}
                </option>
              </select></label
            >
          </div>
          <div
            v-for="(choice, index) in node.choices ?? []"
            :key="index"
            class="evs-row evs-choice"
          >
            <input
              :value="choice.label"
              maxlength="80"
              :aria-label="'Choice ' + (index + 1) + ' label'"
              @change="
                store.updateSceneChoice(current.id, node.id, index, {
                  label: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <select
              :value="choice.effects[0]?.kind ?? 'none'"
              :aria-label="'Choice ' + (index + 1) + ' effect'"
              @change="
                store.updateSceneChoice(current.id, node.id, index, {
                  effect: ($event.target as HTMLSelectElement).value as
                    'none' | 'flag' | 'heal' | 'suppress',
                })
              "
            >
              <option value="none">No effect</option>
              <option value="flag">Set story flag</option>
              <option value="heal">Heal a squadmate</option>
              <option value="suppress">Suppress a rival</option>
            </select>
            <input
              v-if="choice.effects[0]?.kind === 'flag'"
              :value="choice.effects[0].flag"
              maxlength="32"
              :aria-label="'Choice ' + (index + 1) + ' flag'"
              @change="
                store.updateSceneChoice(current.id, node.id, index, {
                  flag: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <select
              :value="choice.next ?? ''"
              :aria-label="'Choice ' + (index + 1) + ' leads to'"
              @change="
                store.setSceneChoiceTarget(
                  current.id,
                  node.id,
                  index,
                  ($event.target as HTMLSelectElement).value || null,
                )
              "
            >
              <option value="">Ends the scene</option>
              <option
                v-for="other in targetsFor(node.id)"
                :key="other.id"
                :value="other.id"
              >
                {{ other.label }}
              </option>
            </select>
          </div>
        </li>
      </ol>
      <button
        type="button"
        data-testid="studio-add-line"
        @click="store.addSceneLine(current.id)"
      >
        + LINE
      </button>
    </div>
    <p v-else class="evs-empty">
      No scenes yet. Add an opening, a triggered moment or a closing scene.
      Scenes play in studio playtests and travel with share codes.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CAMERAS,
  EMOTIONS,
  ROLES,
  TRIGGER_LABELS,
  type Camera,
  type Emotion,
  type SceneBranch,
  type SceneCondition,
  type SceneRole,
  type TriggerKind,
} from '~/utils/everyVillainTactics/sceneGraph'
import { useEveryVillainTacticsStore } from '~/stores/everyVillainTacticsStore'

const store = useEveryVillainTacticsStore()
const SPEAKERS = [
  { value: 'narrator', label: 'Narrator' },
  { value: 'backdraft', label: 'Squad lead' },
  { value: 'priya', label: 'Squad two' },
  { value: 'hattie', label: 'Squad three' },
  { value: 'pip', label: 'Rival lead' },
  { value: 'vee', label: 'Rival two' },
  { value: 'remy', label: 'Rival three' },
]
const UNITS = SPEAKERS.slice(1)
const TEAMS = [
  { value: 'squad', label: 'Squad' },
  { value: 'rival', label: 'Rival' },
]
const scenes = computed(() => store.draft.script?.scenes ?? [])
const current = computed(
  () =>
    scenes.value.find((s) => s.id === store.editingSceneId) ??
    scenes.value[0] ??
    null,
)
type Field = {
  key: string
  label: string
  value: string | number
  numeric?: boolean
  options?: Array<{ value: string; label: string }>
}
const triggerFields = computed<Field[]>(() => {
  const t = current.value?.trigger as Record<string, unknown> | undefined
  if (!t) return []
  const field = (key: string, label: string, extra: Partial<Field> = {}) => ({
    key,
    label,
    value: t[key] as string | number,
    ...extra,
  })
  switch (t.kind) {
    case 'closing':
      return [
        field('outcome', 'OUTCOME', {
          options: [
            { value: 'any', label: 'Any ending' },
            { value: 'victory', label: 'Victory' },
            { value: 'defeat', label: 'Defeat' },
          ],
        }),
      ]
    case 'turn':
      return [field('round', 'ROUND', { numeric: true })]
    case 'tile':
      return [
        field('x', 'COLUMN (0-8)', { numeric: true }),
        field('y', 'ROW (0-5)', { numeric: true }),
        field('team', 'TEAM', { options: TEAMS }),
      ]
    case 'sight':
      return [
        field('unit', 'WATCHER', { options: UNITS }),
        field('target', 'SEES', { options: UNITS }),
      ]
    case 'health':
      return [
        field('unit', 'UNIT', { options: UNITS }),
        field('atMost', 'HP AT MOST', { numeric: true }),
      ]
    case 'kill':
      return [
        field('team', 'TEAM DOWN', { options: TEAMS }),
        field('count', 'COUNT', { numeric: true }),
      ]
    case 'rescue':
      return [field('count', 'RESCUED', { numeric: true })]
    case 'objective':
      return [field('progress', 'PROGRESS', { numeric: true })]
    case 'faction':
      return [
        field('team', 'TEAM', { options: TEAMS }),
        field('lead', 'AHEAD BY', { numeric: true }),
      ]
    case 'after':
      return [
        field('scene', 'AFTER SCENE', {
          options: scenes.value
            .filter((s) => s.id !== current.value?.id)
            .map((s) => ({ value: s.id, label: s.title })),
        }),
      ]
    case 'flag':
      return [field('flag', 'FLAG')]
    default:
      return []
  }
})
/** Lines a link can point to, labelled by speaker and opening words. */
function targetsFor(nodeId: string) {
  return (current.value?.nodes ?? [])
    .filter((n) => n.id !== nodeId)
    .map((n) => ({
      id: n.id,
      label:
        n.id +
        ' · ' +
        (SPEAKERS.find((s) => s.value === n.speaker)?.label ?? n.speaker) +
        ': ' +
        n.text.slice(0, 24),
    }))
}
const settable = computed(() =>
  (store.draft.script?.scenes ?? []).flatMap((s) =>
    s.nodes.flatMap((n) =>
      (n.choices ?? []).flatMap((c) =>
        c.effects.flatMap((e) => (e.kind === 'flag' ? [e.flag] : [])),
      ),
    ),
  ),
)
function defaultCondition(kind: SceneCondition['kind']): SceneCondition {
  if (kind === 'flag') return { kind, flag: settable.value[0] ?? 'flag-1' }
  if (kind === 'perspective') return { kind, perspective: 'hero' }
  if (kind === 'alive') return { kind, unit: 'pip' }
  return { kind, team: 'squad' }
}
function defaultBranch(next: string | null): SceneBranch {
  return {
    when: defaultCondition(settable.value.length ? 'flag' : 'perspective'),
    then: next,
    else: next,
  }
}
function conditionValue(when: SceneCondition): string {
  return when.kind === 'perspective'
    ? when.perspective
    : when.kind === 'alive'
      ? when.unit
      : when.kind === 'outnumber'
        ? when.team
        : when.flag
}
function conditionOptions(when: SceneCondition) {
  if (when.kind === 'perspective')
    return ROLES.map((role) => ({ value: role, label: 'the ' + role }))
  if (when.kind === 'alive') return UNITS
  return TEAMS
}
function withValue(when: SceneCondition, value: string): SceneCondition {
  if (when.kind === 'perspective')
    return { kind: 'perspective', perspective: value as SceneRole }
  if (when.kind === 'alive') return { kind: 'alive', unit: value }
  if (when.kind === 'outnumber')
    return { kind: 'outnumber', team: value as 'squad' | 'rival' }
  return { kind: 'flag', flag: value }
}
function patch(key: string, raw: string, numeric = false) {
  if (!current.value) return
  store.patchSceneTrigger(current.value.id, {
    [key]: numeric ? Number(raw) : raw,
  })
}
</script>

<style scoped>
.evs {
  display: grid;
  grid-template-columns: minmax(130px, 0.6fr) minmax(0, 2fr);
  gap: 10px;
  min-height: 0;
  height: 100%;
  overflow: auto;
  color: #fff1d8;
  font-size: 0.75rem;
}
.evs-scenes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.evs-scene-tab {
  display: grid;
  gap: 2px;
  padding: 6px 8px;
  text-align: left;
  color: inherit;
  border: 1px solid #8193b3;
  border-radius: 8px;
  background: #1b2440;
}
.evs-scene-tab[aria-pressed='true'] {
  border-color: #fedda2;
  background: #3a3560;
}
.evs-scene-tab small {
  color: #b7b3dd;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.evs-add,
.evs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: end;
}
.evs-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.evs label {
  display: grid;
  gap: 2px;
  color: #fedda2;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.evs input,
.evs select,
.evs textarea {
  min-width: 0;
  max-width: 100%;
  padding: 4px 6px;
  color: #f4f0ff;
  font-size: 0.75rem;
  border: 1px solid #8193b3;
  border-radius: 6px;
  background: #10162b;
}
.evs textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
}
.evs button {
  padding: 5px 9px;
  color: #e1e6f6;
  font-size: 0.68rem;
  font-weight: 800;
  border: 1px solid #8193b3;
  border-radius: 6px;
  background: #263552;
}
.evs button[aria-pressed='true'] {
  border-color: #fedda2;
  color: #fedda2;
}
.evs button:focus-visible,
.evs input:focus-visible,
.evs select:focus-visible,
.evs textarea:focus-visible {
  outline: 2px solid #fedda2;
  outline-offset: 1px;
}
.evs button.is-danger {
  border-color: #ff7d8caa;
  color: #ffd2d8;
}
.evs-lines {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.evs-line {
  display: grid;
  gap: 4px;
  padding: 8px;
  border: 1px solid #829fc35a;
  border-radius: 8px;
  background: #161e37;
}
.evs-choice {
  padding-left: 12px;
  border-left: 2px solid #fedda2;
}
.evs-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.evs-empty {
  grid-column: 2;
  color: #b7b3dd;
}
@container (max-width: 640px) {
  .evs {
    grid-template-columns: minmax(0, 1fr);
  }
  .evs-empty {
    grid-column: 1;
  }
}
</style>
