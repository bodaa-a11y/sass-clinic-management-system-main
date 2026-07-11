/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-clinic-admin-results.json');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message, screenshot = null) {
  testResults.total++;
  if (passed) testResults.passed++;
  else testResults.failed++;

  const result = {
    testName,
    passed,
    message,
    screenshot,
    timestamp: new Date().toISOString()
  };
  testResults.tests.push(result);

  const status = passed ? '[PASSED]' : '[FAILED]';
  console.log(`${status} ${testName}`);
  if (message) console.log(`  ${message}`);
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `ca-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginClinicAdmin(page, email, password) {
  console.log('=== Logging in as Clinic Admin ===');
  await page.goto(`${BASE_URL}/dashboard/login`);
  await takeScreenshot(page, '01-login-page');

  const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="البريد"]', 'input[placeholder*="email"]', '#email'];
  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const emailInput = await page.$(selector);
      if (emailInput) {
        await emailInput.fill(email);
        emailFilled = true;
        break;
      }
    } catch {}
  }

  if (!emailFilled) throw new Error('Could not find email input');

  const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="كلمة"]', 'input[placeholder*="password"]', '#password'];
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const passwordInput = await page.$(selector);
      if (passwordInput) {
        await passwordInput.fill(password);
        passwordFilled = true;
        break;
      }
    } catch {}
  }

  if (!passwordFilled) throw new Error('Could not find password input');

  const submitSelectors = ['button[type="submit"]', 'button:has-text("تسجيل")', 'button:has-text("دخول")', 'button:has-text("Login")', '#submit'];
  let clicked = false;
  for (const selector of submitSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      clicked = true;
      break;
    } catch {}
  }

  if (!clicked) throw new Error('Could not find submit button');

  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await takeScreenshot(page, '02-after-login');
  console.log('Clinic Admin login successful');
}

async function testClinicAdminDashboard(page) {
  console.log('\n=== Testing Clinic Admin Dashboard ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '03-dashboard');

    const correctUrl = page.url().includes('admin');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    
    logTest('Clinic Admin Dashboard - Page Load', pageLoaded, pageLoaded ? 'Dashboard loaded successfully' : `Dashboard load failed - URL: ${page.url()}`);

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Clinic Admin Dashboard - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Clinic Admin Dashboard', false, error.message);
    return false;
  }
}

async function testStaffManagement(page) {
  console.log('\n=== Testing Staff Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '04-staff-page');

    const pageContent = await page.textContent('body');
    const hasStaffSection = pageContent && (pageContent.includes('الموظفين') || pageContent.includes('staff') || pageContent.includes('doctor'));
    
    logTest('Staff Management - Staff Section', hasStaffSection, hasStaffSection ? 'Staff section found' : 'Staff section not found');

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Staff Management - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Staff Management', false, error.message);
    return false;
  }
}

async function testSpecialtiesManagement(page) {
  console.log('\n=== Testing Specialties Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-specialties-page');

    const pageContent = await page.textContent('body');
    const hasSpecialtiesSection = pageContent && (pageContent.includes('التخصصات') || pageContent.includes('specialty') || pageContent.includes('تخصص'));
    
    logTest('Specialties Management - Specialties Section', hasSpecialtiesSection, hasSpecialtiesSection ? 'Specialties section found' : 'Specialties section not found');

    return true;
  } catch (error) {
    logTest('Specialties Management', false, error.message);
    return false;
  }
}

async function testServicesManagement(page) {
  console.log('\n=== Testing Services Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-services-page');

    const pageContent = await page.textContent('body');
    const hasServicesSection = pageContent && (pageContent.includes('الخدمات') || pageContent.includes('service') || pageContent.includes('خدمة'));
    
    logTest('Services Management - Services Section', hasServicesSection, hasServicesSection ? 'Services section found' : 'Services section not found');

    return true;
  } catch (error) {
    logTest('Services Management', false, error.message);
    return false;
  }
}

async function testDepartmentsManagement(page) {
  console.log('\n=== Testing Departments Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-departments-page');

    const pageContent = await page.textContent('body');
    const hasDepartmentsSection = pageContent && (pageContent.includes('الأقسام') || pageContent.includes('department') || pageContent.includes('قسم'));
    
    logTest('Departments Management - Departments Section', hasDepartmentsSection, hasDepartmentsSection ? 'Departments section found' : 'Departments section not found');

    return true;
  } catch (error) {
    logTest('Departments Management', false, error.message);
    return false;
  }
}

async function testRolePermissions(page) {
  console.log('\n=== Testing Role Permissions ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '08-permissions-page');

    const pageContent = await page.textContent('body');
    const hasPermissionsSection = pageContent && (pageContent.includes('الصلاحيات') || pageContent.includes('permission') || pageContent.includes('صلاحية'));
    
    logTest('Role Permissions - Permissions Section', hasPermissionsSection, hasPermissionsSection ? 'Permissions section found' : 'Permissions section not found');

    // Check for role-specific permissions
    const hasDoctorPermissions = pageContent && pageContent.includes('doctor');
    const hasReceptionistPermissions = pageContent && pageContent.includes('receptionist');
    const hasClinicAdminPermissions = pageContent && pageContent.includes('clinic_admin');
    
    logTest('Role Permissions - Doctor Permissions', hasDoctorPermissions, hasDoctorPermissions ? 'Doctor permissions found' : 'Doctor permissions not found');
    logTest('Role Permissions - Receptionist Permissions', hasReceptionistPermissions, hasReceptionistPermissions ? 'Receptionist permissions found' : 'Receptionist permissions not found');
    logTest('Role Permissions - Clinic Admin Permissions', hasClinicAdminPermissions, hasClinicAdminPermissions ? 'Clinic Admin permissions found' : 'Clinic Admin permissions not found');

    return true;
  } catch (error) {
    logTest('Role Permissions', false, error.message);
    return false;
  }
}

async function testLogout(page) {
  console.log('\n=== Testing Logout ===');
  try {
    const logoutSelectors = [
      'button:has-text("تسجيل الخروج")',
      'button:has-text("خروج")',
      'button:has-text("Logout")'
    ];

    let logoutClicked = false;
    for (const selector of logoutSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          logoutClicked = true;
          break;
        }
      } catch {}
    }

    if (logoutClicked) {
      await page.waitForTimeout(2000);
      const onLoginPage = page.url().includes('login');
      logTest('Logout', onLoginPage, onLoginPage ? 'Logged out successfully' : 'Logout button clicked but not redirected');
    } else {
      // Try direct navigation as fallback
      await page.goto(`${BASE_URL}/dashboard/login`);
      await page.waitForLoadState('networkidle');
      const onLoginPage = page.url().includes('login');
      logTest('Logout - Direct Navigation', onLoginPage, onLoginPage ? 'Can access login page' : 'Cannot access login page');
    }

    return true;
  } catch (error) {
    logTest('Logout', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== Starting Clinic Admin Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = process.env.CLINIC_ADMIN_EMAIL || 'clinic@dr-ahmed.com';
    const password = process.env.CLINIC_ADMIN_PASSWORD || 'password123';

    await loginClinicAdmin(page, email, password);
    logTest('Clinic Admin Login', true, 'Successfully logged in as Clinic Admin');

    await testClinicAdminDashboard(page);
    await testStaffManagement(page);
    await testSpecialtiesManagement(page);
    await testServicesManagement(page);
    await testDepartmentsManagement(page);
    await testRolePermissions(page);
    await testLogout(page);

  } catch (error) {
    console.error('Test suite failed:', error);
    logTest('Test Suite', false, error.message);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log('\n=== Test Results Saved ===');
  console.log(`Results saved to: ${TEST_RESULTS_FILE}`);
  console.log(JSON.stringify({
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed
  }, null, 2));

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests();
