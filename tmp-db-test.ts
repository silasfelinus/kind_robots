import 'dotenv/config'

async function main() {
  const { default: prisma } = await import('./server/utils/prisma')

  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 AS ok')
    console.log(result)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
