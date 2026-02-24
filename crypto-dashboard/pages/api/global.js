// pages/api/global.js
// CoinGecko 글로벌 데이터 (BTC 도미넌스, 시장 캡 등)

export default async function handler(req, res) {
  try {
    console.log('🌍 Global API: Starting...');
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // 필요한 데이터만 추출
    const result = {
      btc_dominance: data.data?.btc_dominance || 0,
      eth_dominance: data.data?.eth_dominance || 0,
      market_cap_usd: data.data?.total_market_cap?.usd || 0,
      market_cap_krw: data.data?.total_market_cap?.krw || 0,
      market_cap_change_24h: data.data?.market_cap_change_percentage_24h_usd || 0,
      total_volume_usd: data.data?.total_volume?.usd || 0,
      total_volume_krw: data.data?.total_volume?.krw || 0,
      btc_price_usd: data.data?.btc_market_cap?.usd / data.data?.btc_dominance * 100 || 0,
    };

    console.log(`✅ BTC Dominance: ${result.btc_dominance?.toFixed(2)}%`);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Global API Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      btc_dominance: 0,
      eth_dominance: 0,
      market_cap_usd: 0,
      market_cap_krw: 0
    });
  }
}
