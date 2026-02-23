#!/bin/bash
# Windows Toast Notification 발송 (PowerShell 통합)

function send_windows_toast() {
    local title="$1"
    local message="$2"
    
    powershell.exe -NoProfile -Command "
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > \$null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > \$null

    \$APP_ID = 'OpenClaw.Portfolio'
    \$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    \$xml.LoadXml(@\"
<toast>
    <visual>
        <binding template=\"ToastText02\">
            <text id=\"1\">$title</text>
            <text id=\"2\">$message</text>
        </binding>
    </visual>
    <audio src=\"ms-winsoundevent:Notification.Default\" loop=\"false\"/>
</toast>
\"@)

    \$toast = New-Object Windows.UI.Notifications.ToastNotification \$xml
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier(\$APP_ID).Show(\$toast)
    "
}

# 테스트
send_windows_toast "📈 주식 분석 완료!" "PLTR +5.2%, RKLB -2.1%, 분석 완료"
echo "✅ 알림 발송 완료!"
