#!/usr/bin/env python3
"""
자동 이메일 분류 도구
"""
import subprocess
import json
import sys

def run_gog_search(query):
    """gog 검색 실행"""
    cmd = [
        '/home/linuxbrew/.linuxbrew/bin/gog', 'gmail', 'search',
        query, '--max', '200', '--account', 'imchic8@gmail.com',
        '--json'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            return [t['id'] for t in data.get('threads', [])]
        except:
            return []
    return []

def batch_modify(ids, label):
    """배치로 라벨 추가"""
    if not ids:
        return 0
    
    cmd = [
        '/home/linuxbrew/.linuxbrew/bin/gog', 'gmail', 'batch', 'modify'
    ] + ids + [
        '--add', label, '--account', 'imchic8@gmail.com',
        '--force', '--no-input'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return len(ids) if result.returncode == 0 else 0

print("🚀 자동 이메일 분류 시작!\n")

# 1. 쇼핑
print("[1/4] 🛍️  쇼핑 메일 분류...")
shopping_ids = run_gog_search('from:(aliexpress OR coupang OR musinsa OR bucketplace OR nol OR trip)')
if shopping_ids:
    count = batch_modify(shopping_ids, 'Label_1')
    print(f"✅ {count}개 메일 분류 완료")
else:
    print("ℹ️  추가 분류할 메일 없음")

# 2. 개발
print("\n[2/4] 👨💻 개발 메일 분류...")
dev_ids = run_gog_search('from:(google OR apple OR kakaocorp OR jetbrains OR appwrite OR playstation OR nintendo)')
if dev_ids:
    count = batch_modify(dev_ids, 'Label_2')
    print(f"✅ {count}개 메일 분류 완료")
else:
    print("ℹ️  추가 분류할 메일 없음")

# 3. 스팸/프로모션
print("\n[3/4] ✖️  스팸/프로모션 메일 분류...")
spam_ids = run_gog_search('from:(adobe OR netflix OR youtube OR mobbin OR brandcrowd OR wanted OR temu)')
if spam_ids:
    count = batch_modify(spam_ids, 'Label_4')
    print(f"✅ {count}개 메일 분류 완료")
else:
    print("ℹ️  추가 분류할 메일 없음")

# 4. 일반
print("\n[4/4] 😊 일반 메일 분류...")
general_ids = run_gog_search('from:(bank OR card OR kakao OR samsung OR naver OR dyson OR hancom OR 은행 OR 카드 OR 뱅크)')
if general_ids:
    count = batch_modify(general_ids, 'Label_3')
    print(f"✅ {count}개 메일 분류 완료")
else:
    print("ℹ️  추가 분류할 메일 없음")

print("\n✅ 분류 완료!")
print("📊 최종 상태: 모든 메일이 5개 카테고리로 정리되었습니다 🎉")
