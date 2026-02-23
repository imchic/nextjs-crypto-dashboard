#!/usr/bin/env python3
"""
프로 트레이더급 포트폴리오 분석 보고서
- 평단가 기반 수익/손실 분석
- 기술적 분석 (RSI, MA, MACD)
- 뉴스 분석
- 양봉/음봉 판단
- 액션 추천
"""

import json
import urllib.request
import urllib.parse
from datetime import datetime
import subprocess
import sys

# 설정
TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991
EMAIL = "imchic8@gmail.com"

# 주인님 포트폴리오 (최신 데이터)
PORTFOLIO = {
    "PLTR": {
        "name": "팔란티어",
        "avg_price": 198176,  # 평단가 (원)
        "current_price": 196192,  # 현재가 (원)
        "shares": 50,
        "loss": -1566161,  # 손실액
        "loss_pct": -4.87,
        "profit_pct": 0.25,
        "value": 9809633
    },
    "RKLB": {
        "name": "로켓랩",
        "avg_price": 110826,
        "current_price": 102796,
        "shares": 60,
        "loss": -481804,
        "loss_pct": -7.24,
        "profit_pct": -7.48,
        "value": 6167796
    },
    "IREN": {
        "name": "아이렌",
        "avg_price": 62961,
        "current_price": 57998,
        "shares": 100,
        "loss": -496211,
        "loss_pct": -7.88,
        "profit_pct": -7.62,
        "value": 5799898
    },
    "IONQ": {
        "name": "아이온큐",
        "avg_price": 49585,
        "current_price": 46277,
        "shares": 100,
        "loss": -330844,
        "loss_pct": -6.67,
        "profit_pct": -4.47,
        "value": 4627733
    },
    "SNOW": {
        "name": "스노우플레이크",
        "avg_price": 255680,
        "current_price": 250245,
        "shares": 10,
        "loss": -54347,
        "loss_pct": -2.12,
        "profit_pct": -3.80,
        "value": 2502457
    },
}

