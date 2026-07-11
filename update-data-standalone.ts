/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * سكريبت تحديث البيانات الحالية لتصبح منطقية وواقعية
 * Data Update Script - Make existing data logical and realistic
 */

// @ts-ignore - Legacy script referencing removed table
const staff = null as any;

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { 
  patients, 
  appointments, 
  availabilitySlots, 
  waitlist,
  clinics 
} from './db/schema';
import { eq } from 'drizzle-orm';

// تحميل متغيرات البيئة من .env.local
config({ path: '.env.local' });

// التحقق من وجود DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables.');
  console.error('📁 Please ensure .env.local file exists in the project root.');
  console.error('📋 Current working directory:', process.cwd());
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

// إنشاء اتصال مباشر بقاعدة البيانات
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
export const db = drizzle(pool);

// بيانات واقعية للمرضى
const realisticPatientData = [
  { fullName: 'أحمد محمد علي', phone: '+201012345678', email: 'ahmed.mohamed@test.com' },
  { fullName: 'فاطمة عبدالله محمود', phone: '+201112345679', email: 'fatima.abdullah@test.com' },
  { fullName: 'محمد أحمد خالد', phone: '+201212345680', email: 'mohammed.ahmed@test.com' },
  { fullName: 'مريم يوسف حسن', phone: '+201312345681', email: 'mariam.youssef@test.com' },
  { fullName: 'عبدالرحمن سالم عمر', phone: '+201412345682', email: 'abdulrahman.salem@test.com' },
  { fullName: 'نورا هاني كريم', phone: '+201512345683', email: 'noura.hany@test.com' },
  { fullName: 'خالد محمود سامي', phone: '+201612345684', email: 'khaled.mahmoud@test.com' },
  { fullName: 'سارة أحمد عادل', phone: '+201712345685', email: 'sara.ahmed@test.com' },
  { fullName: 'عمر حسن علي', phone: '+201812345686', email: 'omar.hassan@test.com' },
  { fullName: 'ليلى محمود فارس', phone: '+201912345687', email: 'layla.mahmoud@test.com' },
  { fullName: 'يوسف أحمد رامي', phone: '+201023456789', email: 'youssef.ahmed@test.com' },
  { fullName: 'رنا خالد عبدالله', phone: '+201123456790', email: 'rana.khaled@test.com' },
  { fullName: 'باسل محمود سعيد', phone: '+201223456791', email: 'basel.mahmoud@test.com' },
  { fullName: 'هدى أحمد فهمي', phone: '+201323456792', email: 'hoda.ahmed@test.com' },
  { fullName: 'karim adel hassan', phone: '+201423456793', email: 'karim.adel@test.com' },
];

// بيانات واقعية للأطباء
const realisticDoctorData = [
  { 
    name: 'د. أحمد محمد علي', 
    specialty: 'general',
    email: 'dr.ahmed.ali@clinic.com'
  },
  { 
    name: 'د. فاطمة عبدالله محمود', 
    specialty: 'dentist',
    email: 'dr.fatima.abdullah@clinic.com'
  },
  { 
    name: 'د. محمد أحمد خالد', 
    specialty: 'pediatric',
    email: 'dr.mohammed.khaled@clinic.com'
  },
  { 
    name: 'د. مريم يوسف حسن', 
    specialty: 'cardiology',
    email: 'dr.mariam.youssef@clinic.com'
  },
  { 
    name: 'د. عبدالرحمن سالم عمر', 
    specialty: 'orthopedic',
    email: 'dr.abdulrahman.salem@clinic.com'
  },
];

// التخصصات الطبية المتاحة
const medicalSpecialties = [
  'general', 'dentist', 'pediatric', 'cardiology', 'orthopedic', 
  'dermatology', 'psychiatry', 'neurology', 'gynecology', 'ophthalmology'
];

// حالات المواعيد الممكنة
const appointmentStatuses = ['pending', 'confirmed', 'cancelled', 'done'] as const;

// أولويات المواعيد الممكنة
const appointmentPriorities = ['normal', 'priority', 'emergency'] as const;

