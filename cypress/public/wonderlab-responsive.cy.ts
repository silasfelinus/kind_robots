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

function visitWonderLab(path = '/wonderlab'): void {
  cy.intercept('GET', '**/api/components*').as('components')
  cy.visit(path)
  cy.wait('@components', { timeout: 30_000 })
    .its('response.statusCode')
    .should('eq', 200)
  cy.contains('h1', 'Component WonderLab', { timeout: 30_000 })
    .scrollIntoView()
    .should('be.visible')
}

describe('Public WonderLab responsive acceptance', () => {
  for (const viewport of viewports) {
    it(`loads and opens an exhibit on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height)
      visitWonderLab()

      cy.get('input[aria-label="Search WonderLab components"]')
        .scrollIntoView()
        .should('be.visible')
      cy.get('select[aria-label="Filter WonderLab components by status"]').should(
        'be.visible',
      )
      cy.get('select[aria-label="Sort WonderLab components"]').should(
        'be.visible',
      )
      cy.contains('button', 'Open exhibit', { timeout: 30_000 })
        .first()
        .scrollIntoView()
        .should('be.visible')
        .click()

      cy.contains('About this exhibit')
        .scrollIntoView()
        .should('be.visible')
      cy.contains('button', 'Clear').scrollIntoView().should('be.visible')
      cy.contains('Reviews').scrollIntoView().should('be.visible')
      expectNoHorizontalOverflow()
    })
  }

  it('restores URL-backed museum state', () => {
    cy.viewport(1280, 800)
    visitWonderLab('/wonderlab?q=bot&status=WORKING&view=list&sort=REVIEWS')

    cy.get('input[aria-label="Search WonderLab components"]').should(
      'have.value',
      'bot',
    )
    cy.get('select[aria-label="Filter WonderLab components by status"]').should(
      'have.value',
      'WORKING',
    )
    cy.get('select[aria-label="Sort WonderLab components"]').should(
      'have.value',
      'REVIEWS',
    )
    cy.contains('button', 'List').should('have.attr', 'aria-pressed', 'true')
    cy.url().should('include', 'q=bot')
    cy.url().should('include', 'status=WORKING')
    cy.url().should('include', 'view=list')
    expectNoHorizontalOverflow()
  })

  for (const viewport of viewports) {
    it(`loads related Lab routes on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height)

      cy.visit('/memory')
      cy.contains(/enter the dungeon/i, { timeout: 30_000 })
        .scrollIntoView()
        .should('be.visible')
      expectNoHorizontalOverflow()

      cy.visit('/screenfx')
      cy.contains('Screen FX', { timeout: 30_000 })
        .scrollIntoView()
        .should('be.visible')
      expectNoHorizontalOverflow()
    })
  }
})
