import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import {
  actorAt,
  availableMove,
  endTurn,
  fireSelected,
  moveSelected,
  overwatchSelected,
  hunkerSelected,
  elevationAt,
  previewShot,
  previewSelectedPower,
  powerFor,
  selectedPowerTargets,
  selectedUnit,
  trainingState,
  terrainAt,
  useSelectedPower,
  type Cell,
  type Mode,
} from '~/utils/everyVillainTactics/training'
import { powerBlocker } from '~/utils/everyVillainTactics/powers'
import {
  EVT_SAVE_SLOTS,
  createSave,
  latestSave,
  readSlot,
  summarizeSave,
  writeSlot,
  type EvtSave,
  type EvtSaveSlot,
  type EvtSaveSummary,
  type SaveStorage,
} from '~/utils/everyVillainTactics/saves'

import {
  STAGE_PRESETS,
  clonePreset,
  paintStage,
  stageProblems,
  type StudioBrush,
} from '~/utils/everyVillainTactics/studio'

import {
  applyChoice,
  createStory,
  enqueueBeat,
  storyMoment,
  type ChoiceEffect,
  type Perspective,
} from '~/utils/everyVillainTactics/firstBellStory'

export type TacticalPerspective = Perspective

export const PERSPECTIVES: Record<
  TacticalPerspective,
  { label: string; headline: string; opening: string }
> = {
  hero: {
    label: 'Hero',
    headline: 'Save the assembly',
    opening:
      'Someone sealed the auditorium doors with students still inside. Your team has one chance to open a path before the panic spreads.',
  },
  villain: {
    label: 'Villain',
    headline: 'Stop their reckless rescue',
    opening:
      'The heroes want to storm a sealed building without knowing what waits behind the doors. You are keeping a dangerous secret contained.',
  },
  henchman: {
    label: 'Henchman',
    headline: 'An impossible order',
    opening:
      'You were told to hold the east stairs. Nobody mentioned the children trapped inside, or why your boss refuses to answer the radio.',
  },
  sidekick: {
    label: 'Sidekick',
    headline: 'Make your own call',
    opening:
      'Your partner wants a clean victory. You just heard another voice crying for help behind the wall. What kind of hero follows orders?',
  },
}

