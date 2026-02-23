# Windows 로컬 알림 (한글 지원)
# PowerShell UTF-8 인코딩

# 출력 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null

$APP_ID = 'OpenClaw.Portfolio'

# 테스트 알림 (한글)
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument

# XML 선언에 encoding 명시
$toast_content = "<?xml version='1.0' encoding='utf-8'?><toast><visual><binding template='ToastText02'><text id='1'>테스트 알림</text><text id='2'>Windows 로컬 알림 정상 작동!</text></binding></visual></toast>"

$xml.LoadXml($toast_content)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)

Write-Host "알림 발송 완료!"
