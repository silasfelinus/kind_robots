/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Post Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/posts';
  const apiKey = Cypress.env('API_KEY');
  let postId: number;
  const userId: number = 1;

  before(() => {
    // Create a post before all tests
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        username: 'silasfelinus',
        content: 'This is a test post content.',
        title: 'Test Post Title',
        label: 'General',
        imagePath: '/images/test-post.jpg',
        botId: null,
        channelId: null,
        isFavorite: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.post).to.be.an('object').that.is.not.empty;
      postId = response.body.post.id; // Assign the postId here
      cy.wrap(postId).as('postId'); // Alias postId for future use
      cy.log('Created Post ID:', postId); // Log the post ID
    });
  });

  it('Get Post by ID', () => {
    cy.get('@postId').then((postId) => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.post).to.be.an('object').that.is.not.empty;
        expect(response.body.post.title).to.eq('Test Post Title'); // Expect the correct title
      });
    });
  });

  it('Get All Posts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.posts)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Post', function () {
    // Ensure postId alias is set before this test
    cy.get('@postId').then((postId) => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          title: 'Updated Test Post Title',
          content: 'This is updated test post content.',
          likes: 10,
          dislikes: 2,
          loves: 5,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.post.title).to.eq('Updated Test Post Title'); // Verify title is updated
        expect(response.body.post.content).to.eq('This is updated test post content.'); // Verify content is updated
      });
    });
  });

  it('Delete a Post', function () {
    // Ensure postId alias is set before this test
    cy.get('@postId').then((postId) => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log('Deleted Post ID:', postId); // Log the deleted post ID
      });
    });
  });

  after(() => {
    // Clean up if postId still exists after tests
    cy.get('@postId').then((postId) => {
      if (postId) {
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/${postId}`,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          cy.log('Reverted Post ID:', postId); // Log the reverted post ID
        });
      }
    });
  });
});