export const useEveryVillainTacticsStore = defineStore(
  'everyVillainTactics',
  () => {
    const state = ref(trainingState())
    const perspective = ref<TacticalPerspective>('hero')
    const leadSignature = ref('accident-fire')
    const story = ref(createStory())
    const rosterOpen = ref(false)
    const rosterSearch = ref('')
    const studioOpen = ref(false)
    const studioBrush = ref<StudioBrush>('wall')
    const draft = ref(clonePreset('college-quad'))
    const isPlaytest = ref(false)
    /** Per-slot summary or the reason a stored save was refused. */
    const saveSlots = ref<
      Array<{
        slot: EvtSaveSlot
        summary: EvtSaveSummary | null
        problem: string | null
      }>
    >([])
    const saveMessage = ref('')
    function browserStorage(): SaveStorage | null {
      try {
        return typeof localStorage === 'undefined' ? null : localStorage
      } catch {
        return null
      }
    }
    function readSaves(): EvtSave[] {
      const storage = browserStorage()
      const valid: EvtSave[] = []
      saveSlots.value = EVT_SAVE_SLOTS.map((slot) => {
        const result = readSlot(storage, slot)
        if (result?.ok) valid.push(result.save)
        return {
          slot,
          summary: result?.ok ? summarizeSave(result.save) : null,
          problem: result && !result.ok ? result.reason : null,
        }
      })
      return valid
    }
    const canContinue = computed(() =>
      saveSlots.value.some((entry) => entry.summary),
    )
    function saveTo(slot: EvtSaveSlot): boolean {
      const save = createSave({
        slot,
        perspective: perspective.value,
        leadSignature: leadSignature.value,
        stage: isPlaytest.value ? draft.value : null,
        state: state.value,
        story: story.value,
      })
      const ok = writeSlot(browserStorage(), save)
      saveMessage.value = ok
        ? 'Saved to ' + slot + '.'
        : 'This browser blocked saving.'
      readSaves()
      return ok
    }
    function applySave(save: EvtSave) {
      perspective.value = save.perspective
      leadSignature.value = save.leadSignature
      isPlaytest.value = save.mode === 'oneshot'
      if (save.stage) draft.value = structuredClone(save.stage)
      state.value = structuredClone(save.state)
      story.value = structuredClone(save.story)
      studioOpen.value = false
      rosterOpen.value = false
    }
    function loadFrom(slot: EvtSaveSlot): boolean {
      const result = readSlot(browserStorage(), slot)
      if (!result?.ok) {
        saveMessage.value = result ? result.reason : 'That slot is empty.'
        return false
      }
      applySave(result.save)
      saveMessage.value =
        'Loaded ' + slot + (result.migrated ? ' (upgraded save).' : '.')
      return true
    }
    /** Continue resumes the most recently saved valid slot, never a guess. */
    function continueLatest(): boolean {
      const save = latestSave(readSaves())
      if (!save) {
        saveMessage.value = 'No saved battle to continue.'
        return false
      }
      return loadFrom(save.slot)
    }
    const studioProblems = computed(() => stageProblems(draft.value))
    const boardCells = computed(() =>
      Array.from(
        { length: state.value.map.width * state.value.map.height },
        (_, i) => ({
          x: i % state.value.map.width,
          y: Math.floor(i / state.value.map.width),
        }),
      ),
    )
    function loadPreset(id: string) {
      draft.value = clonePreset(id)
    }
    function paintCell(point: Cell) {
      draft.value = paintStage(draft.value, point, studioBrush.value)
    }
    function startPlaytest() {
      if (studioProblems.value.length) return false
      isPlaytest.value = true
      studioOpen.value = false
      reset()
      return true
    }
    function exitPlaytest() {
      isPlaytest.value = false
      reset()
    }
    function tileInfoAt(point: Cell) {
      return terrainAt(point, state.value.map)
    }
    function heightAt(point: Cell) {
      return elevationAt(point, state.value.map)
    }
    function isSeismicWarning(point: Cell) {
      return state.value.units.some(
        (unit) =>
          unit.hp > 0 &&
          unit.seismicTarget &&
          Math.abs(unit.seismicTarget.x - point.x) <= 1 &&
          Math.abs(unit.seismicTarget.y - point.y) <= 1,
      )
    }
    function isBurrowWarning(point: Cell) {
      return state.value.units.some(
        (unit) =>
          unit.hp > 0 &&
          unit.burrowTarget?.x === point.x &&
          unit.burrowTarget?.y === point.y,
      )
    }
    const roster = IDENTITY_ARCS
    const active = computed(() => selectedUnit(state.value) ?? null)
    const players = computed(() =>
      state.value.units.filter((u) => u.team === 'squad'),
    )
    const enemies = computed(() =>
      state.value.units.filter((u) => u.team === 'rival'),
    )
    const scene = computed(() =>
      isPlaytest.value
        ? {
            ...PERSPECTIVES[perspective.value],
            headline: draft.value.objective,
            opening:
              (draft.value.encounter === 'quarry-lieutenant'
                ? 'Mags Hardpan is an independent four-HP lieutenant, not Foreman Thumpkin. Her drum warns of a 3×3 seismic blast. Move away or land a hit to interrupt it; the one-hit Warren Wreckers still burrow. '
                : draft.value.encounter === 'warren-wreckers'
                  ? 'Foreman Thumpkin has brought the Warren Wreckers to a disputed city picnic. Dust rings announce their next burrow attack. Block those squares or shoot the one-hit crew. '
                  : '') +
              draft.value.title +
              ' / ' +
              draft.value.venue +
              '. Studio sparring uses the real tactical rules; story scenes are authored separately.',
          }
        : PERSPECTIVES[perspective.value],
    )
    const moment = computed(() =>
      !isPlaytest.value && story.value.current
        ? storyMoment(
            perspective.value,
            story.value.current,
            leadSignature.value,
            story.value,
          )
        : null,
    )
    const hovered = computed(() => state.value.hover)
    const mode = computed<Mode>(() => state.value.mode)
    /** The selected hero's signature active and why it cannot fire now. */
    const activePower = computed(() =>
      active.value ? (powerFor(active.value) ?? null) : null,
    )
    const powerStatus = computed(() =>
      active.value ? powerBlocker(active.value) : 'Select a squadmate',
    )
    const powerTargetCells = computed(() =>
      mode.value === 'power' ? selectedPowerTargets(state.value) : [],
    )
    const powerPreview = computed(() =>
      mode.value === 'power' && hovered.value
        ? previewSelectedPower(state.value, hovered.value)
        : null,
    )
    const movePossible = computed(
      () => hovered.value && availableMove(state.value, hovered.value),
    )
    const projectedTargets = computed(() => {
      const selected = active.value
      const point = hovered.value
      if (!selected || !point) return []
      const from =
        mode.value === 'move' && movePossible.value
          ? { ...selected, x: point.x, y: point.y }
          : selected
      return enemies.value
        .filter((u) => u.hp > 0)
        .map((u) => previewShot(from, u, state.value.map))
        .filter((shot) => shot.hit > 0)
        .sort((a, b) => b.hit - a.hit || a.target.localeCompare(b.target))
    })
    const aimedTarget = computed(() => {
      if (!hovered.value || mode.value === 'power') return null
      if (mode.value === 'fire') {
        const hoveredEnemy = actorAt(state.value, hovered.value)
        return hoveredEnemy?.team === 'rival'
          ? (projectedTargets.value.find(
              (shot) => shot.target === hoveredEnemy.id,
            ) ?? null)
          : null
      }
      return movePossible.value ? (projectedTargets.value[0] ?? null) : null
    })
    const previewLabel = computed(() => {
      if (!active.value) return 'Select a squadmate'
      if (mode.value === 'power') {
        if (powerStatus.value) return powerStatus.value
        if (!hovered.value) return 'Hover a gold tile to preview the power'
        return powerPreview.value
          ? 'Click to commit · the outlined tiles are exactly what it touches'
          : 'Not a legal target for this power'
      }
      if (!hovered.value)
        return 'Hover a highlighted tile to see sightlines and attack odds'
      if (mode.value === 'fire') {
        return aimedTarget.value?.hit
          ? 'Clear shot · ' + aimedTarget.value.hit + '% hit chance'
          : 'No clear shot from current position'
      }
      if (!movePossible.value)
        return 'Destination blocked or out of movement range'
      return aimedTarget.value
        ? 'From here: ' +
            aimedTarget.value.hit +
            '% on ' +
            enemies.value.find((u) => u.id === aimedTarget.value?.target)?.id
        : 'Reachable · no visible target from this position'
    })

    function reset() {
      state.value = trainingState(
        0x53a1b7,
        isPlaytest.value ? draft.value : undefined,
        { lead: leadSignature.value },
      )
      story.value = createStory()
      if (isPlaytest.value) story.value.current = null
    }
    function choosePerspective(value: TacticalPerspective) {
      perspective.value = value
      reset()
    }
    function chooseLead(signature: string) {
      const valid = roster.some((u) => u.signature === signature)
      if (!valid) return
      leadSignature.value = signature
      reset()
      state.value.log =
        'New squad leader assigned. The battle starts at First Bell.'
      rosterOpen.value = false
    }
    function select(id: string) {
      if (story.value.current) return
      const u = state.value.units.find(
        (u) => u.id === id && u.hp > 0 && u.team === 'squad',
      )
      if (!u) return
      state.value.selected = id
      state.value.hover = { x: u.x, y: u.y }
      state.value.mode = 'move'
    }
    function setMode(next: Mode) {
      if (story.value.current) return
      state.value.mode = next
      state.value.hover = null
    }
    function hover(point: Cell | null) {
      state.value.hover = point
    }
    function click(point: Cell) {
      if (story.value.current && !isPlaytest.value) return
      if (state.value.mode === 'power' && state.value.phase === 'active') {
        // Allies can be power targets, so try the power before reselecting.
        if (useSelectedPower(state.value, point)) {
          if (!isPlaytest.value) enqueueBeat(story.value, state.value)
          return
        }
      }
      const unit = actorAt(state.value, point)
      if (unit?.team === 'squad') return select(unit.id)
      if (state.value.phase !== 'active') return
      if (unit?.team === 'rival') {
        if (
          state.value.mode === 'fire' &&
          fireSelected(state.value, unit) &&
          !isPlaytest.value
        )
          enqueueBeat(story.value, state.value)
      } else if (state.value.mode === 'move') {
        if (moveSelected(state.value, point) && !isPlaytest.value)
          enqueueBeat(story.value, state.value)
      }
    }
    function nextTurn() {
      if (story.value.current) return
      endTurn(state.value)
      if (!isPlaytest.value) enqueueBeat(story.value, state.value)
      // Each completed round autosaves, so Continue survives a closed tab.
      saveTo('auto')
    }
    function overwatch() {
      if (story.value.current) return
      if (overwatchSelected(state.value) && !isPlaytest.value)
        enqueueBeat(story.value, state.value)
    }
    function hunker() {
      if (story.value.current) return
      if (hunkerSelected(state.value) && !isPlaytest.value)
        enqueueBeat(story.value, state.value)
    }
    function chooseStory(effect: ChoiceEffect) {
      return applyChoice(story.value, state.value, perspective.value, effect)
    }
    function cellStyle(point: Cell) {
      const same = (p: Cell) => p.x === point.x && p.y === point.y
      return {
        'power-target': powerTargetCells.value.some(same),
        'power-threat': !!powerPreview.value?.cells.some(same),
        selected:
          !!active.value &&
          active.value.x === point.x &&
          active.value.y === point.y,
        reachable:
          state.value.mode === 'move' &&
          !!active.value &&
          availableMove(state.value, point),
        sightline:
          !!state.value.hover &&
          point.x === state.value.hover.x &&
          point.y === state.value.hover.y,
        'has-cover': tileInfoAt(point) === 'cover',
        'has-wall': tileInfoAt(point) === 'wall',
        'burrow-warning': isBurrowWarning(point),
        'seismic-warning': isSeismicWarning(point),
        elevated: heightAt(point) > 0,
      }
    }
    return {
      state,
      STAGE_PRESETS,
      studioOpen,
      studioBrush,
      draft,
      studioProblems,
      isPlaytest,
      loadPreset,
      paintCell,
      startPlaytest,
      exitPlaytest,
      tileInfoAt,
      heightAt,
      isBurrowWarning,
      isSeismicWarning,
      boardCells,
      perspective,
      leadSignature,
      story,
      moment,
      chooseStory,
      scene,
      roster,
      rosterOpen,
      rosterSearch,
      active,
      players,
      enemies,
      hovered,
      mode,
      aimedTarget,
      projectedTargets,
      previewLabel,
      movePossible,
      activePower,
      powerStatus,
      saveSlots,
      saveMessage,
      canContinue,
      readSaves,
      saveTo,
      loadFrom,
      continueLatest,
      powerTargetCells,
      powerPreview,
      reset,
      choosePerspective,
      chooseLead,
      select,
      setMode,
      hover,
      click,
      nextTurn,
      overwatch,
      hunker,
      cellStyle,
    }
  },
)
