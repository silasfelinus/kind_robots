/// <reference types="cypress" />

type Viewport = {
  name: string
  width: number
  height: number
}

const viewports: Viewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const timestamp = '2026-07-28T20:00:00.000Z'

const storyOne = {
  id: 'story-accessibility-one',
  userId: null,
  bible: {
    title: 'The Lantern Archive',
    premise: 'A librarian follows a lantern into a forgotten wing.',
    narratorStyle: 'cinematic',
    structure: 'chaptered',
    cast: [],
    facets: [],
    rewards: [],
    createdAt: timestamp,
  },
  beats: [
    {
      id: 'story-beat-one',
      sessionId: 'story-accessibility-one',
      narrative:
        'The lantern pauses before a sealed brass door, warming the old letters carved into its frame.',
      question: 'Do you open the door or inspect the letters first?',
      stateDelta: {
        consequences: [],
        relationshipShifts: [],
        inventoryAdd: [],
        inventoryRemove: [],
      },
      createdAt: timestamp,
    },
  ],
  branchHistory: [],
  consequences: [],
  inventory: [],
  stateVersion: 1,
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}

const storyTwo = {
  ...storyOne,
  id: 'story-accessibility-two',
  bible: {
    ...storyOne.bible,
    title: 'The Clockwork Orchard',
    premise: 'A mechanical orchard grows one impossible fruit each night.',
  },
  beats: [
    {
      ...storyOne.beats[0],
      id: 'story-beat-two',
      sessionId: 'story-accessibility-two',
      narrative:
        'At midnight, every brass branch turns toward a single silver pear humming in the rain.',
      question: 'Who should pick the pear?',
    },
  ],
}

const taskSession = {
  id: 'task-accessibility-one',
  userId: null,
  seed: {
    userId: null,
    taskTitle: 'Sort the donation boxes',
    vibeTags: ['warm', 'adventurous'],
    tone: 'adventurous',
    surprise: false,
  },
  checkpoints: [
    {
      id: 'checkpoint-one',
      title: 'Label the three donation boxes',
      detail: 'Use keep, donate, and recycle labels.',
      sourceKind: 'direct-task',
      status: 'active',
      updatedAt: timestamp,
    },
  ],
  beats: [
    {
      id: 'task-beat-one',
      sessionId: 'task-accessibility-one',
      narrative:
        'Three supply crates wait beneath the guild banner, each ready for an honest label.',
      question: {
        prompt: 'What happened when you labeled the boxes?',
        realWorldKind: 'direct-task',
        checkpointId: 'checkpoint-one',
      },
      createdAt: timestamp,
    },
  ],
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}

Cypress.on('uncaught:exception', (error) => {
  if (
    /ResizeObserver loop completed with undelivered notifications/i.test(
      error.message,
    )
  ) {
    return false
  }
})

function expectNoHorizontalOverflow(): void {
  cy.document().then((document) => {
    const root = document.documentElement
    expect(
      root.scrollWidth,
      `document width ${root.scrollWidth}px at ${root.clientWidth}px viewport`,
    ).to.be.at.most(root.clientWidth + 2)
  })
}

function preloadStorybook(window: Window): void {
  window.localStorage.setItem('storybook-session', JSON.stringify(storyOne))
  window.localStorage.setItem(
    'storybook-session-library-v1',
    JSON.stringify([storyOne, storyTwo]),
  )
}

function preloadTaskmaster(window: Window): void {
  window.localStorage.setItem('taskmaster-session', JSON.stringify(taskSession))
}

function expectAccessibleTranscript(): void {
  cy.get('section[aria-label="Story transcript"]', { timeout: 30_000 })
    .should('exist')
    .and('have.attr', 'aria-busy')
  cy.get('section[aria-label="Story transcript"] [role="status"]')
    .should('have.attr', 'aria-live', 'polite')
    .and('have.attr', 'aria-atomic', 'true')
  cy.get('article[aria-labelledby]').first().should('exist')
  cy.get('article[aria-labelledby] h3.sr-only').first().should('contain.text', 'Scene 1')
}

describe('Narrative accessibility and resume acceptance', () => {
  for (const viewport of viewports) {
    it(`resumes Storybook with labeled transcript and response controls on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height)
      cy.visit('/storybook', { onBeforeLoad: preloadStorybook })

      cy.contains('The lantern pauses before a sealed brass door', {
        timeout: 30_000,
      }).should('be.visible')
      expectAccessibleTranscript()

      cy.get('label.sr-only').contains('Your response').should('exist')
      cy.get('textarea')
        .should('not.be.disabled')
        .and('have.attr', 'aria-describedby')
        .focus()
        .should('have.focus')
      cy.get('button[aria-label="Continue"]').should('be.disabled')
      cy.get('.motion-reduce\\:transition-none').should('exist')
      expectNoHorizontalOverflow()
    })
  }

  it('opens a saved Storybook branch directly from the URL', () => {
    cy.viewport(1280, 800)
    cy.visit('/storybook?story=story-accessibility-two', {
      onBeforeLoad: preloadStorybook,
    })

    cy.contains('At midnight, every brass branch turns toward a single silver pear', {
      timeout: 30_000,
    }).should('be.visible')
    cy.url().should('include', 'story=story-accessibility-two')
    cy.contains('button', 'Recent stories').click()
    cy.contains('The Clockwork Orchard').should('be.visible')
    cy.contains('The Lantern Archive').should('be.visible')
    expectNoHorizontalOverflow()
  })

  for (const viewport of viewports) {
    it(`shows Taskmaster checkpoint outcomes and accessible response controls on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height)
      cy.visit('/taskmaster', { onBeforeLoad: preloadTaskmaster })

      cy.contains('Current action: Label the three donation boxes', {
        timeout: 30_000,
      }).should('be.visible')
      cy.contains('Three supply crates wait beneath the guild banner').should(
        'be.visible',
      )
      expectAccessibleTranscript()

      cy.contains('What happened in the real world?').should('be.visible')
      cy.contains('button', 'Blocked')
        .should('have.attr', 'aria-pressed', 'false')
        .click()
        .should('have.attr', 'aria-pressed', 'true')
      cy.get('label.sr-only').contains('Your response').should('exist')
      cy.get('textarea').should('not.be.disabled').focus().should('have.focus')
      expectNoHorizontalOverflow()
    })
  }
})
