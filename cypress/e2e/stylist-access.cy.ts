// /cypress/e2e/stylist-access.cy.ts
//
// Minimal Cypress coverage for /stylist (conductor superkate-hairstyle-ai
// t-021, kaizen from t-018): before this, no Cypress spec referenced
// "stylist" anywhere in the repo. /stylist (content/stylist.md) carries
// `requiredRole: ADMIN`, enforced client-side by
// middleware/navigation-access.global.ts.
//
// This only asserts the access boundary (anonymous visitors get bounced to
// /login with a redirect back to /stylist), not an authenticated admin
// render of Hair Studio: Cypress's only admin-auth mechanism today is the
// header-based beta-admin-token bypass (cypress/support/api-auth.ts), which
// mints a real admin identity for API requests but not a client-usable JWT
// -- server/api/auth/validate/token.ts (what userStore.initialize() calls to
// establish a browser session) requires an actual three-segment JWT and
// rejects the bypass token outright. Visiting /stylist as a real logged-in
// admin needs a seeded admin login (username/password), which no Cypress
// env var currently provides -- filed as a follow-up, not faked here.
describe('/stylist access', () => {
  it('redirects an anonymous visitor to /login instead of rendering Hair Studio', () => {
    cy.visit('/stylist')

    cy.location('pathname', { timeout: 15000 }).should('eq', '/login')
    // Vue Router's query serializer does not percent-encode `/` in query
    // values (it's unreserved in the query component per RFC 3986), so the
    // redirect param may render as either `/stylist` or `%2Fstylist`.
    cy.location('search').should('match', /redirect=(%2F|\/)stylist/)
    cy.contains('Hair Studio').should('not.exist')
  })
})
