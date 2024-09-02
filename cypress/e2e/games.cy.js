// cypress/e2e/api/games.cy.js
/* eslint-disable no-undef */

describe('Game Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/games'
  let gameId // Store game ID for further operations
  let playerId // Store player ID for further operations

  it('Create New Game', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        descriptor: 'Epic Battle',
        category: 'Battle Royale',
        creator: 'PlayerOne',
        isPrivate: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      gameId = response.body.game.id
    })
  })

  it('Get All Games', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true // Check if the success flag is true
      expect(response.body.games)
        .to.be.an('array') // Now checking the games array inside the response body
        .and.have.length.greaterThan(0) // Ensuring there's at least one game object in the array
    })
  })

  it('Get Specific Game by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${gameId}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true // Ensure the success flag is true
      expect(response.body.game).to.exist // Check that the game object exists

      // Check properties of the game object
      const game = response.body.game
      expect(game.id).to.eq(gameId)
      expect(game.descriptor).to.eq('Epic Battle')
      expect(game.category).to.eq('Battle Royale')
      expect(game.isFinished).to.be.false
      expect(game.creator).to.eq('PlayerOne')
      expect(game.isPrivate).to.be.false
      expect(game.winner).to.be.null

      // Check the Players array
      expect(game.Players).to.be.an('array').with.lengthOf(2) // Expecting two players in the array
      expect(game.Players[0].name).to.eq('PlayerOne')
      expect(game.Players[1].name).to.eq('PlayerTwo')
      expect(game.Players[0].status).to.eq('WAITING')
      expect(game.Players[1].status).to.eq('WAITING')
      expect(game.Players[0].points).to.eq(0)
      expect(game.Players[1].points).to.eq(0)
    })
  })

  it('Join a Game by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${gameId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        action: 'join',
        playerName: 'PlayerTwo',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true // Verify the operation was successful

      // Make an additional request to verify the player has been added
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${gameId}`,
        headers: {
          Accept: 'application/json',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.game.Players).to.deep.include({
          name: 'PlayerTwo',
        }) // Verify the player is now part of the game
      })
    })
  })

  it('Update Player Points in an Active Game', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/players/${playerId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        points: 10,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.points).to.eq(10)
    })
  })

  it('Leave a Game by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${gameId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        action: 'leave',
        playerName: 'PlayerTwo',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Resolve a Game by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${gameId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        action: 'resolve',
        winnerName: 'PlayerOne',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.winner).to.eq('PlayerOne')
    })
  })

  it('Update Player Status', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/players/${playerId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        status: 'PLAYING',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.status).to.eq('PLAYING')
    })
  })

  it('Update Player Avatar Image', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/players/${playerId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        avatarImage: 'https://example.com/avatar.png',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.avatarImage).to.eq('https://example.com/avatar.png')
    })
  })

  // Add additional tests for updating player points, status, or multiple fields as needed.
})
