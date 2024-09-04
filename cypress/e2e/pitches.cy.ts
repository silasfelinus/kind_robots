describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches';
  const apiKey = Cypress.env('API_KEY');
  let pitchId: number; // Explicitly define the type as number
  const uniquePitchName = `Pitch-${Date.now()}`; // Generate a unique pitch name using Date.now()

  it('Should create a new pitch and capture its ID', () => {
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
        PitchType: "INSPIRATION",
        userId: 1,
        playerId: 1,
      },
    }).then((response) => {
      expect(response.status).to.eq(200, 'Response status should be 200');
      expect(response.body.pitch).to.be.an('object', 'New pitch should be an object');
      expect(Object.keys(response.body.pitch)).to.have.length.greaterThan(0, 'New pitch object should not be empty');
      pitchId = response.body.pitch.id;
      console.log('Created Pitch ID:', pitchId); // Log for debugging
    });
  });

  it('Should retrieve the pitch by ID and verify details', () => {
    if (!pitchId) {
      throw new Error('pitchId is undefined, cannot fetch pitch by ID');
    }
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${pitchId}`, // Adjust URL path to match your API
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200, 'Response status should be 200');
      expect(response.body.pitch).to.be.an('object', 'Pitch object should be returned');
      expect(response.body.pitch.pitch).to.eq(uniquePitchName, 'Pitch name should match the created unique pitch name');
    });
  });

  it('Should retrieve all pitches', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/batch`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200, 'Response status should be 200');
      expect(response.body.pitches).to.be.an('array').and.have.length.greaterThan(0, 'Pitches array should not be empty');
    });
  });

  it('Should update the pitch and verify changes', () => {
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
      expect(response.status).to.eq(200, 'Response status should be 200');
      expect(response.body.pitch).to.eq(updatedPitchName, 'Pitch name should be updated');
    });
  });

  it('Should delete the pitch', () => {
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
      expect(response.status).to.eq(200, 'Response status should be 200');
    });
  });

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
        expect(response.status).to.eq(200, 'Pitch should be deleted successfully');
        console.log('Reverted Pitch ID:', pitchId);
      });
    }
  });
});
