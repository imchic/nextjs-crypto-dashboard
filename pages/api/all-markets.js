// pages/api/all-markets.js

export default async function handler(req, res) {
  try {
    // 1. 모든 마켓 정보 조회 (한글명 포함)
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all');
    if (!marketsResponse.ok) {
      return res.status(200).json([]); // 에러여도 빈 배열 반환
    }
    
    const allMarkets = await marketsResponse.json();
    
    // KRW 마켓만 필터링 + 한글명 매핑 생성
    const krwMarkets = allMarkets.filter(m => m && m.market && m.market.startsWith('KRW-'));
    const koreanNameMap = {};
    krwMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      koreanNameMap[symbol] = m.korean_name || symbol;
    });

    const marketCodes = krwMarkets.map(m => m.market);

    if (marketCodes.length === 0) {
      return res.status(200).json([]);
    }

    // 2. 모든 KRW 마켓의 현재가 조회 (100개씩 분할)
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < marketCodes.length; i += chunkSize) {
      chunks.push(marketCodes.slice(i, i + chunkSize));
    }

    let tickers = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const tickerResponse = await fetch(
          `https://api.upbit.com/v1/ticker?markets=${chunk.join(',')}`
        );
        if (tickerResponse.ok) {
          const data = await tickerResponse.json();
          if (Array.isArray(data)) {
            tickers = tickers.concat(data);
          }
        }
      } catch (e) {
        console.error(`Chunk ${i} fetch error:`, e);
        // 청크 에러여도 계속 진행
      }
      
      // API 요청 제한 고려
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

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
    }).filter(Boolean); // null 값 제거

    // 거래대금 순 정렬
    formatted.sort((a, b) => b.volume - a.volume);

    res.status(200).json(formatted);
  } catch (error) {
    console.error('All markets API error:', error);
    // 에러여도 빈 배열 반환 (무한 새로고침 방지)
    res.status(200).json([]);
  }
}
