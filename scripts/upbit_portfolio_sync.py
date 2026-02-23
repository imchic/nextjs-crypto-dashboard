#!/usr/bin/env python3
"""
업비트 API 연동 - 실시간 포트폴리오 추적 (완전 자동화)
"""

import json
import urllib.request
import urllib.parse
import hashlib
import hmac
import time
import uuid
from datetime import datetime
from pathlib import Path

# 설정 파일 경로
CONFIG_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/upbit_config.json")
PORTFOLIO_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/crypto_portfolio_auto.json")

TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991

def load_config():
    """설정 파일 로드"""
    if not CONFIG_FILE.exists():
        print("❌ API 키 설정 파일이 없습니다!")
        print(f"다음 경로에 설정 파일을 만들어주세요: {CONFIG_FILE}")
        return None
    
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def get_accounts(access_key, secret_key):
    """보유한 암호화폐 조회 (업비트 API)"""
    url = "https://api.upbit.com/v1/accounts"
    
    try:
        payload = {
            'nonce': str(uuid.uuid4()),
        }
        
        query_string = urllib.parse.urlencode(payload)
        message = query_string.encode('utf-8')
        
        h = hmac.new(secret_key.encode('utf-8'), message, hashlib.sha256)
        hex_output = h.hexdigest()
        
        headers = {
            'Authorization': f"Bearer {access_key}.{hex_output}.{query_string}"
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        print(f"[Error] API 조회 실패: {e}")
        return None

def fetch_current_price(market):
    """현재가 조회"""
    try:
        url = f"https://api.upbit.com/v1/ticker?markets={market}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return data[0]["trade_price"]
    except:
        pass
    return None

def sync_portfolio():
    """포트폴리오 자동 동기화"""
    config = load_config()
    if not config:
        return False
    
    # API 조회
    accounts = get_accounts(config['access_key'], config['secret_key'])
    if not accounts:
        return False
    
    # 포트폴리오 업데이트
    portfolio = {}
    total_value = 0
    
    for account in accounts:
        if account['balance'] == '0' or account['currency'] == 'KRW':
            continue
        
        currency = account['currency']
        market = f"KRW-{currency}"
        balance = float(account['balance'])
        
        # 현재가 조회
        current_price = fetch_current_price(market)
        if not current_price:
            continue
        
        value = balance * current_price
        total_value += value
        
        portfolio[market] = {
            "symbol": currency,
            "balance": balance,
            "current_price": current_price,
            "value": value,
            "updated_at": datetime.now().isoformat(),
        }
        
        print(f"✅ {currency}: {balance} @ {current_price:,}원 = {value:,}원")
    
    # 파일 저장
    PORTFOLIO_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PORTFOLIO_FILE, 'w') as f:
        json.dump({
            "accounts": portfolio,
            "total_value": total_value,
            "synced_at": datetime.now().isoformat(),
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💰 총 포트폴리오 가치: {total_value:,}원")
    print(f"✅ 동기화 완료!")
    
    return True

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

if __name__ == "__main__":
    print("=" * 60)
    print("업비트 포트폴리오 자동 동기화")
    print("=" * 60)
    print()
    
    if sync_portfolio():
        msg = "🚀 업비트 포트폴리오 자동 동기화 완료!\n실제 보유한 암호화폐가 업데이트되었습니다."
        send_telegram(msg)
    else:
        print("\n❌ 포트폴리오 동기화 실패")
        print("API 키 설정을 확인해주세요!")
