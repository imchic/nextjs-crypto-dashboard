@echo off
REM Windows 로컬 알림 테스트 (한글 완벽 지원)

cd /d %~dp0
python send_test_notification.py

pause
