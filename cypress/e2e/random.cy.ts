// cypress/e2e/api/random-list.cy.ts

describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random';
  const apiKey = Cypress.env('API_KEY');
  let randomListId: number; // Explicitly define the type as number
  const uniqueTitle = `Dreams-${Date.now()}`; // Generate a unique title using Date.now()
  const userId: number = 1; // Example user ID (assuming 1 is valid)

  it('Create a New RandomList', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: uniqueTitle,
        items: [`Dream-${Date.now()}-1`, `Dream-${Date.now()}-2`, `Dream-${Date.now()}-3`],
        userId: userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      assert.isObject(response.body.randomList, 'randomList is an object');
      randomListId = response.body.randomList.id; // Ensure the correct ID is captured
      console.log('Created RandomList ID:', randomListId); // Log for debugging
    });
  });

  it('Get RandomList by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.randomList.title).to.eq(uniqueTitle); // Expect the correct title
    });
  });

  it('Get RandomList by Title', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/title/${uniqueTitle}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.randomList.title).to.eq(uniqueTitle); // Expect the correct title
    });
  });

  it('Get RandomLists by User ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/user/${userId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.randomLists)
        .to.be.an('array')
        .and.have.length.greaterThan(0); // Verify it returns an array with elements
    });
  });

  it('Get All RandomLists', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.randomLists)
        .to.be.an('array')
        .and.have.length.greaterThan(0); // Verify it returns an array with elements
    });
  });

  it('Update a RandomList by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: `Updated-${uniqueTitle}`,
        items: [`Updated-Dream-${Date.now()}-1`, `Updated-Dream-${Date.now()}-2`],
        userId: userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('Delete a RandomList by ID', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the RandomList created during the test
  after(() => {
    if (randomListId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${randomListId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted RandomList ID:', randomListId);
      });
    }
  });
});