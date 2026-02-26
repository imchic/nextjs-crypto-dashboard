// pages/api/coingecko.js
// CoinGecko에서 코인 정보 (시가총액, 순위 등) 가져오기

const SYMBOL_TO_COINGECKO_ID = {
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'NEAR': 'near',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ARB': 'arbitrum',
  'AGLD': 'adventure-gold',
  'KITE': 'kite',
  'ORBS': 'orbs',
  'STX': 'stacks',
  'BLUR': 'blur',
  'SEI': 'sei',
  'SAND': 'sandbox',
  'MANA': 'decentraland',
  'FLOW': 'flow',
  'ENSO': 'ethena-stake',
  'SXP': 'swipe',
  'BTC': 'bitcoin',
  'CYBER': 'cyber',
  'YGG': 'yield-guild-games',
  'FLOCK': 'flock',
  'VTHO': 'vethor-token',
  'SOMI': 'somnia',
  'OM': 'om',
  'BARD': 'bard',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XEC': 'ecash',
  'DYDX': 'dydx',
  'MATIC': 'matic-network',
  'SHIB': 'shiba-inu',
  'PUNDIX': 'pundi-x-2',
};

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const coinGeckoId = SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()];

    if (!coinGeckoId) {
      return res.status(404).json({ error: `Unknown symbol: ${symbol}` });
    }

    console.log(`Fetching CoinGecko data for ${symbol} (${coinGeckoId})...`);

    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&market_data=true&tickers=false'
    );

    if (!response.ok) {
      //throw new Error(`CoinGecko API error: ${response.status}`);
      console.error(`CoinGecko API HTTP ${response.status}:`, response.statusText);
    }

    const data = await response.json();

    // 필요한 정보만 추출
    const result = {
      symbol: symbol.toUpperCase(),
      name: data.name,
      market_cap_rank: data.market_cap_data?.market_cap_rank || null,
      market_cap_usd: data.market_data?.market_cap?.usd || null,
      market_cap_krw: data.market_data?.market_cap?.krw || null,
      image: data.image?.small || null,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('CoinGecko API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
