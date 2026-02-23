export default async function handler(req, res) {
  try {
    console.log('📊 Dashboard API: Starting...');
    
    // 1. 모든 마켓 정보 조회 (직접 업비트 API 사용)
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all');
    if (!marketsResponse.ok) {
      console.warn(`⚠️ Market list API error: ${marketsResponse.status}`);
      throw new Error(`Market list API error: ${marketsResponse.status}`);
    }
    
    const allMarkets = await marketsResponse.json();
    console.log(`✅ Markets fetched: ${allMarkets.length} total`);
    
    const krwMarkets = allMarkets.filter(m => m && m.market && m.market.startsWith('KRW-'));
    console.log(`✅ KRW markets: ${krwMarkets.length}`);
    
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
      console.warn('⚠️ No KRW markets found');
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        stats: { total_markets: 0, gainers_count: 0, losers_count: 0, avg_change: 0 },
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
    
    console.log(`📦 Fetching ${batches.length} batches of tickers...`);
    
    let allTickers = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const markets = batch.join(',');
      
      try {
        console.log(`  [Batch ${i + 1}/${batches.length}] Requesting ${batch.length} markets...`);
        
        const response = await fetch(
          `https://api.upbit.com/v1/ticker?markets=${markets}`,
          { 
            headers: { 'Accept': 'application/json' },
            timeout: 10000
          }
        );
        
        console.log(`  [Batch ${i + 1}] Response status: ${response.status}`);
        
        if (response.ok) {
          const tickers = await response.json();
          console.log(`  [Batch ${i + 1}] Got ${tickers.length} tickers`);
          
          if (Array.isArray(tickers) && tickers.length > 0) {
            allTickers = allTickers.concat(tickers);
          }
        } else if (response.status === 429) {
          // Rate limit - wait longer and retry
          console.warn(`  [Batch ${i + 1}] Rate limited (429), waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
          
          // 재시도
          try {
            const retryResponse = await fetch(
              `https://api.upbit.com/v1/ticker?markets=${markets}`,
              { headers: { 'Accept': 'application/json' } }
            );
            if (retryResponse.ok) {
              const tickers = await retryResponse.json();
              console.log(`  [Batch ${i + 1}] Retry successful: ${tickers.length} tickers`);
              allTickers = allTickers.concat(tickers);
            }
          } catch (retryError) {
            console.error(`  [Batch ${i + 1}] Retry failed:`, retryError.message);
          }
        } else {
          console.warn(`  [Batch ${i + 1}] Non-OK response: ${response.status}`);
        }
      } catch (batchError) {
        console.error(`  [Batch ${i + 1}] Error:`, batchError.message);
      }
      
      // API 요청 제한 고려: 초당 10회 = 최소 100ms, 안전하게 500ms 사용
      if (i < batches.length - 1) {
        console.log(`  ⏳ Waiting 500ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Total tickers fetched: ${allTickers.length}`);
    
    // 데이터가 없으면 기본값 반환 (무한 새로고침 방지)
    if (!Array.isArray(allTickers) || allTickers.length === 0) {
      console.warn('⚠️ No tickers returned from Upbit API, returning empty dashboard');
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        stats: { total_markets: 0, gainers_count: 0, losers_count: 0, avg_change: 0 },
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
    }).filter(Boolean);
    
    console.log(`✅ Formatted: ${formatted.length} coins`);
    
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
    
    console.log('✅ Dashboard data ready');
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('❌ Dashboard API Error:', error.message);
    // 에러가 나도 빈 데이터 반환 (무한 새로고침 방지)
    res.status(200).json({
      timestamp: new Date().toISOString(),
      stats: { total_markets: 0, gainers_count: 0, losers_count: 0, avg_change: 0 },
      by_volume: [],
      by_change: { gainers: [] },
      by_decline: [],
    });
  }
}
