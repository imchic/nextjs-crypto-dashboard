# HEARTBEAT.md - 정기 작업 체크리스트

## 📊 자동화 모니터링 시스템

### 1️⃣ 미국 주식 모니터링 (매일 00:00 KST) ⭐ UPDATED

**상태**: ✅ 준비 완료

- **시간**: 자정 (00:00 KST) - 하루의 가장 처음
- **스크립트**: `scripts/stock_monitor.py`
- **발송**: Telegram + Email + Windows 알림
- **대상**: PLTR, RKLB, IREN, IONQ, SNOW + M7 + 테마주
- **내용**: 평단가 분석, RSI, 기술적 분석, 추천도

### 2️⃣ 업비트 알트코인 분석 (매일 12:00 KST) ⭐ UPDATED

**상태**: ✅ 준비 완료

- **시간**: 정오 (12:00 KST)
- **스크립트**: `scripts/crypto_monitor_final.py`
- **발송**: Telegram + Email + Windows 알림
- **대상**: 업비트 상장 10개 코인 (SOL, XRP, ADA, AVAX, DOGE, NEAR, DOT, LINK, UNI, ARB)
- **내용**:
  - 📈 시세 & 변동률
  - 💰 포트폴리오 수익률 추적 (JWT 인증)
  - 📊 기술적 분석 (RSI, MACD)
  - 🔔 매수/매도 신호

포트폴리오 관리:
```bash
# 코인 추가
python3 scripts/crypto_portfolio_setup.py

# 또는 직접 편집
cat crypto_portfolio.json
```

### 3️⃣ 포트폴리오 추적 기능

**구성 요소:**
- 📍 **포지션 추적**: 평단가 기반 수익률 계산
- 📊 **실시간 분석**: 업비트 공개 API
- 🔔 **신호 생성**: 매수/매도 타이밍 추천
- 💡 **기술적 분석**: RSI, 볼린저밴드, MACD

---

## 🚀 실행 방법

### 수동 실행
```bash
# 주식 분석
wsl python3 scripts/stock_monitor.py

# 암호화폐 분석
wsl python3 scripts/crypto_monitor_final.py
```

### 자동 실행 (Option 1: OpenClaw Cron) ⭐ UPDATED
```
0 0 * * * stock-monitor       # 매일 자정 00:00
0 12 * * * crypto-monitor    # 매일 정오 12:00
```

### 자동 실행 (Option 2: Windows Task Scheduler) ⭐ UPDATED
```powershell
# 주식 모니터링 (00:00)
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\Users\imchi\.openclaw\workspace\scripts\stock_monitor.py"
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "StockMonitor" -Description "Daily stock monitoring at midnight"

# 암호화폐 모니터링 (12:00)
$action2 = New-ScheduledTaskAction -Execute "python" -Argument "C:\Users\imchi\.openclaw\workspace\scripts\crypto_monitor_final.py"
$trigger2 = New-ScheduledTaskTrigger -Daily -At 12:00
Register-ScheduledTask -Action $action2 -Trigger $trigger2 -TaskName "CryptoMonitor" -Description "Daily crypto monitoring at noon"
```

### 자동 실행 (Option 3: WSL crontab) ⭐ UPDATED
```bash
crontab -e

# 다음 추가:
0 0 * * * python3 /mnt/c/Users/imchi/.openclaw/workspace/scripts/stock_monitor.py
0 12 * * * python3 /mnt/c/Users/imchi/.openclaw/workspace/scripts/crypto_monitor_final.py
```

---

## 📊 데이터 파일

- **포트폴리오**: `crypto_portfolio.json`
- **주식 분석 로그**: 매일 스크립트 실행 시 Telegram + Email
- **암호화폐 분석 로그**: 매일 14:00 Telegram 발송

---

## 🔄 기타 정기 체크

- [ ] **이메일 체크** - 중요한 미읽 메일 있는지 확인
- [ ] **캘린더 확인** - 오늘/내일 일정 체크
- [ ] **포트폴리오 리뷰** - 주간 수익/손실 검토 (매주 금요일)

---

_2026-02-22: 주식 + 암호화폐 자동화 시스템 완성 🚀_
_2026-02-22 21:50: 자동화 시작 시간 변경 → 00:00 & 12:00_
