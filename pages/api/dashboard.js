export default async function handler(req, res) {
  try {
    // 1. 모든 마켓 정보 조회 (직접 업비트 API 사용)
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all');
    if (!marketsResponse.ok) {
      throw new Error(`Market list API error: ${marketsResponse.status}`);
    }
    
    const allMarkets = await marketsResponse.json();
    const krwMarkets = allMarkets.filter(m => m && m.market && m.market.startsWith('KRW-'));
    
    // 한글명 및 경고 매핑 생성
    const koreanNameMap = {};
    const marketWarningMap = {};
    krwMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      koreanNameMap[symbol] = m.korean_name || symbol;
      marketWarningMap[symbol] = m.market_warning || 'NONE';
    });
    
    const marketCodes = krwMarkets.map(m => m.market);
    
    if (marketCodes.length === 0) {
      // 마켓이 없으면 기본값 반환
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        stats: {
          total_markets: 0,
          gainers_count: 0,
          losers_count: 0,
          avg_change: 0,
        },
        by_volume: [],
        by_change: { gainers: [] },
        by_decline: [],
      });
    }
    
    // 2. 전체 KRW 마켓 티커 데이터 가져오기 (한 번에 최대 100개씩)
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < marketCodes.length; i += batchSize) {
      batches.push(marketCodes.slice(i, i + batchSize));
    }
    
    let allTickers = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const markets = batch.join(',');
      
      try {
        const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const tickers = await response.json();
          if (Array.isArray(tickers) && tickers.length > 0) {
            allTickers = allTickers.concat(tickers);
          }
        }
      } catch (batchError) {
        console.error(`Batch ${i} error:`, batchError);
        // 배치 실패해도 계속 진행
      }
      
      // API 요청 제한 고려 (초당 10회) + 요청 간 딜레이
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    // 데이터가 없으면 기본값 반환 (무한 새로고침 방지)
    if (!Array.isArray(allTickers) || allTickers.length === 0) {
      console.warn('No tickers returned from Upbit API, returning empty dashboard');
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        stats: {
          total_markets: 0,
          gainers_count: 0,
          losers_count: 0,
          avg_change: 0,
        },
        by_volume: [],
        by_change: { gainers: [] },
        by_decline: [],
      });
    }
    
    // 3. 데이터 포맷팅 (실시간 한글명 및 경고 사용)
    const formatted = allTickers.map(ticker => {
      if (!ticker || !ticker.market) return null;
      const symbol = ticker.market.replace('KRW-', '');
      const marketWarning = marketWarningMap[symbol] || 'NONE';
      
      return {
        market: ticker.market,
        symbol,
        name: koreanNameMap[symbol] || symbol,
        price: ticker.trade_price,
        change: ticker.signed_change_rate * 100,
        volume: ticker.acc_trade_price_24h,
        high: ticker.high_price,
        low: ticker.low_price,
        volume_power: ticker.acc_trade_price_24h / (ticker.prev_closing_price * ticker.acc_trade_volume_24h || 1),
        marketWarning,
        isNew: marketWarning === 'CAUTION' && ticker.timestamp > (Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }).filter(Boolean); // null 값 제거
    
    // 4. 카테고리별 분류 (실시간 데이터 기반)
    const byVolume = [...formatted]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);
    
    const gainers = [...formatted]
      .filter(c => c.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 30);
    
    const losers = [...formatted]
      .filter(c => c.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 30);
    
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
    // 에러가 나도 빈 데이터 반환 (무한 새로고침 방지)
    res.status(200).json({
      timestamp: new Date().toISOString(),
      stats: {
        total_markets: 0,
        gainers_count: 0,
        losers_count: 0,
        avg_change: 0,
      },
      by_volume: [],
      by_change: { gainers: [] },
      by_decline: [],
    });
  }
}
