import HeaderUpgrade from './HeaderUpgrade.vue'

describe('<HeaderUpgrade />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(HeaderUpgrade)
  })
})