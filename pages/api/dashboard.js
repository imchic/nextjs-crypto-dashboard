// API 응답 캐시 (메모리)
const apiCache = {
  data: null,
  timestamp: 0,
  ttl: 5000, // 5초 캐시
};

export default async function handler(req, res) {
  try {
    // 캐시 확인
    const now = Date.now();
    if (apiCache.data && (now - apiCache.timestamp) < apiCache.ttl) {
      return res.status(200).json(apiCache.data);
    }

    console.log('📊 Dashboard API: Starting...');

    // 1. 모든 마켓 정보 조회
    const marketsResponse = await fetch(`https://api.upbit.com/v1/market/all`);
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
      const emptyResponse = {
        timestamp: new Date().toISOString(),
        stats: { total_markets: 0, gainers_count: 0, losers_count: 0, avg_change: 0 },
        by_volume: [],
        by_change: { gainers: [] },
        by_decline: [],
      };
      apiCache.data = emptyResponse;
      apiCache.timestamp = now;
      return res.status(200).json(emptyResponse);
    }

    // 2. 전체 KRW 마켓 티커 데이터 가져오기 (EC2 프록시로 100개씩, Rate Limit 방지)
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < marketCodes.length; i += batchSize) {
      batches.push(marketCodes.slice(i, i + batchSize));
    }

    console.log(`📦 Fetching ${batches.length} batches of tickers...`);

    let allTickers = [];
    for (let i = 0; i < batches.length; i++) {
      const batchCodes = batches[i];
      const tickersUrl = `https://api.upbit.com/v1/ticker?markets=${batchCodes.join(',')}`;

      try {
        const tickersResponse = await fetch(tickersUrl, {
          headers: {
            'User-Agent': 'DolPick/1.0',
          }
        });

        if (tickersResponse.status === 429) {
          console.warn('⚠️ Rate limited, waiting before retry...');
          // Rate limit 발생 시 500ms 대기
          await new Promise(resolve => setTimeout(resolve, 500));

          // 재시도 (한 번)
          const retryResponse = await fetch(tickersUrl, {
            headers: {
              'User-Agent': 'DolPick/1.0',
            }
          });

          if (!retryResponse.ok) {
            console.warn(`⚠️ Batch ${i + 1} failed: ${retryResponse.status}`);
            continue;
          }

          const batchTickers = await retryResponse.json();
          allTickers.push(...batchTickers);
        } else if (!tickersResponse.ok) {
          console.warn(`⚠️ Batch ${i + 1} failed: ${tickersResponse.status}`);
          continue;
        } else {
          const batchTickers = await tickersResponse.json();
          allTickers.push(...batchTickers);
        }
      } catch (error) {
        console.warn(`⚠️ Batch ${i + 1} error:`, error.message);
        continue;
      }

      // 배치 사이에 200ms 대기 (Rate Limit 방지)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Tickers fetched: ${allTickers.length}`);

    // 3. 데이터 포맷팅
    const formatted = allTickers.map(ticker => {
      const symbol = ticker.market.replace('KRW-', '');
      const change = ((ticker.trade_price - ticker.opening_price) / ticker.opening_price) * 100;

      return {
        market: ticker.market,
        symbol,
        name: koreanNameMap[symbol] || symbol,
        price: ticker.trade_price,
        change: parseFloat(change.toFixed(2)),
        volume: ticker.acc_trade_volume_24h,
        high: ticker.high_price_24h,
        low: ticker.low_price_24h,
        trade_price_24h: ticker.acc_trade_price_24h,
        volume_power: ticker.trade_volume_24h / ticker.acc_trade_volume_24h || 1,
        marketWarning: marketWarningMap[symbol] || 'NONE',
        isNew: symbol === 'NEW',
      };
    });

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

    // 백그라운드에서 CoinGecko 데이터 수집 (응답을 기다리지 않음)
    console.log('📊 CoinGecko 데이터를 백그라운드에서 수집 중...');
    (async () => {
      try {
        const top30Symbols = byVolume.map(c => c.symbol);
        for (let i = 0; i < top30Symbols.length; i++) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/coingecko?symbol=${top30Symbols[i]}`)
            .catch(() => null);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        }
      } catch (e) {
        console.error('백그라운드 CoinGecko 로드 실패:', e.message);
      }
    })();

    // 캐시 저장
    apiCache.data = dashboardData;
    apiCache.timestamp = now;

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
