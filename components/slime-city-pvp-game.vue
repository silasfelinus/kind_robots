<template>
  <main
    class="kr-surface scpvp h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    data-testid="slime-pvp"
  >
    <!--
      Silas, 2026-11-24 PT: "Most of that header for slime city can be deleted
      entirely. Forfeit is a button in settings control. One simple control
      panel. Art first, minimalist interface." No page bar: the site header
      is the only header, and the fight's settings, back and forfeit live in
      one gear at the console.
    -->

    <div class="scpvp-stage">
      <SlimeCityArtwork
        class="scpvp-arena-art"
        :image-id="slimeArtId('boards', 'pitworks-blackout')"
        alt=""
        compact
        aria-hidden="true"
        data-testid="slime-pvp-backdrop"
      />
      <p
        v-if="pvp.error && pvp.duel?.stage !== 'battle'"
        class="scpvp-error"
        role="alert"
      >
        {{ pvp.error }}
      </p>

      <section
        v-if="!pvp.duel || answering || choosingRematch"
        class="scpvp-lobby"
        aria-label="Create or join a duel"
      >
        <div class="scpvp-poster">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', selectedTeam)"
            :alt="nameOf(selectedTeam) + ' crew poster'"
            fallback="⚔"
            compact
          />
          <div class="scpvp-poster-copy">
            <NuxtLink
              to="/play/slime-city?vs=1"
              class="scpvp-lobby-back"
              data-testid="slime-pvp-lobby-back"
              >← VS</NuxtLink
            >
            <small>TWENTY CARDS · FIVE ALLEYS · THREE EVOLUTIONS</small>
            <strong class="scpvp-poster-title">
              {{
                choosingRematch
                  ? 'CHOOSE YOUR REMATCH CREW'
                  : invitedId
                    ? 'ANSWER THE CHALLENGE'
                    : 'FIGHT A REAL RIVAL'
              }}
            </strong>
            <p>
              {{
                choosingRematch
                  ? 'Challenge ' +
                    (pvp.duel?.rivalName ?? 'your rival') +
                    ' again. Keep your crew or try another.'
                  : answering
                    ? (pvp.duel!.challenge ? 'Your friend' : 'Your rival') +
                      ' brings ' +
                      nameOf(pvp.duel!.hostTeam) +
                      '. Pick your crew, then enter the pit.'
                    : invitedId
                      ? 'Pick your crew, then enter the pit.'
                      : 'Choose a crew, create a private duel, and send your opponent the invitation.'
              }}
            </p>
          </div>
        </div>
        <div class="scpvp-lobby-tools">
          <SlimeCityCrewSelect
            class="scpvp-lobby-crew"
            label="Your crew"
            :team-id="selectedTeam"
            @picked="selectedTeam = $event"
          />
          <SlimeCityDuelDeckPicker v-model="duelDeck" :team="selectedTeam" />
          <div class="scpvp-lobby-power">
            <b>{{ factionPower(selectedTeam).name }}</b>
            <p>{{ factionPower(selectedTeam).text }}</p>
          </div>
          <div
            v-if="!invitedId && !choosingRematch"
            class="scpvp-visibility"
            role="group"
            aria-label="Who can join"
          >
            <button
              type="button"
              :aria-pressed="!openDuel"
              data-testid="slime-pvp-private"
              @click="openDuel = false"
            >
              PRIVATE LINK
            </button>
            <button
              type="button"
              :aria-pressed="openDuel"
              data-testid="slime-pvp-open"
              @click="openDuel = true"
            >
              OPEN TO ANYONE
            </button>
          </div>
          <button
            class="scpvp-primary"
            type="button"
            :disabled="pvp.sending || pvp.loading || !duelDeck"
            @click="
              choosingRematch ? sendRematch() : invitedId ? join() : start()
            "
          >
            {{
              pvp.sending
                ? 'OPENING THE GATES…'
                : choosingRematch
                  ? 'SEND REMATCH CHALLENGE'
                  : invitedId
                    ? 'JOIN THIS DUEL'
                    : openDuel
                      ? 'CREATE OPEN DUEL'
                      : 'CREATE PRIVATE DUEL'
            }}
          </button>
          <button
            v-if="choosingRematch"
            type="button"
            class="scpvp-quiet"
            :disabled="pvp.sending"
            data-testid="slime-pvp-rematch-back"
            @click="choosingRematch = false"
          >
            BACK TO RESULT
          </button>
          <button
            v-if="answering && pvp.duel!.challenge"
            type="button"
            class="scpvp-quiet"
            :class="{ armed: cancelArmed }"
            :disabled="pvp.sending"
            data-testid="slime-pvp-decline"
            @click="cancelDuel"
          >
            {{ cancelArmed ? 'SURE? DECLINE' : 'DECLINE CHALLENGE' }}
          </button>
          <p class="scpvp-note">
            {{
              choosingRematch
                ? 'Your rival will get a notification and can choose their own crew.'
                : answering
                  ? pvp.duel!.challenge
                    ? 'This challenge was sent to you.'
                    : pvp.duel!.open
                      ? 'Open challenge: the first player to join takes the seat.'
                      : 'You hold a private invite.'
                  : openDuel
                    ? 'Open duels are listed in VS for any signed-in player.'
                    : 'Only someone with your link can join.'
            }}
            Fair duels pay Meat to both players; quick forfeits pay nothing.
          </p>
        </div>
      </section>

      <section
        v-else-if="pvp.duel.stage === 'waiting'"
        class="scpvp-waiting"
        aria-label="Waiting for rival"
      >
        <div class="scpvp-poster">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', pvp.duel.hostTeam)"
            :alt="nameOf(pvp.duel.hostTeam)"
            compact
          />
          <div class="scpvp-poster-copy">
            <small>YOUR CREW IS IN THE PIT</small>
            <strong class="scpvp-poster-title">{{
              pvp.duel.challenge
                ? 'CHALLENGE SENT'
                : pvp.duel.open
                  ? 'OPEN CHALLENGE'
                  : 'ONE FIGHTER SHORT'
            }}</strong>
            <p>
              {{
                pvp.duel.challenge
                  ? 'Your friend got a notification. This page wakes up when they answer.'
                  : pvp.duel.open
                    ? 'Listed in VS for any signed-in player to join. This page wakes up when someone does.'
                    : 'Share this private invite with another signed-in player. Your duel resumes from this link, even after a refresh.'
              }}
            </p>
          </div>
        </div>
        <div class="scpvp-invite">
          <NuxtLink
            to="/play/slime-city?vs=1"
            class="scpvp-primary"
            data-testid="slime-pvp-waiting-bulletin"
          >
            BACK TO VS
          </NuxtLink>
          <p>Watching for your opponent…</p>
          <details class="scpvp-share" data-testid="slime-pvp-share-menu">
            <summary>SHARE INVITE LINK</summary>
            <label for="scpvp-invite-link">INVITE LINK</label>
            <input id="scpvp-invite-link" readonly :value="inviteLink" />
            <button type="button" class="scpvp-quiet" @click="copyInvite">
              {{ copied ? 'COPIED!' : 'COPY INVITE' }}
            </button>
          </details>
          <button
            type="button"
            class="scpvp-quiet"
            :class="{ armed: cancelArmed }"
            :disabled="pvp.sending"
            data-testid="slime-pvp-cancel"
            @click="cancelDuel"
          >
            {{ cancelArmed ? 'SURE? CANCEL IT' : 'CANCEL THIS DUEL' }}
          </button>
        </div>
      </section>

      <section
        v-else-if="board && pvp.duel && finished && !reviewBoard"
        class="scpvp-result"
        aria-label="Duel result"
        data-testid="slime-pvp-result"
      >
        <div class="scpvp-result-crews">
          <figure
            v-for="side in resultSides"
            :key="side"
            :class="{
              won: pvp.duel.outcome === side,
              lost: pvp.duel.outcome !== side && pvp.duel.outcome !== 'draw',
            }"
          >
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', teamOf(side))"
              :alt="nameOf(teamOf(side))"
              fallback="⚔"
              compact
            />
            <figcaption>
              <small>{{
                side === pvp.duel.seat
                  ? 'YOU'
                  : (pvp.duel.rivalName ?? 'RIVAL').toUpperCase()
              }}</small>
              <strong>{{ nameOf(teamOf(side)) }}</strong>
              <b>♥ {{ Math.max(0, board.boss[side]) }}</b>
            </figcaption>
          </figure>
        </div>
        <div class="scpvp-result-copy">
          <small>FINAL BELL · ROUND {{ board.round }}</small>
          <strong
            class="scpvp-result-title"
            :class="{ 'is-loss': resultKind === 'loss' }"
            >{{ resultHeadline }}</strong
          >
          <p>{{ resultNote }}</p>
          <div class="scpvp-result-actions">
            <button
              v-if="rivalIsFriend || !pvp.friendsLoaded"
              type="button"
              class="scpvp-primary"
              :disabled="pvp.sending || !pvp.canRematch"
              data-testid="slime-pvp-rematch"
              @click="chooseRematch"
            >
              {{ pvp.sending ? 'SENDING…' : 'REMATCH' }}
            </button>
            <button
              v-else
              type="button"
              class="scpvp-primary"
              :disabled="pvp.sending || friendAsked || !pvp.duel.rivalId"
              data-testid="slime-pvp-befriend"
              @click="befriendRival"
            >
              {{
                friendAsked ? 'FRIEND REQUEST SENT' : 'ADD FRIEND TO REMATCH'
              }}
            </button>
            <NuxtLink
              to="/play/slime-city?vs=1"
              class="scpvp-quiet"
              data-testid="slime-pvp-back-vs"
              >BACK TO VS</NuxtLink
            >
            <button
              type="button"
              class="scpvp-quiet"
              data-testid="slime-pvp-final-board"
              @click="reviewBoard = true"
            >
              SEE FINAL BOARD
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="board && pvp.duel && view"
        class="scpvp-battle"
        aria-label="Live CLASH duel"
        data-testid="slime-pvp-battle"
      >
        <div class="scpvp-arena" role="grid" aria-label="Five CLASH alleys">
          <div
            v-for="side in lineup"
            :key="side"
            class="scpvp-row"
            :class="side === pvp.duel.seat ? 'is-mine' : 'is-rival'"
            role="row"
            :aria-label="
              side === pvp.duel.seat ? 'Your fighters' : 'Rival fighters'
            "
          >
            <button
              v-for="lane in lanes"
              :key="side + lane"
              type="button"
              role="gridcell"
              class="scpvp-slot"
              :class="{
                filled: !!unit(side, lane),
                target: targetable(side, lane),
                inspected:
                  !!unit(side, lane) && pinnedUid === unit(side, lane)!.uid,
                lunge: lunge?.side === side && lunge.lane === lane,
                hurt: slotFlash(side, lane) === 'hurt',
                healed: slotFlash(side, lane) === 'healed',
                buffed: slotFlash(side, lane) === 'buffed',
                entered: slotFlash(side, lane) === 'entered',
              }"
              :aria-label="slotLabel(side, lane)"
              :disabled="!targetable(side, lane) && !unit(side, lane)"
              :data-clash-side="side"
              :data-clash-lane="lane"
              :data-testid="'slime-pvp-slot-' + side + '-' + lane"
              @click="clickSlot(side, lane)"
              @pointerenter="hoverSlot($event, side, lane)"
              @pointerleave="hoverUid = null"
            >
              <SlimeCityTrapSlice :trap="trapAt(side, lane)" />
              <template v-if="unit(side, lane)">
                <SlimeCityArtwork
                  :image-id="
                    slimeCardArtId(
                      unit(side, lane)!.cardId,
                      unit(side, lane)!.level,
                      unit(side, lane)!.evoChoice ?? 0,
                    )
                  "
                  :alt="cardById(unit(side, lane)!.cardId).name"
                  :fallback="cardById(unit(side, lane)!.cardId).symbol"
                  compact
                />
                <span class="scpvp-stats">
                  <b
                    class="is-attack"
                    :aria-label="unit(side, lane)!.power + ' attack'"
                    >⚔ {{ unit(side, lane)!.power }}</b
                  >
                  <span class="scpvp-defense">
                    <b
                      class="is-life"
                      :class="{
                        low:
                          unit(side, lane)!.hp * 3 <= unit(side, lane)!.maxHp,
                      }"
                      :aria-label="unit(side, lane)!.hp + ' life'"
                      >♥ {{ unit(side, lane)!.hp }}</b
                    >
                    <SlimeCityArmorStat
                      :armor="unit(side, lane)!.armor"
                      :guard="unit(side, lane)!.guard"
                    />
                  </span>
                </span>
                <span class="scpvp-tags">
                  <SlimeCityAbilityIcon
                    v-for="keyword in unit(side, lane)!.keywords"
                    :key="keyword"
                    :term="keyword"
                    class="scpvp-tag"
                  />
                  <span
                    v-for="tag in fighterTags(unit(side, lane)!).filter(
                      (tag) => tag.kind !== 'new' && tag.kind !== 'guard',
                    )"
                    :key="tag.text"
                    class="scpvp-tag"
                    :class="'is-' + tag.kind"
                    :title="tag.title"
                    >{{ tag.text }}</span
                  >
                </span>
                <span
                  class="scpvp-unit-label"
                  :class="{
                    'has-armor':
                      unit(side, lane)!.armor + (unit(side, lane)!.guard ?? 0) >
                      0,
                  }"
                >
                  {{ cardById(unit(side, lane)!.cardId).name }}
                  <i :class="'lv-' + unit(side, lane)!.level">{{
                    '★'.repeat(unit(side, lane)!.level)
                  }}</i>
                </span>
                <SlimeCityLevelFrame :level="unit(side, lane)!.level" />
                <SlimeCitySummoningSickness
                  v-if="!board.victor && clashSummoningSick(unit(side, lane)!)"
                />
              </template>
              <span v-else class="scpvp-empty">{{
                targetable(side, lane)
                  ? side === pvp.duel.seat
                    ? 'PLAY HERE'
                    : 'TARGET'
                  : lane + 1
              }}</span>

              <span
                v-for="pop in floatsAt(side, lane)"
                :key="pop.key"
                class="scpvp-float"
                :class="'is-' + pop.kind"
                >{{ pop.text }}</span
              >
            </button>
          </div>
          <div class="scpvp-midline">
            <div
              v-if="!finished"
              class="scpvp-pips"
              :class="{ rival: board.active !== pvp.duel.seat }"
              role="status"
              :aria-label="pipsLabel"
              data-testid="slime-pvp-plays"
            >
              <i
                v-for="n in playLimit"
                :key="n"
                class="scpvp-pip"
                :class="{ used: n <= playsUsed }"
                aria-hidden="true"
              />
              <i
                v-if="freeReady"
                class="scpvp-pip is-free"
                aria-hidden="true"
                title="A free play is ready"
              />
              <small>{{
                board.active === pvp.duel.seat ? playsLeft + ' LEFT' : 'RIVAL'
              }}</small>
            </div>
            <p
              class="scpvp-ticker"
              :class="{ warn: tickerWarn }"
              :role="tickerWarn ? 'alert' : undefined"
              aria-live="polite"
              data-testid="slime-pvp-ticker"
              @click="dismissNotes"
            >
              {{ ticker }}
            </p>
          </div>
          <SlimeCityClashHand
            :game="view"
            :side="pvp.duel.seat"
            :held="heldIndex"
            :choice-pick="choice"
            :inspect="inspect"
            open-off-turn
            dock-held
            focus-toggle
            @pick="onPick"
            @drop="onDrop"
          />
        </div>

        <aside class="scpvp-rail" aria-label="Bosses">
          <div
            v-for="(side, index) in lineup"
            :key="side"
            class="scpvp-boss"
            :class="[
              side === pvp.duel.seat ? 'is-mine' : 'is-rival',
              {
                active: board.active === side && !finished,
                hurt: bossFlash[side] === 'hurt',
                healed: bossFlash[side] === 'healed',
              },
            ]"
            :style="{ order: index === 0 ? 0 : 2 }"
            :data-testid="
              'slime-pvp-boss-' + (side === pvp.duel.seat ? 'mine' : 'rival')
            "
          >
            <button
              type="button"
              class="scpvp-boss-portrait"
              :aria-label="
                'Inspect ' + nameOf(teamOf(side)) + ' faction powers'
              "
              aria-haspopup="dialog"
              :data-testid="'slime-pvp-power-portrait-' + side"
              @click="powerSide = side"
            >
              <SlimeCityArtwork
                :image-id="slimeArtId('crews', teamOf(side))"
                :alt="nameOf(teamOf(side))"
                compact
              />
            </button>
            <div class="scpvp-boss-info">
              <small>{{
                side === pvp.duel.seat
                  ? 'YOUR BOSS'
                  : (pvp.duel.rivalName ?? 'RIVAL').toUpperCase()
              }}</small>
              <strong>{{ nameOf(teamOf(side)) }}</strong>
              <span class="scpvp-life" aria-hidden="true"
                ><i :style="{ width: lifeWidth(side) }"
              /></span>
              <b
                >♥ {{ Math.max(0, board.boss[side])
                }}<small> / {{ bossCap(side) }}</small></b
              >
            </div>
            <span
              v-for="pop in floatsAt(side, 'boss')"
              :key="pop.key"
              class="scpvp-float"
              :class="'is-' + pop.kind"
              >{{ pop.text }}</span
            >
          </div>
          <div class="scpvp-turn" aria-live="polite" :style="{ order: 1 }">
            <span class="scpvp-turn-copy">
              <b>{{ turnLabel }}</b>
              <small>ROUND {{ board.round }} / {{ CLASH_ROUND_LIMIT }}</small>
            </span>
            <button
              v-if="finished"
              type="button"
              class="scpvp-result-link"
              @click="reviewBoard = false"
            >
              RESULT ›
            </button>
          </div>
        </aside>

        <SlimeCityFactionPowerPopup
          v-if="powerSide !== null"
          :game="view"
          :side="powerSide"
          :own="powerSide === seat"
          :ready="powerReady"
          @close="powerSide = null"
          @activate="activatePortraitPower"
        />

        <footer class="scpvp-console">
          <div id="clash-hand-dock" class="scpvp-hand-dock"></div>
          <button
            v-if="pvp.isMyTurn && !finished && takeback"
            type="button"
            class="scpvp-takeback"
            :class="{ blocked: !!takeback.blocked }"
            :disabled="!canAct"
            :title="takebackTitle"
            :aria-label="takebackTitle"
            data-testid="slime-pvp-takeback"
            @click="takeBack"
          >
            ↶ <span>BACK</span>
          </button>
          <div
            v-if="choiceStages && selectedCard"
            class="scpvp-choice"
            role="radiogroup"
            aria-label="Choose this card's level three"
          >
            <button
              v-for="(stage, index) in choiceStages"
              :key="stage.title"
              type="button"
              role="radio"
              :aria-checked="choice === index"
              :data-testid="'slime-pvp-evolution-' + index"
              @click="choice = index === 1 ? 1 : 0"
            >
              <b>{{ index === 0 ? 'A' : 'B' }} · {{ stage.title }}</b>
              <small>{{
                clashCardText(cardById(selectedCard), 3, index === 1 ? 1 : 0)
              }}</small>
            </button>
          </div>
          <button
            v-if="pinnedTap"
            type="button"
            class="scpvp-tap"
            :disabled="!canAct || !pinnedTap.ready"
            :title="pinnedTap.title"
            :data-testid="'slime-pvp-tap-' + pinnedTap.uid"
            @click="tapFighter(pinnedTap.uid)"
          >
            ↷ TAP
          </button>
          <button
            type="button"
            class="scpvp-log-toggle"
            :aria-expanded="showLog"
            @click="showLog = !showLog"
          >
            LOG
          </button>
          <SlimeCityQuickSettings up class="scpvp-settings">
            <NuxtLink
              to="/play/slime-city?vs=1"
              class="scpvp-panel-action"
              data-testid="slime-pvp-back"
              >← BACK TO VS</NuxtLink
            >
            <button
              v-if="!finished"
              type="button"
              class="scpvp-panel-action is-forfeit"
              :class="{ armed: forfeitArmed }"
              :disabled="pvp.sending"
              data-testid="slime-pvp-forfeit"
              @click="confirmForfeit"
            >
              {{ forfeitArmed ? 'TAP AGAIN TO FORFEIT' : '⚑ FORFEIT' }}
            </button>
          </SlimeCityQuickSettings>
          <button
            type="button"
            class="scpvp-fight"
            :class="{ ready: canAct && playsLeft === 0 }"
            :disabled="!canAct && !sweeping"
            data-testid="slime-pvp-fight"
            @click="fight"
          >
            {{ fightLabel }} <span aria-hidden="true">›</span>
          </button>
        </footer>

        <div
          v-if="showLog"
          class="scpvp-log kr-scroll"
          role="log"
          aria-label="Battle log"
        >
          <p v-for="(entry, i) in board.log.slice(-20)" :key="i">
            <small>R{{ entry.round }}</small> {{ entry.text }}
          </p>
        </div>
      </section>
      <section v-else class="scpvp-waiting" role="status">
        <div class="scpvp-lobby-tools">
          <strong>{{ pvp.error || 'Waiting for the battlefield…' }}</strong>
          <button
            type="button"
            class="scpvp-primary"
            :disabled="pvp.loading || pvp.sending"
            @click="pvp.load(pvp.duel.id)"
          >
            {{ pvp.loading ? 'LOADING…' : 'RETRY' }}
          </button>
          <NuxtLink to="/play/slime-city?vs=1">← BACK TO VS</NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'
