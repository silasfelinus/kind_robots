/// <reference types="cypress" />
// Shifting Desks endings browser contract (conductor shifting-desks t-026).
// Every ending is loaded from a save the real engine reached naturally
// (utils/shiftingDesks/endingSaves.ts), through the player's own localStorage,
// into the mounted page, store and Personnel File. Read-only: nothing here
// calls a Kind Robots API or writes anywhere but this browser's storage.
import {
  type EndingSave,
  naturalEndingSaves,
} from '../../utils/shiftingDesks/endingSaves'
import { ENDINGS } from '../../utils/shiftingDesks/rules'
import {
  ENDING_COMMENDATIONS,
  emptyRewardArchive,
  ordinal,
  receiptFor,
  recordReward,
} from '../../utils/shiftingDesks/rewards'

const SAVE_KEY = 'shifting-desks-run-v1'
const ENVELOPE_KEY = 'shifting-desks-envelope-opened-v1'
const ENDINGS_KEY = 'shifting-desks-endings-v1'
const REWARD_KEY = 'shifting-desks-rewards-v1'
const PAGE = '/play/shifting-desks'

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

const saves = naturalEndingSaves()

// textContent ignores CSS text-transform, so uppercase headings still match
// their source copy exactly.
const squash = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim()

function seedBrowser(win: Window, save: EndingSave): void {
  win.localStorage.clear()
  win.localStorage.setItem(SAVE_KEY, JSON.stringify(save.run))
  win.localStorage.setItem(ENVELOPE_KEY, save.run.seed)
}

function openPersonnelFile(): void {
  cy.contains('button', 'Return to your desk', { timeout: 60000 }).click()
  cy.get('article[aria-label="Epilogue"]', { timeout: 20000 }).should(
    'be.visible',
  )
}

function assertEpilogue(save: EndingSave): void {
  cy.get('article[aria-label="Epilogue"]').should(($article) => {
    const text = squash($article[0]?.textContent)
    expect(text, 'epilogue title').to.include(squash(save.epilogueTitle))
    for (const line of save.lines)
      expect(text, 'flag variant line').to.include(squash(line))
    // Secret and default eliminations must never both claim the card.
    for (const other of ENDINGS)
      if (other.id !== save.ending)
        expect(text, `not ${other.id}`).not.to.include(
          squash(other.epilogue.title),
        )
  })
  // The reward panel grows with its content, so its archive button is never
  // clipped by the panel at any screen width (t-046).
  cy.get('[aria-label="Your ending reward"]').should(($panel) => {
    const panel = $panel[0]!.getBoundingClientRect()
    const button = $panel.find('button')[0]?.getBoundingClientRect()
    expect(button, 'archive button').to.exist
    expect(button!.top, 'archive button top').to.be.at.least(panel.top - 1)
    expect(button!.bottom, 'archive button bottom').to.be.at.most(
      panel.bottom + 1,
    )
  })
  cy.window().should((win) => {
    expect(
      win.document.documentElement.scrollWidth,
      'no horizontal overflow',
    ).to.be.at.most(win.innerWidth + 1)
    const found = JSON.parse(win.localStorage.getItem(ENDINGS_KEY) ?? '[]')
    expect(found, 'ending recorded for the gallery').to.include(save.ending)
  })
}

