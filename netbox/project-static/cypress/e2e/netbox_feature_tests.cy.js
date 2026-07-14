describe('NetBox - Device Type Image Columns', () => {

  beforeEach(() => {
    // 1. Visit your local NetBox instance 
    cy.visit('http://localhost:8000')

    const username = Cypress.env('NETBOX_USERNAME') || 'admin'
    const password = Cypress.env('NETBOX_PASSWORD') || 'admin'
    // 2. Log in
    cy.get('#id_username').type(username)
    cy.get('#id_password').type(`${password}{enter}`)
    
  })

  it('should allow a user to add Front Image, Rear Image, and Image Counter columns', () => {
    // 3. Navigate to the Device Types page
    cy.visit('http://localhost:8000/dcim/device-types/')

    // 4. Click the table configuration button to open the column picker
    cy.contains('button', 'Configure Table').click()

    // 5. Select the new optional columns from the list/select box
    // (Depending on how NetBox renders its column picker, you might need to click checkboxes 
    // or select options from a multiple select dropdown)
    cy.get('#id_columns').select(['front_image', 'rear_image', 'images_count']) 

    // 6. Save the table configuration
    cy.get('button[type="submit"]').contains('Save').click()

    // 7. Check that the new column headers now exist in the table header (thead)
    cy.get('table th').should('contain', 'Front Image')
    cy.get('table th').should('contain', 'Rear Image')
    cy.get('table th').should('contain', 'Images')
  })

  it('should allow a user to create a new Site successfully', () => {
    cy.visit('http://localhost:8000/dcim/sites/add/')
    cy.get('#id_name').type('Segundo Data Center ICEA')
    cy.get('button[name="_create"]').click()
    cy.url().should('include', '/dcim/sites/')
    cy.get('h1').should('contain', 'Segundo Data Center ICEA')
  })

  it('should allow a user to create a new VLAN successfully', () => {
    cy.visit('http://localhost:8000/ipam/vlans/add/')
    cy.get('#id_vid').type('200')
    cy.get('#id_name').type('VLAN-TESTE-NOVO')
    cy.get('button[name="_create"]').click()
    cy.url().should('include', '/ipam/vlans/')
    cy.get('h1').should('contain', 'VLAN-TESTE-NOVO')
  })

})