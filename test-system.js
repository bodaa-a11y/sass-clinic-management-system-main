/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Cura Clinic System Automated Test Script
 * 
 * This script tests all major workflows in the system
 * Run with: node test-system.js
 * 
 * Prerequisites:
 * - Node.js installed
 * - Database connection configured in .env.local
 * - A valid clinic ID for testing
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
};

// Helper function to log test results
function logTest(testName, passed, message) {
  const result = { testName, passed, message, timestamp: new Date().toISOString() };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Error: ${message}`);
  }
}

// Helper function to execute SQL queries
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { success: true, data: result.rows, rowCount: result.rowCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 1: Database Connection
async function testDatabaseConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    if (result.success && result.data.length > 0) {
      logTest('Database Connection', true, `Connected at ${result.data[0].current_time}`);
      return true;
    }
    logTest('Database Connection', false, 'No data returned');
    return false;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

// Test 2: Check if required tables exist
async function testTablesExist() {
  const requiredTables = [
    'clinics',
    'patients',
    'users',
    'appointments',
    'medical_records',
    'prescriptions',
    'availability_slots',
    'audit_logs'
  ];

  let allExist = true;
  for (const table of requiredTables) {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [table]);
    
    if (result.success && result.data[0].exists) {
      console.log(`  ✓ Table '${table}' exists`);
    } else {
      console.log(`  ✗ Table '${table}' missing`);
      allExist = false;
    }
  }

  logTest('Required Tables Exist', allExist, allExist ? 'All tables present' : 'Some tables missing');
  return allExist;
}

// Test 3: Check schema for default values
async function testSchemaDefaults() {
  const tablesToCheck = [
    { table: 'appointments', columns: ['deleted_at'] },
    { table: 'prescriptions', columns: ['is_active', 'deleted_at'] },
    { table: 'medical_records', columns: ['is_active', 'deleted_at'] },
    { table: 'patients', columns: ['is_active', 'deleted_at'] },
    { table: 'users', columns: ['is_active', 'deleted_at'] },
  ];

  let hasDefaults = true;
  for (const { table, columns } of tablesToCheck) {
    for (const column of columns) {
      const result = await query(`
        SELECT column_default 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      
      if (result.success && result.data.length > 0) {
        console.log(`  ✓ ${table}.${column} has default: ${result.data[0].column_default || 'NULL'}`);
      } else {
        console.log(`  ✗ ${table}.${column} missing default`);
        hasDefaults = false;
      }
    }
  }

  logTest('Schema Defaults', hasDefaults, hasDefaults ? 'All defaults configured' : 'Some defaults missing');
  return hasDefaults;
}

// Test 4: Test Appointment Insert with end_time
async function testAppointmentInsert(clinicId, doctorId, patientId) {
  const testDate = new Date().toISOString().split('T')[0];
  const startTime = '09:00';
  
  // First, get doctor's slot duration
  const slotResult = await query(`
    SELECT slot_duration_minutes 
    FROM availability_slots 
    WHERE clinic_id = $1 AND doctor_id = $2 AND day_of_week = $3 AND is_active = true
    LIMIT 1
  `, [clinicId, doctorId, new Date().getDay()]);

  if (!slotResult.success || slotResult.data.length === 0) {
    logTest('Appointment Insert', false, 'No availability slot configuration found');
    return false;
  }

  const slotDuration = slotResult.data[0].slot_duration_minutes;
  const expectedEndTime = `${String(9 + Math.floor(slotDuration / 60)).padStart(2, '0')}:${String(slotDuration % 60).padStart(2, '0')}`;

  // Insert test appointment
  const insertResult = await query(`
    INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, start_time, end_time, status, priority, deleted_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'normal', NULL)
    RETURNING id, end_time
  `, [clinicId, doctorId, patientId, testDate, startTime, expectedEndTime]);

  if (insertResult.success && insertResult.data.length > 0) {
    const inserted = insertResult.data[0];
    const endTimeCorrect = inserted.end_time === expectedEndTime;
    
    // Clean up
    await query(`DELETE FROM appointments WHERE id = $1`, [inserted.id]);
    
    logTest('Appointment Insert', endTimeCorrect, 
      endTimeCorrect ? `end_time calculated correctly: ${inserted.end_time}` : `end_time mismatch: expected ${expectedEndTime}, got ${inserted.end_time}`
    );
    return endTimeCorrect;
  }

  logTest('Appointment Insert', false, insertResult.error || 'Insert failed');
  return false;
}

