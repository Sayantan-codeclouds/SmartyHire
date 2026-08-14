const testRegistrationAPI = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Codeclouds Dev',
        name: 'Sayantan Das',
        email: 'sayantan.das@codeclouds.com',
        password: 'password123',
      }),
    });

    const data = await res.json();
    console.log('[API Registration Result]', data);
    process.exit(0);
  } catch (err) {
    console.error('[API Error]', err.message);
    process.exit(1);
  }
};

testRegistrationAPI();
