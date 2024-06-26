
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, '../scripts/.sql');
  const sqlQuery = fs.readFileSync(sqlPath, 'utf-8');

  // Split SQL file into individual statements
  const queries = sqlQuery.split(';').filter(query => query.trim());
  for (const query of queries) {
    await prisma.$executeRawUnsafe(query);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
