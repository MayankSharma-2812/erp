const BASE_URL = 'http://localhost:5000/api/v1';

const runVerification = async () => {
  console.log('--- Starting API & RBAC Verification ---\n');

  try {
    // 1. Verify Principal Login
    console.log('1. Testing Principal Login...');
    const principalLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'principal@vidyaerp.com',
        password: 'Password123!',
      }),
    });

    const principalData = await principalLoginResponse.json();
    if (principalLoginResponse.ok && principalData.success && principalData.data.accessToken) {
      console.log('✅ Principal login succeeded.');
      console.log(`   User: ${principalData.data.user.name} (${principalData.data.user.role})`);
    } else {
      throw new Error(`Principal login failed: ${JSON.stringify(principalData)}`);
    }

    const principalToken = principalData.data.accessToken;
    const cookieHeader = principalLoginResponse.headers.get('set-cookie');
    console.log('✅ Cookie received:', cookieHeader ? cookieHeader.split(';')[0] : 'None');

    // 2. Verify RBAC on protected route for Principal (Allowed)
    console.log('\n2. Testing RBAC for Principal (GET /users - Expected: Allowed)...');
    const principalUsersResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${principalToken}`,
      },
    });

    const principalUsersData = await principalUsersResponse.json();
    if (principalUsersResponse.ok && principalUsersData.success) {
      console.log(`✅ Principal authorized. Fetched ${principalUsersData.data.length} users successfully.`);
    } else {
      throw new Error(`Principal authorization failed: ${JSON.stringify(principalUsersData)}`);
    }

    // 3. Verify Cashier Login
    console.log('\n3. Testing Cashier Login...');
    const cashierLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cashier@vidyaerp.com',
        password: 'Password123!',
      }),
    });

    const cashierData = await cashierLoginResponse.json();
    const cashierToken = cashierData.data.accessToken;
    console.log(`✅ Cashier login succeeded. User: ${cashierData.data.user.name} (${cashierData.data.user.role})`);

    // 4. Verify RBAC on protected route for Cashier (Expected: Denied)
    console.log('\n4. Testing RBAC for Cashier (GET /users - Expected: 403 Forbidden)...');
    const cashierUsersResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${cashierToken}`,
      },
    });

    const cashierUsersData = await cashierUsersResponse.json();
    if (cashierUsersResponse.status === 403) {
      console.log('✅ Cashier correctly denied access with 403 Forbidden.');
      console.log('   Response message:', cashierUsersData.message);
    } else {
      throw new Error(`❌ Error: Cashier was NOT denied (Status: ${cashierUsersResponse.status}): ${JSON.stringify(cashierUsersData)}`);
    }

    // 5. Verify Token Refresh
    console.log('\n5. Testing Token Refresh...');
    if (cookieHeader) {
      const refreshCookie = cookieHeader.split(';')[0];
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: refreshCookie,
        },
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.success && refreshData.data.accessToken) {
        console.log('✅ Token refresh succeeded. New access token received.');
      } else {
        throw new Error(`Token refresh failed: ${JSON.stringify(refreshData)}`);
      }
    } else {
      console.log('⚠️ Warning: No refresh cookie to test refresh endpoint.');
    }

    // 6. Verify Logout
    console.log('\n6. Testing Logout...');
    if (cookieHeader) {
      const refreshCookie = cookieHeader.split(';')[0];
      const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: refreshCookie,
        },
      });
      const logoutData = await logoutResponse.json();
      if (logoutResponse.ok && logoutData.success) {
        console.log('✅ Logout succeeded.');
      } else {
        throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
      }
    } else {
      console.log('⚠️ Warning: No refresh cookie to test logout.');
    }

    console.log('\n🎉 ALL Phase 1 API and RBAC verification checks passed successfully!');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
};

runVerification();