// وظيفة مساعدة لإنشاء رقم هاتف عشوائي مصري
function generateEgyptianPhone(): string {
  const prefixes = ['010', '011', '012', '015'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+20${prefix}${suffix}`;
}

// وظيفة مساعدة لإنشاء بريد إلكتروني من الاسم
function generateEmail(name: string, domain: string = 'test.com'): string {
  const [firstName, lastName] = name.replace('د. ', '').split(' ').slice(0, 2);
  const firstNameEn = firstName?.toLowerCase().replace(/[^a-z]/g, '') || 'user';
  const lastNameEn = lastName?.toLowerCase().replace(/[^a-z]/g, '') || 'name';
  return `${firstNameEn}.${lastNameEn}@${domain}`;
}

// وظيفة مساعدة لإنشاء تاريخ عشوائي في المستقبل أو الماضي
function generateRandomDate(daysFromNow: number = 30): Date {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + (Math.random() * daysFromNow * 2 - daysFromNow));
  return targetDate;
}

// وظيفة مساعدة لإنشاء وقت عشوائي
function generateRandomTime(): string {
  const hours = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

async function updatePatientData() {
  console.log('🔄 بدء تحديث بيانات المرضى...');
  
  // جلب جميع المرضى الحاليين
  const currentPatients = await db.select().from(patients);
  console.log(`📊 تم العثور على ${currentPatients.length} مريض`);

  for (let i = 0; i < currentPatients.length; i++) {
    const patient = currentPatients[i];
    const realisticData = realisticPatientData[i % realisticPatientData.length];
    
    await db.update(patients)
      .set({
        fullName: realisticData.fullName,
        phone: realisticData.phone,
        email: realisticData.email,
      })
      .where(eq(patients.id, patient.id));
    
    console.log(`✅ تم تحديث بيانات المريض: ${realisticData.fullName}`);
  }
  
  console.log('🎉 اكتمل تحديث بيانات المرضى\n');
}

async function updateDoctorData() {
  console.log('🔄 بدء تحديث بيانات الأطباء...');
  
  // جلب جميع الأطباء الحاليين
  const currentDoctors = await db
    .select()
    .from(staff)
    .where(eq(staff.role, 'doctor'));
  
  console.log(`📊 تم العثور على ${currentDoctors.length} طبيب`);

  for (let i = 0; i < currentDoctors.length; i++) {
    const doctor = currentDoctors[i];
    const realisticData = realisticDoctorData[i % realisticDoctorData.length];
    
    await db.update(staff)
      .set({
        name: realisticData.name,
        specialty: realisticData.specialty,
      })
      .where(eq(staff.id, doctor.id));
    
    console.log(`✅ تم تحديث بيانات الطبيب: ${realisticData.name} (${realisticData.specialty})`);
  }
  
  console.log('🎉 اكتمل تحديث بيانات الأطباء\n');
}

async function updateAvailabilitySlots() {
  console.log('🔄 بدء تحديث أوقات العمل...');
  
  // جلب جميع الأطباء لتحديث أوقات عملهم
  const doctors = await db
    .select({ id: staff.id, clinicId: staff.clinicId })
    .from(staff)
    .where(eq(staff.role, 'doctor'));
  
  console.log(`📊 تحديث أوقات العمل لـ ${doctors.length} طبيب`);

  for (const doctor of doctors) {
    // حذف أوقات العمل القديمة
    await db.delete(availabilitySlots).where(eq(availabilitySlots.doctorId, doctor.id));
    
    // إضافة أوقات عمل جديدة ومنطقية
    const weeklySchedule = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // الأحد
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // الإثنين
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // الثلاثاء
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // الأربعاء
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' }, // الخميس (ساعات أقل)
      // الجمعة والسبت: عطلة
    ];

    for (const schedule of weeklySchedule) {
      await db.insert(availabilitySlots).values({
        clinicId: doctor.clinicId,
        doctorId: doctor.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotDurationMinutes: 30,
        bufferAfterMinutes: 5,
      });
    }
    
    console.log(`✅ تم تحديث أوقات العمل للطبيب: ${doctor.id}`);
  }
  
  console.log('🎉 اكتمل تحديث أوقات العمل\n');
}

async function updateAppointments() {
  console.log('🔄 بدء تحديث المواعيد...');
  
  // جلب البيانات المطلوبة
  const [currentAppointments, currentPatients, currentDoctors] = await Promise.all([
    db.select().from(appointments),
    db.select().from(patients),
    db.select().from(staff).where(eq(staff.role, 'doctor')),
  ]);

  console.log(`📊 تم العثور على ${currentAppointments.length} موعد`);

  if (currentPatients.length === 0 || currentDoctors.length === 0) {
    console.log('⚠️ لا يوجد مرضى أو أطباء لربط المواعيد بهم');
    return;
  }

  for (let i = 0; i < currentAppointments.length; i++) {
    const appointment = currentAppointments[i];
    
    // اختيار مريض وطبيب عشوائيين
    const randomPatient = currentPatients[i % currentPatients.length];
    const randomDoctor = currentDoctors[i % currentDoctors.length];
    
    // إنشاء تاريخ ووقت منطقيين
    const appointmentDate = generateRandomDate(30);
    const startTime = generateRandomTime();
    const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
    const priority = appointmentPriorities[Math.floor(Math.random() * appointmentPriorities.length)];
    
    await db.update(appointments)
      .set({
        patientId: randomPatient.id,
        doctorId: randomDoctor.id,
        appointmentDate: appointmentDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        startTime: startTime,
        status: status,
        priority: priority,
        notes: status === 'cancelled' ? 'تم الإلغاء من قبل المريض' : null,
      })
      .where(eq(appointments.id, appointment.id));
    
    console.log(`✅ تم تحديث الموعد: ${appointmentDate.toISOString().split('T')[0]} ${startTime} (${status})`);
  }
  
  console.log('🎉 اكتمل تحديث المواعيد\n');
}

async function updateWaitlist() {
  console.log('🔄 بدء تحديث قائمة الانتظار...');
  
  // جلب البيانات المطلوبة
  const [currentWaitlist, currentDoctors] = await Promise.all([
    db.select().from(waitlist),
    db.select().from(staff).where(eq(staff.role, 'doctor')),
  ]);

  console.log(`📊 تم العثور على ${currentWaitlist.length} سجل في قائمة الانتظار`);

  if (currentDoctors.length === 0) {
    console.log('⚠️ لا يوجد أطباء لربط قائمة الانتظار بهم');
    return;
  }

  for (let i = 0; i < currentWaitlist.length; i++) {
    const waitlistItem = currentWaitlist[i];
    const randomDoctor = currentDoctors[i % currentDoctors.length];
    const realisticPatient = realisticPatientData[i % realisticPatientData.length];
    
    // إنشاء تاريخ مفضل منطقي
    const preferredDate = generateRandomDate(14);
    
    await db.update(waitlist)
      .set({
        doctorId: randomDoctor.id,
        patientName: realisticPatient.fullName,
        patientPhone: realisticPatient.phone,
        patientEmail: realisticPatient.email,
        preferredDate: preferredDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      })
      .where(eq(waitlist.id, waitlistItem.id));
    
    console.log(`✅ تم تحديث سجل الانتظار: ${realisticPatient.fullName} - ${preferredDate.toISOString().split('T')[0]}`);
  }
  
  console.log('🎉 اكتمل تحديث قائمة الانتظار\n');
}

async function main() {
  console.log('🚀 بدء سكريبت تحديث البيانات...\n');
  
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await db.select().from(clinics).limit(1);
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');
    
    // تنفيذ التحديثات بالترتيب
    await updatePatientData();
    await updateDoctorData();
    await updateAvailabilitySlots();
    await updateAppointments();
    await updateWaitlist();
    
    console.log('🎊 تم تحديث جميع البيانات بنجاح!');
    console.log('📈 أصبحت البيانات الآن منطقية وواقعية');
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تحديث البيانات:', error);
    process.exit(1);
  }
}

// تنفيذ السكريبت
if (require.main === module) {
  main().then(() => {
    console.log('\n✨ انتهى السكريبت بنجاح');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 فشل تنفيذ السكريبت:', error);
    process.exit(1);
  });
}

export { main as updateDatabase };
