// cypress/e2e/api/post.cy.ts
 

describe('Post Management API Tests', () => {
    const baseUrl = 'https://kindrobots.org/api/posts';
    const apiKey = Cypress.env('API_KEY');
    let postId: number; // Explicitly define the type as number
    const userId: number = 1; // Example user ID (assuming 1 is valid)
  
    it('Create a New Post', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          userId: userId,
          username: 'testuser',
          content: 'This is a test post content.',
          title: 'Test Post Title',
          label: 'General',
          imagePath: '/images/test-post.jpg',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newPost).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        postId = response.body.newPost.id; // Ensure the correct ID is captured
        console.log('Created Post ID:', postId); // Log for debugging
      });
    });
  
    it('Get Post by ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.post.title).to.eq('Test Post Title'); // Expect the correct title
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
  
    it('Update a Post', () => {
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
      });
    });
  
    it('Delete a Post', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  
    // Ensure all changes are reverted by deleting the post created during the test
    after(() => {
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
          console.log('Reverted Post ID:', postId);
        });
      }
    });
  });
  