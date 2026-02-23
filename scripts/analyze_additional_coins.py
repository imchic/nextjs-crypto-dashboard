#!/usr/bin/env python3
"""
어드벤처골드, 신퓨처스 등 추가 코인 분석
"""

import json
import urllib.request
import urllib.parse

TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991

def fetch_price(market):
    """가격 조회"""
    try:
        url = f"https://api.upbit.com/v1/ticker?markets={market}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return {
                    "price": data[0]["trade_price"],
                    "change": data[0]["change_rate"] * 100,
                    "market_cap_rank": "N/A",
                }
    except Exception as e:
        print(f"[Error] {market}: {e}")
    return None

def analyze_coin(symbol, korean_name, market):
    """코인 분석"""
    price_data = fetch_price(market)
    if not price_data:
        return None
    
    change = price_data["change"]
    
    # 분석
    score = 2.5
    reasons = []
    cautions = []
    
    if change > 15:
        score += 1.5
        reasons.append("최근 상승세 📈")
    elif change > 5:
        score += 0.5
        reasons.append("약간 상승 📈")
    elif change < -10:
        score -= 1.5
        cautions.append("최근 하락 📉")
    
    score = max(1, min(5, score))
    
    if score >= 4:
        rec = "🟢 강추"
        action = "매수 추천"
    elif score >= 3:
        rec = "🟢 추천"
        action = "매수 고려"
    elif score >= 2:
        rec = "🟡 중립"
        action = "관망"
    else:
        rec = "🔴 비추"
        action = "회피"
    
    return {
        "symbol": symbol,
        "korean_name": korean_name,
        "market": market,
        "price": price_data["price"],
        "change": change,
        "score": score,
        "recommendation": rec,
        "action": action,
        "reasons": reasons,
        "cautions": cautions,
    }

def send_telegram(msg):
    """텔레그램 발송"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_USER_ID,
            "text": msg,
            "parse_mode": "HTML"
        }
        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode()).get('ok')
    except:
        return False

# 분석할 코인들
coins_to_analyze = [
    ("KRW-AGLD", "어드벤처골드", "Adventure Gold"),
    ("KRW-MAGIC", "매직", "Magic"),
    ("KRW-FLOW", "플로우", "Flow"),
    ("KRW-GALA", "갈라", "Gala"),
]

print("추가 코인 분석 중...\n")

results = []
for market, korean_name, english_name in coins_to_analyze:
    result = analyze_coin(market.split("-")[1], korean_name, market)
    if result:
        results.append(result)
        print(f"✅ {korean_name} ({result['symbol']}) - {result['price']:,}원 ({result['change']:+.2f}%)")
    else:
        print(f"❌ {korean_name} - 조회 실패 (업비트 미등록일 수 있음)")

# 메시지 생성
if results:
    msg = """<b>🎮 추가 코인 분석</b>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

주인님이 관심 있어 하신 코인들을 분석했습니다!

"""
    
    for coin in results:
        msg += f"""<b>{coin['symbol']} ({coin['korean_name']})</b>
현재가: {coin['price']:,}원
24h: {coin['change']:+.2f}%
추천: {coin['recommendation']}
액션: {coin['action']}

"""
    
    msg += """<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

💡 <b>분석 의견</b>

⚠️ <b>신규 코인 투자 시 주의사항</b>

1️⃣ <b>유동성 확인</b>
   • 거래량이 충분한지 확인
   • 스프레드(매수/매도 가격 차이) 확인

2️⃣ <b>프로젝트 펀더멘탈</b>
   • 실제 게임/서비스 런칭 여부
   • 개발 팀의 실적
   • 커뮤니티 규모

3️⃣ <b>위험도 평가</b>
   • 신규 프로젝트는 변동성이 높음
   • 포트폴리오의 5% 이상 투자 금지
   • 손절 규칙 반드시 설정

4️⃣ <b>기술적 분석</b>
   • RSI, MACD, 거래량 확인
   • 지지선/저항선 파악

🚀 <b>게임파이(GameFi) & 메타버스 코인 전망</b>

✅ <b>긍정 요인</b>
• Web3 게임 시장 성장
• P2E(Play to Earn) 수익화 가능
• 메타버스 플랫폼 확대

⚠️ <b>위험 요인</b>
• 게임성과 수익성 모순 (high APY = 지속 불가)
• 대부분의 P2E 게임 실패율 높음
• 토큰 하락 위험

💰 <b>투자 제안</b>

1️⃣ <b>현재 추적 코인 우선</b>
   → 30개 코인이 이미 충분히 분산됨

2️⃣ <b>관심 종목은 소액(1-5%) 테스트</b>
   → 리스크 제한

3️⃣ <b>신규 추가 시 조건</b>
   • 거래량 > 일일 1억원 이상
   • 커뮤니티 > 10만명 이상
   • 실제 서비스 런칭 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌙 <b>돌돌이의 조언</b>

주인님, 게임파이와 메타버스 코인은 <b>매력적이지만 위험합니다.</b>

현재 포트폴리오(30개 추적)도 충분히 좋으니,
신규 진입 시에는 꼭 <b>소액(5% 이하)으로만 테스트</b>하시고,
실제 게임 플레이 경험 후 판단하세요!"""
    
    if send_telegram(msg):
        print("\n✅ Telegram 발송 완료!")
    else:
        print("\n❌ Telegram 발송 실패")
else:
    print("\n분석할 데이터가 없습니다.")
