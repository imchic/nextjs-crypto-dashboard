#!/usr/bin/env python3
import requests

# AGLD 시세 조회
url = "https://api.upbit.com/v1/ticker?markets=KRW-AGLD"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    if data:
        ticker = data[0]
        price = ticker['trade_price']
        change = ticker['signed_change_rate'] * 100
        volume = ticker['acc_trade_price_24h']
        
        print("✅ AGLD 조회 성공!")
        print(f"현재가: {price:,.0f}원")
        print(f"변동률: {change:+.2f}%")
        print(f"거래대금: ₩{volume:,.0f}")
    else:
        print("❌ AGLD 데이터 없음")
else:
    print(f"❌ API 에러: {response.status_code}")
