
import { db } from './db';
import { users, clinics } from './db/schema';
import { eq, like } from 'drizzle-orm';

async function diagnose() {
  const admin = (await db.select().from(users).where(eq(users.email, 'clinic@dr-ahmed.com')).limit(1))[0];
  if (!admin) {
    console.log('Clinic Admin not found!');
  } else {
    console.log(`Admin found: ${admin.email}, Clinic ID: ${admin.clinicId}`);
    
    const clinicReceptionists = await db.select().from(users)
      .where(eq(users.clinicId, admin.clinicId || ''))
      .where(eq(users.role, 'receptionist'));
    
    console.log(`Total receptionists for this clinic: ${clinicReceptionists.length}`);
    clinicReceptionists.forEach(r => console.log(`- ${r.name} (${r.email})`));
    
    const allMahmouds = await db.select().from(users).where(like(users.name, '%محمود%'));
    console.log(`Total users named محمود in whole DB: ${allMahmouds.length}`);
    allMahmouds.forEach(m => console.log(`- ${m.name} (${m.email}), Role: ${m.role}, Clinic: ${m.clinicId}`));
  }
  process.exit(0);
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
