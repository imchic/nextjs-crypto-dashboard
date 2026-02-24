// pages/api/global.js
// CoinGecko Global Data API for market dominance with caching

// 메모리 캐시
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60초 캐시

export default async function handler(req, res) {
  try {
    const now = Date.now();
    
    // 캐시 확인 (60초 이내면 캐시된 데이터 반환)
    if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
      console.log('Returning cached global data');
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
      });
    }

    const response = await fetch('https://api.coingecko.com/api/v3/global', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DolPick/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    // 429 Rate Limit 에러 처리
    if (response.status === 429) {
      console.warn('CoinGecko API Rate Limited (429) - Using fallback data');
      
      // 캐시된 데이터가 있으면 반환
      if (cachedData) {
        return res.status(200).json({
          ...cachedData,
          fromCache: true,
          rateLimited: true,
        });
      }
      
      // 캐시도 없으면 기본값
      return res.status(200).json({
        btcDominance: 45.8,
        ethDominance: 17.2,
        totalMarketCap: 3100,
        totalMarketCapUsd: 2400,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Rate Limited - Using fallback data',
        rateLimited: true,
      });
    }

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

    // USD를 한국원으로 환산
    const totalMarketCapTrillion = Math.round(totalMarketCapUsd / 1e12 * 1.3);

    const responseData = {
      btcDominance: parseFloat(btcDominance.toFixed(2)),
      ethDominance: parseFloat(ethDominance.toFixed(2)),
      totalMarketCap: totalMarketCapTrillion,
      totalMarketCapUsd: parseFloat((totalMarketCapUsd / 1e12).toFixed(2)),
      timestamp: new Date().toISOString(),
      success: true,
    };

    // 캐시 업데이트
    cachedData = responseData;
    lastFetchTime = now;

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Global API Error:', error.message);
    
    // 캐시된 데이터 반환
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
        error: `API Error: ${error.message}`,
      });
    }
    
    // 기본 fallback
    return res.status(200).json({
      btcDominance: 45.8,
      ethDominance: 17.2,
      totalMarketCap: 3100,
      totalMarketCapUsd: 2400,
      timestamp: new Date().toISOString(),
      success: false,
      error: `API Error: ${error.message}. Using fallback data.`,
    });
  }
}
