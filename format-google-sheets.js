const { google } = require('googleapis');

// Authenticate with Google Sheets API
const auth = new google.auth.GoogleAuth({
    keyFile: 'google-api/imchic-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function formatSheet() {
    try {
        const requests = [
            // Set sheet title and freeze the top row
            {
                updateSheetProperties: {
                    properties: {
                        sheetId: 0,
                        title: '빚 거래 내역',
                        gridProperties: { frozenRowCount: 1 },
                    },
                    fields: 'title,gridProperties.frozenRowCount',
                },
            },
            // Apply formatting to the header row
            {
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 3,
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.26, green: 0.45, blue: 0.77 },
                            textFormat: { bold: true, fontSize: 14, foregroundColor: { red: 1, green: 1, blue: 1 } },
                            horizontalAlignment: 'CENTER',
                        },
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
            },
            // Add borders to the table
            {
                updateBorders: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        startColumnIndex: 0,
                        endColumnIndex: 3,
                        endRowIndex: 12, // Assuming 12 rows of data
                    },
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                    innerHorizontal: { style: 'SOLID' },
                    innerVertical: { style: 'SOLID' },
                },
            },
            // Format values as currency (₩) and align right
            {
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        startColumnIndex: 1,
                        endColumnIndex: 3,
                    },
                    cell: {
                        userEnteredFormat: {
                            numberFormat: {
                                type: 'CURRENCY',
                                pattern: '#,##0 [$₩]'
                            },
                            horizontalAlignment: 'RIGHT',
                        },
                    },
                    fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
                },
            },
        ];

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: '1aE1EvZ1inspeqOAWGIbJSve4Gs7AxusIq7l4ac5C5DY',
            requestBody: {
                requests,
            },
        });

        console.log('Formatting applied successfully!');
    } catch (error) {
        console.error('Error formatting Google Sheets:', error.message);
    }
}

formatSheet();