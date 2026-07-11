# Cura Clinic System Test Guide

## Automated Test Script

An automated test script has been created to test the major workflows in the Cura Clinic Management System.

### Prerequisites

- Node.js installed
- Database connection configured in `.env.local`
- At least one clinic, doctor, and patient in the database

### Running the Tests

```bash
npm test
```

Or directly:

```bash
node test-system.js
```

### Test Coverage

The automated script tests the following:

1. **Database Connection** - Verifies connection to Neon PostgreSQL
2. **Required Tables** - Checks if all required tables exist
3. **Schema Defaults** - Verifies default values are configured correctly
4. **Patient Insert** - Tests patient creation with proper defaults
5. **Medical Record Insert** - Tests medical record creation
6. **Appointment Insert** - Tests appointment booking with end_time calculation
7. **Prescription Insert** - Tests prescription creation
8. **Double Booking Prevention** - Verifies database-level constraints
9. **Audit Logging** - Checks if audit logs are being created

### Test Results

The script will output:
- ✅ PASS for successful tests
- ❌ FAIL for failed tests with error messages
- A summary showing pass/fail count and success rate

### Example Output

```
🧪 Starting Cura Clinic System Tests

============================================================

📋 Test Configuration:
  Clinic ID: f41b28a0-a872-4fa8-885e-9ac8f82ebf3a
  Doctor ID: ea8f5243-4e0b-476e-9bd0-b353522429bf
  Patient ID: 47c2025f-efdf-4496-b6c3-6b1f836fd4d6
============================================================

✅ PASS: Database Connection
✅ PASS: Required Tables Exist
✅ PASS: Schema Defaults
✅ PASS: Audit Logging
✅ PASS: Patient Insert
✅ PASS: Medical Record Insert
✅ PASS: Appointment Insert
✅ PASS: Prescription Insert
✅ PASS: Double Booking Prevention (DB Level)

============================================================
📊 Test Summary
============================================================
✅ Passed: 9
❌ Failed: 0
📈 Success Rate: 100.00%
============================================================
```

## Manual Testing Guide

For comprehensive testing, follow these manual test scenarios:

### 1. Appointment Booking Workflow

**Steps:**
1. Login as clinic_admin
2. Navigate to "المواعيد" (Appointments)
3. Click "حجز موعد جديد" (New Appointment)
4. Select a doctor and date
5. Verify slot colors:
   - 🟢 Green = Available
   - 🟠 Orange = Pending (under review)
   - 🔴 Red = Booked
6. Select an available slot
7. Select a patient
8. Click "حجز الموعد" (Book Appointment)

**Expected Results:**
- Appointment created successfully
- end_time calculated automatically
- Appointment appears in list with "جديد" (new) status
- No 500 errors

### 2. Medical Records & Prescriptions Workflow

**Steps:**
1. Login as doctor
2. Navigate to "السجلات الطبية" (Medical Records)
3. Click "سجل طبي جديد" (New Medical Record)
4. Fill in patient, chief complaint, diagnosis
5. Click save
6. Click "عرض الأدوية" (Show Medications) on the record
7. Click "إضافة دواء" (Add Medication)
8. Enter medication name and instructions
9. Click save

**Expected Results:**
- Medical record created successfully
- Prescription appears inline in medical record
- No 500 errors
- No "Doctor not found" errors

### 3. Unified Scheduling Test

**Steps:**
1. Book an appointment from dashboard
2. Try to book same time from public booking page
3. Reverse: Book from public page, try from dashboard

**Expected Results:**
- System prevents double booking
- Both interfaces show consistent slot availability
- Pending appointments shown in orange in both interfaces

### 4. Patient Management Test

**Steps:**
1. Navigate to "المرضى" (Patients)
2. Click "إضافة مريض جديد" (New Patient)
3. Fill in patient details
4. Click save

**Expected Results:**
- Patient created successfully
- No schema errors
- Patient appears in list

### 5. Staff/User Management Test

**Steps:**
1. Login as clinic_admin
2. Navigate to "الأطباء" (Doctors)
3. Click to add new doctor
4. Enter email, name, temporary password
5. Click save
6. Try to login with new doctor account

**Expected Results:**
- Account created successfully
- Doctor can login immediately
- No schema errors

### 6. Availability Slots Test

**Steps:**
1. Ensure doctor has availability slots configured
2. In appointments page, select doctor and date
3. Verify slots are generated correctly

**Expected Results:**
- Slots generated based on slotDurationMinutes
- No duplicate keys in React
- Buffer time calculated but not shown as separate slot

### 7. Tenant Isolation Test

**Steps:**
1. Login to Clinic A
2. Note patient/appointment data
3. Login to Clinic B (if available)
4. Verify Clinic B cannot see Clinic A's data

**Expected Results:**
- Each clinic sees only its own data
- Cross-clinic access blocked

## Troubleshooting

### Common Issues

**Issue: "No clinic found"**
- Solution: Create at least one clinic in the database first

**Issue: "No doctor found"**
- Solution: Create at least one doctor user with role='doctor'

**Issue: "No patient found"**
- Solution: Create at least one patient in the database

**Issue: Schema errors during inserts**
- Solution: Ensure all API fixes have been applied (deletedAt, isActive defaults)

**Issue: Connection errors**
- Solution: Verify DATABASE_URL in .env.local is correct and accessible

## Reporting Issues

When reporting issues, include:
- Test scenario being performed
- Full error message
- User role (doctor, clinic_admin, receptionist)
- Data being input
- Browser console errors (if applicable)
