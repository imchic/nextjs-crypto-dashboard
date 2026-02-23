const fs = require('fs');

const COINS = [
  'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'NEAR', 'DOT', 'LINK', 'UNI', 'ARB',
  'OP', 'MATIC', 'FIL', 'ATOM', 'ICP', 'SAND', 'MANA', 'ENS', 'LDO', 'BEAM',
  'SEI', 'FLOKI', 'STX', 'BLUR', 'GMT', 'PIXEL', 'SUI', 'APTOS', 'INJ', 'APE'
];

const KOREAN_NAMES = {
  'SOL': '솔라나', 'XRP': '리플', 'ADA': '카르다노', 'AVAX': '애벨란체',
  'DOGE': '도지', 'NEAR': '니어', 'DOT': '폴카닷', 'LINK': '체인링크',
  'UNI': '유니스왑', 'ARB': '아비트럼', 'OP': '옵티미즘', 'MATIC': '폴리곤',
  'FIL': '파일코인', 'ATOM': '코스모스', 'ICP': '인터넷컴퓨터', 'SAND': '샌드박스',
  'MANA': '디센트럴랜드', 'ENS': 'ENS', 'LDO': '리도', 'BEAM': '빔',
  'SEI': '세이', 'FLOKI': '플로키', 'STX': '스택스', 'BLUR': '블러',
  'GMT': 'GMT', 'PIXEL': '픽셀', 'SUI': '수이', 'APTOS': '앱토스',
  'INJ': '인젝티브', 'APE': '에이프코인'
};

async function updateData() {
  try {
    const markets = COINS.map(coin => `KRW-${coin}`).join(',');
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
    const tickers = await response.json();

    const formatted = tickers.map(ticker => {
      const symbol = ticker.market.replace('KRW-', '');
      return {
        market: ticker.market,
        symbol,
        name: KOREAN_NAMES[symbol] || symbol,
        price: ticker.trade_price,
        change: parseFloat((ticker.signed_change_rate * 100).toFixed(2)),
        volume: ticker.acc_trade_price_24h
      };
    });

    // 거래량 순 정렬
    const byVolume = [...formatted].sort((a, b) => b.volume - a.volume);

    // 상승률 순 정렬
    const gainers = formatted.filter(c => c.change > 0).sort((a, b) => b.change - a.change);

    // 하락률 순 정렬
    const losers = formatted.filter(c => c.change < 0).sort((a, b) => a.change - b.change);

    const data = {
      timestamp: new Date().toISOString(),
      stats: {
        avg_change: (formatted.reduce((sum, c) => sum + c.change, 0) / formatted.length).toFixed(2),
        gainers_count: gainers.length,
        losers_count: losers.length,
        total: formatted.length,
        top_volume: byVolume[0].symbol,
        top_volume_amount: (byVolume[0].volume / 1e8).toFixed(2)
      },
      by_change: {
        gainers: gainers.slice(0, 10),
        losers: losers.slice(0, 10)
      },
      by_volume: byVolume.slice(0, 10),
      by_decline: losers.slice(0, 10)
    };

    fs.writeFileSync('../crypto_dashboard.json', JSON.stringify(data, null, 2));
    console.log('✅ crypto_dashboard.json 업데이트 완료!');
    console.log(`📊 총 ${data.stats.total}개 코인 | 상승 ${data.stats.gainers_count} | 하락 ${data.stats.losers_count}`);
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
    process.exit(1);
  }
}

updateData();
