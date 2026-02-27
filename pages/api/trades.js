// pages/api/trades.js
// Upbit API 직접 호출

export default async function handler(req, res) {
  const { market, count = 20 } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    const response = await fetch(
      `https://api.upbit.com/v1/trades/ticks?market=${market}&count=${count}`
    );

    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Trades API Error:', error);
    res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
  }
}
