import { Pool } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log('Querying tables...');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tablesRes.rows.map(r => r.table_name));

    const clinicsCount = await pool.query('SELECT COUNT(*) FROM clinics');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Clinics count: ${clinicsCount.rows[0].count}`);
    console.log(`Users count: ${usersCount.rows[0].count}`);

    if (parseInt(usersCount.rows[0].count) > 0) {
      const existingUsers = await pool.query('SELECT id, email, role, is_active FROM users LIMIT 10');
      console.log('Users detail:', existingUsers.rows);
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

main();
