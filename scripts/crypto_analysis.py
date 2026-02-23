#!/usr/bin/env python3
import requests
import json

url = "https://api.upbit.com/v1/ticker"
markets = "KRW-SOL,KRW-XRP,KRW-ADA,KRW-AVAX,KRW-DOGE,KRW-NEAR,KRW-DOT,KRW-LINK,KRW-UNI,KRW-ARB"

response = requests.get(url, params={'markets': markets})
data = response.json()

# 데이터 정렬
gainers = []
losers = []
high_volume = []

for ticker in data:
    market = ticker['market']
    symbol = market.replace('KRW-', '')
    price = ticker['trade_price']
    change = ticker['signed_change_rate'] * 100
    trade_volume = ticker['acc_trade_price_24h']
    
    coin = {
        'symbol': symbol,
        'price': price,
        'change': change,
        'volume': trade_volume
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

print("\n" + "="*100)
print("📈 전일대비 상승률 (높은순)")
print("="*100)
for coin in gainers:
    print(f"  {coin['symbol']:6} | 가격: {coin['price']:>10,.0f} | 변동: {coin['change']:>7.2f}% | 거래대금: ₩{coin['volume']/1e9:>6.2f}B")

if not gainers:
    print("  상승 종목 없음 ❌")

print("\n" + "="*100)
print("💰 거래대금 (많은순)")
print("="*100)
for coin in high_volume:
    volume_b = coin['volume'] / 1e9
    print(f"  {coin['symbol']:6} | 가격: {coin['price']:>10,.0f} | 변동: {coin['change']:>7.2f}% | 거래대금: ₩{volume_b:>6.2f}B")

print("\n" + "="*100)
print("📉 전일대비 하락 (큰순)")
print("="*100)
for coin in losers:
    print(f"  {coin['symbol']:6} | 가격: {coin['price']:>10,.0f} | 변동: {coin['change']:>7.2f}% | 거래대금: ₩{coin['volume']/1e9:>6.2f}B")

if not losers:
    print("  하락 종목 없음 ✅")

print("="*100 + "\n")