import { useSlimeCitySoundStore } from '~/stores/slimeCitySound'
import {
  clashIsTense,
  clashSoundCues,
  pvpSoundView,
} from '~/utils/slimeCity/sound'
import {
  cardById,
  TEAMS,
  type Side,
  type TeamId,
} from '~/utils/slimeCity/prototypes'
import {
  clashEvolutionChoice,
  clashEvolutionStage,
} from '~/utils/slimeCity/clashEvolutions'
import {
  CLASH_LANES,
  CLASH_ROUND_LIMIT,
  canClashActivate,
  clashBossCap,
  canClashPlay,
  canClashPower,
  clashCardText,
  clashEffectivePlayCost,
  clashPlayLimit,
  clashSummoningSick,
  type ClashStrike,
} from '~/utils/slimeCity/clash'
import { evoTapText } from '~/utils/slimeCity/evolutions/dsl'
import {
  pvpCardRow,
  pvpClashView,
  visibleClashTrapAt,
  type PvpBoard,
} from '~/utils/slimeCity/pvp'
import type { ClashRewardSetup } from '~/utils/slimeCity/clashRewards'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { CLASH_SPEED_PACE } from '~/stores/helpers/slimeCityClashPreference'
import { factionPower } from '~/utils/slimeCity/factionPowers'
import { slimeArtId, slimeCardArtId } from '~/utils/slimeCity/artManifest'