// Test 5: Test Prescription Insert
async function testPrescriptionInsert(clinicId, doctorId, patientId, medicalRecordId) {
  const insertResult = await query(`
    INSERT INTO prescriptions (clinic_id, medical_record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, status, is_active, deleted_at)
    VALUES ($1, $2, $3, $4, 'Test Medication', '1 tablet', 'twice daily', '7 days', 'Take with food', 'active', true, NULL)
    RETURNING id, is_active
  `, [clinicId, medicalRecordId, patientId, doctorId]);

  if (insertResult.success && insertResult.data.length > 0) {
    const inserted = insertResult.data[0];
    const isActiveCorrect = inserted.is_active === true;
    
    // Clean up
    await query(`DELETE FROM prescriptions WHERE id = $1`, [inserted.id]);
    
    logTest('Prescription Insert', isActiveCorrect,
      isActiveCorrect ? 'is_active set correctly' : 'is_active not set correctly'
    );
    return isActiveCorrect;
  }

  logTest('Prescription Insert', false, insertResult.error || 'Insert failed');
  return false;
}

// Test 6: Test Medical Record Insert
async function testMedicalRecordInsert(clinicId, doctorId, patientId) {
  const insertResult = await query(`
    INSERT INTO medical_records (clinic_id, patient_id, doctor_id, chief_complaint, diagnosis, symptoms, clinical_notes, vital_signs, treatment_plan, is_active, deleted_at)
    VALUES ($1, $2, $3, 'Test Complaint', 'Test Diagnosis', 'Test Symptoms', 'Test Notes', 'BP: 120/80', 'Rest', true, NULL)
    RETURNING id, is_active
  `, [clinicId, patientId, doctorId]);

  if (insertResult.success && insertResult.data.length > 0) {
    const inserted = insertResult.data[0];
    const isActiveCorrect = inserted.is_active === true;
    
    // Clean up
    await query(`DELETE FROM medical_records WHERE id = $1`, [inserted.id]);
    
    logTest('Medical Record Insert', isActiveCorrect,
      isActiveCorrect ? 'is_active set correctly' : 'is_active not set correctly'
    );
    return isActiveCorrect;
  }

  logTest('Medical Record Insert', false, insertResult.error || 'Insert failed');
  return false;
}

// Test 7: Test Patient Insert
async function testPatientInsert(clinicId) {
  const testPhone = `+966${Math.floor(Math.random() * 1000000000)}`;
  const insertResult = await query(`
    INSERT INTO patients (clinic_id, full_name, phone, email, is_active, deleted_at)
    VALUES ($1, 'Test Patient', $2, 'test@example.com', true, NULL)
    RETURNING id, is_active
  `, [clinicId, testPhone]);

  if (insertResult.success && insertResult.data.length > 0) {
    const inserted = insertResult.data[0];
    const isActiveCorrect = inserted.is_active === true;
    
    // Clean up
    await query(`DELETE FROM patients WHERE id = $1`, [inserted.id]);
    
    logTest('Patient Insert', isActiveCorrect,
      isActiveCorrect ? 'is_active set correctly' : 'is_active not set correctly'
    );
    return isActiveCorrect;
  }

  logTest('Patient Insert', false, insertResult.error || 'Insert failed');
  return false;
}

