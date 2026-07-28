// /plugins/taskmaster-product-config.ts
//
// The scenario registry is a large shared constant. During the permanent
// Taskmaster migration, keep its established selection key stable while making
// every rendered product label and route canonical. The key itself is removed
// with the underlying store migration; no /serendipity route is preserved.
import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'
import { tutorialChannels } from '@/stores/helpers/tutorialCards'

type MutableDashboardTab = {
  key: string
  label: string
  title: string
  summary?: string
  image: string
  narrative: string
  route: string
}

type MutableTutorialSection = {
  key: string
  title: string
  body: string
  image: string
}

export default defineNuxtPlugin(() => {
  const scenarioTabs = dashboardConfigs.scenario.tabs as unknown as MutableDashboardTab[]
  const taskTab = scenarioTabs.find((tab) => tab.key === 'serendipity')

  if (taskTab) {
    Object.assign(taskTab, {
      label: 'Taskmaster',
      title: 'Taskmaster',
      summary: 'Turn real objectives into a choice-driven adventure.',
      narrative:
        'Taskmaster wraps real work in a second-person quest while keeping the actual objective visible and every write-back explicit.',
      route: '/taskmaster',
    })
  }

  const tutorialSections = tutorialChannels.scenario.sections as unknown as MutableTutorialSection[]
  const taskTutorial = tutorialSections.find(
    (section) => section.key === 'serendipity',
  )

  if (taskTutorial) {
    Object.assign(taskTutorial, {
      title: 'Taskmaster',
      body: 'Choose a project and narrative ingredients, then advance real objectives through a playful second-person quest. Taskmaster directs story art automatically and never applies real-world changes without review.',
    })
  }
})