const route = useRoute()
const pvp = useSlimeCityPvpStore()
const forfeitArmed = ref(false)
async function confirmForfeit() {
  if (!forfeitArmed.value) {
    forfeitArmed.value = true
    return
  }
  forfeitArmed.value = false
  await pvp.forfeit()
}
const invitedId = computed(() =>
  typeof route.query.duel === 'string' ? route.query.duel : '',
)
const selectedTeam = ref<TeamId>('catgirls')
const choosingRematch = ref(false)
/** A friend's challenge waiting for this player to pick a crew and join. */
const answering = computed(
  () => pvp.duel?.stage === 'waiting' && pvp.duel.seat === 'enemy',
)
const copied = ref(false)
const showLog = ref(false)
const board = computed(() => pvp.duel?.board ?? null)
const lineup = computed<Side[]>(() =>
  pvp.duel?.seat === 'enemy' ? ['player', 'enemy'] : ['enemy', 'player'],
)
const inviteLink = computed(() => {
  if (!pvp.duel) return ''
  const path = '/play/slime-city-pvp?duel=' + encodeURIComponent(pvp.duel.id)
  return import.meta.client ? location.origin + path : path
})

/** Silas, 2026-11-11 PT: "finalize multiplayer": the duel ends on a result. */
const finished = computed(() => pvp.duel?.stage === 'finished')
const reviewBoard = ref(false)
const friendAsked = ref(false)
const resultSides = computed<Side[]>(() =>
  pvp.duel?.seat === 'enemy' ? ['enemy', 'player'] : ['player', 'enemy'],
)
const resultKind = computed(() => {
  const victor = pvp.duel?.outcome
  if (!victor || victor === 'draw') return 'draw'
  return victor === pvp.duel?.seat ? 'win' : 'loss'
})
const resultHeadline = computed(() =>
  resultKind.value === 'draw'
    ? 'DRAW'
    : resultKind.value === 'win'
      ? 'YOU WIN!'
      : (pvp.duel?.rivalName?.toUpperCase() ?? 'RIVAL') + ' WINS',
)
const resultNote = computed(() => {
  const forfeit = pvp.duel?.forfeitedBy
  const how = forfeit
    ? forfeit === pvp.duel?.seat
      ? 'You forfeited.'
      : 'Your rival forfeited.'
    : 'Boss life at the final bell.'
  const meat = pvp.duel?.meatReward ?? 0
  return how + (meat ? ' Your cut: +' + meat + ' Meat.' : ' No Meat earned.')
})
const rivalIsFriend = computed(() =>
  pvp.friends.some((friend) => friend.id === pvp.duel?.rivalId),
)
watch(
  finished,
  (done) => {
    if (done && !pvp.friendsLoaded) void pvp.loadFriends()
  },
  { immediate: true },
)
function chooseRematch() {
  const duel = pvp.duel
  if (!duel || !pvp.canRematch || pvp.sending) return
  selectedTeam.value = teamOf(duel.seat)
  choosingRematch.value = true
}

async function sendRematch() {
  if (!choosingRematch.value || pvp.sending || !duelDeck.value) return
  const data = await pvp.rematch(selectedTeam.value, duelDeck.value)
  if (!data) return
  choosingRematch.value = false
  reviewBoard.value = false
  await navigateTo('/play/slime-city?vs=1')
}
async function befriendRival() {
  const id = pvp.duel?.rivalId
  if (id && (await pvp.addFriend(id))) friendAsked.value = true
}

function nameOf(team: TeamId) {
  return TEAMS.find((entry) => entry.id === team)?.name ?? team
}
function teamOf(side: Side): TeamId {
  return (
    (side === 'player' ? pvp.duel?.hostTeam : pvp.duel?.guestTeam) ?? 'catgirls'
  )
}
/**
 * Silas, 2026-11-22 PT, on a tablet: "where are the full screen ish lanes?
 * Where is the map background? Why is hand taking its space instead of
 * optionally toggling open or floating or hidden ... we should click any card
 * in hand or play to see it full size, and evolutions. We lost the ability to
 * drag cards to locations." The duel now shares the CPU Clash's floating hand
 * (drag, level tabs, full-size cards) over a full-height five-by-two board,
 * driven by an engine-shaped view of the server's redacted board.
 */
