#!/usr/bin/env python3
"""
업비트 알트코인 실시간 분석 + 포트폴리오 추적 (한글명 포함 최종)
매일 14:00 KST에 자동 실행
메일로만 발송 (2026-02-23 업데이트)
"""

import json
import urllib.request
import math
import subprocess
import tempfile
import os
from datetime import datetime
from pathlib import Path

# 설정 (환경변수에서 읽음)
EMAIL = os.getenv("EMAIL", "imchic8@gmail.com")
GOG_KEYRING_PASSWORD = os.getenv("GOG_KEYRING_PASSWORD", "lhb7683^^")
PORTFOLIO_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/crypto_portfolio.json")

# 관심 알트코인 30개 (한글명 포함)
INTEREST_COINS = {
    "KRW-SOL": "솔라나",
    "KRW-XRP": "리플",
    "KRW-ADA": "카르다노",
    "KRW-AVAX": "애벨란체",
    "KRW-DOGE": "도지",
    "KRW-NEAR": "니어",
    "KRW-DOT": "폴카닷",
    "KRW-LINK": "체인링크",
    "KRW-UNI": "유니스왑",
    "KRW-ARB": "아비트럼",
    "KRW-OP": "옵티미즘",
    "KRW-MATIC": "폴리곤",
    "KRW-FIL": "파일코인",
    "KRW-ATOM": "코스모스",
    "KRW-ICP": "인터컴",
    "KRW-SAND": "샌드박스",
    "KRW-MANA": "디센트럴랜드",
    "KRW-ENS": "ENS",
    "KRW-LDO": "리도",
    "KRW-BEAM": "빔",
    "KRW-SEI": "세이",
    "KRW-FLOKI": "플로키",
    "KRW-STX": "스택스",
    "KRW-BLUR": "블러",
    "KRW-GMT": "GMT타운",
    "KRW-PIXEL": "픽셀",
    "KRW-SUI": "수이",
    "KRW-APTOS": "앱토스",
    "KRW-INJ": "인젝티브",
    "KRW-APE": "에이프코인",
}

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
                    "change": data[0]["signed_change_rate"] * 100,
                }
    except:
        pass
    return None

def analyze_coin(market, korean_name, price_data):
    """코인 분석"""
    if not price_data:
        return None
    
    score = 2.5
    reasons = []
    cautions = []
    
    change = price_data["change"]
    
    # 기본 분석
    if change > 20:
        score += 2
        reasons.append("급등 🔥")
    elif change > 10:
        score += 1
        reasons.append("상승 📈")
    elif change < -15:
        score -= 1.5
        cautions.append("급락 📉")
    
    score = max(1, min(5, score))
    
    if score >= 4:
        rec = "🟢 강추"
        action = "🔔 매수!"
    elif score >= 3:
        rec = "🟢 추천"
        action = "매수고려"
    elif score >= 2:
        rec = "🟡 중립"
        action = "HOLD"
    else:
        rec = "🔴 비추"
        action = "회피"
    
    return {
        "market": market,
        "symbol": market.replace("KRW-", ""),
        "korean_name": korean_name,
        "price": price_data["price"],
        "change": change,
        "score": score,
        "recommendation": rec,
        "action": action,
        "reasons": reasons,
        "cautions": cautions,
    }

def get_portfolio_stats():
    """포트폴리오 통계"""
    if not PORTFOLIO_FILE.exists():
        return None
    
    with open(PORTFOLIO_FILE, 'r') as f:
        portfolio = json.load(f)
    
    total_cost = 0
    total_value = 0
    positions = []
    
    for market, data in portfolio.items():
        price_data = fetch_price(market)
        if not price_data:
            continue
        
        current_price = price_data["price"]
        avg_price = data["avg_price"]
        quantity = data["quantity"]
        
        cost = avg_price * quantity
        value = current_price * quantity
        profit = value - cost
        profit_pct = (profit / cost * 100) if cost > 0 else 0
        
        total_cost += cost
        total_value += value
        
        korean_name = INTEREST_COINS.get(market, market)
        
        positions.append({
            "symbol": data.get("symbol", market.replace("KRW-", "")),
            "korean_name": korean_name,
            "quantity": quantity,
            "avg_price": avg_price,
            "current_price": current_price,
            "profit": profit,
            "profit_pct": profit_pct,
        })
    
    total_profit = total_value - total_cost
    total_profit_pct = (total_profit / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "positions": sorted(positions, key=lambda x: x["profit_pct"], reverse=True),
        "total_value": total_value,
        "total_profit": total_profit,
        "total_profit_pct": total_profit_pct,
    }

