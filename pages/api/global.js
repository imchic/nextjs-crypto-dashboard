// pages/api/global.js
// CoinGecko Global Data API for market dominance

export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DolPick/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      console.error(`CoinGecko API HTTP ${response.status}:`, response.statusText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Invalid CoinGecko response structure');
    }

    // Extract market dominance data
    const btcDominance = data.data.btc_market_cap_percentage || 0;
    const ethDominance = data.data.eth_market_cap_percentage || 0;
    const totalMarketCapUsd = data.data.total_market_cap?.usd || 0;

    // USD를 한국원으로 환산 (1 USD ≈ 1,300 KRW 기준, 정확한 환율은 별도로 조회 필요)
    // 여기서는 간단히 USD를 조(10^12) 단위로 표시
    // 실제로는 CoinGecko에서 KRW 데이터를 직접 가져와야 함
    const totalMarketCapTrillion = Math.round(totalMarketCapUsd / 1e12 * 1.3); // 1.3 multiplier for KRW conversion estimate

    return res.status(200).json({
      btcDominance: parseFloat(btcDominance.toFixed(2)),
      ethDominance: parseFloat(ethDominance.toFixed(2)),
      totalMarketCap: totalMarketCapTrillion,
      totalMarketCapUsd: parseFloat((totalMarketCapUsd / 1e12).toFixed(2)),
      timestamp: new Date().toISOString(),
      success: true,
    });
  } catch (error) {
    console.error('Global API Error:', error.message);
    
    // Fallback data - 최근 실제 데이터 기반
    return res.status(200).json({
      btcDominance: 45.8,
      ethDominance: 17.2,
      totalMarketCap: 3100, // 조원 단위
      totalMarketCapUsd: 2400,
      timestamp: new Date().toISOString(),
      success: false,
      error: `API Error: ${error.message}. Using fallback data.`,
    });
  }
}
