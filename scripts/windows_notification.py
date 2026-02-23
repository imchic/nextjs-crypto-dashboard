#!/usr/bin/env python3
"""
Windows Toast Notification 유틸리티
"""

import subprocess
import sys
from pathlib import Path

def send_toast_notification(title, message, icon_path=None):
    """
    Windows 10/11 Toast Notification 발송
    
    Args:
        title: 알림 제목
        message: 알림 본문
        icon_path: 아이콘 경로 (옵션)
    """
    try:
        # XML 형식의 Toast 알림 구성
        toast_xml = f'''
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">{title}</text>
                    <text id="2">{message}</text>
                </binding>
            </visual>
            <audio src="ms-winsoundevent:Notification.Default" loop="false"/>
        </toast>
        '''
        
        # PowerShell 스크립트
        ps_script = f'''
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null

        $APP_ID = 'OpenClaw.Portfolio'
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml(@"
{toast_xml}
"@)

        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)
        '''
        
        # PowerShell 실행
        result = subprocess.run(
            ['powershell', '-NoProfile', '-Command', ps_script],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"✅ 알림 발송 완료: {title}")
            return True
        else:
            print(f"⚠️ 알림 발송 실패: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ 알림 발송 에러: {e}")
        return False

# 테스트 알림 함수들
def send_stock_analysis_notification(summary):
    """주식 분석 완료 알림"""
    title = "📈 주식 분석 완료!"
    message = summary
    return send_toast_notification(title, message)

def send_crypto_analysis_notification(summary):
    """암호화폐 분석 완료 알림"""
    title = "🚀 암호화폐 분석 완료!"
    message = summary
    return send_toast_notification(title, message)

def send_price_alert_notification(coin_name, change_rate):
    """코인 가격 변동 알림"""
    emoji = "🔥" if change_rate > 0 else "❄️"
    title = f"{emoji} {coin_name} {change_rate:+.2f}%"
    message = "포트폴리오 변동 감지"
    return send_toast_notification(title, message)

def send_portfolio_summary_notification(total_value, profit_pct):
    """포트폴리오 요약 알림"""
    emoji = "📊" if profit_pct >= 0 else "⚠️"
    title = f"{emoji} 포트폴리오 현황"
    message = f"총자산: {total_value:,}원 ({profit_pct:+.2f}%)"
    return send_toast_notification(title, message)

if __name__ == "__main__":
    # 테스트
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            print("테스트 알림 발송 중...\n")
            
            send_toast_notification(
                "테스트 알림 🌙",
                "Windows 로컬 알림이 정상 작동합니다!"
            )
            
            send_stock_analysis_notification("PLTR +5.2%, RKLB -2.1%, 평가 완료")
            send_crypto_analysis_notification("SOL +3.5%, XRP -1.2%, 준비 완료")
    else:
        print("Windows Toast Notification 유틸리티")
        print("\n사용법:")
        print("  python3 windows_notification.py test  - 테스트 알림 발송")
        print("  python3 windows_notification.py       - 모듈로 임포트")
