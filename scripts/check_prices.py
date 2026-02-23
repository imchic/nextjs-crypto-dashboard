#!/usr/bin/env python3
import requests
import json

url = "https://api.upbit.com/v1/ticker"
markets = "KRW-SOL,KRW-XRP,KRW-ADA,KRW-AVAX,KRW-DOGE,KRW-NEAR,KRW-DOT,KRW-LINK,KRW-UNI,KRW-ARB"

response = requests.get(url, params={'markets': markets})
data = response.json()

print("=" * 80)
for ticker in data:
    market = ticker['market']
    price = ticker['trade_price']
    change = ticker['signed_change_rate'] * 100
    symbol = market.replace('KRW-', '')
    arrow = '📈' if change > 0 else '📉'
    print(f"{arrow} {symbol:6} | 가격: {price:>10,.0f} | 변동: {change:>7.2f}%")
print("=" * 80)
