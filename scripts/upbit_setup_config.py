#!/usr/bin/env python3
"""
업비트 API 키 설정 도구
"""

import json
import sys
from pathlib import Path

CONFIG_FILE = Path("/mnt/c/Users/imchi/.openclaw/workspace/upbit_config.json")

def setup_api_keys():
    """API 키 설정"""
    print("\n" + "=" * 60)
    print("🔐 업비트 API 키 설정")
    print("=" * 60)
    print()
    
    print("📋 다음 정보를 입력해주세요:")
    print("(업비트 마이페이지 → API 관리에서 확인 가능)")
    print()
    
    access_key = input("✏️  Access Key 입력: ").strip()
    if not access_key:
        print("❌ Access Key가 필요합니다!")
        return False
    
    secret_key = input("✏️  Secret Key 입력: ").strip()
    if not secret_key:
        print("❌ Secret Key가 필요합니다!")
        return False
    
    # 설정 파일 저장
    config = {
        "access_key": access_key,
        "secret_key": secret_key,
        "created_at": "2026-02-22",
        "description": "Upbit Open API (Read only)"
    }
    
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    
    # 파일 권한 설정 (보안)
    import os
    os.chmod(CONFIG_FILE, 0o600)
    
    print("\n✅ API 키 설정 완료!")
    print(f"📁 저장 위치: {CONFIG_FILE}")
    print()
    print("⚠️  보안 안내:")
    print("  • Secret Key는 절대 공유하지 마세요!")
    print("  • 설정 파일은 자동으로 보호됩니다 (600권한)")
    print()
    
    return True

if __name__ == "__main__":
    if setup_api_keys():
        print("\n🎉 다음 명령어로 포트폴리오를 동기화하세요:")
        print("\n  wsl python3 /mnt/c/Users/imchi/.openclaw/workspace/scripts/upbit_portfolio_sync.py")
        print()
    else:
        print("\n❌ 설정 실패!")
        sys.exit(1)
