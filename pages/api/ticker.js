// pages/api/ticker.js
export default async function handler(req, res) {
  const { market } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    const response = await fetch(
      `https://api.upbit.com/v1/ticker?markets=${market}`
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
}
