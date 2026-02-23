const { google } = require('googleapis');

// Load the service account credentials
const auth = new google.auth.GoogleAuth({
    keyFile: 'google-api/imchic-account-key.json',
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function listUpcomingEvents() {
    try {
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;

        if (events.length) {
            console.log('Upcoming events:');
            events.map((event) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
            });
        } else {
            console.log('No upcoming events found.');
        }
    } catch (error) {
        console.error('Error fetching calendar events:', error.message);
    }
}

listUpcomingEvents();