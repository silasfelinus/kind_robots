<template>
  <section
    class="atlas-root"
    aria-label="Prom of Doom character and art bible"
    data-testid="capes-cast-atlas"
  >
    <div class="atlas-heading">
      <div>
        <p class="atlas-eyebrow">02 / THE CITIZENS OF COMET CITY</p>
        <h2>48 POWERS. <span>192 FACES OF CONFLICT.</span></h2>
        <p class="atlas-intro">
          The same cast belongs to Prom of Doom and Every Villain Tactics.
          Explore every hero, villain, one-hit crew, and independently powered
          lieutenant. Painted assets appear here only after they're actually
          attached.
        </p>
      </div>
      <div class="atlas-delivery" aria-live="polite">
        <strong>{{ deliveredPosters }} / 96</strong>
        <span>CORE POSTERS LINKED</span>
      </div>
    </div>

    <div class="atlas-layout">
      <aside class="atlas-roster">
        <div class="atlas-controls">
          <label>
            <span>FIND A CHARACTER</span>
            <input
              v-model.trim="search"
              type="search"
              placeholder="Hero, civilian, power, crew…"
              data-testid="capes-cast-search"
            />
          </label>
          <label>
            <span>POWER ORIGIN</span>
            <select v-model="origin" data-testid="capes-cast-origin">
              <option value="">All six origins</option>
              <option v-for="item in origins" :key="item" :value="item">
                {{ readable(item) }}
              </option>
            </select>
          </label>
        </div>
        <p class="atlas-count">
          {{ matching.length }} OF 48 PERMANENT CHARACTERS
        </p>
        <div
          class="atlas-roster-grid"
          role="group"
          aria-label="Canonical power identities"
        >
          <button
            v-for="person in matching"
            :key="person.signature"
            type="button"
            class="atlas-identity"
            :class="{ 'atlas-active': person.signature === chosen }"
            :aria-pressed="person.signature === chosen"
            :data-testid="'capes-identity-' + person.signature"
            @click="chosen = person.signature"
          >
            <span
              class="atlas-avatar"
              :class="'affinity-' + affinityFor(person.signature)"
            >
              <img
                v-if="art(person.signature, 'hero')"
                :src="art(person.signature, 'hero')!"
                :alt="person.hero.alias + ' hero form'"
              />
              <span v-else aria-hidden="true">{{
                person.hero.alias.slice(0, 2).toUpperCase()
              }}</span>
            </span>
            <span class="atlas-person">
              <strong>{{ person.hero.alias }}</strong>
              <small>{{ person.realName }}</small>
            </span>
            <span class="atlas-open" aria-hidden="true">›</span>
          </button>
        </div>
        <p v-if="!matching.length" class="atlas-empty">
          No characters match those filters.
        </p>
      </aside>

      <div class="atlas-detail">
        <div class="atlas-profile">
          <div>
            <p class="atlas-eyebrow">
              {{ active.signature.replace('-', ' / ').toUpperCase() }} · COMET
              CITY DOSSIER
            </p>
            <h3>{{ active.hero.alias }}</h3>
            <p>{{ active.realName }} · {{ active.pronouns }}</p>
          </div>
          <span class="atlas-status">CHARACTER BIBLE · AUTHORING</span>
        </div>
        <p class="atlas-backstory">{{ active.backstory }}</p>

        <div class="atlas-form-grid">
          <article
            v-for="role in forms"
            :key="role"
            class="atlas-form"
            :class="'atlas-' + role"
          >
            <div class="atlas-form-image">
              <img
                v-if="art(active.signature, role)"
                :src="art(active.signature, role)!"
                :alt="active.hero.alias + ' ' + role + ' splash poster'"
              />
              <div
                v-else
                class="atlas-form-placeholder"
                :class="'affinity-' + affinityFor(active.signature)"
              >
                <span class="atlas-energy" aria-hidden="true">✦</span>
                <strong>{{
                  active.hero.alias.slice(0, 2).toUpperCase()
                }}</strong>
                <small>POSTER ART AWAITING DELIVERY</small>
              </div>
              <span class="atlas-form-banner"
                >{{ role.toUpperCase() }} FORM</span
              >
              <span
                class="atlas-art-state"
                :class="{ delivered: !!art(active.signature, role) }"
              >
                {{
                  art(active.signature, role) ? 'Attached art' : 'Not attached'
                }}
              </span>
            </div>
            <div class="atlas-form-body">
              <h4>{{ active[role].alias }}</h4>
              <p>{{ active[role].focus }}</p>
              <p class="atlas-method">{{ active[role].method }}</p>
              <div class="atlas-stats">
                <div
                  v-for="[name, value] in Object.entries(active[role].stats)"
                  :key="name"
                >
                  <span>{{ readable(name) }}</span>
                  <b>{{ value }}</b>
                </div>
              </div>
              <code>{{ identityArtKey(active.signature, role) }}</code>
            </div>
          </article>
        </div>

        <div class="atlas-ranks">
          <article class="atlas-rank atlas-minions">
            <div class="atlas-support-art" data-testid="capes-henchman-poster">
              <img
                v-if="supportArt('henchmen')"
                :src="supportArt('henchmen')!"
                :alt="selectedCrew.name + ' henchman species splash'"
              />
              <div v-else class="atlas-support-empty" aria-label="Henchman poster not attached">
                <strong>{{ selectedCrew.name.slice(0, 2).toUpperCase() }}</strong>
                <span>HENCHMAN POSTER · ART PLANNED</span>
              </div>
            </div>
            <p class="atlas-eyebrow">ONE-HIT SPECIES · VILLAIN'S CREW</p>
            <h4>{{ selectedCrew.name }}</h4>
            <p class="atlas-rank-subtitle">
              Captain {{ selectedCrew.captain }} · 1 HP per ordinary troop
            </p>
            <p>{{ selectedCrew.look }}</p>
            <dl>
              <div>
                <dt>Battlefield trick</dt>
                <dd>{{ selectedCrew.move }}</dd>
              </div>
              <div>
                <dt>Counterplay</dt>
                <dd>{{ selectedCrew.counter }}</dd>
              </div>
            </dl>
            <div class="atlas-rank-foot">
              <span>Henchman poster · portrait · 2:1 tactical standee</span>
              <span class="atlas-unlinked">Art planned</span>
            </div>
          </article>
          <article class="atlas-rank atlas-lieutenant">
            <div class="atlas-support-art" data-testid="capes-lieutenant-poster">
              <img
                v-if="supportArt('lieutenants')"
                :src="supportArt('lieutenants')!"
                :alt="selectedCampaign.lieutenant.name + ' lieutenant splash'"
              />
              <div v-else class="atlas-support-empty" aria-label="Lieutenant poster not attached">
                <strong>{{ selectedCampaign.lieutenant.name.slice(0, 2).toUpperCase() }}</strong>
                <span>LIEUTENANT POSTER · ART PLANNED</span>
              </div>
            </div>
            <p class="atlas-eyebrow">NUMBER TWO · MULTI-HIT BOSS</p>
            <h4>{{ selectedCampaign.lieutenant.name }}</h4>
            <p class="atlas-rank-subtitle">
              Independent lieutenant · 4 HP initial benchmark
            </p>
            <p>{{ selectedCampaign.lieutenant.look }}</p>
            <dl>
              <div>
                <dt>Special power</dt>
                <dd>{{ selectedCampaign.lieutenant.power }}</dd>
              </div>
              <div>
                <dt>Counterplay</dt>
                <dd>{{ selectedCampaign.lieutenant.counter }}</dd>
              </div>
              <div>
                <dt>Loyalty & motive</dt>
                <dd>{{ selectedCampaign.lieutenant.agenda }}</dd>
              </div>
            </dl>
            <div class="atlas-rank-foot">
              <span>Lieutenant poster · portrait · 2:1 tactical standee</span>
              <span class="atlas-unlinked">Art planned</span>
            </div>
          </article>
        </div>

        <div class="atlas-missions">
          <article>
            <span>ORIGIN LEVEL / POWER DISCOVERY</span>
            <strong>{{ selectedCampaign.opening.title }}</strong>
            <p>{{ selectedCampaign.opening.venue }}</p>
          </article>
          <article>
            <span>VILLAIN LEVEL / FINAL SHOWDOWN</span>
            <strong>{{ selectedCampaign.lair.title }}</strong>
            <p>{{ selectedCampaign.lair.venue }}</p>
          </article>
        </div>
        <p class="atlas-footnote">
          Character briefs and unlock-card concepts are authored; art, 96
          complete levels, emotional reaction sets and full tactical standees
          are separate delivery gates. Blank art slots never count as completed
          images.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import { identityArtKey } from '~/utils/cometAcademy/artSlots'
