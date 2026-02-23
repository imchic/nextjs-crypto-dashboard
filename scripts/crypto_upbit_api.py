#!/usr/bin/env python3
"""
업비트 실시간 API 연동 알트코인 분석 + 포트폴리오 추적
- 업비트 공개 API로 실시간 가격 수집
- 기술적 분석 (RSI, MACD, 볼린저밴드)
- 자동 매수/매도 신호 생성
- 포트폴리오 수익률 추적 및 분석
"""

import json
import urllib.request
import urllib.parse
import math
from datetime import datetime, timedelta
from pathlib import Path

# 설정
TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991
EMAIL = "imchic8@gmail.com"

# 포트폴리오 저장 경로
PORTFOLIO_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/crypto_portfolio.json")

# 주요 관심 알트코인 (업비트 마켓명 형식)
INTEREST_COINS = {
    "KRW-SOL": {"name": "솔라나", "tier": "대형"},
    "KRW-XRP": {"name": "리플", "tier": "대형"},
    "KRW-ADA": {"name": "카르다노", "tier": "대형"},
    "KRW-AVAX": {"name": "애벨란체", "tier": "대형"},
    "KRW-DOGE": {"name": "도지", "tier": "대형"},
    "KRW-NEAR": {"name": "니어", "tier": "대형"},
    "KRW-DOT": {"name": "폴카닷", "tier": "대형"},
    "KRW-LINK": {"name": "체인링크", "tier": "대형"},
    "KRW-UNI": {"name": "유니스왑", "tier": "대형"},
    "KRW-ARB": {"name": "아비트럼", "tier": "대형"},
    
    "KRW-OP": {"name": "옵티미즘", "tier": "중형"},
    "KRW-MATIC": {"name": "폴리곤", "tier": "중형"},
    "KRW-FIL": {"name": "파일코인", "tier": "중형"},
    "KRW-ATOM": {"name": "코스모스", "tier": "중형"},
    "KRW-ICP": {"name": "인터넷컴퓨터", "tier": "중형"},
    "KRW-SAND": {"name": "샌드박스", "tier": "중형"},
    "KRW-MANA": {"name": "디센트럴랜드", "tier": "중형"},
    "KRW-ENS": {"name": "ENS", "tier": "중형"},
    "KRW-LDO": {"name": "리도", "tier": "중형"},
    "KRW-LUNC": {"name": "루나클래식", "tier": "중형"},
    
    "KRW-BEAM": {"name": "빔", "tier": "소형"},
    "KRW-SEI": {"name": "세이", "tier": "소형"},
    "KRW-FLOKI": {"name": "플로키", "tier": "소형"},
    "KRW-STX": {"name": "스택스", "tier": "소형"},
    "KRW-BLUR": {"name": "블러", "tier": "소형"},
    "KRW-PIXEL": {"name": "픽셀", "tier": "소형"},
    "KRW-GMT": {"name": "GMT", "tier": "소형"},
    "KRW-APE": {"name": "에이프", "tier": "소형"},
}

def fetch_upbit_price(market):
    """업비트 API에서 현재가 조회"""
    try:
        url = f"https://api.upbit.com/v1/ticker?markets={market}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if isinstance(data, list) and len(data) > 0:
                return {
                    "price": data[0]["trade_price"],
                    "change_rate": data[0]["change_rate"] * 100,  # %로 변환
                    "change_24h": data[0]["change_rate"] * 100,
                    "volume": data[0]["acc_trade_volume"],
                    "timestamp": data[0]["trade_timestamp"],
                }
    except Exception as e:
        print(f"[ERROR] {market}: {e}")
        return None
    return None

def fetch_upbit_candles(market, count=200):
    """업비트 API에서 캔들 데이터 조회 (분석용)"""
    try:
        url = f"https://api.upbit.com/v1/candles/days?market={market}&count={count}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"[ERROR] Candles {market}: {e}")
        return None
    return None

def calculate_rsi(prices, period=14):
    """RSI 계산"""
    if len(prices) < period + 1:
        return 50
    
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    seed = deltas[:period]
    
    up = sum([x for x in seed if x > 0]) / period
    down = -sum([x for x in seed if x < 0]) / period
    
    if down == 0:
        return 100 if up > 0 else 0
    
    rs = up / down
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """볼린저 밴드 계산"""
    if len(prices) < period:
        return None, None, None
    
    sma = sum(prices[-period:]) / period
    variance = sum((x - sma) ** 2 for x in prices[-period:]) / period
    std = math.sqrt(variance)
    
    upper = sma + (std_dev * std)
    lower = sma - (std_dev * std)
    
    return lower, sma, upper

