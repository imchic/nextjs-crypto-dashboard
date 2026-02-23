// Test Upbit API connection
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function testUpbitAPI() {
  try {
    const config = JSON.parse(fs.readFileSync('upbit_config.json', 'utf8'));
    console.log('Config loaded:', Object.keys(config));

    const payload = {
      access_key: config.access_key,
      nonce: uuidv4(),
    };

    const token = jwt.sign(payload, config.secret_key);
    const authorizationToken = `Bearer ${token}`;

    console.log('Token generated');

    const response = await fetch('https://api.upbit.com/v1/accounts', {
      headers: { Authorization: authorizationToken },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }

    const accounts = await response.json();
    console.log('Accounts:', JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpbitAPI();
