/**
 * Clinic Management System Database Update Script
 * Aligns database and workflow with realistic medical operations
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { 
  patients, 
  staff, 
  appointments, 
  availabilitySlots, 
  waitlist,
  clinics,
  users
} from './db/schema';
import { eq, and, ilike, or, lt, gte } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

// Database connection
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Updated realistic data
const realisticPatients = [
  { fullName: 'أحمد محمد السيد', phone: '+201012345678', email: 'ahmed.sayed@test.com' },
  { fullName: 'فاطمة عبدالله محمود', phone: '+201112345679', email: 'fatima.abdullah@test.com' },
  { fullName: 'محمد أحمد خالد', phone: '+201212345680', email: 'mohammed.khaled@test.com' },
  { fullName: 'مريم يوسف حسن', phone: '+201312345681', email: 'mariam.youssef@test.com' },
  { fullName: 'عبدالرحمن سالم عمر', phone: '+201412345682', email: 'abdulrahman.salem@test.com' },
  { fullName: 'نورا هاني كريم', phone: '+201512345683', email: 'noura.hany@test.com' },
  { fullName: 'خالد محمود سامي', phone: '+201612345684', email: 'khaled.mahmoud@test.com' },
  { fullName: 'سارة أحمد عادل', phone: '+201712345685', email: 'sara.ahmed@test.com' },
  { fullName: 'عمر حسن علي', phone: '+201812345686', email: 'omar.hassan@test.com' },
  { fullName: 'ليلى محمود فارس', phone: '+201912345687', email: 'layla.mahmoud@test.com' },
];

const realisticDoctors = [
  { 
    name: 'د. أحمد محمد السيد', 
    specialty: 'general',
    email: 'dr.ahmed.sayed@clinic.com',
    phone: '+201011223344'
  },
  { 
    name: 'د. فاطمة عبدالله محمود', 
    specialty: 'dentist',
    email: 'dr.fatima.abdullah@clinic.com',
    phone: '+201011223345'
  },
  { 
    name: 'د. محمد أحمد خالد', 
    specialty: 'pediatric',
    email: 'dr.mohammed.khaled@clinic.com',
    phone: '+201011223346'
  },
];

const realisticReceptionists = [
  { 
    name: 'سارة أحمد علي', 
    email: 'sara.ali@clinic.com',
    phone: '+201011223347'
  },
  { 
    name: 'مريم يوسف حسن', 
    email: 'mariam.youssef@clinic.com',
    phone: '+201011223348'
  },
];

// Helper functions
function generateRandomDate(daysFromNow: number = 30): Date {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + (Math.random() * daysFromNow * 2 - daysFromNow));
  return targetDate;
}

function generateRandomTime(): string {
  const hours = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function isDateTimeInPast(date: Date, time: string): boolean {
  const appointmentDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}:00`);
  return appointmentDateTime < new Date();
}

// Update functions
async function updatePatients() {
  console.log('🔄 Updating patients data...');
  
  const currentPatients = await db.select().from(patients);
  console.log(`📊 Found ${currentPatients.length} patients`);

  for (let i = 0; i < currentPatients.length; i++) {
    const patient = currentPatients[i];
    const realisticData = realisticPatients[i % realisticPatients.length];
    
    await db.update(patients)
      .set({
        fullName: realisticData.fullName,
        phone: realisticData.phone,
        email: realisticData.email,
      })
      .where(eq(patients.id, patient.id));
    
    console.log(`✅ Updated patient: ${realisticData.fullName}`);
  }
  
  console.log('🎉 Patients update completed\n');
}

async function updateStaff() {
  console.log('🔄 Updating staff data...');
  
  // Update doctors
  const currentDoctors = await db
    .select()
    .from(staff)
    .where(eq(staff.role, 'doctor'));
  
  console.log(`📊 Found ${currentDoctors.length} doctors`);

  for (let i = 0; i < currentDoctors.length; i++) {
    const doctor = currentDoctors[i];
    const realisticData = realisticDoctors[i % realisticDoctors.length];
    
    await db.update(staff)
      .set({
        name: realisticData.name,
        specialty: realisticData.specialty,
      })
      .where(eq(staff.id, doctor.id));
    
    console.log(`✅ Updated doctor: ${realisticData.name} (${realisticData.specialty})`);
  }

  // Update receptionists
  const currentReceptionists = await db
    .select()
    .from(staff)
    .where(eq(staff.role, 'receptionist'));
  
  console.log(`📊 Found ${currentReceptionists.length} receptionists`);

  for (let i = 0; i < currentReceptionists.length; i++) {
    const receptionist = currentReceptionists[i];
    const realisticData = realisticReceptionists[i % realisticReceptionists.length];
    
    await db.update(staff)
      .set({
        name: realisticData.name,
      })
      .where(eq(staff.id, receptionist.id));
    
    console.log(`✅ Updated receptionist: ${realisticData.name}`);
  }
  
  console.log('🎉 Staff update completed\n');
}

async function updateAppointmentStatuses() {
  console.log('🔄 Updating appointment statuses with realistic workflow...');
  
  const currentAppointments = await db.select().from(appointments);
  console.log(`📊 Found ${currentAppointments.length} appointments`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const appointment of currentAppointments) {
    const appointmentDate = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentDate.setHours(hours, minutes);
    
    let newStatus: 'pending' | 'confirmed' | 'cancelled' | 'done' = 'pending';
    let notes = appointment.notes;

    // Apply realistic workflow logic
    if (appointmentDate < today) {
      // Past appointments should be either done or cancelled
      newStatus = Math.random() > 0.2 ? 'done' : 'cancelled';
      if (newStatus === 'cancelled') {
        notes = notes ? `${notes} - تم الإلغاء` : 'تم الإلغاء';
      }
    } else if (appointmentDate.toDateString() === today.toDateString()) {
      // Today's appointments
      if (appointmentDate > new Date()) {
        // Future appointments today
        newStatus = Math.random() > 0.3 ? 'confirmed' : 'pending';
      } else {
        // Past appointments today
        newStatus = Math.random() > 0.2 ? 'done' : 'cancelled';
        if (newStatus === 'cancelled') {
          notes = notes ? `${notes} - تم الإلغاء` : 'تم الإلغاء';
        }
      }
    } else {
      // Future appointments
      newStatus = Math.random() > 0.4 ? 'confirmed' : 'pending';
    }

    await db.update(appointments)
      .set({
        status: newStatus,
        notes: notes,
      })
      .where(eq(appointments.id, appointment.id));
    
    console.log(`✅ Updated appointment ${appointment.id}: ${newStatus} on ${appointment.appointmentDate} ${appointment.startTime}`);
  }
  
  console.log('🎉 Appointment statuses update completed\n');
}

async function validateRelationships() {
  console.log('🔄 Validating data relationships...');
  
  // Check all appointments have valid patients and doctors
  const appointmentsWithRelations = await db
    .select({
      appointment: appointments,
      patient: patients,
      doctor: staff,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(staff, eq(appointments.doctorId, staff.id));

  let invalidCount = 0;
  for (const relation of appointmentsWithRelations) {
    if (!relation.patient || !relation.doctor || relation.doctor.role !== 'doctor') {
      console.log(`⚠️ Invalid relationship for appointment ${relation.appointment.id}`);
      invalidCount++;
    }
  }

  if (invalidCount === 0) {
    console.log('✅ All appointment relationships are valid');
  } else {
    console.log(`❌ Found ${invalidCount} invalid relationships`);
  }
  
  console.log('🎉 Relationship validation completed\n');
}

async function generateSampleData() {
  console.log('🔄 Generating additional realistic sample data...');
  
  // Get current data
  const [currentPatients, currentDoctors] = await Promise.all([
    db.select().from(patients),
    db.select().from(staff).where(eq(staff.role, 'doctor')),
  ]);

  if (currentPatients.length === 0 || currentDoctors.length === 0) {
    console.log('⚠️ No patients or doctors found, skipping sample data generation');
    return;
  }

  // Generate some realistic appointments for the next 30 days
  const newAppointments = [];
  for (let i = 0; i < 20; i++) {
    const appointmentDate = generateRandomDate(30);
    const startTime = generateRandomTime();
    const randomPatient = currentPatients[Math.floor(Math.random() * currentPatients.length)];
    const randomDoctor = currentDoctors[Math.floor(Math.random() * currentDoctors.length)];
    
    // Determine realistic status
    let status: 'pending' | 'confirmed' | 'cancelled' | 'done' = 'pending';
    if (isDateTimeInPast(appointmentDate, startTime)) {
      status = Math.random() > 0.2 ? 'done' : 'cancelled';
    } else {
      status = Math.random() > 0.3 ? 'confirmed' : 'pending';
    }

    newAppointments.push({
      clinicId: randomPatient.clinicId,
      patientId: randomPatient.id,
      doctorId: randomDoctor.id,
      appointmentDate: appointmentDate.toISOString().split('T')[0],
      startTime: startTime,
      status: status,
      priority: ['normal', 'priority', 'emergency'][Math.floor(Math.random() * 3)] as any,
      notes: status === 'cancelled' ? 'تم الإلغاء من قبل المريض' : null,
    });
  }

  // Insert new appointments
  if (newAppointments.length > 0) {
    await db.insert(appointments).values(newAppointments);
    console.log(`✅ Generated ${newAppointments.length} new realistic appointments`);
  }
  
  console.log('🎉 Sample data generation completed\n');
}

async function main() {
  console.log('🚀 Starting Clinic Management System Database Update...\n');
  
  try {
    // Test database connection
    await db.select().from(clinics).limit(1);
    console.log('✅ Database connection successful\n');

    // Execute updates in order
    await updatePatients();
    await updateStaff();
    await updateAppointmentStatuses();
    await validateRelationships();
    await generateSampleData();
    
    console.log('🎊 All database updates completed successfully!');
    console.log('📈 The system is now aligned with realistic medical operations');
    
  } catch (error) {
    console.error('❌ Error during database update:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n✨ Database update completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Database update failed:', error);
    process.exit(1);
  });
}

export { main as updateClinicDatabase };
