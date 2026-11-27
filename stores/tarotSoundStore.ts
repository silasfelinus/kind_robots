// /stores/tarotSoundStore.ts
//
// Kind Tarot's mixer: two shared arcade sound engines (effects and music) so
// each has its own volume. The AudioContext only starts after a gesture.
// Settings themselves live in tarotReaderStore; this store just applies them.
import { defineStore } from 'pinia'
import { createArcadeSound, type ArcadeSound } from '~/utils/arcade/sound'
import { TAROT_AMBIENT, TAROT_SFX, type TarotSfx } from '~/utils/tarot/sound'

export const useTarotSoundStore = defineStore('tarotSound', () => {
  let effects: ArcadeSound | null = null
  let music: ArcadeSound | null = null
  let musicWanted = false

  function engines() {
    if (typeof window === 'undefined') return null
    effects ??= createArcadeSound(false)
    music ??= createArcadeSound(false)
    return { effects, music }
  }

  function apply(settings: {
    sfxOn: boolean
    sfxVolume: number
    musicOn: boolean
    musicVolume: number
  }) {
    const live = engines()
    if (!live) return
    live.effects.setMuted(!settings.sfxOn || settings.sfxVolume <= 0)
    live.effects.setVolume(settings.sfxVolume)
    live.music.setVolume(settings.musicVolume)
    const wantMusic = settings.musicOn && settings.musicVolume > 0
    live.music.setMuted(!wantMusic)
    if (wantMusic && !musicWanted) live.music.startMusic(TAROT_AMBIENT)
    if (!wantMusic && musicWanted) live.music.stopMusic()
    musicWanted = wantMusic
  }

  function unlock() {
    const live = engines()
    live?.effects.unlock()
    live?.music.unlock()
  }

  function play(name: TarotSfx) {
    const live = engines()
    if (!live || live.effects.muted) return
    live.effects.playNotes(TAROT_SFX[name])
  }

  function dispose() {
    effects?.dispose()
    music?.dispose()
    effects = null
    music = null
    musicWanted = false
  }

  return { apply, unlock, play, dispose }
})
