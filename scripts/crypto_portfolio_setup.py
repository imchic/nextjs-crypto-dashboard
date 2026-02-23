#!/usr/bin/env python3
"""
암호화폐 포트폴리오 관리 도구
- 보유 코인 등록/수정/삭제
- 평단가 저장
- 자동 수익률 계산
"""

import json
from pathlib import Path

PORTFOLIO_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/crypto_portfolio.json")

def load_portfolio():
    """포트폴리오 로드"""
    if PORTFOLIO_FILE.exists():
        with open(PORTFOLIO_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_portfolio(portfolio):
    """포트폴리오 저장"""
    PORTFOLIO_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PORTFOLIO_FILE, 'w') as f:
        json.dump(portfolio, f, indent=2, ensure_ascii=False)
    print(f"✅ 포트폴리오 저장됨: {PORTFOLIO_FILE}")

def add_position(symbol, avg_price, quantity):
    """포지션 추가"""
    portfolio = load_portfolio()
    market = f"KRW-{symbol}" if not symbol.startswith("KRW-") else symbol
    
    portfolio[market] = {
        "symbol": symbol.replace("KRW-", ""),
        "avg_price": avg_price,
        "quantity": quantity,
        "added_at": "2026-02-22"
    }
    
    save_portfolio(portfolio)
    print(f"✅ {symbol} 추가: {quantity}개 @ {avg_price:,}원")

def remove_position(symbol):
    """포지션 제거"""
    portfolio = load_portfolio()
    market = f"KRW-{symbol}" if not symbol.startswith("KRW-") else symbol
    
    if market in portfolio:
        del portfolio[market]
        save_portfolio(portfolio)
        print(f"✅ {symbol} 제거됨")
    else:
        print(f"❌ {symbol}을(를) 찾을 수 없습니다")

def show_portfolio():
    """포트폴리오 현황 표시"""
    portfolio = load_portfolio()
    
    if not portfolio:
        print("포트폴리오가 비어있습니다")
        return
    
    print("\n📊 현재 포트폴리오")
    print("=" * 60)
    for market, data in portfolio.items():
        symbol = data.get("symbol", market.replace("KRW-", ""))
        print(f"\n{symbol} ({market})")
        print(f"  평단가: {data['avg_price']:,}원")
        print(f"  수량: {data['quantity']}개")
        print(f"  매입액: {data['avg_price'] * data['quantity']:,}원")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    # 예제: 보유 코인 등록
    print("🚀 포트폴리오 설정 예제\n")
    
    # SOL 등록
    add_position("SOL", 125500, 0.5)  # 0.5개 @ 125,500원
    
    # XRP 등록
    add_position("XRP", 2093, 100)  # 100개 @ 2,093원
    
    # AVAX 등록
    add_position("AVAX", 13270, 0.2)  # 0.2개 @ 13,270원
    
    # 현황 표시
    show_portfolio()