const lanes = Array.from({ length: CLASH_LANES }, (_, lane) => lane)
const view = computed(() =>
  board.value && pvp.duel
    ? pvpClashView(
        board.value,
        pvp.duel.seat,
        pvp.duel.hostTeam,
        pvp.duel.guestTeam ?? pvp.duel.hostTeam,
      )
    : null,
)
const seat = computed<Side>(() => pvp.duel?.seat ?? 'player')
const rivalSeat = computed<Side>(() =>
  seat.value === 'player' ? 'enemy' : 'player',
)
const heldIndex = ref<number | null>(null)
const pinnedUid = ref<number | null>(null)
const hoverUid = ref<number | null>(null)
const powerArmed = ref<TeamId | null>(null)
const powerSide = ref<Side | null>(null)
const choice = ref<0 | 1>(0)
const sweeping = ref(false)
const lunge = ref<{ side: Side; lane: number } | null>(null)
const selectedCard = computed(() =>
  heldIndex.value === null
    ? null
    : (board.value?.hand[heldIndex.value] ?? null),
)
const choiceStages = computed(() =>
  selectedCard.value && board.value
    ? clashEvolutionChoice(
        selectedCard.value,
        board.value.levels[selectedCard.value] ?? 1,
      )
    : undefined,
)
watch(selectedCard, () => (choice.value = 0))
/** Your own card-play phase, with no move in flight. */
const canAct = computed(
  () =>
    !!pvp.isMyTurn &&
    !!board.value &&
    !board.value.victor &&
    !pvp.sending &&
    !sweeping.value,
)
const canPlay = computed(() => canAct.value && board.value?.phase === 'play')
const playLimit = computed(
  () =>
    board.value?.playLimit ??
    (view.value && view.value.active === seat.value
      ? clashPlayLimit(view.value, view.value.active)
      : board.value?.round === 1 && board.value.active === 'player'
        ? 1
        : 2),
)
const playsUsed = computed(() =>
  Math.min(playLimit.value, board.value?.plays[board.value.active] ?? 0),
)
const playsLeft = computed(() =>
  board.value?.phase === 'play' ? playLimit.value - playsUsed.value : 0,
)
const freeReady = computed(
  () =>
    !!view.value &&
    view.value.phase === 'play' &&
    view.value.hands[view.value.active].some(
      (id) =>
        !!id &&
        clashEffectivePlayCost(
          view.value!,
          view.value!.active,
          cardById(id),
        ) === 0,
    ),
)
const pipsLabel = computed(
  () =>
    (board.value?.active === seat.value ? 'You have ' : 'Your rival has ') +
    playsLeft.value +
    ' of ' +
    playLimit.value +
    ' card plays left',
)
const turnLabel = computed(() =>
  finished.value
    ? resultHeadline.value
    : !pvp.isMyTurn
      ? 'RIVAL’S TURN'
      : board.value?.phase === 'play'
        ? 'YOUR TURN'
        : 'YOUR CREW STRIKES',
)
const fightLabel = computed(() =>
  sweeping.value
    ? 'STRIKING…'
    : !pvp.isMyTurn
      ? 'RIVAL’S TURN'
      : board.value?.phase === 'play'
        ? 'FIGHT'
        : 'FINISH ATTACKS',
)
function bossCap(side: Side): number {
  return view.value ? clashBossCap(view.value, side) : 40
}
function lifeWidth(side: Side): string {
  const life = Math.max(0, board.value?.boss[side] ?? 0)
  return Math.min(100, (life / bossCap(side)) * 100) + '%'
}
function unit(side: Side, lane: number) {
  return board.value?.units.find(
    (item) => item.side === side && item.lane === lane,
  )
}
function trapAt(side: Side, lane: number) {
  return visibleClashTrapAt(board.value?.traps ?? [], seat.value, side, lane)
}
type BoardUnit = NonNullable<ReturnType<typeof unit>>
function tapStage(fighter: BoardUnit) {
  const stage = clashEvolutionStage(
    fighter.cardId,
    fighter.level,
    fighter.evoChoice ?? 0,
  )
  return stage?.abilities.some((ability) => ability.when === 'tap')
    ? stage
    : undefined
}
/** Silas: "we should see if the card can have a skill to use, or doesn't attack on turn one". */
function fighterTags(
  fighter: BoardUnit,
): { kind: string; text: string; title: string }[] {
  const tags: { kind: string; text: string; title: string }[] = []
  if (fighter.rooted)
    tags.push({
      kind: 'stun',
      text: 'STUN',
      title: 'Stunned: skips its strike',
    })
  if (!board.value?.victor && clashSummoningSick(fighter))
    tags.push({
      kind: 'new',
      text: '⏳ NEW',
      title: 'Does not attack on its first turn, but still blocks',
    })
  const stage = tapStage(fighter)
  if (stage && !fighter.token)
    tags.push({
      kind: 'tap',
      text:
        fighter.attacked || fighter.activatedRound === board.value?.round
          ? '↷ USED'
          : '↷ TAP',
      title: evoTapText(stage),
    })
  if (fighter.guard)
    tags.push({
      kind: 'guard',
      text: 'WALL +' + fighter.guard,
      title: 'Shielded for the next hit',
    })
  return tags
}
const inspect = computed(() => {
  const units = board.value?.units ?? []
  const pinned = units.find((u) => u.uid === pinnedUid.value)
  const hovered =
    pinned || heldIndex.value !== null
      ? undefined
      : units.find((u) => u.uid === hoverUid.value)
  const fighter = pinned ?? hovered
  if (!fighter) return null
  return {
    id: fighter.cardId,
    level: fighter.level,
    pick: fighter.evoChoice === 1 ? (1 as const) : (0 as const),
    liveStats: {
      attack: fighter.power,
      hp: fighter.hp,
      maxHp: fighter.maxHp,
    },
    hover: !pinned,
    dock: fighter.lane <= 2 ? ('right' as const) : ('left' as const),
  }
})
watch(
  () => board.value?.units.map((u) => u.uid).join(),
  () => {
    const units = board.value?.units ?? []
    if (!units.some((u) => u.uid === pinnedUid.value)) pinnedUid.value = null
  },
)
watch(
  () => board.value?.hand.join(),
  () => {
    if (heldIndex.value !== null && !board.value?.hand[heldIndex.value])
      heldIndex.value = null
  },
)
const pinnedTap = computed(() => {
  const fighter = board.value?.units.find(
    (u) => u.uid === pinnedUid.value && u.side === seat.value,
  )
  const stage = fighter && tapStage(fighter)
  if (!fighter || !stage || !view.value) return null
  return {
    uid: fighter.uid,
    title: evoTapText(stage),
    ready: canClashActivate(view.value, seat.value, fighter.uid),
  }
})
function powerReady(team: TeamId): boolean {
  if (!canPlay.value || !view.value) return false
  return lanes.some((lane) =>
    canClashPower(view.value!, seat.value, lane, team),
  )
}
async function activatePortraitPower(team: TeamId) {
  if (!powerReady(team)) return
  powerSide.value = null
  await firePower(team)
}
async function firePower(team: TeamId) {
  if (!powerReady(team)) return
  heldIndex.value = null
  if (factionPower(team).target === 'none') {
    powerArmed.value = null
    await pvp.send({ t: 'power', lane: 0, team })
    return
  }
  powerArmed.value = powerArmed.value === team ? null : team
}
function rowFor(id: string): Side {
  return pvpCardRow(cardById(id)) === 'own' ? seat.value : rivalSeat.value
}
function targetable(side: Side, lane: number): boolean {
  if (!canPlay.value || !view.value) return false
  const armed = powerArmed.value
  if (armed)
    return (
      side ===
        (factionPower(armed).target === 'own' ? seat.value : rivalSeat.value) &&
      canClashPower(view.value, seat.value, lane, armed)
    )
  const id = selectedCard.value
  if (!id) return false
  return rowFor(id) === side && canClashPlay(view.value, seat.value, id, lane)
}
function hoverSlot(event: PointerEvent, side: Side, lane: number) {
  if (event.pointerType === 'mouse')
    hoverUid.value = unit(side, lane)?.uid ?? null
}
function onPick(index: number | null) {
  powerArmed.value = null
  pinnedUid.value = null
  heldIndex.value = index
}
function onDrop(index: number, side: Side, lane: number) {
  heldIndex.value = index
  if (targetable(side, lane)) void clickSlot(side, lane)
  else if (canPlay.value) refuse(whyNot(side, lane))
}
/**
 * Silas, 2026-11-22 PT: "Our error messages during play which involve not
 * playing in certain lanes pop up and then disappear too quickly." A refusal
 * now holds for six seconds (tap it to dismiss) instead of being wiped by the
 * very selection change that produced it.
 */
const rejectNote = ref('')
let rejectTimer: ReturnType<typeof setTimeout> | null = null
function refuse(message: string) {
  if (!message) return
  rejectNote.value = message
  if (rejectTimer) clearTimeout(rejectTimer)
  rejectTimer = setTimeout(() => (rejectNote.value = ''), 6000)
}
function dismissNotes() {
  if (rejectTimer) clearTimeout(rejectTimer)
  rejectNote.value = ''
  pvp.clearError()
}
watch(
  () => pvp.duel?.revision,
  () => {
    if (rejectNote.value && !pvp.error) dismissNotes()
  },
)
function whyNot(side: Side, lane: number): string {
  const id = selectedCard.value
  if (!id || !view.value) return ''
  const card = cardById(id)
  const cost = clashEffectivePlayCost(view.value, seat.value, card)
  if (cost > playsLeft.value)
    return (
      card.name +
      ' needs ' +
      cost +
      ' plays. You have ' +
      playsLeft.value +
      ' left this turn.'
    )
  if (rowFor(id) !== side)
    return (
      card.name +
      (rowFor(id) === seat.value
        ? ' goes in one of your own alleys.'
        : card.kind === 'trap'
          ? ' goes in a rival alley.'
          : ' targets a rival fighter.')
    )
  if (!canClashPlay(view.value, seat.value, id, lane))
    return card.name + ' cannot go in alley ' + (lane + 1) + '.'
  return ''
}
async function clickSlot(side: Side, lane: number) {
  if (powerArmed.value) {
    if (targetable(side, lane)) {
      const team = powerArmed.value
      powerArmed.value = null
      await pvp.send({ t: 'power', lane, team })
    }
    return
  }
  const id = selectedCard.value
  if (id && targetable(side, lane)) {
    const pick = choice.value
    heldIndex.value = null
    pinnedUid.value = null
    await pvp.send({
      t: 'play',
      card: id,
      lane,
      ...(pick === 1 ? { choice: 1 as const } : {}),
    })
    return
  }
  if (id && canPlay.value) {
    const reason = whyNot(side, lane)
    if (reason) {
      refuse(reason)
      return
    }
  }
  const fighter = unit(side, lane)
  heldIndex.value = null
  pinnedUid.value =
    fighter && pinnedUid.value !== fighter.uid ? fighter.uid : null
}
/**
 * Silas, 2026-11-22 PT: "There should be a back button if it's your turn."
 * Silas, 2026-11-24 PT: "We shouldn't be limiting undos." Any play can be
 * taken back until FIGHT; only a move that revealed something stands.
 */
const takeback = computed(() => pvp.duel?.takeback ?? null)
const takebackTitle = computed(
  () => takeback.value?.blocked ?? 'Take back your last play',
)
async function takeBack() {
  const state = takeback.value
  if (!canAct.value || !state) return
  if (state.blocked) {
    refuse(state.blocked)
    return
  }
  heldIndex.value = null
  pinnedUid.value = null
  powerArmed.value = null
  await pvp.send({ t: 'undo' })
}
async function tapFighter(uid: number) {
  if (await pvp.send({ t: 'activate', uid })) pinnedUid.value = null
}
const ticker = computed(() => {
  if (!board.value || !pvp.duel) return ''
  if (finished.value) return resultNote.value
  if (pvp.error) return pvp.error
  if (rejectNote.value) return rejectNote.value
  if (!pvp.isMyTurn)
    return board.value.hand.length
      ? 'Rival’s turn. Your next hand is ready: switch to CARDS to read it.'
      : 'Rival’s turn.'
  if (sweeping.value || board.value.phase === 'attack')
    return 'Each fighter strikes across its alley; an open alley hits the boss.'
  if (powerArmed.value) return 'Tap a glowing alley to aim your faction power.'
  const id = selectedCard.value
  if (id) {
    const card = cardById(id)
    const cost = clashEffectivePlayCost(view.value!, seat.value, card)
    if (cost > playsLeft.value)
      return (
        card.name +
        ' needs ' +
        cost +
        ' plays. You have ' +
        playsLeft.value +
        ' left this turn.'
      )
    return lanes.some((lane) => targetable(rowFor(id), lane))
      ? 'Drag ' + card.name + ' onto a glowing alley, or tap one.'
      : card.name + ' has no legal target right now.'
  }
  if (playsLeft.value <= 0)
    return 'No plays left. Tap FIGHT to send your crew in.'
  return (
    playsLeft.value +
    (playsLeft.value === 1 ? ' play' : ' plays') +
    ' left. Drag a card onto an alley, tap a card to read it, or FIGHT.'
  )
})
const tickerWarn = computed(
  () =>
    !!pvp.error ||
    !!rejectNote.value ||
    (!!selectedCard.value &&
      !!view.value &&
      clashEffectivePlayCost(
        view.value,
        seat.value,
        cardById(selectedCard.value),
      ) > playsLeft.value),
)
function slotLabel(side: Side, lane: number): string {
  const fighter = unit(side, lane)
  return (
    (side === seat.value ? 'Your' : 'Rival') +
    ' alley ' +
    (lane + 1) +
    (fighter
      ? ', ' +
        cardById(fighter.cardId).name +
        ' level ' +
        fighter.level +
        ', ' +
        fighter.hp +
        ' life' +
        fighterTags(fighter)
          .map((tag) => ', ' + tag.title)
          .join('')
      : ', empty') +
    (trapAt(side, lane)
      ? ', your armed trap: ' + cardById(trapAt(side, lane)!.cardId).name
      : '') +
    (targetable(side, lane) ? ', playable target' : '')
  )
}
/**
 * Silas, 2026-11-22 PT: "Animations aren't happening, such as healing should
 * show the bonus happening. Are cards striking one at a time?" Every board
 * the server sends is compared with the one before: heals rise green, damage
 * drops red, buffs glow gold, new fighters drop in, boss life moves on its
 * panel. A rival's strikes arrive as a list and replay alley by alley.
 */
