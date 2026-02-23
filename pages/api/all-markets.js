// pages/api/all-markets.js

export default async function handler(req, res) {
  try {
    console.log('🔍 all-markets API: Starting...');
    
    // 1. 모든 마켓 정보 조회 (한글명 포함)
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all');
    if (!marketsResponse.ok) {
      console.warn(`⚠️ Market list failed: ${marketsResponse.status}`);
      return res.status(200).json([]);
    }
    
    const allMarkets = await marketsResponse.json();
    console.log(`✅ Total markets: ${allMarkets.length}`);
    
    // KRW 마켓만 필터링 + 한글명 매핑 생성
    const krwMarkets = allMarkets.filter(m => m && m.market && m.market.startsWith('KRW-'));
    console.log(`✅ KRW markets: ${krwMarkets.length}`);
    
    const koreanNameMap = {};
    krwMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      koreanNameMap[symbol] = m.korean_name || symbol;
    });

    const marketCodes = krwMarkets.map(m => m.market);

    if (marketCodes.length === 0) {
      console.warn('⚠️ No KRW markets');
      return res.status(200).json([]);
    }

    // 2. 모든 KRW 마켓의 현재가 조회 (100개씩 분할)
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < marketCodes.length; i += chunkSize) {
      chunks.push(marketCodes.slice(i, i + chunkSize));
    }

    console.log(`📦 Fetching ${chunks.length} chunks...`);

    let tickers = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`  [Chunk ${i + 1}/${chunks.length}] Requesting ${chunk.length} markets...`);
        
        const tickerResponse = await fetch(
          `https://api.upbit.com/v1/ticker?markets=${chunk.join(',')}`
        );
        
        console.log(`  [Chunk ${i + 1}] Response: ${tickerResponse.status}`);
        
        if (tickerResponse.ok) {
          const data = await tickerResponse.json();
          console.log(`  [Chunk ${i + 1}] Got ${data.length} tickers`);
          
          if (Array.isArray(data) && data.length > 0) {
            tickers = tickers.concat(data);
          }
        } else if (tickerResponse.status === 429) {
          // Rate limit - wait and retry
          console.warn(`  [Chunk ${i + 1}] Rate limited (429), waiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const retryResponse = await fetch(
              `https://api.upbit.com/v1/ticker?markets=${chunk.join(',')}`
            );
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              console.log(`  [Chunk ${i + 1}] Retry OK: ${data.length} tickers`);
              tickers = tickers.concat(data);
            }
          } catch (retryError) {
            console.error(`  [Chunk ${i + 1}] Retry failed:`, retryError.message);
          }
        }
      } catch (e) {
        console.error(`  [Chunk ${i}] Error:`, e.message);
      }
      
      // API 요청 제한: 초당 10회 = 500ms 최소 대기
      if (i < chunks.length - 1) {
        console.log(`  ⏳ Waiting 500ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Total tickers: ${tickers.length}`);

    // 3. 포맷팅 (실시간 한글명 사용)
    const formatted = tickers.map(ticker => {
      if (!ticker || !ticker.market) return null;
      const symbol = ticker.market.replace('KRW-', '');
      return {
        symbol,
        name: koreanNameMap[symbol] || symbol,
        market: ticker.market,
        price: ticker.trade_price,
        change: parseFloat((ticker.signed_change_rate * 100).toFixed(2)),
        volume: ticker.acc_trade_price_24h,
        trade_volume: ticker.acc_trade_volume_24h,
      };
    }).filter(Boolean);

    console.log(`✅ Formatted: ${formatted.length} coins`);

    // 거래대금 순 정렬
    formatted.sort((a, b) => b.volume - a.volume);

    res.status(200).json(formatted);
  } catch (error) {
    console.error('❌ All markets API error:', error.message);
    res.status(200).json([]);
  }
}
