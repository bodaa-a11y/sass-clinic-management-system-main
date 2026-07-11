/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-results-all-pages.json');

// Ensure screenshots directory exists
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
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
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

async function login(page, email, password) {
  console.log('=== Logging in ===');
  await page.goto(`${BASE_URL}/dashboard/login`);
  await takeScreenshot(page, '01-login-page');

  // Try multiple selectors for email input
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="البريد"]',
    'input[placeholder*="email"]',
    '#email'
  ];

  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const emailInput = await page.$(selector);
      if (emailInput) {
        await emailInput.fill(email);
        emailFilled = true;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  if (!emailFilled) {
    throw new Error('Could not find email input');
  }

  // Try multiple selectors for password input
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="كلمة"]',
    'input[placeholder*="password"]',
    '#password'
  ];

  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const passwordInput = await page.$(selector);
      if (passwordInput) {
        await passwordInput.fill(password);
        passwordFilled = true;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  if (!passwordFilled) {
    throw new Error('Could not find password input');
  }

  // Try multiple selectors for submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("تسجيل")',
    'button:has-text("دخول")',
    'button:has-text("Login")',
    '#submit'
  ];

  let clicked = false;
  for (const selector of submitSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      clicked = true;
      break;
    } catch {
      // Try next selector
    }
  }

  if (!clicked) {
    throw new Error('Could not find submit button');
  }

  // Wait for navigation
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await takeScreenshot(page, '02-after-login');
  console.log('Login successful');
}

async function testDashboard(page) {
  console.log('\n=== Testing Dashboard ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '03-dashboard');

    const hasSidebar = await waitForElement(page, 'aside, nav, [role="navigation"]', 5000);
    logTest('Dashboard - Sidebar Display', hasSidebar, hasSidebar ? 'Sidebar visible' : 'Sidebar not found');

    const hasHeader = await waitForElement(page, 'header, [role="banner"]', 5000);
    logTest('Dashboard - Header Display', hasHeader, hasHeader ? 'Header visible' : 'Header not found');

    return true;
  } catch (error) {
    logTest('Dashboard', false, error.message);
    return false;
  }
}

async function testPatients(page) {
  console.log('\n=== Testing Patients Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/patients`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '04-patients-page');

    // Check if page loaded successfully
    const correctUrl = page.url().includes('patients');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Patients - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Patients', false, error.message);
    return false;
  }
}

async function testAppointments(page) {
  console.log('\n=== Testing Appointments Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/appointments`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-appointments-page');

    const correctUrl = page.url().includes('appointments');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Appointments - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Appointments', false, error.message);
    return false;
  }
}

async function testMedicalRecords(page) {
  console.log('\n=== Testing Medical Records Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/medical-records`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-medical-records-page');

    const correctUrl = page.url().includes('medical-records');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Medical Records - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Medical Records', false, error.message);
    return false;
  }
}

async function testPrescriptions(page) {
  console.log('\n=== Testing Prescriptions Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/prescriptions`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-prescriptions-page');

    const correctUrl = page.url().includes('prescriptions');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Prescriptions - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Prescriptions', false, error.message);
    return false;
  }
}

async function testInvoices(page) {
  console.log('\n=== Testing Invoices Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/invoices`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '08-invoices-page');

    const correctUrl = page.url().includes('invoices');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Invoices - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Invoices', false, error.message);
    return false;
  }
}

async function testSettings(page) {
  console.log('\n=== Testing Settings Page ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/settings`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '09-settings-page');

    const correctUrl = page.url().includes('settings');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    logTest('Settings - Page Load', pageLoaded, pageLoaded ? 'Page loaded successfully with correct URL' : 'Page load failed or wrong URL');

    return true;
  } catch (error) {
    logTest('Settings', false, error.message);
    return false;
  }
}

async function testNavigation(page) {
  console.log('\n=== Testing Navigation ===');
  try {
    // Test navigation between pages
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');

    // Try to navigate to patients
    const patientsLink = await page.$('a:has-text("المرضى"), a:has-text("Patients"), a[href*="patients"]');
    if (patientsLink) {
      await patientsLink.click();
      await page.waitForLoadState('networkidle');
      const onPatientsPage = page.url().includes('patients');
      logTest('Navigation - Patients Link', onPatientsPage, onPatientsPage ? 'Navigated to patients' : 'Navigation failed');
    } else {
      // Try direct navigation as fallback
      await page.goto(`${BASE_URL}/dashboard/doctor/patients`);
      await page.waitForLoadState('networkidle');
      const onPatientsPage = page.url().includes('patients');
      logTest('Navigation - Patients Direct', onPatientsPage, onPatientsPage ? 'Direct navigation to patients works' : 'Direct navigation failed');
    }

    // Test navigation back to dashboard
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    const onDashboard = page.url().includes('dashboard/doctor') && !page.url().includes('patients');
    logTest('Navigation - Back to Dashboard', onDashboard, onDashboard ? 'Navigated back to dashboard' : 'Navigation back failed');

    return true;
  } catch (error) {
    logTest('Navigation', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== Starting Comprehensive Page Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    const email = process.env.DOCTOR_EMAIL || 'clinic@dr-ahmed.com';
    const password = process.env.DOCTOR_PASSWORD || 'password123';

    await login(page, email, password);
    logTest('Login', true, 'Successfully logged in');

    // Test all pages
    await testDashboard(page);
    await testPatients(page);
    await testAppointments(page);
    await testMedicalRecords(page);
    await testPrescriptions(page);
    await testInvoices(page);
    await testSettings(page);
    await testNavigation(page);

  } catch (error) {
    console.error('Test suite failed:', error);
    logTest('Test Suite', false, error.message);
  } finally {
    await browser.close();
  }

  // Save results
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