type FloatKind = 'hurt' | 'healed' | 'buffed' | 'block' | 'trap'
interface BoardFloat {
  key: number
  side: Side
  at: number | 'boss'
  text: string
  kind: FloatKind
}
const floats = ref<BoardFloat[]>([])
const flashes = ref<Record<string, string>>({})
const bossFlash = ref<Record<Side, string>>({ player: '', enemy: '' })
const animationTimers = new Set<ReturnType<typeof setTimeout>>()
let floatKey = 0
const lab = useSlimeCityStore()
const duelDeck = ref<ClashRewardSetup | null>(null)
const pace = computed(() => {
  const chosen = CLASH_SPEED_PACE[lab.clashSpeed] ?? 1
  return lab.reducedMotion ? Math.min(chosen, CLASH_SPEED_PACE.quick) : chosen
})
function later(ms: number, run: () => void) {
  const timer = setTimeout(() => {
    animationTimers.delete(timer)
    run()
  }, ms)
  animationTimers.add(timer)
}
function float(side: Side, at: number | 'boss', text: string, kind: FloatKind) {
  const key = ++floatKey
  floats.value = [...floats.value, { key, side, at, text, kind }]
  later(1300, () => {
    floats.value = floats.value.filter((item) => item.key !== key)
  })
  if (at === 'boss') {
    bossFlash.value = {
      ...bossFlash.value,
      [side]: kind === 'healed' ? 'healed' : 'hurt',
    }
    later(700, () => {
      bossFlash.value = { ...bossFlash.value, [side]: '' }
    })
  } else flash(side, at, kind === 'block' || kind === 'trap' ? 'hurt' : kind)
}
function flash(side: Side, lane: number, kind: string) {
  const id = side + lane
  flashes.value = { ...flashes.value, [id]: kind }
  later(700, () => {
    if (flashes.value[id] !== kind) return
    flashes.value = Object.fromEntries(
      Object.entries(flashes.value).filter(([key]) => key !== id),
    )
  })
}
function floatsAt(side: Side, at: number | 'boss') {
  return floats.value.filter((item) => item.side === side && item.at === at)
}
function slotFlash(side: Side, lane: number) {
  return flashes.value[side + lane] ?? ''
}
function showStrike(strike: ClashStrike) {
  const foe: Side = strike.side === 'player' ? 'enemy' : 'player'
  if (strike.trap)
    float(strike.side, strike.lane, 'TRAP -' + strike.returned, 'trap')
  else if (strike.returned > 0)
    float(strike.side, strike.lane, '-' + strike.returned, 'hurt')
  if (strike.target === 'boss') {
    if (strike.dealt > 0) float(foe, 'boss', '-' + strike.dealt, 'hurt')
  } else if (strike.dealt > 0)
    float(foe, strike.lane, '-' + strike.dealt, 'hurt')
  else float(foe, strike.lane, 'BLOCK', 'block')
}
/** Heals, buffs, new fighters and life changes no strike explains. */
function showChanges(before: PvpBoard, after: PvpBoard, struck: boolean) {
  const previous = new Map(before.units.map((u) => [u.uid, u]))
  for (const unit of after.units) {
    const was = previous.get(unit.uid)
    if (!was) {
      flash(unit.side, unit.lane, 'entered')
      continue
    }
    if (unit.hp > was.hp)
      float(unit.side, unit.lane, '+' + (unit.hp - was.hp) + ' ♥', 'healed')
    else if (unit.hp < was.hp && !struck)
      float(unit.side, unit.lane, '-' + (was.hp - unit.hp), 'hurt')
    if (unit.power > was.power)
      float(
        unit.side,
        unit.lane,
        '+' + (unit.power - was.power) + ' ⚔',
        'buffed',
      )
    if (unit.armor > was.armor)
      float(
        unit.side,
        unit.lane,
        '+' + (unit.armor - was.armor) + ' ARMOR',
        'buffed',
      )
  }
  for (const side of ['player', 'enemy'] as Side[]) {
    const change = after.boss[side] - before.boss[side]
    if (change > 0) float(side, 'boss', '+' + change + ' ♥', 'healed')
    else if (change < 0 && !struck) float(side, 'boss', String(change), 'hurt')
  }
}
let strikesSeen = -1
let replaying = Promise.resolve()
watch(
  () => [pvp.duel?.id, board.value] as const,
  ([id, next], [previousId, prev]) => {
    if (!next) return
    const trail = pvp.duel?.strikes ?? []
    if (id !== previousId || !prev || strikesSeen < 0) {
      strikesSeen = Math.max(0, ...trail.map((item) => item.at))
      return
    }
    const fresh = trail.filter((item) => item.at > strikesSeen)
    strikesSeen = Math.max(strikesSeen, ...trail.map((item) => item.at))
    const struck = fresh.length > 0
    if (sweeping.value || !struck) {
      for (const item of fresh) showStrike(item.strike)
      showChanges(prev, next, struck)
      return
    }
    // A whole sweep arrived at once: replay it alley by alley.
    const before = prev
    replaying = replaying.then(async () => {
      for (const item of fresh) {
        lunge.value = { side: item.strike.side, lane: item.strike.lane }
        await wait(300 * pace.value)
        showStrike(item.strike)
        await wait(520 * pace.value)
      }
      lunge.value = null
      if (board.value) showChanges(before, board.value, true)
    })
  },
)
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms))
/**
 * Silas, 2026-11-22 PT: "Do we have to double click the strike button? It's
 * unresponsive." One FIGHT now plays the whole turn: send the crew in, strike
 * alley by alley with the same wind-up as the CPU board, then end the turn.
 */
async function fight() {
  if (!canAct.value || !board.value) return
  heldIndex.value = null
  powerArmed.value = null
  pinnedUid.value = null
  sweeping.value = true
  try {
    if (board.value.phase === 'play' && !(await pvp.send({ t: 'pass' }))) return
    for (let beat = 0; beat < 12; beat++) {
      const now = board.value
      if (
        !now ||
        now.victor ||
        now.phase !== 'attack' ||
        now.active !== seat.value
      )
        break
      if (now.nextStrike < 0) {
        await pvp.send({ t: 'end' })
        break
      }
      lunge.value = { side: seat.value, lane: now.nextStrike }
      await wait(320 * pace.value)
      if (!(await pvp.send({ t: 'strike' }))) break
      await wait(560 * pace.value)
    }
  } finally {
    lunge.value = null
    sweeping.value = false
  }
}
onBeforeUnmount(() => {
  for (const timer of animationTimers) clearTimeout(timer)
  animationTimers.clear()
})
/** Silas, 2026-11-11 PT: "Invites should be private or open". */
const openDuel = ref(false)
/** Silas, 2026-11-11 PT: "Invites should be cancellable." Two taps. */
const cancelArmed = ref(false)
async function cancelDuel() {
  const id = pvp.duel?.id
  if (!id) return
  if (!cancelArmed.value) {
    cancelArmed.value = true
    return
  }
  cancelArmed.value = false
  pvp.stopWatching()
  if (await pvp.cancel(id)) await navigateTo('/play/slime-city?vs=1')
  else pvp.watchDuel(id)
}
async function start() {
  if (!duelDeck.value) return
  const data = await pvp.start(selectedTeam.value, {
    isPublic: openDuel.value,
    deck: duelDeck.value,
  })
  if (data) await navigateTo('/play/slime-city?vs=1')
}
async function join() {
  if (!invitedId.value || !duelDeck.value) return
  const data = await pvp.join(
    invitedId.value,
    selectedTeam.value,
    duelDeck.value,
  )
  if (data) pvp.watchDuel(data.id)
}
async function copyInvite() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
onMounted(async () => {
  await lab.hydrateProgression()
  await lab.hydrateStory()
  if (invitedId.value) {
    await pvp.load(invitedId.value)
    pvp.watchDuel(invitedId.value)
  }
})
onBeforeUnmount(() => pvp.stopWatching())

/**
 * The site header is the only header: the duel registers the Slime City
 * console skin but no page bar (Silas, 2026-11-24 PT: "Art first,
 * minimalist interface"). Back and forfeit live in the console's gear.
 */
const navStore = useNavStore()
let themeId = 0
onMounted(() => {
  themeId = navStore.registerConsoleTheme('slime-city')
})
onBeforeUnmount(() => {
  navStore.releasePageBar(themeId)
  sound.detach()
})

/** The duel plays the same music and effects as a CPU Clash, heard from this seat. */
const sound = useSlimeCitySoundStore()
onMounted(() => sound.attach())
watch(
  () => {
    const live = pvp.duel?.stage === 'battle' && board.value
    if (!live) return 'title' as const
    return clashIsTense(board.value!.boss, board.value!.victor)
      ? ('showdown' as const)
      : ('battle' as const)
  },
  (music) => sound.setScene(music),
  { immediate: true },
)
watch(
  () => [pvp.duel?.id, board.value] as const,
  ([id, next], [previousId, prev]) => {
    if (!next || !prev || !pvp.duel || id !== previousId) return
    sound.cue(
      clashSoundCues(pvpSoundView(prev), pvpSoundView(next), pvp.duel.seat),
    )
  },
)
watch(
  () => pvp.duel?.stage,
  (stage, before) => {
    if (stage === 'battle' && before === 'waiting') sound.cue('bell')
  },
)
</script>

