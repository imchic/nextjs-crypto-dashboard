#!/usr/bin/env python3
import requests

url = "https://api.upbit.com/v1/ticker?markets=KRW-NEAR"
response = requests.get(url)
data = response.json()[0]

print("=" * 60)
print(f"종목: {data['market']}")
print(f"현재가: {data['trade_price']:,.0f}원")
print(f"change_rate (API): {data['change_rate']}")
print(f"change_rate % : {data['change_rate'] * 100:.2f}%")
print(f"change_price: {data['change_price']:+,.0f}원")
print(f"signed_change_price: {data['signed_change_price']:+,.0f}원")
print(f"signed_change_rate: {data['signed_change_rate']}")
print(f"전일 종가: {data['prev_closing_price']:,.0f}원")
print("=" * 60)