describe('Shifting Desks endings from naturally reached saves', () => {
  // Validate the deployed front desk once instead of running 35 misleading
  // ending assertions against an unavailable or stale page for 25 minutes.
  before(() => {
    cy.viewport(390, 844)
    cy.visit(PAGE, { onBeforeLoad: (win) => seedBrowser(win, saves[0]!) })
    cy.url().should('include', PAGE)
    cy.contains('button', 'Return to your desk', { timeout: 15000 }).should(
      'be.visible',
    )
  })

  it('reaches every ending, secret and default elimination included', () => {
    expect(saves.map((s) => s.ending)).to.have.members(ENDINGS.map((e) => e.id))
    const eliminated = saves.filter((s) => s.run.status === 'eliminated')
    expect(eliminated.map((s) => s.kind)).to.have.members([
      'elimination',
      'secret',
    ])
    expect(
      saves.reduce((n, s) => n + s.lines.length, 0),
      'saves carry flag variant lines',
    ).to.be.at.least(saves.length)
  })

  for (const viewport of viewports) {
    describe(viewport.name, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height)
      })

      for (const save of saves) {
        it(`${save.ending} (${save.policy}, ${save.seed})`, () => {
          cy.visit(PAGE, { onBeforeLoad: (win) => seedBrowser(win, save) })
          openPersonnelFile()
          assertEpilogue(save)
        })
      }
    })
  }

  // The browser contract also exercises actual keyboard focus and named panels
  // at every supported screen shape, rather than trusting template-only checks.
  for (const viewport of viewports) {
    it(`${viewport.name}: personnel tabs and the archive are keyboard reachable`, () => {
      cy.viewport(viewport.width, viewport.height)
      cy.visit(PAGE, { onBeforeLoad: (win) => seedBrowser(win, saves[0]!) })
      openPersonnelFile()

      cy.get('#personnel-file-tab-verdict').focus().type('{rightarrow}')
      cy.get('#personnel-file-tab-departments')
        .should('be.focused')
        .and('have.attr', 'aria-selected', 'true')
      cy.get('#personnel-file-panel-departments')
        .should('be.visible')
        .and('have.attr', 'tabindex', '0')
        .and('have.attr', 'aria-labelledby', 'personnel-file-tab-departments')
      cy.get('#personnel-file-panel-departments').focus().should('be.focused')

      cy.get('#personnel-file-tab-departments').focus().type('{end}')
      cy.get('#personnel-file-tab-record').should('be.focused')
      cy.get('#personnel-file-tab-record').type('{home}')
      cy.get('#personnel-file-tab-verdict').should('be.focused')

      cy.get('[aria-label="Your ending reward"] button').click()
      cy.get('dialog[aria-labelledby="personnel-archive-heading"]').should(
        'be.visible',
      )
      cy.get('#personnel-archive-tab-milestones').focus().type('{rightarrow}')
      cy.get('#personnel-archive-tab-endings')
        .should('be.focused')
        .and('have.attr', 'aria-selected', 'true')
      cy.get('#personnel-archive-panel')
        .should('be.visible')
        .and('have.attr', 'aria-labelledby', 'personnel-archive-tab-endings')
        .and('have.attr', 'tabindex', '0')
      cy.get('section[aria-label="Ending collection"]').should('be.visible')
      cy.get('[data-testid="locked-ending-slot"]').should(
        'have.length',
        ENDINGS.length - 1,
      )
      cy.get('#personnel-archive-panel').focus().should('be.focused')
      cy.get('#personnel-archive-tab-endings').focus().type('{end}')
      cy.get('#personnel-archive-tab-runs').should('be.focused')
      cy.get('#personnel-archive-tab-runs').type('{home}')
      cy.get('#personnel-archive-tab-milestones').should('be.focused')

      cy.get('dialog[aria-labelledby="personnel-archive-heading"]')
        .contains('button', 'Close')
        .click()
      cy.get('dialog[aria-labelledby="personnel-archive-heading"]').should(
        'not.be.visible',
      )
      cy.window().should((win) => {
        expect(win.document.documentElement.scrollWidth).to.be.at.most(
          win.innerWidth + 1,
        )
      })
    })
  }

  // A repeat completion presents its ending's own commendation, counted,
  // instead of replaying the first-ending award (t-046).
  for (const save of saves) {
    it(`${save.ending}: a repeat completion gets its own commendation`, () => {
      const receipt = receiptFor(save.run, '2026-11-01T12:00:00Z')!
      const earlier = recordReward(
        emptyRewardArchive(),
        { ...receipt, id: receipt.id + '-earlier' },
        [save.ending],
      )
      const commendation = ENDING_COMMENDATIONS[save.ending]!
      cy.viewport(390, 844)
      cy.visit(PAGE, {
        onBeforeLoad: (win) => {
          seedBrowser(win, save)
          win.localStorage.setItem(REWARD_KEY, JSON.stringify(earlier))
          win.localStorage.setItem(ENDINGS_KEY, JSON.stringify([save.ending]))
        },
      })
      openPersonnelFile()
      cy.get('[aria-label="Your ending reward"]').should(($panel) => {
        const text = squash($panel[0]?.textContent)
        expect(text).to.include(commendation.title)
        expect(text).to.include(
          squash(commendation.repeat.replace('{nth}', ordinal(2))),
        )
        expect(text).not.to.include('A Permanent Position')
      })
      assertEpilogue(save)
    })
  }

  it('keeps the same saved run across a real reload', () => {
    const save = saves.find((s) => s.lines.length > 1) ?? saves[0]!
    cy.viewport(390, 844)
    cy.visit(PAGE, { onBeforeLoad: (win) => seedBrowser(win, save) })
    openPersonnelFile()
    assertEpilogue(save)
    cy.reload()
    openPersonnelFile()
    assertEpilogue(save)
    cy.window().should((win) => {
      const stored = JSON.parse(win.localStorage.getItem(SAVE_KEY) ?? 'null')
      expect(stored?.seed, 'persisted seed').to.equal(save.run.seed)
      expect(stored?.status).to.equal(save.run.status)
    })
  })

  it('keeps the epilogue readable when its art fails to load', () => {
    const save = saves[0]!
    cy.intercept(
      { method: 'GET', url: /\/images\/shifting-desks\/.+\.webp/ },
      { statusCode: 404 },
    )
    cy.viewport(768, 1024)
    cy.visit(PAGE, { onBeforeLoad: (win) => seedBrowser(win, save) })
    openPersonnelFile()
    cy.get('article[aria-label="Epilogue"] .desk-art')
      .first()
      .should('be.visible')
      .and(($art) => {
        expect(squash($art[0]?.textContent)).to.match(/art brief/i)
      })
    assertEpilogue(save)
  })
})

