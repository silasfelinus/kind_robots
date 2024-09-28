import fs from 'fs';
import path from 'path';

export default (on: Cypress.PluginEvents) => {
  on('task', {
    getStoreFiles() {
      const storeDir = path.resolve(__dirname, '../../stores');
      const storeFiles = fs.readdirSync(storeDir).filter((file: string) => file.endsWith('Store.ts'));
      return storeFiles;
    },
  });
};
