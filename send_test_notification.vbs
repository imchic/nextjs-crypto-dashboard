' Windows 로컬 알림 (한글 완벽 지원)
' VBScript 사용

Set objWshShell = CreateObject("WScript.Shell")

' 간단한 팝업 (한글 지원)
objWshShell.Popup "Windows 로컬 알림 정상 작동!", 5, "테스트 알림", 64

' 알림 메시지
WScript.Echo "알림 발송 완료!"