describe('Shifting Desks settings and employee identity', () => {
  for (const viewport of viewports) {
    it(`${viewport.name}: saves preferences and a personalized employee through reload`, () => {
      cy.viewport(viewport.width, viewport.height)
      cy.visit(PAGE, { onBeforeLoad: (win) => win.localStorage.clear() })
      cy.get('button[title="Game settings"]').click()
      cy.get('dialog[aria-labelledby="shifting-desks-settings-heading"]')
        .should('be.visible')
        .within(() => {
          cy.get('select[aria-label="Story text size"]').select('large')
          cy.get('select[aria-label="Card transition speed"]').select('instant')
          cy.get('select[aria-label="Contrast"]').select('high')
          cy.contains('button', 'Close').click()
        })
      cy.get('main.kr-surface')
        .should('have.attr', 'data-text-size', 'large')
        .and('have.attr', 'data-contrast', 'high')
      cy.contains('button', 'Begin').click()
      cy.get('input[aria-label="Employee name"]').type('Agent Paperclip')
      cy.get('select[aria-label="Employee pronouns"]').select('they/them')
      cy.get('select[aria-label="Badge photo treatment"]').select('plum')
      cy.contains('button', /^Hire on as /).click()
      cy.window().should((win) => {
        const run = JSON.parse(win.localStorage.getItem(SAVE_KEY) ?? 'null')
        expect(run?.version).to.equal(6)
        expect(run?.identity).to.deep.equal({
          name: 'Agent Paperclip',
          pronouns: 'they/them',
          badgeTone: 'plum',
        })
      })
      cy.reload()
      cy.get('main.kr-surface')
        .should('have.attr', 'data-text-size', 'large')
        .and('have.attr', 'data-reading-speed', 'instant')
      cy.contains('button', 'Return to your desk').click()
      cy.window().should((win) => {
        const run = JSON.parse(win.localStorage.getItem(SAVE_KEY) ?? 'null')
        expect(run?.identity?.name).to.equal('Agent Paperclip')
      })
    })
  }

  it('requires confirmation to erase progress without erasing preferences', () => {
    cy.viewport(390, 844)
    cy.visit(PAGE, { onBeforeLoad: (win) => win.localStorage.clear() })
    cy.contains('button', 'Begin').click()
    cy.contains('button', /^Hire on as /).click()
    cy.get('button[title="Game settings"]').click()
    cy.get('dialog[aria-labelledby="shifting-desks-settings-heading"]').within(
      () => {
        cy.get('select[aria-label="Story text size"]').select('extra-large')
        cy.contains('button', 'Erase local game progress').click()
      },
    )
    cy.window().should((win) => {
      expect(win.localStorage.getItem(SAVE_KEY)).not.to.be.null
    })
    cy.contains('button', 'Confirm: erase all local game progress').click()
    cy.window().should((win) => {
      expect(win.localStorage.getItem(SAVE_KEY)).to.be.null
      expect(win.localStorage.getItem('shifting-desks-rewards-v1')).to.be.null
      expect(
        JSON.parse(
          win.localStorage.getItem('shifting-desks-settings-v1') ?? '{}',
        ).textSize,
      ).to.equal('extra-large')
    })
    cy.contains('button', 'Begin').should('be.visible')
  })
})
