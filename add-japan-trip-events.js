const fs = require('fs');
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'google-api/imchic-account-key.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

(async () => {
  try {
    const data = JSON.parse(fs.readFileSync('japan-trip.json'));

    for (const event of data.events) {
      const res = await calendar.events.insert({
        calendarId: 'hyobin.im@gmail.com',
        resource: event
      });
      console.log(`Event added: ${res.data.summary}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();