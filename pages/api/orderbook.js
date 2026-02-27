// pages/api/orderbook.js
// Upbit API 직접 호출

export default async function handler(req, res) {
  const { market } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    const response = await fetch(
      `https://api.upbit.com/v1/orderbook?markets=${market}`
    );

    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Orderbook API Error:', error);
    res.status(500).json({ error: 'Failed to fetch orderbook', details: error.message });
  }
}
