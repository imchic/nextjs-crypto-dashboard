// 프록시 설정 (AWS EC2 Squid 프록시)
const PROXY_URL = process.env.UPBIT_PROXY_URL || null;
let proxyAgent = null;

if (PROXY_URL) {
  const { HttpProxyAgent } = await import('http-proxy-agent');
  const { HttpsProxyAgent } = await import('https-proxy-agent');
  proxyAgent = {
    http: new HttpProxyAgent(PROXY_URL),
    https: new HttpsProxyAgent(PROXY_URL),
  };
}

export default async function handler(req, res) {
  try {
    // 1. 전체 마켓 리스트 가져오기 (한글명 포함)
    const marketsListRes = await fetch('https://api.upbit.com/v1/market/all', {
      headers: { 'Accept': 'application/json' },
      ...(proxyAgent && { agent: proxyAgent.https })
    });
    
    if (!marketsListRes.ok) {
      throw new Error(`Market list API error: ${marketsListRes.status}`);
    }
    
    const allMarkets = await marketsListRes.json();
    const krwMarkets = allMarkets.filter(m => m.market.startsWith('KRW-'));
    
    // 한글명 및 경고 매핑 생성
    const koreanNameMap = {};
    const marketWarningMap = {};
    krwMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      koreanNameMap[symbol] = m.korean_name;
      marketWarningMap[symbol] = m.market_warning || 'NONE';
    });
    
    const marketCodes = krwMarkets.map(m => m.market);
    
    if (marketCodes.length === 0) {
      throw new Error('No KRW markets found');
    }
    
    // 2. 전체 KRW 마켓 티커 데이터 가져오기 (한 번에 최대 100개씩)
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < marketCodes.length; i += batchSize) {
      batches.push(marketCodes.slice(i, i + batchSize));
    }
    
    let allTickers = [];
    for (const batch of batches) {
      const markets = batch.join(',');
      const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`, {
        headers: { 'Accept': 'application/json' },
        ...(proxyAgent && { agent: proxyAgent.https })
      });
      
      if (response.ok) {
        const tickers = await response.json();
        if (Array.isArray(tickers)) {
          allTickers = allTickers.concat(tickers);
        }
      }
      
      // API 요청 제한 고려 (초당 10회)
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (allTickers.length === 0) {
      throw new Error('No tickers returned from Upbit API');
    }
    
    // 3. 데이터 포맷팅 (실시간 한글명 및 경고 사용)
    const formatted = allTickers.map(ticker => {
      const symbol = ticker.market.replace('KRW-', '');
      const marketWarning = marketWarningMap[symbol] || 'NONE';
      
      return {
        market: ticker.market,
        symbol,
        name: koreanNameMap[symbol] || symbol, // API에서 받은 한글명 사용
        price: ticker.trade_price,
        change: ticker.signed_change_rate * 100,
        volume: ticker.acc_trade_price_24h,
        high: ticker.high_price,
        low: ticker.low_price,
        volume_power: ticker.acc_trade_price_24h / (ticker.prev_closing_price * ticker.acc_trade_volume_24h || 1),
        marketWarning, // 상장/유의/경고 정보
        isNew: marketWarning === 'CAUTION' && ticker.timestamp > (Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 이내 신규
      };
    });
    
    // 4. 카테고리별 분류 (실시간 데이터 기반)
    const byVolume = [...formatted]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
    
    const gainers = [...formatted]
      .filter(c => c.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 10);
    
    const losers = [...formatted]
      .filter(c => c.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 10);
    
    const dashboardData = {
      timestamp: new Date().toISOString(),
      stats: {
        total_markets: formatted.length,
        gainers_count: formatted.filter(c => c.change > 0).length,
        losers_count: formatted.filter(c => c.change < 0).length,
        avg_change: (formatted.reduce((sum, c) => sum + c.change, 0) / formatted.length).toFixed(2),
      },
      by_volume: byVolume,
      by_change: { gainers },
      by_decline: losers,
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
}
