/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * سلسلة اختبارات بسيطة لنظام Role-Based Task Design
 * Simple Test Suite for Role-Based System (File-based checks only)
 */

import * as fs from 'fs';
import * as path from 'path';

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

  // Test 1: Component Files Existence
  await testComponentFiles();

  // Test 2: Page Integration
  await testPageIntegration();

  // Test 3: API Routes
  await testApiRoutes();

  // Test 4: Layout Configuration
  await testLayoutConfiguration();

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

async function testComponentFiles() {
  try {
    console.log('\n📋 اختبار 1: Component Files Existence');
    console.log('-'.repeat(60));

    const basePath = process.cwd();
    console.log('Base path:', basePath);

    // Check use-facility-config
    const facilityConfigPath = path.join(basePath, 'lib', 'use-facility-config.ts');
    const facilityConfigExists = fs.existsSync(facilityConfigPath);
    logTest('use-facility-config.ts', facilityConfigExists,
      facilityConfigExists ? 'ملف use-facility-config.ts موجود' : 'ملف use-facility-config.ts مفقود'
    );

    // Check PatientProgressStepper
    const stepperPath = path.join(basePath, 'components', 'patient-progress-stepper.tsx');
    const stepperExists = fs.existsSync(stepperPath);
    logTest('patient-progress-stepper.tsx', stepperExists,
      stepperExists ? 'ملف patient-progress-stepper.tsx موجود' : 'ملف patient-progress-stepper.tsx مفقود'
    );

    // Check ControlCenterTabs
    const tabsPath = path.join(basePath, 'components', 'control-center-tabs.tsx');
    const tabsExists = fs.existsSync(tabsPath);
    logTest('control-center-tabs.tsx', tabsExists,
      tabsExists ? 'ملف control-center-tabs.tsx موجود' : 'ملف control-center-tabs.tsx مفقود'
    );

    // Check useRealtimeData
    const realtimePath = path.join(basePath, 'lib', 'use-realtime-data.ts');
    const realtimeExists = fs.existsSync(realtimePath);
    logTest('use-realtime-data.ts', realtimeExists,
      realtimeExists ? 'ملف use-realtime-data.ts موجود' : 'ملف use-realtime-data.ts مفقود'
    );

  } catch (error: any) {
    logTest('Component Files', false, 'خطأ في اختبار المكونات', { error: error.message || error });
  }
}

async function testPageIntegration() {
  try {
    console.log('\n📋 اختبار 2: Page Integration');
    console.log('-'.repeat(60));

    const basePath = process.cwd();

    // Check reception page
    const receptionPath = path.join(basePath, 'app', 'dashboard', 'reception', 'page.tsx');
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
    } else {
      logTest('Reception Page', false, 'صفحة الاستقبال غير موجودة');
    }

    // Check doctor page
    const doctorPath = path.join(basePath, 'app', 'dashboard', 'doctor', 'page.tsx');
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
    } else {
      logTest('Doctor Page', false, 'صفحة الطبيب غير موجودة');
    }

  } catch (error: any) {
    logTest('Page Integration', false, 'خطأ في اختبار تكامل الصفحات', { error: error.message || error });
  }
}

async function testApiRoutes() {
  try {
    console.log('\n📋 اختبار 3: API Routes');
    console.log('-'.repeat(60));

    const basePath = process.cwd();

    // Check appointments API
    const appointmentsApiPath = path.join(basePath, 'app', 'api', 'clinics', '[id]', 'appointments', 'route.ts');
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
    } else {
      logTest('Appointments API', false, 'API المواعيد غير موجود');
    }

    // Check patients API
    const patientsApiPath = path.join(basePath, 'app', 'api', 'clinics', '[id]', 'patients', 'route.ts');
    const patientsApiExists = fs.existsSync(patientsApiPath);
    
    if (patientsApiExists) {
      const apiContent = fs.readFileSync(patientsApiPath, 'utf-8');
      const hasRoleFiltering = apiContent.includes('context.userRole === \'doctor\'');
      const hasContext = apiContent.includes('const context = tenantCheck.context!');
      
      logTest('Patients API Role Filtering', hasRoleFiltering,
        hasRoleFiltering ? 'API المرضى لديه تصفية حسب الدور' : 'API المرضى لا يوجد تصفية حسب الدور'
      );

      logTest('Patients API Context', hasContext,
        hasContext ? 'API المرضى يستخدم context' : 'API المرضى لا يستخدم context'
      );
    } else {
      logTest('Patients API', false, 'API المرضى غير موجود');
    }

    // Check invoices API
    const invoicesApiPath = path.join(basePath, 'app', 'api', 'clinics', '[id]', 'invoices', 'route.ts');
    const invoicesApiExists = fs.existsSync(invoicesApiPath);
    
    if (invoicesApiExists) {
      const apiContent = fs.readFileSync(invoicesApiPath, 'utf-8');
      const hasContext = apiContent.includes('const context = tenantCheck.context!');
      
      logTest('Invoices API Context', hasContext,
        hasContext ? 'API الفواتير يستخدم context' : 'API الفواتير لا يستخدم context'
      );
    } else {
      logTest('Invoices API', false, 'API الفواتير غير موجود');
    }

  } catch (error: any) {
    logTest('API Routes', false, 'خطأ في اختبار API Routes', { error: error.message || error });
  }
}

async function testLayoutConfiguration() {
  try {
    console.log('\n📋 اختبار 4: Layout Configuration');
    console.log('-'.repeat(60));

    const basePath = process.cwd();

    // Check dashboard layout
    const layoutPath = path.join(basePath, 'app', 'dashboard', 'layout.tsx');
    const layoutExists = fs.existsSync(layoutPath);
    
    if (layoutExists) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const hasProvider = layoutContent.includes('FacilityConfigProvider');
      const hasImport = layoutContent.includes('use-facility-config');
      
      logTest('FacilityConfigProvider Import', hasImport,
        hasImport ? 'FacilityConfigProvider مستورد' : 'FacilityConfigProvider غير مستورد'
      );

      logTest('FacilityConfigProvider in Layout', hasProvider,
        hasProvider ? 'FacilityConfigProvider موجود في Layout' : 'FacilityConfigProvider مفقود من Layout'
      );
    } else {
      logTest('Dashboard Layout', false, 'Dashboard Layout غير موجود');
    }

  } catch (error: any) {
    logTest('Layout Configuration', false, 'خطأ في اختبار تكوين Layout', { error: error.message || error });
  }
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('خطأ في تشغيل الاختبارات:', error);
  process.exit(1);
});
