#!/usr/bin/env python3
"""
업비트 알트코인 30개 추적 리스트 (한글명 포함) - Telegram 발송
"""

import json
import urllib.request
import urllib.parse

TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991

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
    except Exception as e:
        print(f"Error: {e}")
        return False

# 한글명 리스트
msg1 = """<b>📊 업비트 추적 코인 30개 (한글명 포함) - 대형</b>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

1️⃣ <b>SOL</b> - 솔라나 (고성능 블록체인)
2️⃣ <b>XRP</b> - 리플 (국제송금)
3️⃣ <b>ADA</b> - 카르다노 (학파 기반)
4️⃣ <b>AVAX</b> - 애벨란체 (고속 거래)
5️⃣ <b>DOGE</b> - 도지 (밈 코인)
6️⃣ <b>NEAR</b> - 니어 (Web3 인프라)
7️⃣ <b>DOT</b> - 폴카닷 (멀티체인)
8️⃣ <b>LINK</b> - 체인링크 (오라클)
9️⃣ <b>UNI</b> - 유니스왑 (DEX)
🔟 <b>ARB</b> - 아비트럼 (이더리움 L2)"""

msg2 = """<b>📈 업비트 추적 코인 30개 - 중형</b>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

1️⃣1️⃣ <b>OP</b> - 옵티미즘 (L2 솔루션)
1️⃣2️⃣ <b>MATIC</b> - 폴리곤 (이더리움 L2)
1️⃣3️⃣ <b>FIL</b> - 파일코인 (분산 저장)
1️⃣4️⃣ <b>ATOM</b> - 코스모스 (인터체인)
1️⃣5️⃣ <b>ICP</b> - 인터컴 (Web3 클라우드)
1️⃣6️⃣ <b>SAND</b> - 샌드박스 (메타버스)
1️⃣7️⃣ <b>MANA</b> - 디센트럴랜드 (메타버스)
1️⃣8️⃣ <b>ENS</b> - ENS (이름 서비스)
1️⃣9️⃣ <b>LDO</b> - 리도 (스테이킹)
2️⃣0️⃣ <b>BEAM</b> - 빔 (프라이버시)"""

msg3 = """<b>🚀 업비트 추적 코인 30개 - 소형</b>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

2️⃣1️⃣ <b>SEI</b> - 세이 (고속 체인)
2️⃣2️⃣ <b>FLOKI</b> - 플로키 (밈코인)
2️⃣3️⃣ <b>STX</b> - 스택스 (비트코인 L2)
2️⃣4️⃣ <b>BLUR</b> - 블러 (NFT 마켓)
2️⃣5️⃣ <b>GMT</b> - GMT타운 (무브투언)
2️⃣6️⃣ <b>PIXEL</b> - 픽셀 (P2E 게임)
2️⃣7️⃣ <b>SUI</b> - 수이 (새로운 체인)
2️⃣8️⃣ <b>APTOS</b> - 앱토스 (고성능 L1)
2️⃣9️⃣ <b>INJ</b> - 인젝티브 (탈중앙 거래소)
3️⃣0️⃣ <b>APE</b> - 에이프코인 (NFT 커뮤니티)"""

msg4 = """<b>💾 현재 보유 포트폴리오</b>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

🔸 <b>SOL (솔라나)</b>
   수량: 0.5개
   평단가: 125,500원
   현재가: 125,500원
   평가액: 62,750원

🔹 <b>XRP (리플)</b>
   수량: 100개
   평단가: 2,093원
   현재가: 2,093원
   평가액: 209,300원

🔸 <b>AVAX (애벨란체)</b>
   수량: 0.2개
   평단가: 13,270원
   현재가: 13,270원
   평가액: 2,654원

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
💰 총 포트폴리오 가치: ~274,704원"""

if __name__ == "__main__":
    print("한글명 리스트 발송 중...\n")
    
    success = 0
    for i, msg in enumerate([msg1, msg2, msg3, msg4], 1):
        if send_telegram(msg):
            print(f"✅ Part {i}/4 발송 완료")
            success += 1
        else:
            print(f"❌ Part {i}/4 발송 실패")
    
    print(f"\n총 {success}/4 부분 발송 완료!")