def generate_report():
    """HTML 메일 형식 보고서 생성"""
    print("[1/3] 가격 데이터 수집...")
    
    analysis = []
    for market, korean_name in list(INTEREST_COINS.items())[:15]:  # Rate limit 회피
        price = fetch_price(market)
        if price:
            result = analyze_coin(market, korean_name, price)
            if result:
                analysis.append(result)
    
    analysis.sort(key=lambda x: x["change"], reverse=True)
    
    print("[2/3] 포트폴리오 분석...")
    portfolio = get_portfolio_stats()
    
    print("[3/3] 리포트 생성...")
    
    # HTML 메일 생성
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #0f0f23; color: #fff; }}
.container {{ max-width: 900px; margin: 0 auto; background: linear-gradient(135deg, #1a1a3e 0%, #16213e 100%); padding: 0; }}
.header {{ background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #000; padding: 30px; text-align: center; }}
.header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
.header p {{ margin: 10px 0 0 0; opacity: 0.9; }}
.section {{ padding: 20px; border-bottom: 1px solid #333; }}
.section h2 {{ color: #00ff88; margin: 0 0 15px 0; border-left: 4px solid #00ff88; padding-left: 10px; }}
.portfolio-box {{ background: rgba(0,255,136,0.1); padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ff88; }}
.portfolio-stat {{ display: inline-block; margin-right: 20px; }}
.portfolio-label {{ color: #999; font-size: 12px; }}
.portfolio-value {{ font-size: 20px; font-weight: bold; color: #00ff88; }}
.portfolio-value.negative {{ color: #ff4466; }}
.coin-table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
.coin-table th {{ background: #00ff88; color: #000; padding: 12px; text-align: left; font-weight: bold; }}
.coin-table td {{ padding: 12px; border-bottom: 1px solid #333; }}
.coin-table tr:hover {{ background: rgba(0,255,136,0.05); }}
.coin-symbol {{ font-weight: bold; }}
.coin-change {{ font-weight: bold; }}
.coin-change.positive {{ color: #00ff88; }}
.coin-change.negative {{ color: #ff4466; }}
.recommendation {{ padding: 4px 8px; border-radius: 4px; font-weight: bold; }}
.recommendation.strong {{ background: #00ff88; color: #000; }}
.recommendation.neutral {{ background: #666; color: #fff; }}
.recommendation.weak {{ background: #ff4466; color: #fff; }}
.position {{ background: rgba(0,255,136,0.05); padding: 10px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #00ff88; }}
.position-profit {{ color: #00ff88; }}
.position-loss {{ color: #ff4466; }}
.footer {{ background: #0a0a14; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🚀 업비트 알트코인 분석</h1>
<p>{datetime.now().strftime('%Y년 %m월 %d일 %H:%M:%S')} (KST)</p>
</div>
"""
    
    # 포트폴리오 섹션
    if portfolio and portfolio["total_value"] > 0:
        profit_color = "positive" if portfolio["total_profit"] >= 0 else "negative"
        html += f"""<div class="section">
<h2>💰 포트폴리오</h2>
<div class="portfolio-box">
<div class="portfolio-stat">
<div class="portfolio-label">총자산</div>
<div class="portfolio-value">{portfolio['total_value']:,.0f}원</div>
</div>
<div class="portfolio-stat">
<div class="portfolio-label">수익</div>
<div class="portfolio-value {profit_color}">{portfolio['total_profit']:+,.0f}원</div>
</div>
<div class="portfolio-stat">
<div class="portfolio-label">수익률</div>
<div class="portfolio-value {profit_color}">{portfolio['total_profit_pct']:+.2f}%</div>
</div>
</div>

<h3 style="color: #00ff88; margin-top: 20px;">📍 보유 종목</h3>
"""
        for pos in portfolio["positions"][:5]:
            profit_class = "position-profit" if pos["profit"] > 0 else "position-loss"
            html += f"""<div class="position">
<strong>{pos['symbol']} ({pos['korean_name']})</strong> | 수익률: <span class="{profit_class}">{pos['profit_pct']:+.2f}%</span> ({pos['profit']:+,.0f}원)
</div>
"""
        html += "</div>"
    
    # 급등 코인
    html += f"""<div class="section">
<h2>📈 상위 10 급등 코인</h2>
<table class="coin-table">
<thead>
<tr>
<th>순위</th>
<th>종목</th>
<th>현재가</th>
<th>변동률</th>
<th>평가</th>
<th>추천</th>
</tr>
</thead>
<tbody>
"""
    
    for i, coin in enumerate(analysis[:10], 1):
        change_class = "positive" if coin["change"] > 0 else "negative"
        
        rec_class = "strong" if coin["score"] >= 4 else "neutral" if coin["score"] >= 2 else "weak"
        
        html += f"""<tr>
<td>{i}</td>
<td><span class="coin-symbol">{coin['symbol']}</span> ({coin['korean_name']})</td>
<td>{coin['price']:,.0f}원</td>
<td><span class="coin-change {change_class}">{coin['change']:+.2f}%</span></td>
<td>{coin['recommendation']}</td>
<td><span class="recommendation {rec_class}">{coin['action']}</span></td>
</tr>
"""
    
    html += """</tbody>
</table>
</div>

<div class="footer">
🤖 자동 생성됨 | 돌돌이 모니터링
</div>
</div>
</body>
</html>"""
    
    return html, analysis, portfolio

def send_email(html_body):
    """gog CLI로 메일 발송"""
    try:
        # 임시 HTML 파일 생성
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_body)
            temp_html = f.name
        
        try:
            # 환경변수 설정 (gog keyring 패스프레이즈)
            env = os.environ.copy()
            env['GOG_KEYRING_PASSWORD'] = GOG_KEYRING_PASSWORD
            
            # 파일 내용 읽고 gog로 발송
            with open(temp_html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # gog gmail send 명령 실행
            cmd = [
                '/home/linuxbrew/.linuxbrew/bin/gog',
                'gmail',
                'send',
                '--account', EMAIL,
                '--to', EMAIL,
                '--subject', '🚀 업비트 알트코인 실시간 분석',
                '--body-html', html_content
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, env=env)
            
            if result.returncode == 0:
                print("✅ Email sent!")
                return True
            else:
                print(f"❌ Email failed: {result.stderr}")
                return False
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_html):
                os.remove(temp_html)
    except Exception as e:
        print(f"[EMAIL] {e}")
        return False

def main():
    print("=" * 60)
    print("업비트 알트코인 실시간 분석 (한글명 포함)")
    print("=" * 60)
    
    html, analysis, portfolio = generate_report()
    
    print("\n[4/4] 메일 발송...")
    if send_email(html):
        print("✅ 메일 발송 완료!")
    else:
        print("❌ 메일 발송 실패")
    
    print("\n" + "=" * 60)
    print("분석 완료!")
    print("=" * 60)

if __name__ == "__main__":
    main()
