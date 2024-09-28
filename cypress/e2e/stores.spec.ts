/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Pinia Stores', () => {
    let storeFiles: string[];

    before(() => {
        // Run the task to get all store files and store them in a variable with proper typing
        cy.task<string[]>('getStoreFiles').then((files) => {
            storeFiles = files; // Type assertion ensures files are treated as string[]
        });
    });

    it('should load all stores correctly', function () {
        // Use the stored files directly instead of using `cy.wrap`
        Cypress.Promise.resolve(storeFiles).then((files) => {
            files.forEach((file: string) => {
                cy.log(`Testing store: ${file}`);

                // Dynamically import each store
                cy.window().then(() => {  // Removed unused `win` argument
                    // Use dynamic import to load the store
                    import(`../../stores/${file}`).then((storeModule) => {
                        const storeName = Object.keys(storeModule)[0]; // Assume default export

                        // Ensure the store module exists
                        expect(storeModule).to.exist;

                        // Initialize the store
                        const store = storeModule[storeName]();
                        expect(store).to.exist;


                    });
                });
            });
        });
    });
});
