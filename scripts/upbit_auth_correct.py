#!/usr/bin/env python3
"""
업비트 API 인증 (정확한 JWT 방식)
"""

import requests
import jwt
import uuid
import json
from pathlib import Path

CONFIG_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/upbit_config.json")

def load_config():
    """설정 파일 로드"""
    if not CONFIG_FILE.exists():
        print("❌ API 키 설정 파일이 없습니다!")
        return None
    
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def get_accounts(access_key, secret_key):
    """보유한 암호화폐 조회 (정확한 JWT 방식)"""
    url = "https://api.upbit.com/v1/accounts"
    
    try:
        # 1. JWT 페이로드 생성 (파라미터 없으므로 query_hash 제외)
        payload = {
            'access_key': access_key,
            'nonce': str(uuid.uuid4())
        }
        
        # 2. JWT 토큰 생성 (HS512)
        token = jwt.encode(payload, secret_key, algorithm='HS512')
        
        # 3. Authorization 헤더 설정
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        
        print(f"[DEBUG] JWT Token: {token[:50]}...")
        print(f"[DEBUG] Authorization: Bearer {token[:50]}...")
        
        # 4. 요청
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"[SUCCESS] API 응답 수신! ({len(data)}개 계정)")
        return data
        
    except requests.exceptions.HTTPError as e:
        print(f"[Error] HTTP {e.response.status_code}: {e.response.reason}")
        print(f"[Response] {e.response.text}")
        return None
    except Exception as e:
        print(f"[Error] {type(e).__name__}: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("업비트 포트폴리오 조회 (정확한 JWT 인증)")
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
            print(f"보유 자산:")
            for account in accounts:
                print(f"  - {account.get('currency')}: {account.get('balance')} (평가: {account.get('locked')})")
        else:
            print(f"\n❌ 포트폴리오 동기화 실패")
            print("API 키 설정을 다시 확인해주세요.")
