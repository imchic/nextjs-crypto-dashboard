#!/usr/bin/env python3
"""
Gmail 라벨 자동 생성 및 필터 설정 스크립트
"""

import subprocess
import os

# 새로운 라벨 구조
NEW_LABELS = {
    "금융/은행": "은행, 신용카드, 증권거래",
    "커뮤니케이션": "소셜, 메시지, 팀 협업 (Slack, Discord)",
    "배송/배달": "주문 추적, 배송 알림 (쿠팡, Amazon)",
    "개발/기술": "GitHub, GitLab, 기술 도구",
    "클라우드/SAAS": "Figma, Notion, Supabase, 클라우드 서비스",
    "앱/구독": "앱 스토어, 구독 갱신, 라이선스",
    "뉴스/레터": "뉴스레터, 블로그, 뉴스 구독",
    "보안/알림": "2FA 코드, 보안 경고, 로그인 알림",
    "쇼핑/마켓": "쇼핑몰, AliExpress, 마켓플레이스",
    "마케팅/광고": "프로모션, 광고, 할인 쿠폰",
    "아카이빙/정리": "자동 정리 대상 메일",
}

# Gmail 필터 규칙 (sender/subject 기반)
FILTER_RULES = {
    "금융/은행": [
        "from:@naver.com banking",
        "from:@kakao.com 카드",
        "from:hana.co.kr",
        "from:kb.co.kr",
    ],
    "커뮤니케이션": [
        "from:noreply@slack.com",
        "from:notifications@discord.com",
        "from:mail@telegram.org",
    ],
    "배송/배달": [
        "from:@coupang.com 배송",
        "from:amazon tracking",
        "subject:배송 알림",
    ],
    "개발/기술": [
        "from:noreply@github.com",
        "from:notifications@gitlab.com",
        "from:@google.com Cloud",
    ],
    "클라우드/SAAS": [
        "from:@figma.com",
        "from:@notion.so",
        "from:@supabase.io",
        "from:@stripe.com",
    ],
    "앱/구독": [
        "from:@apple.com App Store",
        "from:@google.com Play Store",
        "subject:구독",
    ],
    "뉴스/레터": [
        "subject:뉴스레터",
        "subject:Newsletter",
        "from:mail@substack.com",
    ],
    "보안/알림": [
        "subject:2FA",
        "subject:인증코드",
        "subject:Verification code",
        "from:security@",
    ],
    "쇼핑/마켓": [
        "from:@aliexpress.com",
        "from:@amazon.com",
        "from:shopping@",
    ],
    "마케팅/광고": [
        "from:promo@",
        "from:marketing@",
        "subject:할인",
    ],
}

def create_labels():
    """라벨 생성"""
    print("🏷️ Gmail 라벨 생성 중...")
    
    for label_name in NEW_LABELS.keys():
        cmd = f'export GOG_KEYRING_PASSWORD="lhb7683^^"; /home/linuxbrew/.linuxbrew/bin/gog gmail label create --account imchic8@gmail.com "{label_name}" 2>&1'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if "already exists" in result.stderr or result.returncode == 0:
            print(f"✅ '{label_name}' 라벨 준비 완료")
        else:
            print(f"⚠️  '{label_name}': {result.stderr}")

def list_labels():
    """라벨 목록 출력"""
    print("\n📋 생성된 라벨 목록:")
    print("=" * 60)
    
    for label_name, description in NEW_LABELS.items():
        print(f"\n📌 {label_name}")
        print(f"   설명: {description}")

def main():
    print("[START] Gmail 라벨 및 필터 설정\n")
    
    create_labels()
    list_labels()
    
    print("\n" + "=" * 60)
    print("✅ 라벨 생성 완료!")
    print("\n💡 다음 단계:")
    print("1. Gmail 웹에서 직접 필터 규칙을 설정하거나")
    print("2. 수동으로 기존 메일들을 새 라벨로 이동해주세요")
    print("\n🔗 Gmail Filters: https://mail.google.com/mail/u/0/#settings/filters")

if __name__ == "__main__":
    main()
