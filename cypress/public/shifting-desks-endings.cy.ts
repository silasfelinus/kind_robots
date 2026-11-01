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

const SAVE_KEY = 'shifting-desks-run-v1'
const ENVELOPE_KEY = 'shifting-desks-envelope-opened-v1'
const ENDINGS_KEY = 'shifting-desks-endings-v1'
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