def analyze_coin_with_api(symbol, market):
    """API 데이터로 코인 분석"""
    # 현재가 조회
    price_data = fetch_upbit_price(market)
    if not price_data:
        return None
    
    # 캔들 데이터 조회 (기술적 분석용)
    candles = fetch_upbit_candles(market, count=200)
    if not candles:
        prices = [price_data["price"]]  # 현재가만 사용
    else:
        prices = [c["trade_price"] for c in reversed(candles)] + [price_data["price"]]
    
    # 기술적 분석
    rsi = calculate_rsi(prices)
    lower_bb, middle_bb, upper_bb = calculate_bollinger_bands(prices)
    
    # MACD 간단 버전
    prices_short = prices[-12:] if len(prices) >= 12 else prices
    prices_long = prices[-26:] if len(prices) >= 26 else prices
    
    ema_short = sum(prices_short) / len(prices_short)
    ema_long = sum(prices_long) / len(prices_long)
    macd = ema_short - ema_long
    macd_signal = "강세" if macd > 0 else "약세"
    
    # 변화율 분석
    change_24h = price_data.get("change_24h", 0)
    
    # 거래량 분석
    volume_trend = "증가" if price_data.get("volume", 0) > 0 else "감소"
    
    # 추천도 계산
    score = 2.5
    reasons = []
    cautions = []
    
    # RSI 분석
    if rsi > 70:
        score -= 1.0
        cautions.append("과매수 ⚠️")
    elif rsi < 30:
        score += 1.5
        reasons.append("과매도 기회 💡")
    elif 40 < rsi < 60:
        score += 0.5
        reasons.append("균형잡힘 ✅")
    
    # 변화율 분석
    if change_24h > 20:
        score += 1.5
        reasons.append("급등 🔥")
    elif change_24h > 10:
        score += 0.5
        reasons.append("상승 📈")
    elif change_24h < -15:
        score -= 1.5
        cautions.append("급락 📉")
    
    # MACD 분석
    if macd > 0:
        score += 0.5
        reasons.append("강세신호 📊")
    else:
        score -= 0.5
        cautions.append("약세신호 ⚠️")
    
    # 볼린저밴드
    current_price = prices[-1]
    if current_price < lower_bb:
        score += 1.0
        reasons.append("하단 돌파 진입 💪")
    elif current_price > upper_bb:
        score -= 0.5
        cautions.append("상단 과열 ⚠️")
    
    # 정규화
    score = max(1, min(5, score))
    
    # 추천도 결정
    if score >= 4.5:
        recommendation = "🟢 강추"
        action = "🔔 매수 신호!"
    elif score >= 3.5:
        recommendation = "🟢 추천"
        action = "매수 고려"
    elif score >= 2.5:
        recommendation = "🟡 중립"
        action = "HOLD"
    elif score >= 1.5:
        recommendation = "🔴 비추"
        action = "관망"
    else:
        recommendation = "🔴 강비추"
        action = "회피"
    
    return {
        "symbol": symbol,
        "market": market,
        "current_price": current_price,
        "change_24h": change_24h,
        "rsi": rsi,
        "macd": macd_signal,
        "bb_lower": lower_bb,
        "bb_middle": middle_bb,
        "bb_upper": upper_bb,
        "score": score,
        "recommendation": recommendation,
        "action": action,
        "reasons": reasons,
        "cautions": cautions,
    }

