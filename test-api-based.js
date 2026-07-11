const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test credentials
const CREDENTIALS = {
  superAdmin: { email: 'admin@platform.com', password: 'Admin@1234' },
  clinicAdmin: { email: 'clinic@dr-ahmed.com', password: 'Clinic123!' }
};

// Helper function to make HTTP requests with cookie support
function makeRequest(method, path, data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
            cookies: res.headers['set-cookie']
          };
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, data: body, cookies: res.headers['set-cookie'] });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testLogin(email, password) {
  console.log(`🔐 Testing login for ${email}...`);
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email,
      password
    });

    if (response.status === 200) {
      console.log(`✅ Login successful for ${email}`);
      
      // Extract cookies from response
      const cookies = response.cookies;
      if (cookies && cookies.length > 0) {
        console.log(`✅ Cookies received: ${cookies.length} cookie(s)`);
        // Return the cookie string for subsequent requests
        return cookies.join('; ');
      } else {
        console.log(`⚠️ No cookies received`);
        return 'no-cookies';
      }
    } else {
      console.log(`❌ Login failed for ${email}: Status ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Login error for ${email}:`, error.message);
    return null;
  }
}

async function testSuperAdmin() {
  console.log('\n🧪 Testing Super Admin Role...');
  
  const cookies = await testLogin(CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  
  if (!cookies) {
    console.log('❌ Cannot proceed without valid cookies');
    return;
  }

  // Test dashboard data
  try {
    const response = await makeRequest('GET', '/api/super-admin/stats', null, cookies !== 'no-cookies' ? cookies : null);
    console.log(response.status === 200 ? '✅ Dashboard data accessible' : `❌ Dashboard data not accessible (Status: ${response.status})`);
    if (response.data) {
      console.log('📝 Dashboard data:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Dashboard data error:', error.message);
  }
}

async function testClinicAdmin() {
  console.log('\n🧪 Testing Clinic Admin Role...');
  
  const cookies = await testLogin(CREDENTIALS.clinicAdmin.email, CREDENTIALS.clinicAdmin.password);
  
  if (!cookies) {
    console.log('❌ Cannot proceed without valid cookies');
    return;
  }

  // Test new clinic stats endpoint
  const clinicId = 'f41b28a0-a872-4fa8-885e-9ac8f82ebf3a';
  
  try {
    const response = await makeRequest('GET', `/api/clinics/${clinicId}/stats`, null, cookies !== 'no-cookies' ? cookies : null);
    console.log(response.status === 200 ? '✅ Clinic stats accessible' : `❌ Clinic stats not accessible (Status: ${response.status})`);
    if (response.data) {
      console.log('📝 Clinic stats:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Clinic stats error:', error.message);
  }
}

async function testAppointments() {
  console.log('\n🧪 Testing Appointments API...');
  
  const cookies = await testLogin(CREDENTIALS.clinicAdmin.email, CREDENTIALS.clinicAdmin.password);
  
  if (!cookies) {
    console.log('❌ Cannot proceed without valid cookies');
    return;
  }

  // Test appointments with clinic ID
  const clinicId = 'f41b28a0-a872-4fa8-885e-9ac8f82ebf3a'; // From login response
  
  try {
    const response = await makeRequest('GET', `/api/clinics/${clinicId}/appointments`, null, cookies !== 'no-cookies' ? cookies : null);
    console.log(response.status === 200 ? '✅ Appointments list accessible' : `❌ Appointments list not accessible (Status: ${response.status})`);
    if (response.data) {
      console.log('📝 Appointments count:', Array.isArray(response.data) ? response.data.length : 'N/A');
    }
  } catch (error) {
    console.log('❌ Appointments list error:', error.message);
  }
}

async function testPatients() {
  console.log('\n🧪 Testing Patients API...');
  
  const cookies = await testLogin(CREDENTIALS.clinicAdmin.email, CREDENTIALS.clinicAdmin.password);
  
  if (!cookies) {
    console.log('❌ Cannot proceed without valid cookies');
    return;
  }

  // Test patients with clinic ID
  const clinicId = 'f41b28a0-a872-4fa8-885e-9ac8f82ebf3a';
  
  try {
    const response = await makeRequest('GET', `/api/clinics/${clinicId}/patients`, null, cookies !== 'no-cookies' ? cookies : null);
    console.log(response.status === 200 ? '✅ Patients list accessible' : `❌ Patients list not accessible (Status: ${response.status})`);
    if (response.data) {
      console.log('📝 Patients count:', Array.isArray(response.data) ? response.data.length : 'N/A');
    }
  } catch (error) {
    console.log('❌ Patients list error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API-based UX tests...\n');
  
  const errors = [];

  try {
    await testSuperAdmin();
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('❌ Super Admin test failed:', error.message);
    errors.push({ role: 'Super Admin', error: error.message });
  }

  try {
    await testClinicAdmin();
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('❌ Clinic Admin test failed:', error.message);
    errors.push({ role: 'Clinic Admin', error: error.message });
  }

  try {
    await testAppointments();
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('❌ Appointments test failed:', error.message);
    errors.push({ role: 'Appointments', error: error.message });
  }

  try {
    await testPatients();
  } catch (error) {
    console.error('❌ Patients test failed:', error.message);
    errors.push({ role: 'Patients', error: error.message });
  }

  // Generate report
  console.log('\n📊 Test Results:');
  console.log('================');
  if (errors.length === 0) {
    console.log('✅ All API tests passed!');
  } else {
    console.log(`❌ ${errors.length} test(s) failed:`);
    errors.forEach(err => {
      console.log(`  - ${err.role}: ${err.error}`);
    });
  }
}

// Run tests
runTests().catch(console.error);
