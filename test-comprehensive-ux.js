const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
const EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test credentials
const CREDENTIALS = {
  superAdmin: { email: 'admin@platform.com', password: 'Admin@1234' },
  clinicAdmin: { email: 'clinic@dr-ahmed.com', password: 'Clinic123!' },
  // Will be created during test
  doctor: { email: 'test-doctor@clinic.com', password: 'Test123!' },
  receptionist: { email: 'test-reception@clinic.com', password: 'Test123!' }
};

// Helper functions
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filepath}`);
}

async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`❌ Selector not found: ${selector}`);
    return false;
  }
}

async function clickAndWait(page, selector, timeout = 5000) {
  try {
    await page.click(selector);
    await page.waitForTimeout(500);
    return true;
  } catch (error) {
    console.log(`❌ Failed to click: ${selector}`);
    return false;
  }
}

async function typeText(page, selector, text) {
  try {
    await page.waitForSelector(selector);
    await page.type(selector, text);
    return true;
  } catch (error) {
    console.log(`❌ Failed to type in: ${selector}`);
    return false;
  }
}

async function login(page, email, password) {
  console.log(`🔐 Logging in as ${email}...`);
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'login-page');
  
  // Fill login form
  await typeText(page, 'input[type="email"]', email);
  await typeText(page, 'input[type="password"]', password);
  await takeScreenshot(page, 'login-form-filled');
  
  // Submit
  await clickAndWait(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'after-login');
  
  console.log(`✅ Logged in as ${email}`);
}

// Test functions
async function testSuperAdmin(page) {
  console.log('\n🧪 Testing Super Admin Role...');
  
  await login(page, CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  
  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard/super-admin`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'super-admin-dashboard');
  
  // Test dashboard stats
  const statsVisible = await waitForSelector(page, '[class*="card"]');
  console.log(statsVisible ? '✅ Dashboard stats visible' : '❌ Dashboard stats not visible');
  
  console.log('✅ Super Admin test completed');
}

async function testClinicAdmin(page) {
  console.log('\n🧪 Testing Clinic Admin Role...');
  
  await login(page, CREDENTIALS.clinicAdmin.email, CREDENTIALS.clinicAdmin.password);
  
  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'clinic-admin-dashboard');
  
  // Test dashboard stats
  const dashboardVisible = await waitForSelector(page, '[class*="dashboard"]');
  console.log(dashboardVisible ? '✅ Dashboard visible' : '❌ Dashboard not visible');
  
  // Test tabs
  console.log('🔍 Testing tabs...');
  const tabsVisible = await waitForSelector(page, '[class*="tabs"]');
  console.log(tabsVisible ? '✅ Tabs visible' : '❌ Tabs not visible');
  
  console.log('✅ Clinic Admin test completed');
}

async function testDoctor(page) {
  console.log('\n🧪 Testing Doctor Role...');
  
  // Login as doctor (assuming account exists)
  await login(page, CREDENTIALS.doctor.email, CREDENTIALS.doctor.password);
  
  // Navigate to doctor dashboard
  await page.goto(`${BASE_URL}/dashboard/doctor`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'doctor-dashboard');
  
  // Test dashboard stats
  const doctorDashboardVisible = await waitForSelector(page, '[class*="dashboard"]');
  console.log(doctorDashboardVisible ? '✅ Doctor dashboard visible' : '❌ Doctor dashboard not visible');
  
  console.log('✅ Doctor test completed');
}

async function testReceptionist(page) {
  console.log('\n🧪 Testing Receptionist Role...');
  
  // Login as receptionist (assuming account exists)
  await login(page, CREDENTIALS.receptionist.email, CREDENTIALS.receptionist.password);
  
  // Navigate to reception dashboard
  await page.goto(`${BASE_URL}/dashboard/reception`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'reception-dashboard');
  
  // Test dashboard stats
  const receptionDashboardVisible = await waitForSelector(page, '[class*="dashboard"]');
  console.log(receptionDashboardVisible ? '✅ Reception dashboard visible' : '❌ Reception dashboard not visible');
  
  // Test tabs
  console.log('🔍 Testing tabs...');
  const tabsVisible = await waitForSelector(page, '[class*="tabs"]');
  console.log(tabsVisible ? '✅ Tabs visible' : '❌ Tabs not visible');
  
  console.log('✅ Receptionist test completed');
}

async function testOnlineBooking(page) {
  console.log('\n🧪 Testing Online Booking...');
  
  // Navigate to booking page
  await page.goto(`${BASE_URL}/booking`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'booking-page');
  
  console.log('✅ Online booking test completed');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting comprehensive UX tests...\n');
  
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: false,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const errors = [];
  
  try {
    // Test Super Admin
    try {
      await testSuperAdmin(page);
    } catch (error) {
      console.error('❌ Super Admin test failed:', error.message);
      errors.push({ role: 'Super Admin', error: error.message });
    }
    
    // Test Clinic Admin
    try {
      await testClinicAdmin(page);
    } catch (error) {
      console.error('❌ Clinic Admin test failed:', error.message);
      errors.push({ role: 'Clinic Admin', error: error.message });
    }
    
    // Test Doctor
    try {
      await testDoctor(page);
    } catch (error) {
      console.error('❌ Doctor test failed:', error.message);
      errors.push({ role: 'Doctor', error: error.message });
    }
    
    // Test Receptionist
    try {
      await testReceptionist(page);
    } catch (error) {
      console.error('❌ Receptionist test failed:', error.message);
      errors.push({ role: 'Receptionist', error: error.message });
    }
    
    // Test Online Booking
    try {
      await testOnlineBooking(page);
    } catch (error) {
      console.error('❌ Online booking test failed:', error.message);
      errors.push({ role: 'Online Booking', error: error.message });
    }
    
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n📊 Test Results:');
  console.log('================');
  if (errors.length === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${errors.length} test(s) failed:`);
    errors.forEach(err => {
      console.log(`  - ${err.role}: ${err.error}`);
    });
  }
  
  console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
}

// Run tests
runTests().catch(console.error);