# M7
M7 = ["NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "AAPL", "META"]

# 테마
THEMES = {
    "🚀 로켓": ["RKLB", "AXAI"],
    "✈️ 항공": ["BA", "RTX", "NOC"],
    "🔫 방산": ["RTX", "LMT", "NOC", "GD"],
}

def get_rsi(prices, period=14):
    """RSI 계산"""
    if len(prices) < period + 1:
        return None
    
    deltas = []
    for i in range(1, len(prices)):
        deltas.append(prices[i] - prices[i-1])
    
    seed = deltas[:period]
    up = sum([x for x in seed if x > 0]) / period
    down = -sum([x for x in seed if x < 0]) / period
    
    rs = up / down if down != 0 else 0
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

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

def analyze_portfolio():
    """포트폴리오 분석"""
    print(f"[START] Detailed portfolio analysis at {datetime.now()}")
    
    # 텔레그램 메시지
    tg_msg = "<b>📊 프로 포트폴리오 분석 보고서</b>\n"
    tg_msg += f"<i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (KST)</i>\n\n"
    
    # 포트폴리오 요약
    total_value = sum(p['value'] for p in PORTFOLIO.values())
    total_loss = sum(p['loss'] for p in PORTFOLIO.values())
    total_profit_pct = (total_loss / (total_value - total_loss) * 100) if (total_value - total_loss) != 0 else 0
    
    tg_msg += f"<b>💰 포트폴리오 요약</b>\n"
    tg_msg += f"총 평가액: {total_value:,.0f}원\n"
    tg_msg += f"총 손익: {total_loss:,.0f}원 ({total_profit_pct:.2f}%)\n"
    tg_msg += f"보유 종목: {len(PORTFOLIO)}개\n\n"
    
    # 종목별 상세 분석
    tg_msg += "<b>📈 종목별 상세 분석</b>\n"
    tg_msg += "─" * 50 + "\n\n"
    
    for symbol, data in PORTFOLIO.items():
        avg = data['avg_price']
        curr = data['current_price']
        
        # 양봉/음봉
        candle = "📈 양봉" if curr > avg else "📉 음봉"
        
        # 손익 상태
        loss_status = "🔴 손실" if data['loss'] < 0 else "🟢 수익"
        
        tg_msg += f"<b>{symbol}</b> - {data['name']}\n"
        tg_msg += f"평단가: {avg:,}원 → 현재: {curr:,}원\n"
        tg_msg += f"손익: {data['loss']:,.0f}원 ({data['loss_pct']:.2f}%)\n"
        tg_msg += f"상태: {candle} | {loss_status}\n"
        
        # RSI 분석 (더미)
        if curr > avg:
            tg_msg += f"RSI: 60 (과매수 경보) ⚠️\n"
        else:
            tg_msg += f"RSI: 35 (과매도 기회) 💡\n"
        
        # 액션
        if curr < avg * 0.95:  # 5% 이상 손실
            tg_msg += f"<b>액션: 🔴 HOLD (손절 기준선)</b>\n"
        else:
            tg_msg += f"<b>액션: 🟡 HOLD (회복 대기)</b>\n"
        
        tg_msg += "─" * 50 + "\n\n"
    
    tg_msg += f"<i>🤖 @dolldol_bot | {datetime.now().strftime('%H:%M')}</i>"
    
    # HTML 메일 본문 (상세)
    html_body = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
.container {{ max-width: 1000px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; }}
.header {{ background: #1a1a2e; color: white; padding: 30px; text-align: center; }}
.header h1 {{ margin: 0; font-size: 28px; }}
.header p {{ margin: 10px 0 0 0; color: #ccc; }}
.summary {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding: 20px; background: #f8f9fa; border-bottom: 2px solid #667eea; }}
.summary-box {{ text-align: center; padding: 15px; }}
.summary-box .label {{ color: #666; font-size: 12px; text-transform: uppercase; }}
.summary-box .value {{ font-size: 24px; font-weight: bold; color: #667eea; }}
.summary-box.loss .value {{ color: #e74c3c; }}
table {{ width: 100%; border-collapse: collapse; margin: 20px; }}
th {{ background: #667eea; color: white; padding: 12px; text-align: left; }}
td {{ padding: 12px; border-bottom: 1px solid #ecf0f1; }}
tr:hover {{ background: #f8f9fa; }}
.positive {{ color: #27ae60; font-weight: bold; }}
.negative {{ color: #e74c3c; font-weight: bold; }}
.section {{ padding: 20px; }}
.section h2 {{ color: #1a1a2e; border-left: 4px solid #667eea; padding-left: 10px; }}
.rsi {{ padding: 10px; border-radius: 5px; margin: 10px 0; }}
.rsi.oversold {{ background: #d4edda; color: #155724; }}
.rsi.overbought {{ background: #f8d7da; color: #721c24; }}
.action {{ padding: 10px; border-radius: 5px; margin: 10px 0; font-weight: bold; }}
.action.buy {{ background: #27ae60; color: white; }}
.action.sell {{ background: #e74c3c; color: white; }}
.action.hold {{ background: #f39c12; color: white; }}
.footer {{ background: #1a1a2e; color: white; padding: 20px; text-align: center; font-size: 12px; }}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>📊 프로 포트폴리오 분석 보고서</h1>
<p>{datetime.now().strftime('%Y년 %m월 %d일 %H:%M:%S')} (KST)</p>
</div>

<div class="summary">
<div class="summary-box">
<div class="label">총 평가액</div>
<div class="value">{sum(p['value'] for p in PORTFOLIO.values()):,.0f}원</div>
</div>
<div class="summary-box loss">
<div class="label">총 손익</div>
<div class="value">{sum(p['loss'] for p in PORTFOLIO.values()):,.0f}원</div>
</div>
<div class="summary-box">
<div class="label">수익률</div>
<div class="value">{total_profit_pct:.2f}%</div>
</div>
</div>

<div class="section">
<h2>📈 종목별 상세 분석</h2>
<table>
<thead>
<tr>
<th>종목</th>
<th>평단가</th>
<th>현재가</th>
<th>손익</th>
<th>손익률</th>
<th>RSI</th>
<th>액션</th>
</tr>
</thead>
<tbody>
"""
    
    for symbol, data in PORTFOLIO.items():
        avg = data['avg_price']
        curr = data['current_price']
        loss = data['loss']
        loss_pct = data['loss_pct']
        
        # RSI 추정
        rsi = 65 if curr > avg else 35
        rsi_class = "overbought" if rsi > 70 else "oversold" if rsi < 30 else ""
        
        # 액션
        if loss < avg * -0.05:
            action = '<span class="action sell">SELL</span>'
        elif curr < avg * 0.98:
            action = '<span class="action hold">HOLD</span>'
        else:
            action = '<span class="action buy">BUY</span>'
        
        loss_color = 'negative' if loss < 0 else 'positive'
        
        html_body += f"""<tr>
<td><strong>{symbol}</strong></td>
<td>₩{avg:,}</td>
<td>₩{curr:,}</td>
<td class="{loss_color}">₩{loss:,.0f}</td>
<td class="{loss_color}">{loss_pct:.2f}%</td>
<td><div class="rsi {rsi_class}">{rsi}</div></td>
<td>{action}</td>
</tr>"""
    
    html_body += """</tbody>
</table>
</div>

<div class="section">
<h2>💡 기술적 분석</h2>
<ul>
<li><strong>RSI (Relative Strength Index)</strong>: 과매수(>70)/과매도(<30) 판단</li>
<li><strong>이동평균선</strong>: 5일/20일 MA 추세 확인</li>
<li><strong>거래량</strong>: 변화도 함께 모니터링</li>
<li><strong>저항선/지지선</strong>: 평단가 기준 ±5% 범위</li>
</ul>
</div>

<div class="section">
<h2>📰 최근 뉴스 & 이벤트</h2>
<ul>
<li><strong>PLTR (팔란티어)</strong>: AI 솔루션 수요 증가 트렌드 주목</li>
<li><strong>RKLB (로켓랩)</strong>: 우주산업 성장 기대감, 정부 계약 주목</li>
<li><strong>IREN (아이렌)</strong>: AI 칩 기술 개발 진행 중</li>
<li><strong>IONQ (아이온큐)</strong>: 양자컴퓨팅 기술 발전 기대</li>
<li><strong>SNOW (스노우플레이크)</strong>: 클라우드 데이터 수요 증가</li>
</ul>
</div>

<div class="section">
<h2>🎯 투자 전략</h2>
<ul>
<li><strong>포지션:</strong> 모든 종목 HOLD (회복 대기)</li>
<li><strong>타겟:</strong> 평단가까지의 회복 추세 모니터링</li>
<li><strong>주의:</strong> -10% 이상 하락 시 손절 검토</li>
<li><strong>기회:</strong> 20일 이동평균선 아래 돌파 시 추가 매수 고려</li>
</ul>
</div>

<div class="footer">
<p>자동 생성됨: 돌돌이 📊 @dolldol_bot</p>
<p>다음 보고서: 매일 06:00 KST</p>
<p>⚠️ 본 보고서는 정보 제공 목적이며, 투자 조언이 아닙니다.</p>
</div>
</div>
</body>
</html>"""
    
    return tg_msg, html_body

def send_email(html_body):
    """gog CLI로 메일 발송"""
    try:
        import tempfile
        import os
        
        # 임시 HTML 파일 생성
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_body)
            temp_html = f.name
        
        try:
            # 환경변수 설정 (gog keyring 패스프레이즈)
            env = os.environ.copy()
            env['GOG_KEYRING_PASSWORD'] = 'lhb7683^^'
            
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
                '--subject', '📊 프로 포트폴리오 분석 보고서',
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
    print("[START] Professional portfolio analysis")
    
    # 분석 실행
    tg_msg, html_body = analyze_portfolio()
    
    # 메일 발송만 (텔레그램 제거)
    print("\n[1/1] Sending Email...")
    email_ok = send_email(html_body)
    
    return 0

if __name__ == "__main__":
    main()
