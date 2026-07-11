import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { eq, or } from 'drizzle-orm';
import { 
  clinics, 
  users, 
  patients, 
  appointments, 
  availabilitySlots,
  specialties,
  departments
} from './db/schema';

// Load env variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in env');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clean up existing data to prevent unique constraint conflicts
    console.log('🧹 Cleaning up conflicting seed data...');
    await db.delete(users).where(
      or(
        eq(users.email, 'admin@clinic.com'),
        eq(users.email, 'doctor@clinic.com'),
        eq(users.email, 'receptionist@clinic.com'),
        eq(users.email, 'superadmin@clinic.com')
      )
    );
    await db.delete(clinics).where(eq(clinics.slug, 'shifa-clinic'));
    
    // 1. Create a clinic
    const insertedClinics = await db.insert(clinics).values({
      name: 'عيادة الشفاء النموذجية',
      slug: 'shifa-clinic',
      phone: '+201012345678',
      address: 'القاهرة، مصر',
      facilityType: 'single_clinic',
      edition: 'pro',

      enabledModules: [
        'appointments',
        'patients',
        'medical_records',
        'prescriptions',
        'invoices',
        'payments',
        'specialties',
        'calendar',
        'schedule',
        'live-monitor',
        'staff_management',
        'departments',
        'lab_results',
        'radiology_images',
        'medical_documents'
      ],
      config: {},
      isActive: true
    }).returning();

    const clinicId = insertedClinics[0].id;
    console.log('✅ Clinic created:', clinicId);

    // 2. Create specialties
    const insertedSpecialties = await db.insert(specialties).values([
      { name: 'الطب العام', code: 'general', isActive: true, clinicId },
      { name: 'طب الأطفال', code: 'pediatric', isActive: true, clinicId },
      { name: 'طب الأسنان', code: 'dentist', isActive: true, clinicId }
    ]).returning();
    console.log('✅ Specialties created');

    const generalSpecialtyId = insertedSpecialties[0].id;
    const pediatricSpecialtyId = insertedSpecialties[1].id;

    // 3. Create departments
    await db.insert(departments).values([
      { name: 'العيادات الخارجية', isActive: true, clinicId },
      { name: 'قسم الطوارئ', isActive: true, clinicId }
    ]);
    console.log('✅ Departments created');

    // 4. Create users (hashed password is for 'password123')
    const passwordHash = '$2b$10$fMSRr5m.aQGNwNOb1BeIu.OtE7E4barWgC2e84xjl7o8XX/gG64Oi';

    const insertedUsers = await db.insert(users).values([
      {
        clinicId,
        email: 'admin@clinic.com',
        name: 'أحمد محمد (مدير)',
        passwordHash,
        role: 'clinic_admin',
        status: 'active',
        isActive: true,
        permissions: {
          appointments: ['view', 'create', 'edit', 'delete'],
          patients: ['view', 'create', 'edit', 'delete'],
          medical_records: ['view', 'create', 'edit', 'delete'],
          prescriptions: ['view', 'create', 'edit', 'delete'],
          invoices: ['view', 'create', 'edit', 'delete'],
          finance: ['view', 'create', 'edit', 'delete'],
          staff_management: ['view', 'create', 'edit', 'delete'],
          departments: ['view', 'create', 'edit', 'delete']
        }
      },
      {
        clinicId,
        email: 'doctor@clinic.com',
        name: 'د. محمد علي',
        passwordHash,
        role: 'doctor',
        status: 'active',
        specialtyId: pediatricSpecialtyId,
        isActive: true,
        permissions: {
          appointments: ['view', 'edit'],
          patients: ['view', 'create', 'edit'],
          medical_records: ['view', 'create', 'edit'],
          prescriptions: ['view', 'create', 'edit']
        }
      },
      {
        clinicId,
        email: 'receptionist@clinic.com',
        name: 'سارة أحمد',
        passwordHash,
        role: 'receptionist',
        status: 'active',
        isActive: true,
        permissions: {
          appointments: ['view', 'create', 'edit', 'delete'],
          patients: ['view', 'create', 'edit'],
          invoices: ['view', 'create', 'edit']
        }
      },
      {
        email: 'superadmin@clinic.com',
        name: 'المدير العام للنظام',
        passwordHash,
        role: 'super_admin',
        status: 'active',
        isActive: true,
        permissions: {}
      }
    ]).returning();
    console.log('✅ Users created');

    const doctorId = insertedUsers[1].id;

    // 5. Create availability slots for the doctor
    await db.insert(availabilitySlots).values([
      { clinicId, doctorId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, bufferAfterMinutes: 5 },
      { clinicId, doctorId, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, bufferAfterMinutes: 5 },
      { clinicId, doctorId, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, bufferAfterMinutes: 5 },
      { clinicId, doctorId, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, bufferAfterMinutes: 5 },
      { clinicId, doctorId, dayOfWeek: 5, startTime: '09:00', endTime: '15:00', slotDurationMinutes: 30, bufferAfterMinutes: 5 }
    ]);
    console.log('✅ Availability slots created');

    // 6. Create patients
    const insertedPatients = await db.insert(patients).values([
      { clinicId, fullName: 'عبدالرحمن محمد علي', phone: '+201012345678', email: 'abdulrahman@test.com', isActive: true },
      { clinicId, fullName: 'فاطمة الزهراء عبدالله', phone: '+201112345679', email: 'fatima@test.com', isActive: true },
      { clinicId, fullName: 'يوسف عمر حسن', phone: '+201212345680', email: 'youssef@test.com', isActive: true }
    ]).returning();
    console.log('✅ Patients created');

    const pat1Id = insertedPatients[0].id;
    const pat2Id = insertedPatients[1].id;

    // 7. Create appointments
    const todayStr = new Date().toISOString().split('T')[0];
    await db.insert(appointments).values([
      {
        clinicId,
        doctorId,
        patientId: pat1Id,
        appointmentDate: todayStr,
        startTime: '09:00',
        endTime: '09:30',
        status: 'confirmed',
        priority: 'normal',
        notes: 'متابعة دورية'
      },
      {
        clinicId,
        doctorId,
        patientId: pat2Id,
        appointmentDate: todayStr,
        startTime: '10:00',
        endTime: '10:30',
        status: 'in-waiting-room',
        priority: 'emergency',
        notes: 'كشف مستعجل'
      }
    ]);
    console.log('✅ Appointments created');

    console.log('🌱 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await pool.end();
  }
}

main();
