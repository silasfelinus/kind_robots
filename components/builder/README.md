# /components/builder

Reusable card-based builder frontend for Kind Robots.

## Core component

Use `builder-manager.vue` once a model has registered itself with `useBuilderStore().registerBuilder(config)`.

```vue
<builder-manager />
```

The manager reads everything from `builderStore`:

- active builder config
- splash
- cards
- active card and step
- staged values
- completed cards
- rewards
- stats
- art prompt and art asset
- suggest loading and errors

## Expected store setup

A model-specific page or component should register and activate its builder before rendering:

```ts
const builderStore = useBuilderStore()

builderStore.registerBuilder({
  key: 'scenario',
  label: 'Scenario',
  title: 'Scenario Builder',
  modelType: 'scenario',
  storageKey: 'kindrobots.builder.scenario.v1',
  cards: SCENARIO_CARDS,
  splash: SCENARIO_SPLASH,
  defaultSheet: defaultScenarioSheet,
  coreCardKeys: ['title', 'genre', 'description'],
  requiredCardKeys: ['title', 'genre', 'description', 'intro'],
  finalCardKey: 'art',
})

builderStore.setBuilder('scenario')
```

## Component map

- `builder-manager.vue`: full shell
- `builder-stage.vue`: decides splash, card grid, active step, or summary
- `builder-splash.vue`: landing panel
- `builder-card-grid.vue`: large selectable card grid
- `builder-card.vue`: large card
- `builder-step-panel.vue`: active card/step layout
- `builder-input.vue`: input switcher
- `builder-preset-input.vue`: choice cards with custom/list expansion
- `builder-text-input.vue`: text and long text
- `builder-list-input.vue`: selectable list and custom additions
- `builder-stats-input.vue`: reusable stat assignment
- `builder-reward-input.vue`: reward slot selector
- `builder-art-input.vue`: art prompt and `art-creator`
- `builder-visibility-input.vue`: public/mature toggles
- `builder-custom-input.vue`: fallback input
- `builder-summary.vue`: generic completion screen
