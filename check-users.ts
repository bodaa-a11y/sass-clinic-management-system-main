
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const allUsers = await db.select().from(users).limit(20);
  console.log('--- DB USERS ---');
  allUsers.forEach(u => {
    console.log(`- ${u.email} (${u.role}) - Clinic: ${u.clinicId}`);
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
