#!/usr/bin/env python3
import requests

# 다양한 알트코인 테스트
test_coins = [
    'KRW-AGLD',     # 어드벤처골드
    'KRW-KITE',     # 카이트
    'KRW-ORBS',     # 오브스
    'KRW-FLOKI',    # 플로키
    'KRW-STX',      # 스택스
    'KRW-BLUR',     # 블러
    'KRW-SEI',      # 세이
    'KRW-APE',      # 에이프코인
    'KRW-SAND',     # 샌드박스
    'KRW-MANA',     # 디센트럴랜드
    'KRW-ENS',      # ENS
    'KRW-LDO',      # 리도
    'KRW-ATOM',     # 코스모스
    'KRW-FIL',      # 파일코인
    'KRW-MATIC',    # 폴리곤
]

print("="*80)
print("업비트 API - 알트코인 지원 여부 확인")
print("="*80)

supported = []
not_supported = []

for coin in test_coins:
    url = f"https://api.upbit.com/v1/ticker?markets={coin}"
    response = requests.get(url, timeout=5)
    
    if response.status_code == 200 and response.json():
        ticker = response.json()[0]
        price = ticker['trade_price']
        change = ticker['signed_change_rate'] * 100
        symbol = coin.replace('KRW-', '')
        
        supported.append(coin)
        print(f"✅ {symbol:6} | 가격: {price:>10,.0f}원 | 변동: {change:>7.2f}%")
    else:
        not_supported.append(coin)
        symbol = coin.replace('KRW-', '')
        print(f"❌ {symbol:6} | 지원 안 함")

print("="*80)
print(f"\n📊 결과:")
print(f"✅ 지원: {len(supported)}개")
print(f"❌ 미지원: {len(not_supported)}개")
print(f"✅ 지원 종목: {', '.join([c.replace('KRW-', '') for c in supported])}")
print(f"❌ 미지원 종목: {', '.join([c.replace('KRW-', '') for c in not_supported])}")
