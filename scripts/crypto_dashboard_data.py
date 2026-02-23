#!/usr/bin/env python3
"""
3가지 기준으로 암호화폐 분석 (상승률 / 거래대금 / 하락)
"""

import requests
import json
from datetime import datetime

url = "https://api.upbit.com/v1/ticker"
markets = "KRW-SOL,KRW-XRP,KRW-ADA,KRW-AVAX,KRW-DOGE,KRW-NEAR,KRW-DOT,KRW-LINK,KRW-UNI,KRW-ARB"

COINS = {
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
}

response = requests.get(url, params={'markets': markets})
data = response.json()

# 데이터 정렬
gainers = []
losers = []
high_volume = []

for ticker in data:
    market = ticker['market']
    symbol = market.replace('KRW-', '')
    korean_name = COINS.get(market, 'N/A')
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
    
    if change > 0:
        gainers.append(coin)
    else:
        losers.append(coin)
    
    high_volume.append(coin)

# 정렬
gainers = sorted(gainers, key=lambda x: x['change'], reverse=True)
losers = sorted(losers, key=lambda x: x['change'], reverse=True)
high_volume = sorted(high_volume, key=lambda x: x['volume'], reverse=True)

# 통계
total = len(gainers) + len(losers)
avg_change = sum([c['change'] for c in gainers + losers]) / total if total > 0 else 0

dashboard = {
    'timestamp': datetime.now().isoformat(),
    'stats': {
        'avg_change': round(avg_change, 2),
        'gainers_count': len(gainers),
        'losers_count': len(losers),
        'total': total,
        'top_volume': high_volume[0]['symbol'] if high_volume else 'N/A',
        'top_volume_amount': round(high_volume[0]['volume'] / 1e9, 2) if high_volume else 0
    },
    'by_change': {
        'gainers': gainers,
        'losers': losers
    },
    'by_volume': high_volume,
    'by_decline': losers
}

# JSON 저장
with open('/mnt/c/Users/imchi/.openclaw/workspace/crypto_dashboard.json', 'w', encoding='utf-8') as f:
    json.dump(dashboard, f, ensure_ascii=False, indent=2)

with open('/mnt/c/Users/imchi/.openclaw/workspace/nextjs-dashboard/public/crypto_dashboard.json', 'w', encoding='utf-8') as f:
    json.dump(dashboard, f, ensure_ascii=False, indent=2)

print("✅ 대시보드 데이터 업데이트 완료!")
print(f"📈 상승: {len(gainers)}개, 📉 하락: {len(losers)}개")
print(f"💰 거래대금 TOP: {high_volume[0]['symbol']} (₩{high_volume[0]['volume']/1e9:.2f}B)")
