// cypress/e2e/api/pitch.cy.ts

describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches';
  const apiKey = Cypress.env('API_KEY');
  let pitchId: number; // Explicitly define the type as number
  const uniquePitchName = `Pitch-${Date.now()}`; // Generate a unique pitch name using Date.now()

  it('Create New Pitch', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        pitch: uniquePitchName,
        description: 'This is a procedurally generated pitch description',
        userId: 1,
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.newPitch).to.be.an('object');
      expect(Object.keys(response.body.newPitch)).to.have.length.greaterThan(0);
      pitchId = response.body.newPitch.id; // Ensure the correct ID is captured
      console.log('Created Pitch ID:', pitchId); // Log for debugging
    });
  });

  it('Get Pitch by ID', () => {
    if (!pitchId) {
      throw new Error('pitchId is undefined, cannot fetch pitch by ID');
    }
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false, // This prevents Cypress from failing the test immediately on a 500 error
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.pitch).to.be.an('object');
      expect(response.body.pitch.pitch).to.eq(uniquePitchName); // Expect the correct pitch name
    });
  });

  it('Get All Pitches', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.pitches)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Pitch', () => {
    if (!pitchId) {
      throw new Error('pitchId is undefined, cannot update pitch by ID');
    }
    const updatedPitchName = `Updated-${uniquePitchName}`;
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        pitch: updatedPitchName,
        description: 'This is an updated pitch description',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.updatedPitch.pitch).to.eq(updatedPitchName); // Verify pitch name is updated
    });
  });

  it('Delete a Pitch', () => {
    if (!pitchId) {
      throw new Error('pitchId is undefined, cannot delete pitch by ID');
    }
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the pitch created during the test
  after(() => {
    if (pitchId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${pitchId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Pitch ID:', pitchId);
      });
    }
  });
});
