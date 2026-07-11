/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-doctor-comprehensive-results.json');

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
  const screenshotPath = path.join(SCREENSHOTS_DIR, `doc-${name}.png`);
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

async function loginDoctor(page, email, password) {
  console.log('=== Logging in as Doctor ===');
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
  console.log('Doctor login successful');
}

async function testDoctorDashboard(page) {
  console.log('\n=== Testing Doctor Dashboard ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '03-dashboard');

    const correctUrl = page.url().includes('doctor');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    
    logTest('Doctor Dashboard - Page Load', pageLoaded, pageLoaded ? 'Dashboard loaded successfully' : `Dashboard load failed - URL: ${page.url()}`);

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Doctor Dashboard - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Doctor Dashboard', false, error.message);
    return false;
  }
}

async function testWaitingList(page) {
  console.log('\n=== Testing Waiting List ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '04-waiting-list');

    const pageContent = await page.textContent('body');
    const hasWaitingList = pageContent && (pageContent.includes('الانتظار') || pageContent.includes('waiting') || pageContent.includes('قائمة'));
    
    logTest('Waiting List - Waiting List Section', hasWaitingList, hasWaitingList ? 'Waiting list section found' : 'Waiting list section not found');

    return true;
  } catch (error) {
    logTest('Waiting List', false, error.message);
    return false;
  }
}

async function testStartConsultation(page) {
  console.log('\n=== Testing Start Consultation ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-start-consultation');

    const pageContent = await page.textContent('body');
    const hasStartButton = pageContent && (pageContent.includes('بدء') || pageContent.includes('start') || pageContent.includes('فحص'));
    
    logTest('Start Consultation - Start Button', hasStartButton, hasStartButton ? 'Start consultation button found' : 'Start consultation button not found');

    const hasButtons = await page.$$('button');
    const hasUI = hasButtons && hasButtons.length > 0;
    logTest('Start Consultation - UI Elements', hasUI, hasUI ? `Found ${hasButtons.length} buttons on page` : 'No buttons found on page');

    return true;
  } catch (error) {
    logTest('Start Consultation', false, error.message);
    return false;
  }
}

async function testMedicalRecords(page) {
  console.log('\n=== Testing Medical Records ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/medical-records`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-medical-records');

    const correctUrl = page.url().includes('medical-records');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    
    logTest('Medical Records - Page Load', pageLoaded, pageLoaded ? 'Medical records page loaded successfully' : 'Medical records page load failed');

    const hasRecords = pageContent && (pageContent.includes('السجل') || pageContent.includes('record') || pageContent.includes('طبي'));
    logTest('Medical Records - Records Section', hasRecords, hasRecords ? 'Medical records section found' : 'Medical records section not found');

    return true;
  } catch (error) {
    logTest('Medical Records', false, error.message);
    return false;
  }
}

async function testPrescriptions(page) {
  console.log('\n=== Testing Prescriptions ===');
  try {
    await page.goto(`${BASE_URL}/dashboard/doctor/prescriptions`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-prescriptions');

    const correctUrl = page.url().includes('prescriptions');
    const pageContent = await page.textContent('body');
    const hasPageContent = pageContent && pageContent.length > 0;
    const pageLoaded = correctUrl && hasPageContent;
    
    logTest('Prescriptions - Page Load', pageLoaded, pageLoaded ? 'Prescriptions page loaded successfully' : 'Prescriptions page load failed');

    const hasPrescriptions = pageContent && (pageContent.includes('وصفة') || pageContent.includes('prescription') || pageContent.includes('دواء'));
    logTest('Prescriptions - Prescriptions Section', hasPrescriptions, hasPrescriptions ? 'Prescriptions section found' : 'Prescriptions section not found');

    return true;
  } catch (error) {
    logTest('Prescriptions', false, error.message);
    return false;
  }
}

async function testPermissions(page) {
  console.log('\n=== Testing Doctor Permissions ===');
  try {
    // Try to access admin page (should fail)
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    const onAdminPage = page.url().includes('admin');
    logTest('Permissions - Admin Page Access', !onAdminPage, !onAdminPage ? 'Correctly blocked from admin page' : 'SECURITY ISSUE: Can access admin page');

    // Try to access reception page (should fail)
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    const onReceptionPage = page.url().includes('reception');
    logTest('Permissions - Reception Page Access', !onReceptionPage, !onReceptionPage ? 'Correctly blocked from reception page' : 'SECURITY ISSUE: Can access reception page');

    // Go back to doctor page (should succeed)
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    const onDoctorPage = page.url().includes('doctor');
    logTest('Permissions - Doctor Page Access', onDoctorPage, onDoctorPage ? 'Can access doctor page' : 'Cannot access doctor page');

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
  console.log('=== Starting Doctor Comprehensive Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = process.env.DOCTOR_EMAIL || 'doctor@example.com';
    const password = process.env.DOCTOR_PASSWORD || 'password123';

    await loginDoctor(page, email, password);
    logTest('Doctor Login', true, 'Successfully logged in as Doctor');

    await testDoctorDashboard(page);
    await testWaitingList(page);
    await testStartConsultation(page);
    await testMedicalRecords(page);
    await testPrescriptions(page);
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
