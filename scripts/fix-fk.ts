import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function fixForeignKeys() {
  console.log('🔧 Fixing availability_slots.doctor_id FK constraint...');

  try {
    // Find and drop the old FK on availability_slots
    const result = await db.execute(sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'availability_slots'
        AND kcu.column_name = 'doctor_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    if (result.rows.length > 0) {
      const constraintName = result.rows[0].constraint_name as string;
      console.log(`Found constraint: ${constraintName}, dropping...`);
      await db.execute(sql.raw(`ALTER TABLE availability_slots DROP CONSTRAINT "${constraintName}"`));
      console.log('✅ Old FK dropped');
    } else {
      console.log('ℹ️  No existing FK found');
    }

    // Add new FK to users
    await db.execute(sql`
      ALTER TABLE availability_slots
        ADD CONSTRAINT availability_slots_doctor_id_users_fkey
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    `);
    console.log('✅ New FK to users table added');

    // Fix doctor_leaves if needed
    const leavesResult = await db.execute(sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'doctor_leaves'
        AND kcu.column_name = 'doctor_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    for (const row of leavesResult.rows) {
      const cName = row.constraint_name as string;
      await db.execute(sql.raw(`ALTER TABLE doctor_leaves DROP CONSTRAINT "${cName}"`));
    }
    await db.execute(sql`
      ALTER TABLE doctor_leaves
        ADD CONSTRAINT doctor_leaves_doctor_id_users_fkey
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    `);
    console.log('✅ doctor_leaves FK fixed');

    // Fix schedule_exceptions if needed
    const exceptResult = await db.execute(sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'schedule_exceptions'
        AND kcu.column_name = 'doctor_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    for (const row of exceptResult.rows) {
      const cName = row.constraint_name as string;
      await db.execute(sql.raw(`ALTER TABLE schedule_exceptions DROP CONSTRAINT "${cName}"`));
    }
    await db.execute(sql`
      ALTER TABLE schedule_exceptions
        ADD CONSTRAINT schedule_exceptions_doctor_id_users_fkey
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    `);
    console.log('✅ schedule_exceptions FK fixed');

    // Fix waitlist if needed
    const waitlistResult = await db.execute(sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'waitlist'
        AND kcu.column_name = 'doctor_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    for (const row of waitlistResult.rows) {
      const cName = row.constraint_name as string;
      await db.execute(sql.raw(`ALTER TABLE waitlist DROP CONSTRAINT "${cName}"`));
    }
    await db.execute(sql`
      ALTER TABLE waitlist
        ADD CONSTRAINT waitlist_doctor_id_users_fkey
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    `);
    console.log('✅ waitlist FK fixed');

    console.log('\n🎉 All FK constraints fixed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixForeignKeys();