<style scoped>
.scpvp {
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at 45% 20%, #29313e 0%, #090e15 75%);
  color: #ecf5e9;
}
.scpvp-stage {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: clip;
  isolation: isolate;
}
.scpvp-stage > section {
  position: relative;
  z-index: 1;
}
.scpvp-lobby-back {
  align-self: flex-start;
  color: #b9f151;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.12em;
}
.scpvp-settings {
  flex: none;
}
/* The deck and the gear lead the console row: one compact control pair. */
.scpvp-hand-dock {
  order: -2;
}
.scpvp-settings {
  order: -1;
}
.scpvp-settings {
  align-self: center;
}
.scpvp-settings :deep(.scq-gear) {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.6rem;
}
.scpvp-settings :deep(.scq-panel) {
  z-index: 30;
}
.scpvp-panel-action {
  display: block;
  min-height: 2rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid #38877a;
  border-radius: 0.45rem;
  background: #0f2622;
  color: #dfff93;
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-align: left;
}
.scpvp-panel-action.is-forfeit {
  border-color: #b3646d;
  color: #f6b6a3;
}
.scpvp-panel-action.is-forfeit.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.scpvp-arena-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.78;
  pointer-events: none;
}
.scpvp-arena-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 42%, transparent 35%, #090e15b8 100%),
    linear-gradient(#090e1566, transparent 22%, transparent 62%, #090e15dd);
}
.scpvp-error {
  position: absolute;
  z-index: 20;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #6a2634;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  max-width: 85%;
}
.scpvp-lobby,
.scpvp-waiting {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: clamp(0.6rem, 2vw, 1.6rem);
  height: 100%;
  padding: clamp(0.6rem, 2vw, 1.4rem);
}
.scpvp-poster {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  background: #18242c;
  min-height: 0;
}
.scpvp-poster > :first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scpvp-poster-copy {
  position: absolute;
  inset: auto 0 0;
  padding: clamp(1rem, 3vw, 2rem);
  background: linear-gradient(transparent, #09131bea 40%);
}
.scpvp-poster-title {
  display: block;
  font-size: clamp(1.35rem, 3vw, 3rem);
  font-weight: 950;
  line-height: 1;
  margin: 0.35rem 0;
}
.scpvp-poster-copy small {
  color: #c9f56c;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.scpvp-poster-copy p {
  max-width: 36rem;
  font-size: 0.95rem;
}
.scpvp-lobby-tools,
.scpvp-invite {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}
.scpvp-lobby-crew :deep(.scs-current) {
  width: 100%;
  min-height: 3.5rem;
}
.scpvp-lobby-crew :deep(.scs-current .slime-art) {
  width: 3rem;
  height: 3rem;
}
.scpvp-lobby-crew :deep(.scs-name b) {
  max-width: none;
  font-size: 1rem;
}
.scpvp-lobby-power {
  padding: 0.65rem;
  border: 2px solid #d4f960;
  background: #112933;
  font-size: 0.85rem;
}
.scpvp-lobby-power b {
  color: #d4f960;
  font-weight: 900;
}
.scpvp-primary {
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: #c4f25d;
  color: #111b15;
  font-weight: 950;
  letter-spacing: 0.03em;
}
.scpvp-visibility {
  display: flex;
  gap: 0.35rem;
}
.scpvp-visibility button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #586e68;
  border-radius: 0.6rem;
  background: #16262b;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scpvp-visibility button[aria-pressed='true'] {
  border-color: #c4f25d;
  color: #c4f25d;
}
.scpvp-quiet {
  padding: 0.55rem 1rem;
  border: 1px solid #586e68;
  border-radius: 0.8rem;
  background: transparent;
  color: #c7d6d0;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scpvp-quiet.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.scpvp-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.scpvp-note,
.scpvp-invite p {
  font-size: 0.8rem;
  color: #bdcfc9;
}
.scpvp-share {
  display: grid;
  gap: 0.45rem;
}
.scpvp-share summary {
  cursor: pointer;
  color: #d4f960;
  font-size: 0.8rem;
  font-weight: 800;
}
.scpvp-share[open] > :not(summary) {
  margin-top: 0.4rem;
}
.scpvp-invite input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #759287;
  border-radius: 0.5rem;
  color: #f6faed;
  background: #15232a;
}
.scpvp-result {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: clamp(0.6rem, 2vw, 1.6rem);
  padding: clamp(0.6rem, 2vw, 1.4rem);
  overflow: hidden;
}
.scpvp-result-crews {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  min-height: 0;
}
.scpvp-result-crews figure {
  position: relative;
  margin: 0;
  min-height: 0;
  overflow: hidden;
  border: 2px solid #416264;
  border-radius: 1.25rem;
  background: #18242c;
}
.scpvp-result-crews figure.won {
  border-color: #d4f960;
  box-shadow: 0 0 0 2px #d4f96044;
}
.scpvp-result-crews figure > :first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scpvp-result-crews figure.lost > :first-child {
  filter: grayscale(0.7) brightness(0.7);
}
.scpvp-result-crews figcaption {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(0.4rem, 1.5vw, 1rem);
  background: linear-gradient(transparent, #09131bea 40%);
}
.scpvp-result-crews figcaption small {
  overflow: hidden;
  color: #c9f56c;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scpvp-result-crews figcaption strong {
  font-size: clamp(0.75rem, 1.6vw, 1.2rem);
}
.scpvp-result-crews figcaption b {
  color: #f6b6a3;
  font-size: clamp(1.1rem, 2.6vw, 2rem);
  font-weight: 950;
  line-height: 1;
}
.scpvp-result-copy {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;
}
.scpvp-result-copy > small {
  color: #c9f56c;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.scpvp-result-copy p {
  color: #bdcfc9;
  font-size: 0.85rem;
}
.scpvp-result-title {
  color: #d2f364;
  font-size: clamp(1.6rem, 4vw, 3.4rem);
  font-weight: 950;
  line-height: 1;
}
.scpvp-result-title.is-loss {
  color: #f6b6a3;
}
.scpvp-result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.scpvp-result-actions > a {
  text-align: center;
}
.scpvp-result-link {
  margin-top: 0.15rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid #c9ee5a;
  border-radius: 0.4rem;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
}
@media (max-width: 690px) {
  .scpvp-result {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .scpvp-result-copy {
    gap: 0.45rem;
  }
  .scpvp-result-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .scpvp-result-actions > * {
    flex: 1 1 auto;
  }
  .scpvp-result-actions > .scpvp-primary {
    flex-basis: 100%;
  }
  .scpvp-lobby,
  .scpvp-waiting {
    grid-template-columns: 1fr;
    grid-template-rows: 42% 1fr;
  }
  .scpvp-poster-copy {
    padding: 0.6rem;
  }
  .scpvp-lobby-tools {
    gap: 0.4rem;
  }
}
.scpvp-arena {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.25rem;
  padding: 0.35rem;
  border: 1px solid #566c7088;
  border-radius: 1rem;
  background: #0a161926;
}
.scpvp-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(0.2rem, 0.8vw, 0.5rem);
  min-height: 0;
}
.scpvp-row.is-rival {
  grid-row: 1;
}
.scpvp-row.is-mine {
  grid-row: 3;
}
.scpvp-slot {
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 2px solid #708b8099;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #0a161966;
  color: #f3fbf6;
  transition:
    transform 0.28s cubic-bezier(0.2, 0.9, 0.25, 1.12),
    border-color 0.2s,
    box-shadow 0.2s;
}
.scpvp-slot.filled {
  border-color: #9ab6a7;
  box-shadow: 0 0.4rem 1rem #000a;
}
.scpvp-row.is-rival .scpvp-slot.filled {
  border-color: #d98b8f;
}
.scpvp-slot.filled:not(.target) {
  cursor: zoom-in;
}
.scpvp-slot.inspected {
  border-color: #ffdb76;
  box-shadow: 0 0 0 2px #ffdb7666;
}
.scpvp-slot.target {
  border-color: #c9ee5a;
  box-shadow:
    inset 0 0 1.4rem #c9ee5a55,
    0 0 0.8rem #c9ee5a66;
  cursor: copy;
  animation: scpvp-glow 1.2s ease-in-out infinite alternate;
}
.scpvp-row.is-mine .scpvp-slot.lunge {
  transform: translateY(-9%);
  z-index: 3;
}
.scpvp-row.is-rival .scpvp-slot.lunge {
  transform: translateY(9%);
  z-index: 3;
}
.scpvp-slot.hit {
  animation: scpvp-shake 0.36s ease;
}
.scpvp-slot > .slime-art {
  position: absolute;
  inset: 0;
}
.scpvp-slot > .slime-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    #0008,
    transparent 22%,
    transparent 62%,
    #050d11e6
  );
}
.scpvp-stats {
  position: absolute;
  z-index: 2;
  inset: 0.25rem 0.25rem auto;
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
  font-size: clamp(0.72rem, 1.9vw, 1.2rem);
  font-weight: 950;
  line-height: 1;
}
.scpvp-defense {
  --sc-armor-size: clamp(1.1rem, 2.4vw, 1.8rem);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  z-index: 2;
}
.scpvp-stats b {
  padding: 0.15rem 0.3rem;
  border-radius: 0.4rem;
  background: #0b1719e0;
  white-space: nowrap;
}
.scpvp-stats .is-attack {
  color: #ffe08a;
}
.scpvp-stats .is-life {
  color: #ffb3b8;
}
.scpvp-stats .is-life.low {
  color: #ff6f7a;
}
.scpvp-tags {
  position: absolute;
  z-index: 2;
  inset: auto 0.25rem 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}
