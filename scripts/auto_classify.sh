#!/bin/bash
# 자동 이메일 분류 스크립트
# 규칙:
# 쇼핑: AliExpress, 쿠팡, 무신사, 오늘의집 등
# 개발: Google, Apple, Kakaocorp, Jetbrains, Appwrite 등  
# 스팸: 프로모션, 광고 메일
# 일반: 나머지

echo "=== 자동 분류 시작 ==="

# 1. 쇼핑 메일 분류
echo "[1/4] 쇼핑 메일 분류 중..."
/home/linuxbrew/.linuxbrew/bin/gog gmail search 'from:(aliexpress OR coupang OR musinsa OR bucketplace OR nol-universe OR trip.com OR 무신사 OR 쿠팡 OR 오늘의집)' --max 200 --account imchic8@gmail.com --json 2>&1 | python3 << 'PYTHON'
import sys, json, subprocess
data = json.load(sys.stdin)
threads = data.get('threads', [])
ids = [t['id'] for t in threads if t.get('id')]
print("Found {} shopping emails".format(len(ids)))
if ids:
    cmd = ['/home/linuxbrew/.linuxbrew/bin/gog', 'gmail', 'batch', 'modify'] + ids + ['--add', 'Label_1', '--account', 'imchic8@gmail.com', '--force', '--no-input']
    print("Command: {}".format(' '.join(cmd[:3] + ['...', '--add', 'Label_1'])))
PYTHON

# 2. 개발 메일 분류
echo "[2/4] 개발 메일 분류 중..."
/home/linuxbrew/.linuxbrew/bin/gog gmail search 'from:(google OR apple OR kakaocorp OR jetbrains OR appwrite OR playstation OR nintendo OR discord OR whatsapp)' --max 200 --account imchic8@gmail.com --json 2>&1 | python3 << 'PYTHON'
import sys, json
data = json.load(sys.stdin)
threads = data.get('threads', [])
ids = [t['id'] for t in threads if t.get('id')]
print("Found {} dev emails".format(len(ids)))
PYTHON

# 3. 스팸 메일 분류
echo "[3/4] 스팸 메일 분류 중..."
/home/linuxbrew/.linuxbrew/bin/gog gmail search 'from:(adobe OR airbnb OR netflix OR youtube OR mobbin OR brandcrowd OR wanted OR temu OR instagram)' --max 200 --account imchic8@gmail.com --json 2>&1 | python3 << 'PYTHON'
import sys, json
data = json.load(sys.stdin)
threads = data.get('threads', [])
ids = [t['id'] for t in threads if t.get('id')]
print("Found {} promo/spam emails".format(len(ids)))
PYTHON

# 4. 일반 메일 분류
echo "[4/4] 일반 메일 분류 중..."
/home/linuxbrew/.linuxbrew/bin/gog gmail search 'from:(bank OR card OR kakao OR samsung OR naver OR nol OR dyson)' --max 200 --account imchic8@gmail.com --json 2>&1 | python3 << 'PYTHON'
import sys, json
data = json.load(sys.stdin)
threads = data.get('threads', [])
ids = [t['id'] for t in threads if t.get('id')]
print("Found {} general emails".format(len(ids)))
PYTHON

echo "=== 분류 완료 ==="
