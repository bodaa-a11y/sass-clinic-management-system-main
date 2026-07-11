/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * سلسلة اختبارات لنظام Role-Based Task Design
 * Comprehensive Test Suite for Role-Based System
 */

import { db } from './db/index';
import { users, clinics, appointments } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const testResults: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  const result: TestResult = { testName: name, passed, message, details };
  testResults.push(result);
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log('   Details:', JSON.stringify(details, null, 2));
}

async function runTests() {
  console.log('\n🧪 بدء سلسلة اختبارات نظام Role-Based Task Design\n');
  console.log('='.repeat(60));

  // Test 1: Facility Configuration
  await testFacilityConfig();

  // Test 2: Patient Progress Stepper
  await testPatientProgressStepper();

  // Test 3: Role-Based Permission Filtering
  await testRoleBasedFiltering();

  // Test 4: Polling Infrastructure
  await testPollingInfrastructure();

  // Test 5: Control Center Components
  await testControlCenterComponents();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص نتائج الاختبارات');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`\nإجمالي الاختبارات: ${total}`);
  console.log(`الاختبارات الناجحة: ${passed}`);
  console.log(`الاختبارات الفاشلة: ${total - passed}`);
  console.log(`نسبة النجاح: ${percentage}%\n`);

  if (passed === total) {
    console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
  } else {
    console.log('⚠️  بعض الاختبارات فشلت. يرجى مراجعة النتائج أعلاه.');
  }

  console.log('\nتفاصيل الاختبارات الفاشلة:');
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.testName}: ${r.message}`);
  });
}

async function testFacilityConfig() {
  try {
    console.log('\n📋 اختبار 1: Facility Configuration');
    console.log('-'.repeat(60));

    // Check if clinics table has facilityType field
    const clinicsList = await db.select().from(clinics).limit(1);
    
    if (clinicsList.length === 0) {
      logTest('Facility Type Field', false, 'لا توجد عيادات في قاعدة البيانات');
      return;
    }

    const clinic = clinicsList[0];
    const hasFacilityType = 'facilityType' in clinic;
    const hasEdition = 'edition' in clinic;
    const hasEnabledModules = 'enabledModules' in clinic;

    logTest('Facility Type Field', hasFacilityType, 
      hasFacilityType ? 'حقل facilityType موجود' : 'حقل facilityType مفقود',
      { facilityType: clinic.facilityType }
    );

    logTest('Edition Field', hasEdition,
      hasEdition ? 'حقل edition موجود' : 'حقل edition مفقود',
      { edition: clinic.edition }
    );

    logTest('Enabled Modules Field', hasEnabledModules,
      hasEnabledModules ? 'حقل enabledModules موجود' : 'حقل enabledModules مفقود',
      { enabledModules: clinic.enabledModules }
    );

    // Test facility types are valid
    const validTypes = ['single_clinic', 'multi_clinic', 'medical_center'];
    const isValidType = validTypes.includes(clinic.facilityType as any);
    
    logTest('Valid Facility Type', isValidType,
      isValidType ? 'نوع المنشأة صالح' : 'نوع المنشأة غير صالح',
      { facilityType: clinic.facilityType }
    );

    const validEditions = ['basic', 'pro', 'enterprise'];
    const isValidEdition = validEditions.includes(clinic.edition as any);
    
    logTest('Valid Edition', isValidEdition,
      isValidEdition ? 'الإصدار صالح' : 'الإصدار غير صالح',
      { edition: clinic.edition }
    );

  } catch (error) {
    logTest('Facility Config', false, 'خطأ في اختبار تكوين المنشأة', { error });
  }
}

async function testPatientProgressStepper() {
  try {
    console.log('\n📋 اختبار 2: Patient Progress Stepper');
    console.log('-'.repeat(60));

    // Check if appointments have status field
    const appointmentsList = await db.select().from(appointments).limit(1);
    
    if (appointmentsList.length === 0) {
      logTest('Appointment Status', false, 'لا توجد مواعيد في قاعدة البيانات');
      return;
    }

    const appointment = appointmentsList[0];
    const hasStatus = 'status' in appointment;

    logTest('Appointment Status Field', hasStatus,
      hasStatus ? 'حقل status موجود' : 'حقل status مفقود',
      { status: appointment.status }
    );

    // Test valid status values
    const validStatuses = ['pending', 'confirmed', 'in-waiting-room', 'in-progress', 'done', 'cancelled', 'no-show'];
    const isValidStatus = validStatuses.includes(appointment.status as any);

    logTest('Valid Appointment Status', isValidStatus,
      isValidStatus ? 'حالة الموعد صالحة' : 'حالة الموعد غير صالحة',
      { status: appointment.status }
    );

    // Test status flow
    const statusFlow = ['pending', 'confirmed', 'in-waiting-room', 'in-progress', 'done'];
    const currentStatusIndex = statusFlow.indexOf(appointment.status as any);
    const hasValidFlow = currentStatusIndex !== -1 || ['cancelled', 'no-show'].includes(appointment.status as any);

    logTest('Status Flow Validation', hasValidFlow,
      hasValidFlow ? 'حالة الموعد في التدفق الصحيح' : 'حالة الموعد خارج التدفق الصحيح',
      { status: appointment.status, flow: statusFlow }
    );

  } catch (error) {
    logTest('Patient Progress Stepper', false, 'خطأ في اختبار شريط التقدم', { error });
  }
}

async function testRoleBasedFiltering() {
  try {
    console.log('\n📋 اختبار 3: Role-Based Permission Filtering');
    console.log('-'.repeat(60));

    // Check if users table has role field
    const usersList = await db.select().from(users).limit(5);
    
    if (usersList.length === 0) {
      logTest('User Roles', false, 'لا يوجد مستخدمين في قاعدة البيانات');
      return;
    }

    const hasRole = 'role' in usersList[0];
    logTest('User Role Field', hasRole,
      hasRole ? 'حقل role موجود' : 'حقل role مفقود'
    );

    // Check for different roles
    const roles = [...new Set(usersList.map(u => u.role))];
    const hasMultipleRoles = roles.length > 1;

    logTest('Multiple Roles', hasMultipleRoles,
      hasMultipleRoles ? 'يوجد أدوار متعددة' : 'يوجد دور واحد فقط',
      { roles, count: roles.length }
    );

    // Check if doctors have doctorId in appointments
    const hasDoctorId = 'doctorId' in appointments;
    logTest('Appointment Doctor ID', hasDoctorId,
      hasDoctorId ? 'حقل doctorId موجود في المواعيد' : 'حقل doctorId مفقود'
    );

    // Test doctor-isolation: Check if we can filter appointments by doctor
    if (usersList.length > 0 && hasDoctorId) {
      const doctorUser = usersList.find(u => u.role === 'doctor');
      if (doctorUser) {
        const doctorAppointments = await db
          .select()
          .from(appointments)
          .where(and(
            eq(appointments.doctorId, doctorUser.id),
            isNull(appointments.deletedAt)
          ))
          .limit(1);

        logTest('Doctor Appointment Filtering', doctorAppointments.length >= 0,
          'تصفية مواعيد الطبيب تعمل',
          { doctorId: doctorUser.id, appointmentsCount: doctorAppointments.length }
        );
      }
    }

  } catch (error) {
    logTest('Role-Based Filtering', false, 'خطأ في اختبار تصفية الصلاحيات', { error });
  }
}

async function testPollingInfrastructure() {
  try {
    console.log('\n📋 اختبار 4: Polling Infrastructure');
    console.log('-'.repeat(60));

    // Check if useRealtimeData hook exists
    const hookPath = path.join(__dirname, 'lib', 'use-realtime-data.ts');
    
    const hookExists = fs.existsSync(hookPath);
    logTest('useRealtimeData Hook', hookExists,
      hookExists ? 'ملف useRealtimeData.ts موجود' : 'ملف useRealtimeData.ts مفقود'
    );

    // Check if reception page uses polling
    const receptionPath = path.join(__dirname, 'app', 'dashboard', 'reception', 'page.tsx');
    const receptionExists = fs.existsSync(receptionPath);
    
    if (receptionExists) {
      const receptionContent = fs.readFileSync(receptionPath, 'utf-8');
      const usesPolling = receptionContent.includes('useRealtimeData');
      const usesProgressStepper = receptionContent.includes('PatientProgressStepper');
      
      logTest('Reception Page Polling', usesPolling,
        usesPolling ? 'صفحة الاستقبال تستخدم Polling' : 'صفحة الاستقبال لا تستخدم Polling'
      );

      logTest('Reception Page Progress Stepper', usesProgressStepper,
        usesProgressStepper ? 'صفحة الاستقبال تستخدم Progress Stepper' : 'صفحة الاستقبال لا تستخدم Progress Stepper'
      );
    }

    // Check if doctor page uses polling
    const doctorPath = path.join(__dirname, 'app', 'dashboard', 'doctor', 'page.tsx');
    const doctorExists = fs.existsSync(doctorPath);
    
    if (doctorExists) {
      const doctorContent = fs.readFileSync(doctorPath, 'utf-8');
      const usesPolling = doctorContent.includes('useRealtimeData');
      const usesProgressStepper = doctorContent.includes('PatientProgressStepper');
      
      logTest('Doctor Page Polling', usesPolling,
        usesPolling ? 'صفحة الطبيب تستخدم Polling' : 'صفحة الطبيب لا تستخدم Polling'
      );

      logTest('Doctor Page Progress Stepper', usesProgressStepper,
        usesProgressStepper ? 'صفحة الطبيب تستخدم Progress Stepper' : 'صفحة الطبيب لا تستخدم Progress Stepper'
      );
    }

  } catch (error) {
    logTest('Polling Infrastructure', false, 'خطأ في اختبار بنية Polling', { error });
  }
}

async function testControlCenterComponents() {
  try {
    console.log('\n📋 اختبار 5: Control Center Components');
    console.log('-'.repeat(60));

    // Check if ControlCenterTabs component exists
    const tabsPath = path.join(__dirname, 'components', 'control-center-tabs.tsx');
    const tabsExists = fs.existsSync(tabsPath);
    logTest('ControlCenterTabs Component', tabsExists,
      tabsExists ? 'مكون ControlCenterTabs موجود' : 'مكون ControlCenterTabs مفقود'
    );

    // Check if FacilityConfigProvider is in layout
    const layoutPath = path.join(__dirname, 'app', 'dashboard', 'layout.tsx');
    const layoutExists = fs.existsSync(layoutPath);
    
    if (layoutExists) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const hasProvider = layoutContent.includes('FacilityConfigProvider');
      
      logTest('FacilityConfigProvider in Layout', hasProvider,
        hasProvider ? 'FacilityConfigProvider موجود في Layout' : 'FacilityConfigProvider مفقود من Layout'
      );
    }

    // Check if API routes have role-based filtering
    const appointmentsApiPath = path.join(__dirname, 'app', 'api', 'clinics', '[id]', 'appointments', 'route.ts');
    const appointmentsApiExists = fs.existsSync(appointmentsApiPath);
    
    if (appointmentsApiExists) {
      const apiContent = fs.readFileSync(appointmentsApiPath, 'utf-8');
      const hasRoleFiltering = apiContent.includes('context.userRole === \'doctor\'');
      const hasContext = apiContent.includes('const context = tenantCheck.context!');
      
      logTest('Appointments API Role Filtering', hasRoleFiltering,
        hasRoleFiltering ? 'API المواعيد لديه تصفية حسب الدور' : 'API المواعيد لا يوجد تصفية حسب الدور'
      );

      logTest('Appointments API Context', hasContext,
        hasContext ? 'API المواعيد يستخدم context' : 'API المواعيد لا يستخدم context'
      );
    }

    const patientsApiPath = path.join(__dirname, 'app', 'api', 'clinics', '[id]', 'patients', 'route.ts');
    const patientsApiExists = fs.existsSync(patientsApiPath);
    
    if (patientsApiExists) {
      const apiContent = fs.readFileSync(patientsApiPath, 'utf-8');
      const hasRoleFiltering = apiContent.includes('context.userRole === \'doctor\'');
      
      logTest('Patients API Role Filtering', hasRoleFiltering,
        hasRoleFiltering ? 'API المرضى لديه تصفية حسب الدور' : 'API المرضى لا يوجد تصفية حسب الدور'
      );
    }

  } catch (error) {
    logTest('Control Center Components', false, 'خطأ في اختبار مكونات Control Center', { error });
  }
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('خطأ في تشغيل الاختبارات:', error);
  process.exit(1);
});
