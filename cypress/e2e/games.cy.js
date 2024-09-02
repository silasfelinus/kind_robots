// cypress/e2e/api/games.cy.js
/* eslint-disable no-undef */

describe('Game Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/games'
  let gameId // Store game ID for further operations
  let playerId // Store player ID for further operations
  const uniqueGameName = `Epic Battle ${Date.now()}` // Unique name for each test run
  const uniquePlayerName = `testuser${Date.now()}` // Unique player name for each test run

  it('Create New Game', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        descriptor: uniqueGameName, // Use the unique game name
        category: 'Battle Royale',
        creator: uniquePlayerName, // Corrected to use the variable
        isPrivate: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      gameId = response.body.game.id // Save the game ID for use in later tests
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
      expect(response.body.success).to.be.true
      expect(response.body.games)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
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
      expect(response.body.success).to.be.true
      expect(response.body.game).to.exist

      const game = response.body.game
      expect(game.id).to.eq(gameId)
      expect(game.descriptor).to.eq(uniqueGameName)
      expect(game.category).to.eq('Battle Royale')
      expect(game.isFinished).to.be.false
      expect(game.creator).to.eq(uniquePlayerName)
      expect(game.isPrivate).to.be.false
      expect(game.winner).to.be.null
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
        playerName: `${uniquePlayerName}2`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.player.name).to.eq(`${uniquePlayerName}2`)

      playerId = response.body.player.id // Save playerId for use in subsequent tests
    })
  })

  it('Update Player Points in an Active Game', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${gameId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        action: 'updatePoints',
        playerName: `${uniquePlayerName}2`,
        points: 10,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.eq('Player points updated')
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
        playerName: `${uniquePlayerName}2`,
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
        winnerName: uniquePlayerName,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.game.winner).to.eq(uniquePlayerName)
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
      expect(response.body.success).to.be.true
      expect(response.body.player.status).to.eq('PLAYING')
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
      expect(response.body.success).to.be.true
      expect(response.body.player.avatarImage).to.eq(
        'https://example.com/avatar.png',
      )
    })
  })
})