import { promArt } from '~/utils/cometAcademy/artManifest'
import { campaignStagesFor } from '~/utils/cometAcademy/identityCampaignStages'
import { henchmanForVillain } from '~/utils/cometAcademy/villainHenchmen'
import type { SignaturePowerId } from '~/utils/cometAcademy/specialPowers'

const forms = ['hero', 'villain'] as const
const search = ref('')
const origin = ref('')
const chosen = ref<SignaturePowerId>(IDENTITY_ARCS[0]!.signature)
const origins = [
  ...new Set(IDENTITY_ARCS.map((person) => person.signature.split('-')[0]!)),
]
function readable(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function affinityFor(signature: SignaturePowerId): string {
  return signature.split('-')[1] ?? 'fire'
}
function art(
  signature: SignaturePowerId,
  role: 'hero' | 'villain',
): string | null {
  return promArt(identityArtKey(signature, role))
}
function supportArt(group: 'henchmen' | 'lieutenants'): string | null {
  return promArt(group + '/' + active.value.signature + '/poster')
}
const matching = computed(() => {
  const term = search.value.toLowerCase()
  return IDENTITY_ARCS.filter((person) => {
    if (origin.value && !person.signature.startsWith(origin.value + '-'))
      return false
    if (!term) return true
    const crew = henchmanForVillain(person.signature)
    const lieutenant = campaignStagesFor(person.signature).lieutenant
    return [
      person.signature,
      person.realName,
      person.hero.alias,
      person.villain.alias,
      crew.name,
      crew.captain,
      lieutenant.name,
    ].some((field) => field.toLowerCase().includes(term))
  })
})
const active = computed(
  () =>
    IDENTITY_ARCS.find((person) => person.signature === chosen.value) ??
    IDENTITY_ARCS[0]!,
)
const selectedCrew = computed(() => henchmanForVillain(active.value.signature))
const selectedCampaign = computed(() =>
  campaignStagesFor(active.value.signature),
)
const deliveredPosters = computed(() =>
  IDENTITY_ARCS.reduce(
    (total, person) =>
      total + forms.filter((role) => art(person.signature, role)).length,
    0,
  ),
)
</script>

<style scoped>
.atlas-root {
  min-width: 0;
  color: #f0ecdf;
}
.atlas-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding: 6px 0 18px;
  border-bottom: 1px solid #dba76c55;
}
.atlas-eyebrow {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: #e3b774;
}
.atlas-heading h2 {
  font:
    900 clamp(1.5rem, 3.1vw, 2.8rem)/1.05 Impact,
    'Arial Black',
    sans-serif;
  letter-spacing: 0.025em;
  margin: 7px 0;
}
.atlas-heading h2 span {
  color: #e5b679;
}
.atlas-intro {
  font-size: 12px;
  line-height: 1.55;
  max-width: 760px;
  color: #bbcadc;
}
.atlas-delivery {
  flex: none;
  display: flex;
  flex-direction: column;
  text-align: right;
  border-left: 3px solid #e5b679;
  padding-left: 16px;
}
.atlas-delivery strong {
  font-size: 1.65rem;
  font-weight: 900;
  color: #f7dcac;
}
.atlas-delivery span {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #adbed4;
}
.atlas-layout {
  display: grid;
  grid-template-columns: minmax(235px, 300px) minmax(0, 1fr);
  gap: 18px;
  padding-top: 18px;
}
.atlas-roster {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  align-self: start;
  position: sticky;
  top: 0;
  max-height: 75vh;
}
.atlas-controls {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.atlas-controls label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #d8c5a8;
}
.atlas-controls input,
.atlas-controls select {
  width: 100%;
  padding: 9px;
  border: 1px solid #8f9db56b;
  border-radius: 5px;
  background: #13223c;
  color: white;
  font-size: 13px;
  letter-spacing: normal;
}
.atlas-count {
  font-size: 10px;
  letter-spacing: 0.09em;
  color: #a3b4ca;
}
.atlas-roster-grid {
  display: grid;
  gap: 5px;
  overflow-y: auto;
  min-height: 120px;
}
.atlas-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #465a77;
  background: #1a2a43;
  padding: 5px 9px;
  text-align: left;
  color: #f7eddc;
  border-radius: 6px;
}
.atlas-identity:hover,
.atlas-active {
  border-color: #ecc78f;
  background: #37415a;
}
.atlas-identity:focus-visible,
.atlas-controls :focus-visible {
  outline: 2px solid #ffd289;
  outline-offset: 2px;
}
.atlas-avatar {
  width: 41px;
  height: 41px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: linear-gradient(140deg, #385879, #6a4460);
  font-weight: 900;
  overflow: hidden;
}
.atlas-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.atlas-person {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}
.atlas-person strong {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.atlas-person small {
  font-size: 10px;
  color: #bec9da;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.atlas-open {
  font-size: 21px;
  color: #f4c37b;
}
.atlas-empty {
  padding: 20px 8px;
  font-size: 12px;
  color: #c0c9db;
}
.atlas-detail {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.atlas-profile {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 10px;
}
.atlas-profile h3 {
  font:
    900 clamp(1.8rem, 3vw, 3rem)/1 Impact,
    'Arial Black',
    sans-serif;
  margin: 7px 0 3px;
}
.atlas-profile p:not(.atlas-eyebrow) {
  font-size: 12px;
  color: #becde0;
}
.atlas-status {
  border: 1px solid #a3afbf;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: #e6d8bc;
  padding: 5px;
  text-align: right;
}
.atlas-backstory {
  color: #c7d4e2;
  line-height: 1.58;
  font-size: 13px;
  border-left: 3px solid #dfbc7c;
  padding-left: 11px;
}
.atlas-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.atlas-form {
  min-width: 0;
  background: linear-gradient(140deg, #192c48, #111c32);
  border: 1px solid #7d95ad70;
  border-radius: 8px;
  overflow: hidden;
}
.atlas-form-image {
  position: relative;
  aspect-ratio: 3/2;
  overflow: hidden;
  background: #202f48;
}
.atlas-form-image > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.atlas-form-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 9px;
  background: radial-gradient(ellipse at 50% 50%, #415874, #172841);
}
.atlas-energy {
  position: absolute;
  left: 50%;
  top: 25%;
  transform: translate(-50%, -50%);
  font-size: clamp(4rem, 10vw, 8rem);
  opacity: 0.11;
}
.atlas-form-placeholder strong {
  font:
    900 clamp(3rem, 9vw, 6rem)/1 Impact,
    sans-serif;
  color: #b0c6de99;
  letter-spacing: 0.08em;
}
.atlas-form-placeholder small {
  font-size: 10px;
  color: #c8d7e8;
  letter-spacing: 0.11em;
  font-weight: 900;
}
.atlas-form-banner {
  position: absolute;
  left: 9px;
  top: 9px;
  padding: 6px 9px;
  font-size: 10px;
  letter-spacing: 0.11em;
  font-weight: 900;
  background: #eed29d;
  color: #18243a;
  transform: skew(-7deg);
}
.atlas-villain .atlas-form-banner {
  background: #ff9c91;
}
.atlas-art-state {
  position: absolute;
  right: 8px;
  bottom: 9px;
  background: #182940dd;
  padding: 5px 7px;
  font-size: 10px;
}
.atlas-art-state.delivered {
  color: #9be4bd;
}
.atlas-form-body {
  padding: 11px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.atlas-form-body h4 {
  font-size: 17px;
  font-weight: 900;
}
.atlas-form-body > p {
  font-size: 12px;
  color: #e5cfac;
}
.atlas-form-body .atlas-method {
  font-size: 12px;
  color: #c2cede;
  line-height: 1.45;
}
.atlas-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}
.atlas-stats > div {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  border-bottom: 1px dotted #7890ad66;
  padding-bottom: 4px;
  font-size: 11px;
}
.atlas-stats b {
  color: #f5d59b;
}
.atlas-form-body code {
  word-break: break-all;
  color: #9cafc5;
  font-size: 10px;
}
.atlas-ranks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.atlas-rank {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #20344d;
  border: 1px solid #9db0c05e;
  border-radius: 8px;
}
.atlas-support-art {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border: 1px solid #7694ac77;
  border-radius: 5px;
  background: #14263c;
}
.atlas-support-art img { width: 100%; height: 100%; object-fit: contain; }
.atlas-support-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 5px;
  text-align: center;
  background: radial-gradient(circle at 50% 25%, #47617b, #17263d 68%);
}
.atlas-support-empty strong { font: 900 clamp(2rem, 5vw, 4rem)/1 Impact, sans-serif; opacity: .45; }
.atlas-support-empty span { font-size: 10px; font-weight: 900; letter-spacing: .08em; color: #f6d6a2; }
.atlas-minions {
  border-top: 4px solid #c4d77f;
}
.atlas-lieutenant {
  border-top: 4px solid #8dc9dc;
}
.atlas-rank h4 {
  font:
    900 clamp(1.25rem, 2vw, 1.75rem)/1 Impact,
    sans-serif;
}
.atlas-rank-subtitle {
  font-size: 11px !important;
  font-weight: 800;
  color: #e8cb97 !important;
}
.atlas-rank > p:not(.atlas-eyebrow) {
  font-size: 12px;
  line-height: 1.45;
  color: #c3d0e0;
}
.atlas-rank dl {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.atlas-rank dl > div {
  border-top: 1px solid #91a5b93d;
  padding-top: 7px;
}
.atlas-rank dt {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #a0d0e1;
}
.atlas-rank dd {
  font-size: 12px;
  line-height: 1.43;
  color: #ecede7;
}
.atlas-rank-foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: #a7bacf;
  line-height: 1.35;
}
.atlas-unlinked {
  color: #f3c795;
  white-space: nowrap;
  font-weight: 800;
}
.atlas-missions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.atlas-missions article {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  background: #12243b;
  border-left: 3px solid #bfad79;
}
.atlas-missions span {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #bcd0df;
}
.atlas-missions strong {
  font-weight: 900;
  color: #f0d09c;
}
.atlas-missions p {
  font-size: 12px;
  color: #c1cfe0;
}
.atlas-footnote {
  font-size: 11px;
  line-height: 1.5;
  color: #95aac1;
  padding-bottom: 18px;
}
@media (max-width: 850px) {
  .atlas-layout {
    grid-template-columns: 1fr;
  }
  .atlas-roster {
    position: relative;
    max-height: none;
  }
  .atlas-roster-grid {
    display: flex;
    overflow-x: auto;
  }
  .atlas-identity {
    min-width: 155px;
  }
  .atlas-avatar {
    width: 36px;
    height: 36px;
  }
  .atlas-heading {
    align-items: start;
  }
}
@media (max-width: 540px) {
  .atlas-form-grid,
  .atlas-ranks,
  .atlas-missions {
    grid-template-columns: 1fr;
  }
  .atlas-heading {
    flex-direction: column;
  }
  .atlas-delivery {
    align-self: start;
    text-align: left;
  }
  .atlas-form-image {
    aspect-ratio: 2/1;
  }
}
</style>
