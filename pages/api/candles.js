// pages/api/candles.js
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
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Data length:', Array.isArray(data) ? data.length : 'not array');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}


