#!/usr/bin/env python3
"""
Upbit all coins dynamic query + 4 group classification
"""

import requests
import json
from datetime import datetime

# 1. Get all markets
markets_url = "https://api.upbit.com/v1/market/all"
markets_response = requests.get(markets_url)
markets_data = markets_response.json()

# Filter KRW markets
krw_markets = [m['market'] for m in markets_data if m['market'].startswith('KRW-')]

print(f"✅ Upbit coins: {len(krw_markets)} retrieved...")

# 2. Batch query
all_coins = []
batch_size = 100

KOREAN_NAMES = {
    'KRW-SOL': '솔라나',
    'KRW-XRP': '리플',
    'KRW-ADA': '카르다노',
    'KRW-AVAX': '애벨란체',
    'KRW-DOGE': '도지',
    'KRW-NEAR': '니어',
    'KRW-DOT': '폴카닷',
    'KRW-LINK': '체인링크',
    'KRW-UNI': '유니스왑',
    'KRW-ARB': '아비트럼',
    'KRW-AGLD': '어드벤처골드',
    'KRW-KITE': '카이트',
    'KRW-ORBS': '오브스',
    'KRW-STX': '스택스',
    'KRW-BLUR': '블러',
    'KRW-SEI': '세이',
    'KRW-SAND': '샌드박스',
    'KRW-MANA': '디센트럴랜드',
    'KRW-FLOW': '플로우',
    'KRW-ENSO': '엔소',
    'KRW-SXP': '스와이프',
    'KRW-AZTEC': '아즈텍',
    'KRW-BTC': '비트코인',
    'KRW-CYBER': '사이버',
    'KRW-YGG': '일드길드',
    'KRW-FLOCK': '플록',
    'KRW-VTHO': '비토로',
    'KRW-SOMI': '솔미',
    'KRW-OM': '오엠',
    'KRW-BARD': '바드',
    'KRW-ETH': '이더리움',
    'KRW-USDT': '테더',
    'KRW-USDC': '유에스디씨',
    'KRW-BNB': '바이낸스코인',
    'KRW-XEC': '이캐시',
    'KRW-DYDX': '디와이디엑스',
    'KRW-MATIC': '폴리곤',
    'KRW-SHIB': '시바이누',
}

for i in range(0, len(krw_markets), batch_size):
    batch = krw_markets[i:i+batch_size]
    markets_str = ",".join(batch)
    
    ticker_url = "https://api.upbit.com/v1/ticker"
    ticker_response = requests.get(ticker_url, params={'markets': markets_str})
    tickers = ticker_response.json()
    
    for ticker in tickers:
        market = ticker['market']
        symbol = market.replace('KRW-', '')
        korean_name = KOREAN_NAMES.get(market, symbol)
        price = ticker['trade_price']
        change = ticker['signed_change_rate'] * 100
        trade_volume = ticker['acc_trade_price_24h']
        
        coin = {
            'market': market,
            'symbol': symbol,
            'name': korean_name,
            'price': int(price),
            'change': round(change, 2),
            'volume': int(trade_volume)
        }
        
        all_coins.append(coin)

# Stats and groups
gainers = sorted([c for c in all_coins if c['change'] > 0], key=lambda x: x['change'], reverse=True)
losers = sorted([c for c in all_coins if c['change'] <= 0], key=lambda x: x['change'])
by_volume = sorted(all_coins, key=lambda x: x['volume'], reverse=True)

# Recommended (high volume + positive change)
recommended = sorted(
    [c for c in all_coins if c['change'] > -2 and c['volume'] > 1e9],
    key=lambda x: (x['volume'], x['change']),
    reverse=True
)

avg_change = sum([c['change'] for c in all_coins]) / len(all_coins) if all_coins else 0

dashboard = {
    'timestamp': datetime.now().isoformat(),
    'stats': {
        'avg_change': round(avg_change, 2),
        'gainers_count': len(gainers),
        'losers_count': len(losers),
        'total': len(all_coins),
    },
    'groups': {
        'volume': by_volume[:10],
        'gainers': gainers[:10],
        'losers': losers[:10],
        'recommended': recommended[:10]
    },
    'all_coins': by_volume
}

# Save JSON
with open('/mnt/c/Users/imchi/.openclaw/workspace/nextjs-dashboard/public/crypto_dashboard.json', 'w', encoding='utf-8') as f:
    json.dump(dashboard, f, ensure_ascii=False, indent=2)

print(f"✅ Dashboard updated!")
print(f"Total: {len(all_coins)} | Gainers: {len(gainers)} | Losers: {len(losers)}")
