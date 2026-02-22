export default async function handler(req, res) {
  try {
    const coins = [
      'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'NEAR', 'DOT', 'LINK', 'UNI', 'ARB',
      'OP', 'MATIC', 'FIL', 'ATOM', 'ICP', 'SAND', 'MANA', 'ENS', 'LDO', 'BEAM',
      'SEI', 'FLOKI', 'STX', 'BLUR', 'GMT', 'PIXEL', 'SUI', 'APTOS', 'INJ', 'APE'
    ];
    
    const markets = coins.map(c => `KRW-${c}`).join(',');
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
    const tickers = await response.json();
    
    const formatted = tickers.map(ticker => {
      const symbol = ticker.market.replace('KRW-', '');
      return {
        market: ticker.market,
        symbol,
        name: ticker.korean_name || symbol,
        price: ticker.trade_price,
        change: ticker.signed_change_rate * 100,
        volume: ticker.acc_trade_price_24h,
        high: ticker.high_price,
        low: ticker.low_price,
      };
    });
    
    const byVolume = [...formatted].sort((a, b) => b.volume - a.volume).slice(0, 10);
    const gainers = [...formatted].filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
    const losers = [...formatted].filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
    
    const dashboardData = {
      timestamp: new Date().toISOString(),
      stats: {},
      by_volume: byVolume,
      by_change: { gainers },
      by_decline: losers,
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