def load_portfolio():
    """포트폴리오 로드"""
    if PORTFOLIO_FILE.exists():
        try:
            with open(PORTFOLIO_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_portfolio(portfolio):
    """포트폴리오 저장"""
    with open(PORTFOLIO_FILE, 'w') as f:
        json.dump(portfolio, f, indent=2, ensure_ascii=False)

def calculate_portfolio_stats(portfolio, price_data):
    """포트폴리오 수익률 계산"""
    total_value = 0
    total_cost = 0
    positions = []
    
    for market, holdings in portfolio.items():
        if market not in price_data:
            continue
        
        current_price = price_data[market]["current_price"]
        avg_price = holdings["avg_price"]
        quantity = holdings["quantity"]
        
        cost = avg_price * quantity
        value = current_price * quantity
        profit = value - cost
        profit_pct = (profit / cost * 100) if cost > 0 else 0
        
        total_value += value
        total_cost += cost
        
        positions.append({
            "market": market,
            "symbol": market.replace("KRW-", ""),
            "quantity": quantity,
            "avg_price": avg_price,
            "current_price": current_price,
            "cost": cost,
            "value": value,
            "profit": profit,
            "profit_pct": profit_pct,
        })
    
    total_profit = total_value - total_cost
    total_profit_pct = (total_profit / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "positions": positions,
        "total_cost": total_cost,
        "total_value": total_value,
        "total_profit": total_profit,
        "total_profit_pct": total_profit_pct,
    }

def main():
    print("[START] 업비트 실시간 분석 시작")
    
    # 현황 수집
    price_data = {}
    analysis_data = []
    
    print("\n[1/4] 가격 데이터 수집 중...")
    for market, info in INTEREST_COINS.items():
        price = fetch_upbit_price(market)
        if price:
            price_data[market] = price
            print(f"  ✅ {market}: {price['price']:,.0f}원 ({price['change_24h']:+.2f}%)")
    
    print(f"\n[2/4] 기술적 분석 중... ({len(price_data)}개 종목)")
    for market, info in INTEREST_COINS.items():
        if market not in price_data:
            continue
        
        result = analyze_coin_with_api(info["name"], market)
        if result:
            analysis_data.append(result)
            print(f"  ✅ {market}")
    
    # 급등순위로 정렬
    analysis_data.sort(key=lambda x: x["change_24h"], reverse=True)
    
    # 포트폴리오 분석
    print("\n[3/4] 포트폴리오 분석 중...")
    portfolio = load_portfolio()
    
    if portfolio:
        portfolio_stats = calculate_portfolio_stats(portfolio, price_data)
        print(f"  💰 총자산: {portfolio_stats['total_value']:,.0f}원")
        print(f"  📊 수익: {portfolio_stats['total_profit']:,.0f}원 ({portfolio_stats['total_profit_pct']:+.2f}%)")
    else:
        print("  ℹ️  포트폴리오 데이터 없음")
        portfolio_stats = None
    
    # 매수/매도 신호 생성
    print("\n[4/4] 매수/매도 신호 생성 중...")
    buy_signals = [c for c in analysis_data if c["action"].startswith("매수")]
    sell_signals = [c for c in analysis_data if c["recommendation"] == "🔴 강비추"]
    
    print(f"  🔔 매수 신호: {len(buy_signals)}개")
    print(f"  ⛔ 회피 신호: {len(sell_signals)}개")
    
    # 텔레그램 발송
    print("\n📤 Telegram 발송...")
    tg_msg = generate_telegram_message(analysis_data, portfolio_stats, buy_signals, sell_signals)
    send_telegram(tg_msg)
    print("✅ 발송 완료!")
    
    return 0

def generate_telegram_message(analysis_data, portfolio_stats, buy_signals, sell_signals):
    """텔레그램 메시지 생성"""
    msg = "<b>🚀 업비트 실시간 알트코인 분석</b>\n"
    msg += f"<i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>\n\n"
    
    # 포트폴리오 현황
    if portfolio_stats:
        msg += "<b>💰 포트폴리오 현황</b>\n"
        msg += f"총자산: {portfolio_stats['total_value']:,.0f}원\n"
        msg += f"수익: {portfolio_stats['total_profit']:+,.0f}원 ({portfolio_stats['total_profit_pct']:+.2f}%)\n\n"
    
    # 상위 5대 급등
    msg += "<b>📈 TOP 5 급등</b>\n"
    for i, coin in enumerate(analysis_data[:5], 1):
        msg += f"{i}. {coin['symbol']}: {coin['change_24h']:+.2f}% | "
        msg += f"RSI:{coin['rsi']:.0f} | {coin['action']}\n"
    
    msg += "\n"
    
    # 매수 신호
    if buy_signals:
        msg += "<b>🔔 매수 신호 TOP 3</b>\n"
        for coin in buy_signals[:3]:
            msg += f"• {coin['symbol']}: RSI{coin['rsi']:.0f} | {coin['recommendation']}\n"
    
    msg += f"\n🤖 상세 분석은 이메일 확인 👇"
    
    return msg

def send_telegram(message):
    """텔레그램 발송"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_USER_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
        return result.get('ok', False)
    except Exception as e:
        print(f"[TELEGRAM] {e}")
        return False

if __name__ == "__main__":
    main()
