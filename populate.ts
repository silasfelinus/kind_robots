import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, 'output.sql');
  const sqlQuery = fs.readFileSync(sqlPath, 'utf-8');

  // If you have multiple SQL queries in one file, split them by ';' and execute them separately
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