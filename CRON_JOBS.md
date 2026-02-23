# OpenClaw Cron Jobs - 정기 자동화 작업

## 주식 모니터링 - 매일 오전 6:00 KST

**작업명**: `stock-monitor`  
**시간표**: `0 6 * * *` (매일 오전 6:00)  
**실행**: 보유 종목 + M7 + 테마주 가격 모니터링 → Telegram 자동 발송

### 설정 내용
```
cron: "0 6 * * *"
task: stock-monitor
script: C:\Users\imchi\.openclaw\workspace\scripts\stock_monitor.py
target: Telegram @dolldol_bot
```

### 모니터링 항목

#### 📊 보유 종목 (5개)
- PLTR (팔란티어) - 9.8M원
- RKLB (로켓랩) - 6.1M원
- IREN (아이렌) - 5.7M원
- IONQ (아이온큐) - 4.6M원
- SNOW (스노우플레이크) - 2.5M원

#### 💎 M7 (Magnificent 7)
- NVDA, TSLA, MSFT, GOOGL, AMZN, AAPL, META

#### 🎯 테마주 (로켓/항공/방산)
- 로켓: RKLB, AXAI
- 항공: BA, RTX, NOC
- 방산: RTX, LMT, NOC, GD

### 출력 형식
```
📊 내 포트폴리오
📈 PLTR  $xxx.xx  +x.xx% (or 📉)
📈 RKLB  $xxx.xx  +x.xx%
...

💎 M7 (MAGNIFICENT 7)
📈 NVDA  $xxx.xx  +x.xx%
...

🎯 테마주 (로켓/항공/방산)
🚀 로켓
📈 RKLB  $xxx.xx  +x.xx%
...

⏰ 2026-02-22 06:00:00 (KST)
🤖 @dolldol_bot
```

---

## 설정 상태

✅ 스크립트 준비 완료: `scripts/stock_monitor.py`
✅ Telegram 봇 연동: @dolldol_bot
⏳ Cron 등록 대기 (OpenClaw Scheduler)

---

**주인님**: Cron이 정상 작동하면, 매일 오전 6:00에 자동으로 주가 정보가 텔레그램으로 전송됩니다! 🚀🌙
