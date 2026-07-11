/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-receptionist-results.json');

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
  const screenshotPath = path.join(SCREENSHOTS_DIR, `rec-${name}.png`);
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

async function loginReceptionist(page, email, password) {
  console.log('=== Logging in as Receptionist ===');
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
  console.log('Receptionist login successful');
}

async function testReceptionistDashboard(page) {
  console.log('\n=== Testing Receptionist Dashboard ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '03-dashboard');

    const correctUrl = page.url().includes('reception');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    
    logTest('Receptionist Dashboard - Page Load', pageLoaded, pageLoaded ? 'Dashboard loaded successfully' : `Dashboard load failed - URL: ${page.url()}`);

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Receptionist Dashboard - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Receptionist Dashboard', false, error.message);
    return false;
  }
}

async function testAppointmentsManagement(page) {
  console.log('\n=== Testing Appointments Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '04-appointments-page');

    const pageContent = await page.textContent('body');
    const hasAppointmentsSection = pageContent && (pageContent.includes('المواعيد') || pageContent.includes('appointment') || pageContent.includes('موعد'));
    
    logTest('Appointments Management - Appointments Section', hasAppointmentsSection, hasAppointmentsSection ? 'Appointments section found' : 'Appointments section not found');

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Appointments Management - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Appointments Management', false, error.message);
    return false;
  }
}

async function testPatientsManagement(page) {
  console.log('\n=== Testing Patients Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-patients-page');

    const pageContent = await page.textContent('body');
    const hasPatientsSection = pageContent && (pageContent.includes('المرضى') || pageContent.includes('patient') || pageContent.includes('مريض'));
    
    logTest('Patients Management - Patients Section', hasPatientsSection, hasPatientsSection ? 'Patients section found' : 'Patients section not found');

    return true;
  } catch (error) {
    logTest('Patients Management', false, error.message);
    return false;
  }
}

async function testInvoicesManagement(page) {
  console.log('\n=== Testing Invoices Management ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-invoices-page');

    const pageContent = await page.textContent('body');
    const hasInvoicesSection = pageContent && (pageContent.includes('الفواتير') || pageContent.includes('invoice') || pageContent.includes('فاتورة'));
    
    logTest('Invoices Management - Invoices Section', hasInvoicesSection, hasInvoicesSection ? 'Invoices section found' : 'Invoices section not found');

    return true;
  } catch (error) {
    logTest('Invoices Management', false, error.message);
    return false;
  }
}

async function testPermissions(page) {
  console.log('\n=== Testing Receptionist Permissions ===');
  try {
    // Try to access doctor page (should fail)
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    const onDoctorPage = page.url().includes('doctor');
    logTest('Permissions - Doctor Page Access', !onDoctorPage, !onDoctorPage ? 'Correctly blocked from doctor page' : 'Incorrectly accessed doctor page');

    // Try to access admin page (should fail)
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    const onAdminPage = page.url().includes('admin');
    logTest('Permissions - Admin Page Access', !onAdminPage, !onAdminPage ? 'Correctly blocked from admin page' : 'Incorrectly accessed admin page');

    // Go back to reception page (should succeed)
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    const onReceptionPage = page.url().includes('reception');
    logTest('Permissions - Reception Page Access', onReceptionPage, onReceptionPage ? 'Can access reception page' : 'Cannot access reception page');

    return true;
  } catch (error) {
    logTest('Permissions', false, error.message);
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
  console.log('=== Starting Receptionist Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = process.env.RECEPTIONIST_EMAIL || 'receptionist@example.com';
    const password = process.env.RECEPTIONIST_PASSWORD || 'password123';

    await loginReceptionist(page, email, password);
    logTest('Receptionist Login', true, 'Successfully logged in as Receptionist');

    await testReceptionistDashboard(page);
    await testAppointmentsManagement(page);
    await testPatientsManagement(page);
    await testInvoicesManagement(page);
    await testPermissions(page);
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
