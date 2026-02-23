const { google } = require('googleapis');
const fs = require('fs');

// Load service account credentials
const KEYFILE_PATH = 'google-api/imchic-account-key.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Test function to write data to the Google Sheet
const SPREADSHEET_ID = '1aE1EvZ1inspeqOAWGIbJSve4Gs7AxusIq7l4ac5C5DY'; // Replace with your actual spreadsheet ID
const RANGE = 'sheet1!A1'; // Replace with the desired range

async function writeTestData() {
  try {
    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'RAW',
      resource: {
        values: [['Connected Successfully!', 'Test Complete']],
      },
    };

    const response = await sheets.spreadsheets.values.update(request);
    console.log(`${response.status}: ${response.statusText}`);
  } catch (error) {
    console.error('Error writing to Google Sheets:', error.message);
  }
}

writeTestData();