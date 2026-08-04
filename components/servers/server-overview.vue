<!-- /components/servers/server-overview.vue -->
<!--
  Server manager's "overview" tab: a genuine two-owner grid (galleries column
  + interact column, both mounted and scrolling concurrently). Extracted out
  of server-manager.vue (interface-vision t-058) so the .kr-panes/.kr-pane-scroll
  primitive lives in a file that declares ONLY the multi-owner shape -- mixing
  it with server-manager.vue's other, genuinely single-owner tabs in one file
  is what the one-scroll rule forbids, and rightly so: the other five tabs are
  mutually-exclusive v-else-if branches with one real scroll region each.
-->
<template>
  <section
    class="kr-panes grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
  >
    <div class="kr-pane-scroll flex flex-col gap-4 xl:col-span-5">
      <server-gallery
        mode="art"
        variant="dropdown"
        :show-header="false"
        :show-controls="false"
        :show-card-actions="false"
        :show-descriptions="true"
        :show-meta="true"
        :show-capabilities="false"
        :show-use-buttons="false"
        :show-workflow="false"
        :show-defaults="false"
        :show-status="false"
      />

      <server-gallery
        mode="text"
        variant="dropdown"
        :show-header="false"
        :show-controls="false"
        :show-card-actions="false"
        :show-descriptions="true"
        :show-meta="true"
        :show-capabilities="false"
        :show-use-buttons="false"
        :show-workflow="false"
        :show-defaults="false"
        :show-status="false"
      />

      <checkpoint-gallery
        variant="compact"
        :show-header="false"
        :show-controls="false"
        :show-status="false"
      />
    </div>

    <div class="kr-pane-scroll xl:col-span-7">
      <server-interact />
    </div>
  </section>
</template>