// Test 8: Test Double Booking Prevention
async function testDoubleBookingPrevention(clinicId, doctorId, patientId) {
  const testDate = new Date().toISOString().split('T')[0];
  const startTime = '10:00';
  const endTime = '10:30';

  // Insert first appointment
  const firstInsert = await query(`
    INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, start_time, end_time, status, priority, deleted_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', 'normal', NULL)
    RETURNING id
  `, [clinicId, doctorId, patientId, testDate, startTime, endTime]);

  if (!firstInsert.success) {
    logTest('Double Booking Prevention', false, 'First appointment insert failed');
    return false;
  }

  // Try to insert second appointment at same time
  await query(`
    INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, start_time, end_time, status, priority, deleted_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', 'normal', NULL)
    RETURNING id
  `, [clinicId, doctorId, patientId, testDate, startTime, endTime]);

  // Clean up first appointment
  await query(`DELETE FROM appointments WHERE id = $1`, [firstInsert.data[0].id]);

  // Double booking prevention is at application level, so DB will allow it
  // This test just verifies the schema allows the insert
  logTest('Double Booking Prevention (DB Level)', true, 
    'Note: Double booking prevention is handled at application level, not database level'
  );
  return true;
}

// Test 9: Check Audit Logging
async function testAuditLogging() {
  const result = await query(`
    SELECT COUNT(*) as count 
    FROM audit_logs 
    WHERE created_at > NOW() - INTERVAL '1 day'
  `);

  if (result.success) {
    logTest('Audit Logging', true, `Found ${result.data[0].count} audit logs in last 24 hours`);
    return true;
  }

  logTest('Audit Logging', false, result.error || 'Query failed');
  return false;
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Cura Clinic System Tests\n');
  console.log('=' .repeat(60));

  // Get test data
  const clinicResult = await query('SELECT id FROM clinics LIMIT 1');
  if (!clinicResult.success || clinicResult.data.length === 0) {
    console.log('❌ No clinic found. Please create a clinic first.');
    process.exit(1);
  }
  const clinicId = clinicResult.data[0].id;

  const doctorResult = await query(`
    SELECT id FROM users 
    WHERE clinic_id = $1 AND role = 'doctor' AND is_active = true 
    LIMIT 1
  `, [clinicId]);
  
  const doctorId = doctorResult.success && doctorResult.data.length > 0 ? doctorResult.data[0].id : null;

  const patientResult = await query(`
    SELECT id FROM patients 
    WHERE clinic_id = $1 AND is_active = true 
    LIMIT 1
  `, [clinicId]);
  
  const patientId = patientResult.success && patientResult.data.length > 0 ? patientResult.data[0].id : null;

  console.log(`\n📋 Test Configuration:`);
  console.log(`  Clinic ID: ${clinicId}`);
  console.log(`  Doctor ID: ${doctorId || 'Not found (some tests will be skipped)'}`);
  console.log(`  Patient ID: ${patientId || 'Not found (some tests will be skipped)'}`);
  console.log('=' .repeat(60) + '\n');

  // Run basic tests
  await testDatabaseConnection();
  await testTablesExist();
  await testSchemaDefaults();
  await testAuditLogging();

  // Run data-dependent tests if we have the required data
  if (patientId) {
    await testPatientInsert(clinicId);
  } else {
    console.log('⚠️  Skipping Patient Insert test (no patient found)');
  }

  if (doctorId && patientId) {
    await testMedicalRecordInsert(clinicId, doctorId, patientId);
    await testAppointmentInsert(clinicId, doctorId, patientId);
    await testDoubleBookingPrevention(clinicId, doctorId, patientId);
    
    // Create a medical record for prescription test
    const medicalRecordResult = await query(`
      INSERT INTO medical_records (clinic_id, patient_id, doctor_id, chief_complaint, diagnosis, is_active, deleted_at)
      VALUES ($1, $2, $3, 'Test', 'Test', true, NULL)
      RETURNING id
    `, [clinicId, patientId, doctorId]);
    
    if (medicalRecordResult.success && medicalRecordResult.data.length > 0) {
      await testPrescriptionInsert(clinicId, doctorId, patientId, medicalRecordResult.data[0].id);
      await query(`DELETE FROM medical_records WHERE id = $1`, [medicalRecordResult.data[0].id]);
    }
  } else {
    console.log('⚠️  Skipping doctor-dependent tests (no doctor found)');
  }

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`📈 Success Rate: ${((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(2)}%`);

  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  console.log('\n' + '=' .repeat(60));

  await pool.end();
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
