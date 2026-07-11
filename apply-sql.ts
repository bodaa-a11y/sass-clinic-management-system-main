import { db } from './db/index.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    // SQL migration file removed - no longer needed
    console.log('No SQL migrations to apply');
    process.exit(0);
  } catch (e) {
    console.error('Failed', e);
    process.exit(1);
  }
}

main();
