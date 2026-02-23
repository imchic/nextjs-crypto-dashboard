// pages/api/ticker.js
export default async function handler(req, res) {
  const { market } = req.query;

  if (!market) {
    return res.status(400).json({ error: 'Market parameter required' });
  }

  try {
    const markets = market.split(',');
    let response = await fetch(
      `https://api.upbit.com/v1/ticker?markets=${market}`
    );
    let data = await response.json();

    // 만약 전체 요청이 실패했으면 (404 또는 에러), 개별 마켓 검증
    if (!Array.isArray(data) || data.length === 0) {
      const validTickers = [];

      for (const m of markets) {
        try {
          const singleRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${m}`);
          const singleData = await singleRes.json();

          // 유효한 데이터(배열이고 길이가 1 이상)만 추가
          if (Array.isArray(singleData) && singleData.length > 0) {
            validTickers.push(singleData[0]);
          }
        } catch (e) {
          // 개별 요청 실패는 무시하고 계속
        }
      }

      return res.status(200).json(validTickers);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
}
