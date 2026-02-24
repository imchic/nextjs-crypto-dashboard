// pages/api/trades.js
// EC2 포트 5000 프록시 사용 (CORS + 429 레이트 제한 해결)
const EC2_API_URL = 'http://3.36.240.119:5000';

export default async function handler(req, res) {
  const { market, count = 20 } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    // EC2 서버를 통해 요청 프록시
    const response = await fetch(
      `${EC2_API_URL}/api/trades?market=${market}&count=${count}`
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Trades API Error:', error);
    // 폴백: 직접 Upbit API 호출 (EC2 다운 시)
    try {
      const fallbackResponse = await fetch(
        `https://api.upbit.com/v1/trades/ticks?market=${market}&count=${count}`
      );
      const fallbackData = await fallbackResponse.json();
      res.status(200).json(fallbackData);
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  }
}