.scpvp-tag {
  padding: 0.12rem 0.32rem;
  border-radius: 0.35rem;
  background: #0b1719e6;
  font-size: clamp(0.5rem, 1.15vw, 0.7rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.scpvp-tag.is-new {
  color: #9fd3ff;
}
.scpvp-tag.is-tap {
  background: #c9ee5a;
  color: #10200b;
}
.scpvp-tag.is-ambush {
  color: #ffe08a;
}
.scpvp-tag.is-stun {
  color: #ff9aa0;
}
.scpvp-tag.is-armor,
.scpvp-tag.is-guard {
  color: #cfe7ff;
}
.scpvp-unit-label {
  position: absolute;
  inset: calc(0.8rem + clamp(0.72rem, 1.9vw, 1.2rem)) 0 auto;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.2rem;
  background: linear-gradient(#07131ad9, transparent);
  font-size: clamp(0.55rem, 1.25vw, 0.85rem);
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  text-shadow: 0 1px 3px #000;
}
.scpvp-unit-label.has-armor {
  right: clamp(1.35rem, 3vw, 2.1rem);
}
.scpvp-unit-label i {
  color: #8af2c2;
  font-style: normal;
  font-size: 0.85em;
}
.scpvp-unit-label i.lv-2 {
  color: #b9adff;
  text-shadow: 0 0 6px #3fd6ff;
}
.scpvp-unit-label i.lv-3 {
  color: #ffd34d;
  text-shadow: 0 0 6px #ff5fa2;
}
.scpvp-empty {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  color: #8aa59e;
  font-size: clamp(1rem, 3vw, 2rem);
  font-weight: 950;
  opacity: 0.7;
}
.scpvp-slot.target .scpvp-empty {
  color: #e8ff9a;
  font-size: clamp(0.6rem, 1.4vw, 0.9rem);
  letter-spacing: 0.1em;
  opacity: 1;
}
.scpvp-float {
  position: absolute;
  inset: 40% 0 auto;
  z-index: 4;
  color: #ff6f7a;
  font-size: clamp(1.1rem, 3vw, 2rem);
  font-weight: 950;
  text-align: center;
  text-shadow:
    0 2px 0 #000,
    0 0 0.6rem #000;
  animation: scpvp-float 0.9s ease-out forwards;
  pointer-events: none;
}

.scpvp-midline {
  grid-row: 2;
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-width: 0;
  min-height: 1.9rem;
  pointer-events: none;
}
.scpvp-pips {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid #c9ee5a88;
  border-radius: 999px;
  background: #0c1c22f0;
  box-shadow: 0 0.3rem 1rem #000c;
}
.scpvp-pips small {
  color: #e8ff9a;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.scpvp-pip {
  width: 0.95rem;
  height: 1.35rem;
  border: 2px solid #c9ee5a;
  border-radius: 0.25rem;
  background: linear-gradient(160deg, #e8ff9a, #8fc23a);
  box-shadow: 0 0 0.6rem #c9ee5a99;
  transition:
    background 0.25s,
    box-shadow 0.25s,
    opacity 0.25s;
}
.scpvp-pip.used {
  background: transparent;
  box-shadow: none;
  opacity: 0.45;
}
.scpvp-pip.is-free {
  border-color: #ffdb76;
  background: linear-gradient(160deg, #fff0b3, #e3a93a);
  box-shadow: 0 0 0.6rem #ffdb7699;
}
.scpvp-pips.rival {
  border-color: #d98b8f88;
}
.scpvp-pips.rival .scpvp-pip {
  border-color: #d98b8f;
  background: linear-gradient(160deg, #ffc2c6, #c45a62);
  box-shadow: none;
}
.scpvp-pips.rival .scpvp-pip.used {
  background: transparent;
}
.scpvp-pips.rival small {
  color: #ffc2c6;
}
.scpvp-ticker {
  min-width: 0;
  max-width: 46rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  background: #0c1c22d9;
  color: #dceee6;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
}
.scpvp-ticker.warn {
  color: #ffd38a;
}

.scpvp-console {
  position: relative;
  z-index: 8;
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 0.35rem;
}
.scpvp-hand-dock {
  flex: none;
  display: flex;
}
.scpvp-choice {
  flex: 2 1 0;
  min-width: 0;
  display: flex;
  gap: 0.25rem;
}
.scpvp-choice button {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.3rem 0.4rem;
  border: 1px solid #7a9687;
  border-radius: 0.5rem;
  background: #13252bee;
  text-align: left;
}
.scpvp-choice b {
  font-size: 0.68rem;
}
.scpvp-choice small {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #e4efe9;
  font-size: 0.6rem;
  line-height: 1.25;
}
.scpvp-choice button[aria-checked='true'] {
  border-color: #c9ee5a;
  background: #3d5420;
}
.scpvp-tap,
.scpvp-power,
.scpvp-log-toggle {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #7a9687;
  border-radius: 0.6rem;
  background: #13252bee;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.scpvp-tap {
  border-color: #c9ee5a;
  color: #e8ff9a;
}
.scpvp-power {
  max-width: 13rem;
}
.scpvp-power span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scpvp-power.armed {
  border-color: #c9ee5a;
  background: #3d5420;
}
.scpvp-power.spent,
.scpvp-tap:disabled,
.scpvp-power:disabled {
  opacity: 0.45;
}
.scpvp-fight {
  flex: 1 1 auto;
  max-width: 18rem;
  margin-left: auto;
  padding: 0.55rem 1rem;
  border-radius: 0.8rem;
  background: #c4f25d;
  color: #111b15;
  font-size: 1rem;
  font-weight: 950;
  letter-spacing: 0.06em;
}
.scpvp-fight.ready {
  animation: scpvp-glow 1s ease-in-out infinite alternate;
}
.scpvp-fight:disabled {
  background: #33463a;
  color: #a9bfb7;
}
.scpvp-log {
  position: absolute;
  z-index: 12;
  top: 4rem;
  right: 0.5rem;
  bottom: 4.2rem;
  width: min(22rem, 86%);
  padding: 0.8rem;
  border: 1px solid #8da69a;
  border-radius: 0.75rem;
  background: #0c1c22f2;
  overflow-y: auto;
  font-size: 0.75rem;
}
.scpvp-log p {
  padding: 0.3rem;
  border-bottom: 1px solid #49605e;
}
.scpvp-log small {
  color: #c9ee5a;
}
@keyframes scpvp-glow {
  from {
    box-shadow:
      inset 0 0 0.8rem #c9ee5a33,
      0 0 0.4rem #c9ee5a44;
  }
  to {
    box-shadow:
      inset 0 0 1.6rem #c9ee5a66,
      0 0 1rem #c9ee5a88;
  }
}
@keyframes scpvp-shake {
  25% {
    translate: -4px 0;
  }
  50% {
    translate: 4px 0;
  }
  75% {
    translate: -2px 0;
  }
}
@keyframes scpvp-float {
  from {
    opacity: 1;
    translate: 0 0;
  }
  to {
    opacity: 0;
    translate: 0 -2.4rem;
  }
}
@media (max-width: 690px) {
  .scpvp-arena {
    padding: 0.2rem;
  }
  .scpvp-slot {
    border-radius: 0.5rem;
  }
  .scpvp-unit-label {
    font-size: 0.5rem;
  }
  .scpvp-tag {
    padding: 0.08rem 0.2rem;
    font-size: 0.48rem;
  }
  .scpvp-ticker {
    font-size: 0.6rem;
  }
  .scpvp-midline {
    gap: 0.3rem;
  }
  .scpvp-pips small {
    display: none;
  }
  .scpvp-console {
    flex-wrap: wrap;
  }
  .scpvp-choice {
    flex-basis: 100%;
    order: -1;
  }
  .scpvp-power span {
    display: none;
  }
  .scpvp-tap,
  .scpvp-power,
  .scpvp-log-toggle {
    padding: 0.4rem 0.5rem;
    font-size: 0.68rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scpvp-slot,
  .scpvp-slot.target,
  .scpvp-slot.hit,
  .scpvp-fight.ready,
  .scpvp-float {
    animation: none;
    transition: none;
  }
}
/*
  Silas, 2026-11-22 PT: "Bring back the stat line hp bars, and put them to
  the right of the lanes, so we see the two opponents on their [side]." On
  wide screens each boss sits in a rail beside its own row of alleys; phones
  fold the rail into one strip above the board.
*/
.scpvp-battle {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(10rem, 17vw, 15rem);
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'arena rail'
    'console console';
  gap: 0.4rem;
  padding: 0.4rem;
}
.scpvp-arena {
  grid-area: arena;
}
.scpvp-rail {
  grid-area: rail;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.25rem;
  padding: 0.35rem 0;
}
.scpvp-console {
  grid-area: console;
}
.scpvp-boss {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #4d665e99;
  border-radius: 0.9rem;
  background: #0c1a1fcc;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.scpvp-boss.is-rival {
  border-color: #d98b8f77;
}
.scpvp-boss.active {
  border-color: #c9ee5a;
  box-shadow: 0 0 1rem #c9ee5a55;
}
.scpvp-boss.hurt {
  animation: scpvp-shake 0.4s ease;
  box-shadow: 0 0 1.2rem #ff6f7a88;
}
.scpvp-boss.healed {
  box-shadow: 0 0 1.2rem #7dffb088;
}
.scpvp-boss-portrait {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  border: 0;
  background: transparent;
}
.scpvp-boss-portrait :deep(.slime-art) {
  width: 100%;
  height: 100%;
}
.scpvp-boss-info {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.45rem 0.45rem;
  background: linear-gradient(transparent, #07131ae6 30%);
  margin-top: -1.6rem;
  position: relative;
}
.scpvp-boss small {
  color: #c9f56c;
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scpvp-boss.is-rival small {
  color: #ffc2c6;
}
.scpvp-boss strong {
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scpvp-boss b {
  color: #ffd3d6;
  font-size: clamp(1rem, 1.8vw, 1.45rem);
  font-weight: 950;
  line-height: 1;
  white-space: nowrap;
}
.scpvp-boss b small {
  color: #a9bfb7;
  font-size: 0.6em;
}
.scpvp-life {
  display: block;
  height: 0.5rem;
  border-radius: 999px;
  background: #ffffff1f;
  overflow: hidden;
}
.scpvp-life i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #f0686f, #f6b6a3);
  transition: width 0.5s ease;
}
.scpvp-boss.is-mine .scpvp-life i {
  background: linear-gradient(90deg, #7fcf4a, #d4f960);
}
.scpvp-turn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-height: 1.9rem;
  text-align: center;
  font-weight: 900;
  color: #d2f364;
  line-height: 1.15;
}
.scpvp-turn-copy {
  display: flex;
  flex-direction: column;
}
.scpvp-turn small {
  color: #a9bfb7;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
}
.scpvp-takeback {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid #c9ee5a;
  border-radius: 0.6rem;
  background: #13252bee;
  color: #e8ff9a;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.scpvp-takeback.blocked,
.scpvp-takeback:disabled {
  border-color: #586e68;
  color: #8fa49c;
}
.scpvp-slot.hurt {
  animation: scpvp-shake 0.36s ease;
  box-shadow: inset 0 0 1.4rem #ff6f7a88;
}
.scpvp-slot.healed {
  box-shadow:
    inset 0 0 1.6rem #7dffb099,
    0 0 0.9rem #7dffb077;
}
.scpvp-slot.buffed {
  box-shadow:
    inset 0 0 1.4rem #ffdb7699,
    0 0 0.9rem #ffdb7677;
}
.scpvp-slot.entered {
  animation: scpvp-enter 0.45s cubic-bezier(0.2, 0.9, 0.25, 1.12);
}
.scpvp-float.is-healed {
  color: #7dffb0;
}
.scpvp-float.is-buffed {
  color: #ffdb76;
}
.scpvp-float.is-block {
  color: #cfe7ff;
}
.scpvp-float.is-trap {
  color: #ffb35c;
}
.scpvp-ticker.warn {
  pointer-events: auto;
  cursor: pointer;
}
@keyframes scpvp-enter {
  from {
    opacity: 0;
    transform: translateY(-14%) scale(1.08);
  }
}
/*
  Silas, 2026-11-24 PT, tablet landscape: "The cards should start at the very
  bottom of the screen, there's blank space that really extraneous. Deck log
  turn button should all be on right." Beside a rail, the board takes the
  full height (the hand fans up from the screen's bottom edge) and the
  console stacks at the foot of the rail, under the bosses: the deck, BACK,
  powers and LOG in a wrapping row, the turn button full width below.
*/
@media (min-width: 691px) and (orientation: landscape) {
  .scpvp-battle {
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas:
      'arena rail'
      'arena console';
    padding-bottom: 0.2rem;
  }
  .scpvp-rail {
    padding-bottom: 0;
  }
  .scpvp-console {
    flex-wrap: wrap;
    align-items: stretch;
    align-content: flex-end;
    gap: 0.3rem;
    padding-bottom: 0.2rem;
  }
  .scpvp-hand-dock :deep(.cxh-toggle) {
    width: 2.9rem;
    height: 2.9rem;
  }
  .scpvp-choice {
    flex: 1 1 100%;
    flex-direction: column;
  }
  /*
    The held card shows the picked option's full rules, so the rail's A / B
    buttons carry just their titles, whole, instead of clipped rules.
  */
  .scpvp-choice small {
    display: none;
  }
  .scpvp-choice b {
    white-space: normal;
  }
  .scpvp-tap,
  .scpvp-power,
  .scpvp-log-toggle,
  .scpvp-takeback {
    flex: 1 1 auto;
    justify-content: center;
    min-width: 0;
    padding: 0.4rem 0.5rem;
  }
  .scpvp-power {
    max-width: none;
  }
  .scpvp-fight {
    flex: 1 1 100%;
    max-width: none;
    margin-left: 0;
    padding: 0.6rem 0.5rem;
    font-size: 0.9rem;
  }
  .scpvp-log {
    right: calc(clamp(10rem, 17vw, 15rem) + 1rem);
    bottom: 0.5rem;
  }
}
/*
  Phone landscape: too short for boss portraits and a stacked console. The
  bosses become name, life bar and HP; the console buttons tighten so the
  rail still ends in a full-width turn button.
*/
@media (min-width: 691px) and (max-height: 540px) and (orientation: landscape) {
  .scpvp-rail {
    grid-template-rows: auto auto auto;
    align-content: start;
    gap: 0.2rem;
    padding-top: 0;
  }
  .scpvp-boss-portrait {
    flex: none;
    width: 2rem;
    height: 2rem;
  }
  .scpvp-boss-info {
    margin-top: 0;
    padding: 0.25rem 0.4rem 0.3rem;
    background: none;
  }
  .scpvp-boss-info > small {
    display: none;
  }
  .scpvp-boss strong {
    font-size: 0.68rem;
  }
  .scpvp-boss b {
    font-size: 0.85rem;
  }
  .scpvp-life {
    height: 0.35rem;
  }
  .scpvp-turn {
    min-height: 0;
    font-size: 0.75rem;
  }
  .scpvp-hand-dock :deep(.cxh-toggle) {
    width: 2.4rem;
    height: 2.4rem;
  }
  .scpvp-tap,
  .scpvp-power,
  .scpvp-log-toggle,
  .scpvp-takeback {
    padding: 0.3rem 0.4rem;
    font-size: 0.66rem;
  }
  .scpvp-fight {
    padding: 0.45rem 0.5rem;
  }
}
@media (max-width: 690px) {
  .scpvp-battle {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'rail'
      'arena'
      'console';
  }
  .scpvp-rail {
    display: flex;
    align-items: stretch;
    gap: 0.25rem;
    padding: 0;
  }
  .scpvp-boss {
    flex: 1 1 0;
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem;
  }
  .scpvp-boss-portrait {
    flex: none;
    width: 2rem;
    height: 2rem;
    border-radius: 0.4rem;
  }
  .scpvp-boss-info {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    background: none;
  }
  .scpvp-boss strong,
  .scpvp-boss > .scpvp-boss-info > small {
    display: none;
  }
  .scpvp-boss b {
    font-size: 0.72rem;
  }
  .scpvp-boss b small {
    display: none;
  }
  .scpvp-life {
    height: 0.3rem;
  }
  .scpvp-turn {
    flex-direction: row;
    flex: none;
    gap: 0.25rem;
    font-size: 0.6rem;
  }
  .scpvp-turn-copy {
    max-width: 4.6rem;
  }
  .scpvp-turn small {
    font-size: 0.5rem;
  }
  .scpvp-takeback span {
    display: none;
  }
}
@media (orientation: portrait) {
  .scpvp-battle {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas:
      'arena arena'
      'rail console';
  }
  .scpvp-rail {
    display: flex;
    align-items: stretch;
    gap: 0.3rem;
    padding: 0;
  }
  .scpvp-boss {
    flex: 1 1 0;
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem;
  }
  .scpvp-boss-portrait {
    flex: none;
    width: clamp(2rem, 5vw, 3.5rem);
    height: clamp(2rem, 5vw, 3.5rem);
    border-radius: 0.4rem;
  }
  .scpvp-boss-info {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    background: none;
  }
  .scpvp-turn {
    flex: none;
    font-size: 0.75rem;
  }
  .scpvp-console {
    flex-wrap: wrap;
    align-content: center;
  }
  .scpvp-choice {
    flex-basis: 100%;
  }
  .scpvp-fight {
    flex: 1 1 5rem;
    max-width: none;
  }
}
@media (max-width: 690px) and (orientation: portrait) {
  .scpvp-battle {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'arena'
      'rail'
      'console';
  }
}
@media (prefers-reduced-motion: reduce) {
  .scpvp-boss.hurt,
  .scpvp-slot.hurt,
  .scpvp-slot.entered {
    animation: none;
  }
}
.scpvp-arena :deep(.cxh) {
  --W: min(20rem, 36cqw, 20cqh);
  --preview-center: 82%;
  --preview-offset: 32cqw;
  overflow: visible;
  z-index: 15;
  --pvp-preview-width: min(18rem, 42cqw, 38cqh);
  --rest: 1;
  --peek: 1;
}
.scpvp-arena :deep(.cxh:not(.open) .cxh-card:not(.big)) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging)) {
  --hand-gap: 0.65rem;
  --hand-width: min(
    var(--W),
    (100cqw - 1rem - var(--n1) * var(--hand-gap)) / (var(--n1) + 1)
  );
  --x: calc(var(--o) * (var(--hand-width) + var(--hand-gap)));
  --y: calc(-0.4rem + var(--drop) * 0.2);
  --s: 1;
  --r: calc(var(--rot) * 0.35);
  --rules-open: 1;
  width: var(--hand-width);
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf) {
  display: flex;
  flex-direction: column;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf-head) {
  position: relative;
  inset: auto;
  margin: 3.5cqw;
  flex: none;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf-top) {
  flex-wrap: wrap;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf-badge) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf-name) {
  overflow-wrap: anywhere;
}
.scpvp-arena :deep(.cxh.open .cxh-card:not(.big):not(.dragging) .ccf-rules) {
  position: relative;
  margin-top: auto;
  min-height: 0;
  overflow-y: auto;
}
.scpvp-arena :deep(.cxh.holding.open .cxh-card:not(.big):not(.dragging)) {
  --y: calc(-0.4rem + var(--drop) * 0.2);
}
.scpvp-arena :deep(.cxh .cxh-card.big:not(.dragging)) {
  width: var(--pvp-preview-width);
}
.scpvp-arena :deep(.cxh .cxh-card.big.held-dock:not(.dragging)) {
  --x: var(--preview-offset);
  --y: calc(var(--pvp-preview-width) * 0.75 - 50cqh);
}
.scpvp-arena :deep(.cxh .cxh-card.cxh-inspect) {
  left: var(--preview-center);
  right: auto;
  transform: translate(-50%, -50%);
}
.scpvp-arena :deep(.cxh .cxh-levels.docked) {
  left: var(--preview-center);
  right: auto;
  top: max(0.25rem, calc(50% - var(--pvp-preview-width) * 0.75 - 4.6rem));
  transform: translateX(-50%);
}
@media (min-width: 691px) and (orientation: landscape) {
  .scpvp-arena :deep(.cxh) {
    --rail-width: clamp(10rem, 17vw, 15rem);
    --preview-offset: calc(
      50cqw + var(--rail-width) + 0.4rem - var(--pvp-preview-width) / 2
    );
    --preview-center: calc(
      100% + var(--rail-width) + 0.4rem - var(--pvp-preview-width) / 2
    );
    --pvp-preview-width: min(20rem, 42cqw, 42cqh);
  }
}
.scpvp-hand-dock :deep(.cxh-toggle) {
  transform: none;
  animation: none;
}
.scpvp-hand-dock :deep(.cxh-toggle small) {
  bottom: -0.65rem;
  font-size: 0.65rem;
  color: #e5f8aa;
}
</style>
