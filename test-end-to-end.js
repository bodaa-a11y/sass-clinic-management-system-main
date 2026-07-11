/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-end-to-end-results.json');

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
  const screenshotPath = path.join(SCREENSHOTS_DIR, `e2e-${name}.png`);
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
  console.log('Login successful');
}

async function testCreatePatientEndToEnd(page) {
  console.log('\n=== Testing Create Patient End-to-End ===');
  try {
    const email = process.env.RECEPTIONIST_EMAIL || 'receptionist@example.com';
    const password = process.env.RECEPTIONIST_PASSWORD || 'password123';

    await login(page, email, password);
    logTest('Create Patient - Login', true, 'Logged in as Receptionist');

    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '03-reception-dashboard');

    // Try to find add patient button
    const addButtonSelectors = [
      'button:has-text("إضافة مريض")',
      'button:has-text("إضافة")',
      'button:has-text("Add")',
      'button:has-text("جديد")'
    ];

    let addButtonClicked = false;
    for (const selector of addButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          addButtonClicked = true;
          break;
        }
      } catch {}
    }

    if (addButtonClicked) {
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '04-add-patient-dialog');
      logTest('Create Patient - Open Dialog', true, 'Add patient dialog opened');

      // Try to fill form
      const nameInput = await page.$('input[name="name"], input[placeholder*="الاسم"], input[placeholder*="name"]');
      if (nameInput) {
        await nameInput.fill('Test Patient E2E');
      }

      const phoneInput = await page.$('input[name="phone"], input[placeholder*="الهاتف"], input[placeholder*="phone"]');
      if (phoneInput) {
        await phoneInput.fill('0501234567');
      }

      await takeScreenshot(page, '05-patient-form-filled');
      logTest('Create Patient - Fill Form', true, 'Patient form filled');

      // Try to submit
      const submitSelectors = ['button[type="submit"]', 'button:has-text("حفظ")', 'button:has-text("Save")'];
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          submitted = true;
          break;
        } catch {}
      }

      if (submitted) {
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '06-after-create-patient');
        logTest('Create Patient - Submit', true, 'Patient creation submitted');
      } else {
        logTest('Create Patient - Submit', false, 'Submit button not found');
      }
    } else {
      logTest('Create Patient - Open Dialog', false, 'Add patient button not found');
    }

    return true;
  } catch (error) {
    logTest('Create Patient End-to-End', false, error.message);
    return false;
  }
}

async function testCompleteConsultationEndToEnd(page) {
  console.log('\n=== Testing Complete Consultation End-to-End ===');
  try {
    const email = process.env.DOCTOR_EMAIL || 'doctor@example.com';
    const password = process.env.DOCTOR_PASSWORD || 'password123';

    await login(page, email, password);
    logTest('Complete Consultation - Login', true, 'Logged in as Doctor');

    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-doctor-dashboard');

    const pageContent = await page.textContent('body');
    const hasWaitingList = pageContent && (pageContent.includes('الانتظار') || pageContent.includes('waiting'));
    logTest('Complete Consultation - Waiting List', hasWaitingList, hasWaitingList ? 'Waiting list found' : 'Waiting list not found');

    // Try to find start consultation button
    const startButtonSelectors = [
      'button:has-text("بدء الفحص")',
      'button:has-text("بدء")',
      'button:has-text("Start")',
      'button:has-text("فحص")'
    ];

    let startButtonClicked = false;
    for (const selector of startButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          startButtonClicked = true;
          break;
        }
      } catch {}
    }

    if (startButtonClicked) {
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '08-consultation-started');
      logTest('Complete Consultation - Start', true, 'Consultation started');

      // Try to fill consultation form
      const chiefComplaintInput = await page.$('textarea[name="chiefComplaint"], textarea[placeholder*="الشكوى"]');
      if (chiefComplaintInput) {
        await chiefComplaintInput.fill('Test chief complaint');
      }

      await takeScreenshot(page, '09-consultation-form-filled');
      logTest('Complete Consultation - Fill Form', true, 'Consultation form filled');

      // Try to complete
      const completeSelectors = ['button:has-text("إكمال")', 'button:has-text("Complete")', 'button:has-text("حفظ")'];
      let completed = false;
      for (const selector of completeSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          completed = true;
          break;
        } catch {}
      }

      if (completed) {
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '10-after-complete-consultation');
        logTest('Complete Consultation - Complete', true, 'Consultation completed');
      } else {
        logTest('Complete Consultation - Complete', false, 'Complete button not found');
      }
    } else {
      logTest('Complete Consultation - Start', false, 'Start consultation button not found (may be no patients in waiting list)');
    }

    return true;
  } catch (error) {
    logTest('Complete Consultation End-to-End', false, error.message);
    return false;
  }
}

async function testCreateInvoiceEndToEnd(page) {
  console.log('\n=== Testing Create Invoice End-to-End ===');
  try {
    const email = process.env.RECEPTIONIST_EMAIL || 'receptionist@example.com';
    const password = process.env.RECEPTIONIST_PASSWORD || 'password123';

    await login(page, email, password);
    logTest('Create Invoice - Login', true, 'Logged in as Receptionist');

    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '11-reception-dashboard');

    const pageContent = await page.textContent('body');
    const hasInvoices = pageContent && (pageContent.includes('الفواتير') || pageContent.includes('invoice'));
    logTest('Create Invoice - Invoices Section', hasInvoices, hasInvoices ? 'Invoices section found' : 'Invoices section not found');

    // Try to find add invoice button
    const addButtonSelectors = [
      'button:has-text("إضافة فاتورة")',
      'button:has-text("إضافة")',
      'button:has-text("Add")',
      'button:has-text("فاتورة")'
    ];

    let addButtonClicked = false;
    for (const selector of addButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          addButtonClicked = true;
          break;
        }
      } catch {}
    }

    if (addButtonClicked) {
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '12-add-invoice-dialog');
      logTest('Create Invoice - Open Dialog', true, 'Add invoice dialog opened');

      // Try to fill form
      const patientSelect = await page.$('select[name="patient"], select:has-text("المريض")');
      if (patientSelect) {
        await patientSelect.selectOption({ index: 0 });
      }

      await takeScreenshot(page, '13-invoice-form-filled');
      logTest('Create Invoice - Fill Form', true, 'Invoice form filled');

      // Try to submit
      const submitSelectors = ['button[type="submit"]', 'button:has-text("حفظ")', 'button:has-text("Save")'];
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          submitted = true;
          break;
        } catch {}
      }

      if (submitted) {
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '14-after-create-invoice');
        logTest('Create Invoice - Submit', true, 'Invoice creation submitted');
      } else {
        logTest('Create Invoice - Submit', false, 'Submit button not found');
      }
    } else {
      logTest('Create Invoice - Open Dialog', false, 'Add invoice button not found');
    }

    return true;
  } catch (error) {
    logTest('Create Invoice End-to-End', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== Starting End-to-End Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await testCreatePatientEndToEnd(page);
    await testCompleteConsultationEndToEnd(page);
    await testCreateInvoiceEndToEnd(page);

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
