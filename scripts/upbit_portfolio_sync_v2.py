#!/usr/bin/env python3
"""
업비트 API 연동 - 실시간 포트폴리오 추적 (인증 방식 수정)
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

CONFIG_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/upbit_config.json")
TELEGRAM_TOKEN = "***REDACTED***"
TELEGRAM_USER_ID = 8525813991

def load_config():
    """설정 파일 로드"""
    if not CONFIG_FILE.exists():
        print("❌ API 키 설정 파일이 없습니다!")
        return None
    
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def get_accounts(access_key, secret_key):
    """보유한 암호화폐 조회 (수정된 인증)"""
    url = "https://api.upbit.com/v1/accounts"
    
    try:
        # 1. Query String 생성
        query_payload = {'nonce': str(uuid.uuid4())}
        query_string = urllib.parse.urlencode(query_payload)
        
        # 2. Message 생성 (URL + query)
        message = query_string.encode('utf-8')
        
        # 3. HMAC-SHA256 생성
        signature = hmac.new(
            secret_key.encode('utf-8'),
            message,
            hashlib.sha256
        ).hexdigest()
        
        # 4. Authorization 헤더 생성
        auth_header = f"Bearer {access_key}.{signature}.{query_string}"
        
        # 5. 요청
        headers = {
            'Authorization': auth_header,
            'Accept': 'application/json'
        }
        
        print(f"[DEBUG] Authorization Header Length: {len(auth_header)}")
        print(f"[DEBUG] Signature: {signature}")
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"[SUCCESS] API 응답 수신! ({len(data)}개 계정)")
            return data
    except urllib.error.HTTPError as e:
        print(f"[Error] HTTP {e.code}: {e.reason}")
        if e.code == 401:
            print("💡 힌트: API 키 또는 권한 설정을 확인하세요")
        return None
    except Exception as e:
        print(f"[Error] {type(e).__name__}: {e}")
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
    print("업비트 포트폴리오 자동 동기화 (수정된 버전)")
    print("=" * 60)
    print()
    
    config = load_config()
    if not config:
        print("❌ 설정 파일을 찾을 수 없습니다!")
    else:
        print(f"✅ 설정 파일 로드됨")
        print(f"   Access Key: {config['access_key'][:10]}...")
        print(f"   IP: {config.get('ip_address', 'N/A')}")
        print()
        
        accounts = get_accounts(config['access_key'], config['secret_key'])
        if accounts:
            print(f"\n✅ 포트폴리오 동기화 성공!")
            print(f"보유 자산: {len(accounts)}개")
        else:
            print(f"\n❌ 포트폴리오 동기화 실패")
            print("API 키 설정을 다시 확인해주세요.")
