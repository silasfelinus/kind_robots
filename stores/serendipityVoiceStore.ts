// /stores/serendipityVoiceStore.ts
// Serendipity Voice bridge (alexa-integration surface).
// Connects the Kind Robots front end to the local serendipity-voice relay
// (silasfelinus/serendipity-voice). It polls the relay for front-end commands
// spoken through Alexa ("Serendipity, turn butterflies on") and applies them to
// the app — starting with the animation surface via animationStore. It also
// mirrors the shared message feed so both sides of the conversation are visible.
//
// Local-first and read-safe: the relay is an in-memory dev seam on localhost.
// Commands only toggle reversible visual effects; nothing is written or spent.
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  useAnimationStore,
  type AnimationEffectId,
  type FxRegion,
} from '@/stores/animationStore'
import { useThemeStore } from '@/stores/themeStore'

export type VoiceBusRole = 'voice' | 'view' | 'system'

export type VoiceBusMessage = {
  id: number
  role: VoiceBusRole
  text: string
  at: string
}

export type VoiceBusCommand = {
  id: number
  target: string
  action: 'on' | 'off' | 'toggle' | 'clear' | 'set' | 'draft'
  effect?: string
  effectId?: string
  surface?: string
  theme?: string
  prompt?: string
  style?: string
  size?: string
  gallery?: string
  spokenText: string
  source: string
  at: string
}

// An art draft surfaced on the view for review. Voice never generates or
// publishes images — this is display + a manual handoff only.
export type VoiceArtRequest = {
  id: number
  prompt: string
  style?: string
  size?: string
  gallery?: string
  at: string
}

const DEFAULT_RELAY_URL = 'http://localhost:4173'
const RELAY_URL_KEY = 'serendipity-voice-relay'
const POLL_INTERVAL_MS = 1200
const FX_REGIONS: FxRegion[] = ['header', 'sheet', 'page', 'hand']

