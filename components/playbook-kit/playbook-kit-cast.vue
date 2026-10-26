<template>
  <div class="flex flex-col gap-4">
    <section
      v-for="group in groups"
      :key="group.role"
      class="flex flex-col gap-2"
    >
      <p class="text-[10px] font-semibold uppercase tracking-[.2em] opacity-70">
        {{ group.label }}
      </p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-2"
      >
        <li
          v-for="member in group.members"
          :key="member.id"
          class="overflow-hidden rounded-xl border bg-base-200/60"
          :class="
            member.role === 'villain'
              ? 'border-error/40'
              : 'border-base-content/10'
          "
        >
          <span class="relative block aspect-[4/5]">
            <PlaybookKitArt
              :art="member.portrait"
              :tone="
                member.role === 'villain'
                  ? 'error'
                  : factionTone(member.faction)
              "
              icon="kind-icon:user"
              class="absolute inset-0"
            />
            <span
              v-if="member.primary"
              class="badge badge-error badge-sm absolute left-1.5 top-1.5 gap-1"
            >
              <Icon name="kind-icon:crown" class="size-3" />
              Nemesis
            </span>
            <span
              v-if="member.romance && kit.settings.romance === 'on'"
              class="badge badge-secondary badge-sm absolute right-1.5 top-1.5"
              :title="member.romance.arc"
            >
              <Icon name="kind-icon:heart" class="size-3" />
            </span>
          </span>
          <span class="flex flex-col gap-0.5 p-2">
            <span class="pk-display text-sm font-bold">{{ member.name }}</span>
            <span class="pk-dim text-xs leading-snug opacity-80">{{
              member.tagline
            }}</span>
            <span
              v-if="member.faction"
              class="mt-1 self-start rounded-full border border-base-content/15 px-1.5 text-[10px]"
            >
              {{ factionName(member.faction) }}
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import type {
  KitCastRole,
  KitTone,
  PlaybookKitSpec,
} from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()

const LABELS: Record<KitCastRole, string> = {
  follower: 'Followers',
  villain: 'Villains',
  figure: 'Figures',
}

const groups = computed(() =>
  (['follower', 'villain', 'figure'] as KitCastRole[])
    .map((role) => ({
      role,
      label: LABELS[role],
      members: props.spec.cast
        .filter((member) => member.role === role)
        .sort((a, b) => Number(!!b.primary) - Number(!!a.primary)),
    }))
    .filter((group) => group.members.length),
)

function factionName(id: string): string {
  return props.spec.factions.find((f) => f.id === id)?.name ?? id
}

function factionTone(id?: string): KitTone {
  return props.spec.factions.find((f) => f.id === id)?.tone ?? 'primary'
}
</script>
