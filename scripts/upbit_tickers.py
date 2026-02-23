#!/usr/bin/env python3
"""
업비트 30개 종목 실시간 시세 조회
"""

import requests
import json
from datetime import datetime

# 30개 추천 종목 (한글명 포함)
COINS = {
    # 대형
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
    
    # 중형
    'KRW-OP': '옵티미즘',
    'KRW-MATIC': '폴리곤',
    'KRW-FIL': '파일코인',
    'KRW-ATOM': '코스모스',
    'KRW-ICP': '인터컴',
    'KRW-SAND': '샌드박스',
    'KRW-MANA': '디센트럴랜드',
    'KRW-ENS': 'ENS',
    'KRW-LDO': '리도',
    'KRW-BEAM': '빔',
    
    # 소형
    'KRW-SEI': '세이',
    'KRW-FLOKI': '플로키',
    'KRW-STX': '스택스',
    'KRW-BLUR': '블러',
    'KRW-GMT': 'GMT타운',
    'KRW-PIXEL': '픽셀',
    'KRW-SUI': '수이',
    'KRW-APTOS': '앱토스',
    'KRW-INJ': '인젝티브',
    'KRW-APE': '에이프코인',
}

def get_tickers():
    """30개 종목 시세 조회 (배치 처리)"""
    url = "https://api.upbit.com/v1/ticker"
    
    all_tickers = []
    failed_coins = []
    
    # 5개씩 묶어서 요청 (서버 부하 분산)
    coin_list = list(COINS.keys())
    batch_size = 5
    
    print(f"[INFO] {len(coin_list)}개 종목 시세 조회 중 (배치: {batch_size}개씩)...")
    
    for i in range(0, len(coin_list), batch_size):
        batch = coin_list[i:i+batch_size]
        markets = ','.join(batch)
        
        try:
            params = {'markets': markets}
            headers = {'Accept': 'application/json'}
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                all_tickers.extend(data)
                print(f"  ✅ [{i+len(batch):2d}/{len(coin_list)}] {','.join(batch)}")
            else:
                print(f"  ❌ [{i+len(batch):2d}/{len(coin_list)}] Status {response.status_code}")
                failed_coins.extend(batch)
                
        except Exception as e:
            print(f"  ❌ [{i+len(batch):2d}/{len(coin_list)}] Error: {e}")
            failed_coins.extend(batch)
    
    print(f"\n[SUCCESS] {len(all_tickers)}개 종목 조회 완료!")
    
    if failed_coins:
        print(f"[WARNING] {len(failed_coins)}개 실패: {','.join(failed_coins)}")
    
    return all_tickers if all_tickers else None

def display_results(tickers):
    """결과 출력"""
    if not tickers:
        return
    
    print("\n" + "=" * 110)
    print(f"업비트 {len(tickers)}개 종목 실시간 시세 | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 110)
    print()
    
    # 가격 변동률로 정렬
    sorted_tickers = sorted(tickers, key=lambda x: x['change_rate'], reverse=True)
    
    print(f"{'순위':<5} {'종목':<12} {'한글명':<12} {'현재가':<15} {'24h변동':<12} {'고가':<15} {'저가':<15}")
    print("-" * 110)
    
    for idx, ticker in enumerate(sorted_tickers, 1):
        market = ticker['market']
        korean_name = COINS.get(market, 'N/A')
        price = ticker['trade_price']
        change_rate = ticker['change_rate'] * 100
        high_price = ticker['high_price']
        low_price = ticker['low_price']
        
        # 변동률에 따라 이모지 표시
        if change_rate > 5:
            emoji = "🔥"
        elif change_rate > 0:
            emoji = "📈"
        elif change_rate > -5:
            emoji = "📉"
        else:
            emoji = "❄️"
        
        print(f"{idx:<5} {market:<12} {korean_name:<12} {price:>14,.0f} {emoji} {change_rate:>9.2f}% {high_price:>14,.0f} {low_price:>14,.0f}")
    
    print()
    print("=" * 110)
    
    # 통계
    avg_change = sum([t['change_rate'] for t in tickers]) / len(tickers)
    top_3_gainers = sorted(tickers, key=lambda x: x['change_rate'], reverse=True)[:3]
    top_3_losers = sorted(tickers, key=lambda x: x['change_rate'])[:3]
    
    print(f"\n📊 통계:")
    print(f"  평균 변동률: {avg_change * 100:+.2f}%")
    print(f"  총 상승 종목: {len([t for t in tickers if t['change_rate'] > 0])}개")
    print(f"  총 하락 종목: {len([t for t in tickers if t['change_rate'] < 0])}개")
    
    print(f"\n🔥 TOP 3 상승:")
    for i, ticker in enumerate(top_3_gainers, 1):
        market = ticker['market']
        korean_name = COINS.get(market, 'N/A')
        change = ticker['change_rate'] * 100
        print(f"  {i}. {market} ({korean_name}): {change:+.2f}%")
    
    print(f"\n❄️ TOP 3 하락:")
    for i, ticker in enumerate(top_3_losers, 1):
        market = ticker['market']
        korean_name = COINS.get(market, 'N/A')
        change = ticker['change_rate'] * 100
        print(f"  {i}. {market} ({korean_name}): {change:+.2f}%")

if __name__ == "__main__":
    print()
    tickers = get_tickers()
    if tickers:
        display_results(tickers)
    else:
        print("❌ 시세 조회 실패")
