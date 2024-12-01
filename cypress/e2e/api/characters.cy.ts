/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/character.cy.ts

describe('Character Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/characters';
  const userToken = Cypress.env('USER_TOKEN');
  const invalidToken = 'someInvalidTokenValue';
  let characterId: number | undefined; // Define with undefined for clarity
  const uniqueCharacterName = `Character-${Date.now()}`; // Generate a unique character name

  // Step 1: Attempt to create a character with various authentication scenarios

  it('should not allow creating a character without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.include(
        'Authorization token is required',
      );
    });
  });

  it('should not allow creating a character with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.include('Invalid or expired token');
    });
  });

  it('Create a New Character with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('object').that.is.not.empty;
      characterId = response.body.data.id;
    });
  });

  // Step 2: Attempt to update character without authentication
  it('Attempt to Update Character without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401); // Unauthorized without token
    });
  });

  // Step 3: Attempt to update character with invalid token
  it('Attempt to Update Character with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { name: 'Invalid Update Attempt' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401); // Unauthorized with invalid token
    });
  });

  // Step 4: Update character with valid authentication
  it('Update Character with Authentication', () => {
    const updatedCharacterName = `Updated-${uniqueCharacterName}`;
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { name: updatedCharacterName },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.name).to.eq(updatedCharacterName);
    });
  });

  // Step 5: Retrieve character by ID
  it('Retrieve Character by ID', () => {
    cy.wrap(characterId).should('exist'); // Ensure characterId exists
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.name).to.include('Updated-');
    });
  });

  // Step 6: Retrieve all characters
  it('Retrieve All Characters', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  // Step 7: Attempt to delete character without authentication
  it('Attempt to Delete Character without Authentication (expect failure)', () => {
    cy.wrap(characterId).should('exist'); // Ensure characterId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401); // Unauthorized without token
    });
  });

  // Step 8: Attempt to delete character with invalid token
  it('Attempt to Delete Character with Invalid Token (expect failure)', () => {
    cy.wrap(characterId).should('exist'); // Ensure characterId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401); // Unauthorized with invalid token
    });
  });

  // Step 9: Delete character with valid authentication
  it('Delete Character with Authentication', () => {
    cy.wrap(characterId).should('exist'); // Ensure characterId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include(
        `Character with ID ${characterId} successfully deleted`,
      );
    });
  });
});
