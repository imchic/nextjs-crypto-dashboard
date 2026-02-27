// pages/api/candles.js
// Upbit API 직접 호출

export default async function handler(req, res) {
  const { market, type = 'minutes/60', count = 24 } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    console.log(`Fetching candles for ${market} (${type})...`);

    const response = await fetch(
      `https://api.upbit.com/v1/candles/${type}?market=${market}&count=${count}`
    );

    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data length:', Array.isArray(data) ? data.length : 'not array');
    res.status(200).json(data);
  } catch (error) {
    console.error('Candles API Error:', error);
    res.status(500).json({ error: 'Failed to fetch candles', details: error.message });
  }
}


