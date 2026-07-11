/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-roles-permissions-results.json');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
  securityIssues: []
};

function logTest(testName, passed, message, screenshot = null, isSecurityIssue = false) {
  testResults.total++;
  if (passed) testResults.passed++;
  else testResults.failed++;

  const result = {
    testName,
    passed,
    message,
    screenshot,
    timestamp: new Date().toISOString(),
    isSecurityIssue
  };
  testResults.tests.push(result);

  if (isSecurityIssue && !passed) {
    testResults.securityIssues.push({
      testName,
      message,
      timestamp: new Date().toISOString()
    });
  }

  const status = passed ? '[PASSED]' : (isSecurityIssue ? '[SECURITY ISSUE]' : '[FAILED]');
  console.log(`${status} ${testName}`);
  if (message) console.log(`  ${message}`);
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `perm-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function testCrossRoleAccess() {
  console.log('\n=== Testing Cross-Role Access ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test Doctor accessing Admin
    console.log('\n--- Testing Doctor Access to Admin ---');
    await page.goto(`${BASE_URL}/dashboard/login`);
    await page.fill('input[type="email"]', 'doctor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    const doctorAccessAdmin = page.url().includes('admin');
    logTest('Cross-Role: Doctor → Admin', !doctorAccessAdmin, 
      !doctorAccessAdmin ? 'Doctor correctly blocked from Admin' : 'SECURITY ISSUE: Doctor can access Admin',
      null, true);

    // Test Doctor accessing Reception
    await page.goto(`${BASE_URL}/dashboard/reception`);
    await page.waitForLoadState('networkidle');
    const doctorAccessReception = page.url().includes('reception');
    logTest('Cross-Role: Doctor → Reception', !doctorAccessReception,
      !doctorAccessReception ? 'Doctor correctly blocked from Reception' : 'SECURITY ISSUE: Doctor can access Reception',
      null, true);

    // Logout
    await page.goto(`${BASE_URL}/dashboard/login`);

    // Test Receptionist accessing Doctor
    console.log('\n--- Testing Receptionist Access to Doctor ---');
    await page.fill('input[type="email"]', 'receptionist@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/dashboard/doctor`);
    await page.waitForLoadState('networkidle');
    const receptionAccessDoctor = page.url().includes('doctor');
    logTest('Cross-Role: Receptionist → Doctor', !receptionAccessDoctor,
      !receptionAccessDoctor ? 'Receptionist correctly blocked from Doctor' : 'SECURITY ISSUE: Receptionist can access Doctor',
      null, true);

    // Test Receptionist accessing Admin
    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForLoadState('networkidle');
    const receptionAccessAdmin = page.url().includes('admin');
    logTest('Cross-Role: Receptionist → Admin', !receptionAccessAdmin,
      !receptionAccessAdmin ? 'Receptionist correctly blocked from Admin' : 'SECURITY ISSUE: Receptionist can access Admin',
      null, true);

    // Logout
    await page.goto(`${BASE_URL}/dashboard/login`);

    // Test Clinic Admin accessing Super Admin
    console.log('\n--- Testing Clinic Admin Access to Super Admin ---');
    await page.fill('input[type="email"]', 'clinic@dr-ahmed.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/super-admin`);
    await page.waitForLoadState('networkidle');
    const clinicAccessSuper = page.url().includes('super-admin');
    logTest('Cross-Role: Clinic Admin → Super Admin', !clinicAccessSuper,
      !clinicAccessSuper ? 'Clinic Admin correctly blocked from Super Admin' : 'SECURITY ISSUE: Clinic Admin can access Super Admin',
      null, true);

  } catch (error) {
    logTest('Cross-Role Access Tests', false, error.message);
  } finally {
    await browser.close();
  }
}

async function testGranularPermissions() {
  console.log('\n=== Testing Granular Permissions ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test Receptionist without finance permission
    console.log('\n--- Testing Receptionist Finance Access ---');
    await page.goto(`${BASE_URL}/dashboard/login`);
    await page.fill('input[type="email"]', 'receptionist@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/dashboard/finance`);
    await page.waitForLoadState('networkidle');
    const receptionAccessFinance = page.url().includes('finance');
    logTest('Granular: Receptionist → Finance', !receptionAccessFinance,
      !receptionAccessFinance ? 'Receptionist correctly blocked from Finance' : 'Receptionist can access Finance (check if intended)',
      null, false);

    // Test Receptionist without reports permission
    await page.goto(`${BASE_URL}/dashboard/reports`);
    await page.waitForLoadState('networkidle');
    const receptionAccessReports = page.url().includes('reports');
    logTest('Granular: Receptionist → Reports', !receptionAccessReports,
      !receptionAccessReports ? 'Receptionist correctly blocked from Reports' : 'Receptionist can access Reports (check if intended)',
      null, false);

    // Logout
    await page.goto(`${BASE_URL}/dashboard/login`);

    // Test Doctor without settings permission
    console.log('\n--- Testing Doctor Settings Access ---');
    await page.fill('input[type="email"]', 'doctor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');
    const doctorAccessSettings = page.url().includes('settings');
    logTest('Granular: Doctor → Settings', !doctorAccessSettings,
      !doctorAccessSettings ? 'Doctor correctly blocked from Settings' : 'Doctor can access Settings (check if intended)',
      null, false);

  } catch (error) {
    logTest('Granular Permissions Tests', false, error.message);
  } finally {
    await browser.close();
  }
}

async function testTenantIsolation() {
  console.log('\n=== Testing Tenant Isolation ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // This test would require multiple clinics to properly test
    // For now, we'll just verify that users are scoped to their clinic
    console.log('\n--- Testing User Clinic Scoping ---');
    await page.goto(`${BASE_URL}/dashboard/login`);
    await page.fill('input[type="email"]', 'doctor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    const pageContent = await page.textContent('body');
    const hasClinicContext = pageContent && (pageContent.includes('clinic') || pageContent.includes('عيادة'));
    logTest('Tenant Isolation - Clinic Context', hasClinicContext,
      hasClinicContext ? 'User has clinic context' : 'No clinic context found (may be issue)',
      null, false);

  } catch (error) {
    logTest('Tenant Isolation Tests', false, error.message);
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('=== Starting Roles & Permissions Tests ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  await testCrossRoleAccess();
  await testGranularPermissions();
  await testTenantIsolation();

  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log('\n=== Test Results Saved ===');
  console.log(`Results saved to: ${TEST_RESULTS_FILE}`);
  console.log(JSON.stringify({
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    securityIssues: testResults.securityIssues.length
  }, null, 2));

  if (testResults.securityIssues.length > 0) {
    console.log('\n⚠️  SECURITY ISSUES FOUND:');
    testResults.securityIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.testName}: ${issue.message}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests();
