Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('http://localhost:8000')
    const username = Cypress.env('NETBOX_USERNAME') || 'admin'
    const password = Cypress.env('NETBOX_PASSWORD') || 'admin'
    cy.get('#id_username', { timeout: 10000 }).type(username)
    cy.get('#id_password').type(`${password}{enter}`)
    cy.url().should('eq', 'http://localhost:8000/')
  })
})

Cypress.Commands.add('hideDebugToolbar', () => {
  cy.get('body').then($body => {
    if ($body.find('#djDebug').length) {
      cy.get('#djDebug').invoke('css', 'display', 'none')
    }
  })
})

describe('NetBox - Device Type Image Columns', () => {

  beforeEach(() => {
    cy.loginAsAdmin()
  })

it('should allow a user to add Front Image, Rear Image, and Image Counter columns', () => {
  cy.visit('http://localhost:8000/dcim/device-types/')
  cy.hideDebugToolbar()

  cy.contains('button', 'Configure Table').click()

  cy.get('#id_available_columns').select('front_image')
  cy.contains('button', 'Add').click()

  cy.get('#id_available_columns').select('rear_image')
  cy.contains('button', 'Add').click()

  cy.get('#id_available_columns').select('image_count')
  cy.contains('button', 'Add').click()

  cy.contains('button', 'Apply').click()

  cy.get('table th').should('contain', 'Front Image')
  cy.get('table th').should('contain', 'Rear Image')
  cy.get('table th').should('contain', 'Images')
})

  it('should allow a user to create a new Site successfully', () => {
    cy.visit('http://localhost:8000/dcim/sites/add/')
    cy.hideDebugToolbar()
    cy.get('#id_name').type('Segundo Data Center ICEA')
    cy.get('button[name="_create"]').click()
    cy.url().should('include', '/dcim/sites/')
    cy.get('h1').should('contain', 'Segundo Data Center ICEA')
  })

  it('should allow a user to create a new VLAN successfully', () => {
    cy.visit('http://localhost:8000/ipam/vlans/add/')
    cy.hideDebugToolbar()
    cy.get('#id_vid').type('200')
    cy.get('#id_name').type('VLAN-TESTE-NOVO')
    cy.get('button[name="_create"]').click()
    cy.url().should('include', '/ipam/vlans/')
    cy.get('h1').should('contain', 'VLAN-TESTE-NOVO')
  })

})