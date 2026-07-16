import mariadb from 'mariadb'
const pool = mariadb.createPool({
  host: 'acrocatranch.com',
  port: 5544,
  user: 'kindrobot',
  password: process.env.P,
  database: 'kindblank_fresh',
  connectionLimit: 2,
  ssl: { rejectUnauthorized: false } // == your reject=false config
})
try {
  const c = await pool.getConnection()
  console.log('CONNECTED:', await c.query('SELECT 1 AS ok'))
  c.release()
} catch (e) {
  console.error('DRIVER FAILED:', e)
} finally {
  await pool.end()
}