export const useSerendipityVoiceStore = defineStore(
  'serendipityVoiceStore',
  () => {
    const animationStore = useAnimationStore()
    const themeStore = useThemeStore()

    const relayBaseUrl = ref<string>(DEFAULT_RELAY_URL)
    const connected = ref(false)
    const polling = ref(false)
    const lastError = ref<string | null>(null)
    const lastAppliedText = ref<string | null>(null)

    const messages = ref<VoiceBusMessage[]>([])
    const artRequests = ref<VoiceArtRequest[]>([])
    const commandCursor = ref(0)
    const messageCursor = ref(0)

    const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

    const recentMessages = computed(() => messages.value.slice(-40))

    function isClient(): boolean {
      return typeof window !== 'undefined'
    }

    function loadRelayUrl(): void {
      if (!isClient()) return
      const saved = window.localStorage.getItem(RELAY_URL_KEY)
      if (saved) relayBaseUrl.value = saved
    }

    function setRelayBaseUrl(url: string): void {
      relayBaseUrl.value = url.trim().replace(/\/+$/, '') || DEFAULT_RELAY_URL
      if (isClient())
        window.localStorage.setItem(RELAY_URL_KEY, relayBaseUrl.value)
    }

    function pushLocalMessage(role: VoiceBusRole, text: string): void {
      // Local-only feed entries (for example an applied-effect note) get a
      // negative id so they never collide with server-assigned ids.
      const id = -(messages.value.length + 1)
      messages.value.push({ id, role, text, at: new Date().toISOString() })
    }

    // Map a spoken effect ("butterflies") to a real Kind Robots effect id. Prefer
    // the id the voice runtime guessed; otherwise resolve by id/label substring so
    // an unknown alias still has a chance to land on the right effect.
    function resolveEffectId(
      command: VoiceBusCommand,
    ): AnimationEffectId | null {
      const byId = animationStore.effects.find(
        (effect) => effect.id === command.effectId,
      )
      if (byId) return byId.id

      const slug = (command.effect ?? '').toLowerCase().trim()
      if (!slug) return null

      // "surprise me" — pick a random generation-safe effect.
      if (slug === 'surprise') {
        const pool = animationStore.safeEffects
        const pick = pool[Math.floor(Math.random() * pool.length)]
        return pick ? pick.id : null
      }

      const singular = slug.replace(/s$/, '')
      const match = animationStore.effects.find((effect) => {
        const id = effect.id.toLowerCase()
        const label = effect.label.toLowerCase()
        return (
          id.includes(slug) ||
          label.includes(slug) ||
          id.includes(singular) ||
          label.includes(singular)
        )
      })

      return match ? match.id : null
    }

    function normalizeRegion(surface?: string): FxRegion {
      return FX_REGIONS.includes(surface as FxRegion)
        ? (surface as FxRegion)
        : 'page'
    }

    function applyThemeCommand(command: VoiceBusCommand): void {
      const theme = (command.theme ?? '').trim()
      if (!theme) {
        pushLocalMessage('system', 'Theme command had no theme name.')
        return
      }

      void themeStore.setActiveTheme(theme).then((result) => {
        if (result.success) {
          lastAppliedText.value = `theme → ${theme}`
          pushLocalMessage('system', `Applied: theme set to ${theme}.`)
          void postAck(`Serendipity view: theme is now ${theme}.`)
        } else {
          const message = result.message ?? `Unknown theme "${theme}".`
          lastError.value = message
          pushLocalMessage('system', message)
        }
      })
    }

    function applyArtCommand(command: VoiceBusCommand): void {
      // Draft only: surface the request for review. Never generate or publish.
      const request: VoiceArtRequest = {
        id: command.id,
        prompt: command.prompt ?? command.spokenText,
        at: command.at,
      }
      if (command.style) request.style = command.style
      if (command.size) request.size = command.size
      if (command.gallery) request.gallery = command.gallery

      artRequests.value.push(request)
      lastAppliedText.value = `art draft: ${request.prompt}`
      pushLocalMessage('system', `Art draft received: ${request.prompt}`)
    }

    function applyCommand(command: VoiceBusCommand): void {
      if (command.target === 'theme') {
        applyThemeCommand(command)
        return
      }

      if (command.target === 'art') {
        applyArtCommand(command)
        return
      }

      if (command.target !== 'animation') {
        pushLocalMessage(
          'system',
          `Ignored unsupported command target: ${command.target}`,
        )
        return
      }

      if (command.action === 'clear') {
        animationStore.clearScreenEffects()
        lastAppliedText.value = 'Cleared all animations'
        pushLocalMessage('system', 'Applied: cleared all animations.')
        void postAck('Serendipity view: cleared all animations.')
        return
      }

      const effectId = resolveEffectId(command)
      if (!effectId) {
        const message = `Could not match animation "${command.effect ?? command.effectId ?? 'unknown'}".`
        lastError.value = message
        pushLocalMessage('system', message)
        return
      }

      const active = animationStore.isScreenEffectActive(effectId)
      if (command.action === 'on' && !active)
        animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'off' && active)
        animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'toggle')
        animationStore.toggleScreenEffect(effectId)

      if (command.action !== 'off') {
        animationStore.setSurfacePlacement(
          normalizeRegion(command.surface),
          'front',
        )
      }

      const verb =
        command.action === 'off'
          ? 'off'
          : command.action === 'toggle'
            ? 'toggled'
            : 'on'
      lastAppliedText.value = `${effectId} ${verb}`
      pushLocalMessage('system', `Applied: ${effectId} ${verb}.`)
      void postAck(`Serendipity view: ${effectId} is now ${verb}.`)
    }

    async function pollOnce(): Promise<void> {
      if (!isClient()) return

      try {
        const [commandsRes, messagesRes] = await Promise.all([
          fetch(
            `${relayBaseUrl.value}/api/commands?since=${commandCursor.value}`,
          ),
          fetch(
            `${relayBaseUrl.value}/api/messages?since=${messageCursor.value}`,
          ),
        ])

        if (!commandsRes.ok || !messagesRes.ok) {
          throw new Error(
            `Relay responded ${commandsRes.status}/${messagesRes.status}`,
          )
        }

        const commandsData = (await commandsRes.json()) as {
          commands: VoiceBusCommand[]
          cursor: number
        }
        const messagesData = (await messagesRes.json()) as {
          messages: VoiceBusMessage[]
          cursor: number
        }

        for (const message of messagesData.messages)
          messages.value.push(message)
        messageCursor.value = messagesData.cursor

        for (const command of commandsData.commands) applyCommand(command)
        commandCursor.value = commandsData.cursor

        connected.value = true
        lastError.value = null
      } catch (error) {
        connected.value = false
        lastError.value =
          error instanceof Error ? error.message : 'Relay poll failed'
      }
    }

    function start(): void {
      if (!isClient() || polling.value) return
      loadRelayUrl()
      polling.value = true
      void pollOnce()
      pollTimer.value = setInterval(() => void pollOnce(), POLL_INTERVAL_MS)
    }

    function stop(): void {
      polling.value = false
      connected.value = false
      if (pollTimer.value) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
      }
    }

    // Simulate an Echo utterance from the page: routes through the same relay
    // dispatcher the Alexa endpoint uses, so testing needs no physical device.
    async function sendVoiceText(text: string): Promise<void> {
      if (!isClient() || !text.trim()) return

      try {
        const response = await fetch(`${relayBaseUrl.value}/api/handle`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!response.ok) throw new Error(`Relay responded ${response.status}`)
        lastError.value = null
        await pollOnce()
      } catch (error) {
        lastError.value = error instanceof Error ? error.message : 'Send failed'
      }
    }

    async function postAck(text: string): Promise<void> {
      if (!isClient()) return
      try {
        await fetch(`${relayBaseUrl.value}/api/messages`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'view', text }),
        })
      } catch {
        // Acknowledgements are best-effort; a failed ack must not break the view.
      }
    }

    return {
      relayBaseUrl,
      connected,
      polling,
      lastError,
      lastAppliedText,
      messages,
      recentMessages,
      artRequests,
      setRelayBaseUrl,
      start,
      stop,
      pollOnce,
      sendVoiceText,
      applyCommand,
    }
  },
)
