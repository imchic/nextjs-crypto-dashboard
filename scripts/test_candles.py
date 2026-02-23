#!/usr/bin/env python3
import requests
import json

symbol = "SOL"
market = f"KRW-{symbol}"

print(f"테스트: {market}")
print("="*80)

# 캔들 데이터 조회
url = f"https://api.upbit.com/v1/candles/hours/1?market={market}&count=24"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print(f"✅ 캔들 데이터 조회 성공! ({len(data)}개)")
    print(json.dumps(data[:2], indent=2, ensure_ascii=False))
else:
    print(f"❌ 에러: {response.status_code}")
    print(response.text)
